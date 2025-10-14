const AssetTransfer = require('../models/assetTransfer');
const Asset = require('../models/asset');
const User = require('../models/user');
const AuditLog = require('../models/auditLog');
const Notification = require('../models/notification');

// Get all asset transfers with filtering
exports.getAllAssetTransfers = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status, 
      from_user,
      to_user,
      asset_id,
      transfer_reason,
      priority,
      date_from,
      date_to,
      overdue_only,
      search
    } = req.query;
    
    const skip = (page - 1) * limit;

    // Build filter based on user role and permissions
    let filter = {};
    
    // Role-based filtering
    if (req.user.role === 'EMPLOYEE') {
      // Employees can only see transfers they're involved in
      filter.$or = [
        { initiated_by: req.user.id },
        { from_user: req.user.id },
        { to_user: req.user.id }
      ];
    }

    // Apply additional filters
    if (status) filter.status = status;
    if (from_user) filter.from_user = from_user;
    if (to_user) filter.to_user = to_user;
    if (asset_id) filter.asset = asset_id;
    if (transfer_reason) filter.transfer_reason = transfer_reason;
    if (priority) filter.priority = priority;
    
    // Date range filter
    if (date_from || date_to) {
      filter.expected_transfer_date = {};
      if (date_from) filter.expected_transfer_date.$gte = new Date(date_from);
      if (date_to) filter.expected_transfer_date.$lte = new Date(date_to);
    }

    // Overdue filter
    if (overdue_only === 'true') {
      filter.expected_transfer_date = { $lt: new Date() };
      filter.status = { $in: ['pending', 'approved', 'in_transit'] };
    }

    // Search filter
    if (search) {
      filter.$or = [
        { transfer_id: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { from_location: { $regex: search, $options: 'i' } },
        { to_location: { $regex: search, $options: 'i' } }
      ];
    }

    const transfers = await AssetTransfer.find(filter)
      .populate('asset', 'unique_asset_id name category')
      .populate('from_user', 'full_name email employee_id')
      .populate('to_user', 'full_name email employee_id')
      .populate('initiated_by', 'full_name email')
      .populate('approved_by', 'full_name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await AssetTransfer.countDocuments(filter);

    res.json({
      transfers,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_transfers: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching asset transfers:', error);
    res.status(500).json({ message: 'Failed to fetch asset transfers' });
  }
};

// Get asset transfer by ID
exports.getAssetTransferById = async (req, res) => {
  try {
    const { id } = req.params;

    const transfer = await AssetTransfer.findById(id)
      .populate('asset', 'unique_asset_id name category current_location current_status')
      .populate('from_user', 'full_name email employee_id department')
      .populate('to_user', 'full_name email employee_id department')
      .populate('initiated_by', 'full_name email employee_id')
      .populate('approved_by', 'full_name email')
      .populate('transferred_by', 'full_name email')
      .populate('approval_history.performed_by', 'full_name')
      .populate('tracking_notes.added_by', 'full_name');

    if (!transfer) {
      return res.status(404).json({ message: 'Asset transfer not found' });
    }

    // Check permissions
    if (req.user.role === 'EMPLOYEE') {
      const isInvolved = transfer.initiated_by._id.toString() === req.user.id ||
                        transfer.from_user._id.toString() === req.user.id ||
                        transfer.to_user._id.toString() === req.user.id;
      
      if (!isInvolved) {
        return res.status(403).json({ message: 'Access denied to this transfer' });
      }
    }

    res.json(transfer);
  } catch (error) {
    console.error('Error fetching asset transfer:', error);
    res.status(500).json({ message: 'Failed to fetch asset transfer' });
  }
};

// Create new asset transfer
exports.createAssetTransfer = async (req, res) => {
  try {
    const transferData = req.body;
    transferData.initiated_by = req.user.id;
    transferData.created_by = req.user.id;

    // Validate asset exists and is available
    const asset = await Asset.findById(transferData.asset);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    if (asset.current_status !== 'assigned') {
      return res.status(400).json({ 
        message: 'Asset must be in assigned status to initiate transfer' 
      });
    }

    // Validate users exist
    const [fromUser, toUser] = await Promise.all([
      User.findById(transferData.from_user),
      User.findById(transferData.to_user)
    ]);

    if (!fromUser || !toUser) {
      return res.status(404).json({ message: 'One or more users not found' });
    }

    // Validate that asset is currently assigned to from_user
    if (asset.assigned_user.toString() !== transferData.from_user.toString()) {
      return res.status(400).json({ 
        message: 'Asset is not currently assigned to the specified from_user' 
      });
    }

    // Create transfer
    const transfer = new AssetTransfer(transferData);
    await transfer.save();

    // Add to approval history
    transfer.approval_history.push({
      action: 'submitted',
      performed_by: req.user.id,
      comments: 'Asset transfer request submitted',
      timestamp: new Date()
    });
    await transfer.save();

    // Populate for response
    await transfer.populate([
      { path: 'asset', select: 'unique_asset_id name category' },
      { path: 'from_user', select: 'full_name email employee_id' },
      { path: 'to_user', select: 'full_name email employee_id' },
      { path: 'initiated_by', select: 'full_name email' }
    ]);

    // Create audit log
    const auditLog = new AuditLog({
      action: 'asset_transfer_requested',
      performed_by: req.user.id,
      details: {
        transfer_id: transfer.transfer_id,
        asset_id: asset.unique_asset_id,
        from_user: fromUser.full_name,
        to_user: toUser.full_name,
        reason: transfer.transfer_reason
      },
      timestamp: new Date()
    });
    await auditLog.save();

    // Notify approvers (Admin and Inventory Managers)
    const approvers = await User.find({ 
      role: { $in: ['ADMIN', 'INVENTORY_MANAGER'] },
      status: 'active' 
    });

    const notifications = approvers.map(approver => ({
      recipient: approver._id,
      title: 'Asset Transfer Approval Required',
      message: `Asset transfer request ${transfer.transfer_id} requires your approval`,
      type: 'approval',
      priority: transfer.priority,
      data: {
        transfer_id: transfer._id,
        transfer_number: transfer.transfer_id,
        asset_name: asset.name,
        from_user: fromUser.full_name,
        to_user: toUser.full_name
      },
      action_url: `/employee/asset-transfers/${transfer._id}`
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({
      message: 'Asset transfer request created successfully',
      transfer
    });
  } catch (error) {
    console.error('Error creating asset transfer:', error);
    res.status(500).json({ message: 'Failed to create asset transfer' });
  }
};

// Update asset transfer status
exports.updateAssetTransferStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments, rejection_reason } = req.body;

    const transfer = await AssetTransfer.findById(id)
      .populate('asset')
      .populate('from_user to_user');

    if (!transfer) {
      return res.status(404).json({ message: 'Asset transfer not found' });
    }

    // Validate status transition
    const validTransitions = {
      'pending': ['approved', 'rejected', 'cancelled'],
      'approved': ['in_transit', 'cancelled'],
      'in_transit': ['completed', 'cancelled'],
      'rejected': [],
      'completed': [],
      'cancelled': []
    };

    if (!validTransitions[transfer.status].includes(status)) {
      return res.status(400).json({ 
        message: `Cannot change status from ${transfer.status} to ${status}` 
      });
    }

    const oldStatus = transfer.status;
    transfer.status = status;
    transfer.last_updated_by = req.user.id;

    // Handle specific status changes
    if (status === 'approved') {
      transfer.approved_by = req.user.id;
      transfer.approved_at = new Date();
    } else if (status === 'rejected') {
      transfer.rejection_reason = rejection_reason;
    } else if (status === 'in_transit') {
      transfer.transferred_by = req.user.id;
      transfer.actual_transfer_date = new Date();
    } else if (status === 'completed') {
      // Update asset assignment
      const asset = await Asset.findById(transfer.asset._id);
      asset.assigned_user = transfer.to_user._id;
      asset.current_location = transfer.to_location;
      asset.last_updated_by = req.user.id;
      await asset.save();

      transfer.completion_date = new Date();
    }

    // Add to approval history
    transfer.approval_history.push({
      action: status,
      performed_by: req.user.id,
      comments: comments || '',
      timestamp: new Date()
    });

    await transfer.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'asset_transfer_status_updated',
      performed_by: req.user.id,
      details: {
        transfer_id: transfer.transfer_id,
        asset_id: transfer.asset.unique_asset_id,
        old_status: oldStatus,
        new_status: status,
        comments
      },
      timestamp: new Date()
    });
    await auditLog.save();

    // Send notifications based on status
    let notificationRecipients = [transfer.initiated_by];
    if (transfer.from_user._id.toString() !== transfer.initiated_by.toString()) {
      notificationRecipients.push(transfer.from_user._id);
    }
    if (transfer.to_user._id.toString() !== transfer.initiated_by.toString()) {
      notificationRecipients.push(transfer.to_user._id);
    }

    const statusMessages = {
      'approved': 'has been approved and will proceed',
      'rejected': 'has been rejected',
      'in_transit': 'is now in transit',
      'completed': 'has been completed successfully',
      'cancelled': 'has been cancelled'
    };

    const notifications = notificationRecipients.map(recipientId => ({
      recipient: recipientId,
      title: `Asset Transfer ${status.replace('_', ' ').toUpperCase()}`,
      message: `Asset transfer ${transfer.transfer_id} ${statusMessages[status]}`,
      type: status === 'approved' || status === 'completed' ? 'success' : 
            status === 'rejected' ? 'error' : 'info',
      priority: 'medium',
      data: {
        transfer_id: transfer._id,
        transfer_number: transfer.transfer_id,
        status
      },
      action_url: `/employee/asset-transfers/${transfer._id}`
    }));

    await Notification.insertMany(notifications);

    res.json({
      message: 'Asset transfer status updated successfully',
      transfer: {
        id: transfer._id,
        transfer_id: transfer.transfer_id,
        status: transfer.status
      }
    });
  } catch (error) {
    console.error('Error updating asset transfer status:', error);
    res.status(500).json({ message: 'Failed to update asset transfer status' });
  }
};

