const Asset = require('../models/asset');

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

    const asset = new Asset({
      ...req.body,
      department: req.user.role === 'ADMIN' ? req.body.department : req.user.department
    });
    
    const saved = await asset.save();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ message: err.message });
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
      req.user.role !== 'Admin'
    ) {
      return res.status(403).json({
        message: 'Can only update your own assets or admin access required',
      });
    }

    // Proceed to update
    const updated = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);

  } catch (err) {
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
    
    // Calculate total value (sum of purchase_value for all assets)
    const valueResult = await Asset.aggregate([
      {
        $group: {
          _id: null,
          totalValue: { $sum: '$purchase_value' }
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
