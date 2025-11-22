const assetService = require('../services/assetService');
const logger = require('../utils/logger');
const { logUserAction } = require('../utils/auditHelper');
const Asset = require('../models/asset');
const mongoose = require('mongoose');

// GET all assets with pagination and filtering
exports.getAssets = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      department: req.query.department,
      asset_type: req.query.asset_type,
      location: req.query.location,
      search: req.query.search,
      purchaseStartDate: req.query.purchaseStartDate,
      purchaseEndDate: req.query.purchaseEndDate
    };
    
    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy: req.query.sortBy || 'createdAt',
      sortOrder: req.query.sortOrder || 'desc'
    };
    
    const result = await assetService.getAssets(filters, pagination, req.user);
    
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    logger.error('Get assets error', { error: err.message, requestId: req.id });
    next(err);
  }
};

// GET my assigned assets (employee-specific)
exports.getMyAssets = async (req, res, next) => {
  try {
    const assets = await assetService.getUserAssets(req.user.id);
    
    res.json({
      success: true,
      data: assets,
      total: assets.length
    });
  } catch (err) {
    logger.error('Get my assets error', { error: err.message, userId: req.user.id, requestId: req.id });
    next(err);
  }
};

// GET asset by id
exports.getAssetById = async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);
    
    if (!asset) {
      return res.status(404).json({ 
        success: false,
        message: 'Asset not found' 
      });
    }
    
    res.json({
      success: true,
      data: asset
    });
  } catch (err) {
    logger.error('Error fetching asset by ID', { error: err.message, assetId: req.params.id, requestId: req.id });
    next(err);
  }
};

// CREATE asset
exports.createAsset = async (req, res, next) => {
  try {
    // If not admin, ensure asset is created in user's department
    if (req.user.role !== 'ADMIN' && req.body.department !== req.user.department) {
      return res.status(403).json({ 
        success: false,
        message: 'You can only create assets in your own department' 
      });
    }

    // Set department if not admin
    const assetData = {
      ...req.body,
      department: req.user.role === 'ADMIN' ? req.body.department : req.user.department
    };
    
    const asset = await assetService.createAsset(assetData, req.user.id);
    
    res.status(201).json({ 
      success: true,
      data: asset,
      message: 'Asset created successfully'
    });
  } catch (err) {
    logger.error('Create asset error', { error: err.message, userId: req.user.id, requestId: req.id });
    next(err);
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
        
        // Use new audit helper for proper IP tracking
        await logUserAction(
          req,
          'asset_transferred',
          'Asset',
          asset._id,
          description,
          'info'
        );
        
        logger.info('Audit log created for asset transfer', { assetId: asset._id });
      } catch (auditErr) {
        logger.error('Audit log creation failed', { error: auditErr.message });
        // Don't fail the request if audit log fails
      }
    }
    
    res.json(asset);

  } catch (err) {
    logger.error('Update asset error', { error: err.message, assetId: req.params.id });
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
    logger.error('Get asset stats error', { error: err.message });
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
};