// Get asset transfer statistics
exports.getAssetTransferStats = async (req, res) => {
  try {
    // Status breakdown
    const statusStats = await AssetTransfer.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Transfer reasons breakdown
    const reasonStats = await AssetTransfer.aggregate([
      {
        $group: {
          _id: '$transfer_reason',
          count: { $sum: 1 }
        }
      }
    ]);

    // Monthly transfer trends
    const monthlyTrends = await AssetTransfer.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Overdue transfers
    const overdueTransfers = await AssetTransfer.countDocuments({
      status: { $in: ['pending', 'approved', 'in_transit'] },
      expected_transfer_date: { $lt: new Date() }
    });

    // Average completion time
    const completionTimeStats = await AssetTransfer.aggregate([
      {
        $match: {
          status: 'completed',
          completion_date: { $exists: true }
        }
      },
      {
        $project: {
          completion_days: {
            $divide: [
              { $subtract: ['$completion_date', '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          avg_completion_days: { $avg: '$completion_days' },
          min_completion_days: { $min: '$completion_days' },
          max_completion_days: { $max: '$completion_days' }
        }
      }
    ]);

    res.json({
      total_transfers: statusStats.reduce((sum, stat) => sum + stat.count, 0),
      status_breakdown: statusStats,
      reason_breakdown: reasonStats,
      monthly_trends: monthlyTrends,
      overdue_count: overdueTransfers,
      completion_stats: completionTimeStats[0] || {
        avg_completion_days: 0,
        min_completion_days: 0,
        max_completion_days: 0
      }
    });
  } catch (error) {
    console.error('Error fetching asset transfer statistics:', error);
    res.status(500).json({ message: 'Failed to fetch asset transfer statistics' });
  }
};