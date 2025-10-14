const AssetRequest = require('../models/assetRequest');
const User = require('../models/user');
const mongoose = require('mongoose');
const AuditLog = require('../models/auditLog');
const Notification = require('../models/notification');

// Create new asset request
exports.createAssetRequest = async (req, res) => {
  try {
    const {
      asset_type,
      asset_category,
      brand_preference,
      specifications,
      justification,
      priority,
      expected_usage,
      budget_range,
      required_by_date,
      department,
      location
    } = req.body;

    const userId = req.user.id;

    // Create new asset request
    const assetRequest = new AssetRequest({
      requester: userId,
      asset_type,
      asset_category,
      brand_preference,
      specifications,
      justification,
      priority,
      expected_usage,
      budget_range,
      required_by_date: new Date(required_by_date),
      department,
      location,
      status: 'pending'
    });

    await assetRequest.save();

    // Populate requester info for response
    await assetRequest.populate('requester', 'full_name email employee_id');

    // Create audit log
    const auditLog = new AuditLog({
      action: 'asset_request_created',
      performed_by: userId,
      details: {
        request_id: assetRequest._id,
        asset_type,
        priority,
        required_by_date
      },
      timestamp: new Date()
    });
    await auditLog.save();

    // Create notification for inventory managers
    const inventoryManagers = await User.find({ 
      role: 'INVENTORY_MANAGER',
      status: 'active'
    });

    const notifications = inventoryManagers.map(manager => ({
      recipient: manager._id,
      title: 'New Asset Request',
      message: `${req.user.full_name} has requested a ${asset_type}`,
      type: 'asset_assigned',
      priority: priority,
      data: {
        request_id: assetRequest._id,
        requester_name: req.user.full_name,
        asset_type
      },
      action_url: `/inventory/asset-requests/${assetRequest._id}`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      message: 'Asset request created successfully',
      request: assetRequest
    });
  } catch (error) {
    console.error('Error creating asset request:', error);
    res.status(500).json({ message: 'Failed to create asset request' });
  }
};

// Get user's asset requests
exports.getUserAssetRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;
    const skip = (page - 1) * limit;

    let filter = { requester: userId };
    if (status) filter.status = status;

    const requests = await AssetRequest.find(filter)
      .populate('reviewed_by', 'full_name email')
      .populate('assigned_asset', 'unique_asset_id manufacturer model')
      .populate('fulfilled_by', 'full_name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AssetRequest.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_requests: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching asset requests:', error);
    res.status(500).json({ message: 'Failed to fetch asset requests' });
  }
};

// Get specific asset request by ID
exports.getAssetRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const request = await AssetRequest.findById(id)
      .populate('requester', 'full_name email employee_id department')
      .populate('reviewed_by', 'full_name email')
      .populate('assigned_asset', 'unique_asset_id manufacturer model serial_number')
      .populate('fulfilled_by', 'full_name email');

    if (!request) {
      return res.status(404).json({ message: 'Asset request not found' });
    }

    // Check if user has permission to view this request
    const canView = 
      request.requester._id.toString() === userId || // Requester
      ['ADMIN', 'INVENTORY_MANAGER'].includes(req.user.role); // Admin or Inventory Manager

    if (!canView) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(request);
  } catch (error) {
    console.error('Error fetching asset request:', error);
    res.status(500).json({ message: 'Failed to fetch asset request' });
  }
};

// Update asset request (only for pending requests)
exports.updateAssetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;

    const request = await AssetRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Asset request not found' });
    }

    // Check if user owns this request
    if (request.requester.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if request can be updated
    if (!['pending', 'under_review'].includes(request.status)) {
      return res.status(400).json({ 
        message: 'Request cannot be updated in current status' 
      });
    }

    // Update allowed fields
    const allowedFields = [
      'specifications',
      'justification',
      'expected_usage',
      'budget_range',
      'required_by_date',
      'location'
    ];

    const filteredUpdateData = {};
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    });

    if (filteredUpdateData.required_by_date) {
      filteredUpdateData.required_by_date = new Date(filteredUpdateData.required_by_date);
    }

    const updatedRequest = await AssetRequest.findByIdAndUpdate(
      id,
      filteredUpdateData,
      { new: true }
    ).populate('requester', 'full_name email employee_id');

    // Create audit log
    const auditLog = new AuditLog({
      action: 'asset_request_updated',
      performed_by: userId,
      details: {
        request_id: id,
        updated_fields: Object.keys(filteredUpdateData)
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({
      message: 'Asset request updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Error updating asset request:', error);
    res.status(500).json({ message: 'Failed to update asset request' });
  }
};

// Cancel asset request
exports.cancelAssetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { cancellation_reason } = req.body;

    const request = await AssetRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Asset request not found' });
    }

    // Check if user owns this request
    if (request.requester.toString() !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if request can be cancelled
    if (['fulfilled', 'cancelled'].includes(request.status)) {
      return res.status(400).json({ 
        message: 'Request cannot be cancelled in current status' 
      });
    }

    request.status = 'cancelled';
    request.review_comments = cancellation_reason || 'Cancelled by requester';
    request.review_date = new Date();
    await request.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'asset_request_cancelled',
      performed_by: userId,
      details: {
        request_id: id,
        cancellation_reason
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({
      message: 'Asset request cancelled successfully',
      request
    });
  } catch (error) {
    console.error('Error cancelling asset request:', error);
    res.status(500).json({ message: 'Failed to cancel asset request' });
  }
};

// Get asset request statistics for employee
exports.getAssetRequestStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await AssetRequest.aggregate([
      { $match: { requester: mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    const statusCounts = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      fulfilled: 0,
      cancelled: 0
    };

    stats.forEach(stat => {
      statusCounts[stat._id] = stat.count;
    });

    const totalRequests = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    res.json({
      total_requests: totalRequests,
      status_breakdown: statusCounts
    });
  } catch (error) {
    console.error('Error fetching asset request stats:', error);
    res.status(500).json({ message: 'Failed to fetch asset request statistics' });
  }
};

// Get all asset requests (for inventory managers/admins)
exports.getAllAssetRequests = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, priority, asset_type, department } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    let filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (asset_type) filter.asset_type = asset_type;
    if (department) filter.department = department;

    const requests = await AssetRequest.find(filter)
      .populate('requester', 'full_name email employee_id department')
      .populate('reviewed_by', 'full_name email')
      .populate('assigned_asset', 'unique_asset_id manufacturer model')
      .populate('fulfilled_by', 'full_name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AssetRequest.countDocuments(filter);

    res.json({
      requests,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_requests: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all asset requests:', error);
    res.status(500).json({ message: 'Failed to fetch asset requests' });
  }
};