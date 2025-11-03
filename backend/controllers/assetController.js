const Asset = require('../models/asset');
const mongoose = require('mongoose');

// GET all assets with pagination and filtering
exports.getAssets = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Validate limits
    if (limit > 100) {
      return res.status(400).json({ 
        success: false,
        error: 'Limit cannot exceed 100 items per page' 
      });
    }
    
    if (page < 1) {
      return res.status(400).json({
        success: false,
        error: 'Page must be greater than 0'
      });
    }
    
    let query = {};
    
    // Filter by department if not admin
    if (req.user.role !== 'ADMIN') {
      query.department = req.user.department;
    }
    
    // Additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.department && req.user.role === 'ADMIN') {
      query.department = req.query.department;
    }
    
    if (req.query.asset_type) {
      query.asset_type = req.query.asset_type;
    }
    
    if (req.query.location) {
      query.location = { $regex: req.query.location, $options: 'i' };
    }
    
    // Text search across multiple fields
    if (req.query.search) {
      const searchRegex = { $regex: req.query.search, $options: 'i' };
      query.$or = [
        { unique_asset_id: searchRegex },
        { manufacturer: searchRegex },
        { model: searchRegex },
        { serial_number: searchRegex }
      ];
    }
    
    // Date range filters
    if (req.query.purchaseStartDate || req.query.purchaseEndDate) {
      query.purchase_date = {};
      if (req.query.purchaseStartDate) {
        query.purchase_date.$gte = new Date(req.query.purchaseStartDate);
      }
      if (req.query.purchaseEndDate) {
        query.purchase_date.$lte = new Date(req.query.purchaseEndDate);
      }
    }
    
    // Sorting
    let sort = { createdAt: -1 }; // Default: newest first
    if (req.query.sortBy) {
      const sortField = req.query.sortBy;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sort = { [sortField]: sortOrder };
    }
    
    // Execute query with pagination
    const [assets, total] = await Promise.all([
      Asset.find(query)
        .populate('assigned_user', 'name email department')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean() for better performance on read-only operations
      Asset.countDocuments(query)
    ]);
    
    res.json({
      success: true,
      data: assets,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    console.error('Get assets error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// GET my assigned assets (employee-specific)
exports.getMyAssets = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Find all assets assigned to the current user
    const assets = await Asset.find({ assigned_user: userId })
      .populate('assigned_user', 'name email department')
      .sort({ assigned_date: -1 })
      .lean();
    
    res.json({
      success: true,
      data: assets,
      total: assets.length
    });
  } catch (err) {
    console.error('Get my assets error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};

// GET asset by id
exports.getAssetById = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id).populate('assigned_user', 'name email');
    if (!asset) return res.status(404).json({ message: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// CREATE asset
exports.createAsset = async (req, res) => {
  try {
    // If not admin, ensure asset is created in user's department
    if (req.user.role !== 'ADMIN' && req.body.department !== req.user.department) {
      return res.status(403).json({ 
        message: 'You can only create assets in your own department' 
      });
    }

    // Auto-generate unique_asset_id if not provided
    if (!req.body.unique_asset_id) {
      const prefix = 'AST';
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      req.body.unique_asset_id = `${prefix}-${timestamp}${random}`;
    }

    const asset = new Asset({
      ...req.body,
      department: req.user.role === 'ADMIN' ? req.body.department : req.user.department
    });
    
    const saved = await asset.save();
    
    // Log asset creation
    const AuditLog = require('../models/auditLog');
    await AuditLog.create({
      user_id: req.user.id,
      action: 'asset_created',
      entity_type: 'Asset',
      entity_id: saved._id,
      description: `Asset ${saved.unique_asset_id} created: ${saved.name || `${saved.manufacturer} ${saved.model}`}`,
      severity: 'info',
      details: {
        asset_id: saved.unique_asset_id,
        asset_name: saved.name || `${saved.manufacturer} ${saved.model}`,
        category: saved.asset_type,
        location: saved.location,
        department: saved.department
      }
    });
    
    res.status(201).json({ 
      success: true,
      data: saved,
      message: 'Asset created successfully'
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// UPDATE asset
exports.updateAsset = async (req, res) => {
  try {
    // Fetch the asset first
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ message: 'Asset not found' });

    // Check if the user is the assigned user or an Admin
    if (
      asset.assigned_user &&
      asset.assigned_user.toString() !== req.user.id &&
      req.user.role !== 'ADMIN'
    ) {
      return res.status(403).json({
        message: 'Can only update your own assets or admin access required',
      });
    }

    // If assigned_user is being updated and it's a string (email or employee_id), look up the user
    if (req.body.assigned_user && typeof req.body.assigned_user === 'string') {
      // Check if it's already a valid ObjectId
      if (!mongoose.Types.ObjectId.isValid(req.body.assigned_user)) {
        // Try to find user by email or employee_id
        const User = require('../models/user');
        const user = await User.findOne({
          $or: [
            { email: req.body.assigned_user },
            { employee_id: req.body.assigned_user }
          ]
        });
        
        if (!user) {
          return res.status(400).json({ 
            message: `User not found with email or employee ID: ${req.body.assigned_user}` 
          });
        }
        
        // Replace with the ObjectId
        req.body.assigned_user = user._id;
      }
    }

    // Store original values for audit log
    const originalLocation = asset.location;
    const originalAssignedUser = asset.assigned_user;
    
    // Update only the fields provided in req.body
    Object.keys(req.body).forEach(key => {
      asset[key] = req.body[key];
    });
    
    await asset.save();
    
    // Create audit log if location changed (asset transfer)
    if (req.body.location && originalLocation !== req.body.location) {
      try {
        const AuditLog = require('../models/auditLog');
        const User = require('../models/user');
        
        // Get assigned user name if ObjectId provided
        let assignedUserName = 'Unassigned';
        if (req.body.assigned_user) {
          const assignedUser = await User.findById(req.body.assigned_user);
          if (assignedUser) {
            assignedUserName = assignedUser.full_name || assignedUser.email;
          }
        }
        
        const description = `Asset ${asset.unique_asset_id} transferred from "${originalLocation}" to "${req.body.location}"${req.body.assigned_user ? ` and assigned to ${assignedUserName}` : ''}`;
        
        await AuditLog.create({
          user_id: req.user.id,
          action: 'asset_transferred',
          entity_type: 'Asset',
          entity_id: asset._id,
          description: description,
          severity: 'info',
          details: {
            asset_id: asset.unique_asset_id,
            asset_name: asset.name || `${asset.manufacturer} ${asset.model}`,
            from_location: originalLocation,
            to_location: req.body.location,
            assigned_to: assignedUserName
          },
          old_values: {
            location: originalLocation,
            assigned_user: originalAssignedUser
          },
          new_values: {
            location: req.body.location,
            assigned_user: req.body.assigned_user
          },
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.headers['user-agent'],
          timestamp: new Date()
        });
        
        console.log('Audit log created for asset transfer');
      } catch (auditErr) {
        console.error('Audit log creation failed:', auditErr);
        // Don't fail the request if audit log fails
      }
    }
    
    res.json(asset);

  } catch (err) {
    console.error('Update asset error:', err);
    res.status(400).json({ message: err.message });
  }
};

// DELETE asset
exports.deleteAsset = async (req, res) => {
  try {
    const deleted = await Asset.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Asset not found' });
    res.json({ message: 'Asset deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET asset statistics - DYNAMIC STATS FIX
exports.getAssetStats = async (req, res) => {
  try {
    // Count total assets
    const totalAssets = await Asset.countDocuments();
    
    // Count active assets (status = 'Active')
    const activeAssets = await Asset.countDocuments({ status: 'Active' });
    
    // Count under maintenance
    const underMaintenance = await Asset.countDocuments({ status: 'Under Maintenance' });
    
    // Calculate total value (sum of purchase_cost for all assets)
    const valueResult = await Asset.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$purchase_cost' }
        }
      }
    ]);
    
    const totalValue = valueResult.length > 0 ? valueResult[0].totalValue : 0;
    
    res.json({
      success: true,
      data: {
        totalAssets,
        activeAssets,
        underMaintenance,
        totalValue
      }
    });
  } catch (err) {
    console.error('Get asset stats error:', err);
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};
