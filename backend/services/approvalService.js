const Approval = require('../models/approval');
const AuditLog = require('../models/auditLog');
const Notification = require('../models/notification');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Get all approval requests with filters
 */
exports.getApprovals = async (filters = {}, pagination = {}, userRole, userId) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    
    // Build query based on user role
    const query = {};
    
    // Role-based access control
    if (userRole === 'Vendor') {
      query.requested_by = userId;
    } else if (userRole === 'Manager' || userRole === 'Department Head') {
      // Managers see approvals they need to approve or have approved
      query.$or = [
        { approver: userId },
        { requested_by: userId }
      ];
    }
    // Admin, INVENTORY_MANAGER, and IT_MANAGER see all approvals
    
    // Status filter
    if (filters.status) {
      query.status = filters.status;
    }
    
    // Type filter
    if (filters.type) {
      query.request_type = filters.type;
    }
    
    // Date range filter
    if (filters.startDate || filters.endDate) {
      query.created_at = {};
      if (filters.startDate) {
        query.created_at.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.created_at.$lte = new Date(filters.endDate);
      }
    }
    
    // Execute query
    const [approvals, total] = await Promise.all([
      Approval.find(query)
        .populate('requested_by', 'name email role employee_id')
        .populate('approver', 'name email role')
        .populate('asset_id', 'name unique_asset_id asset_type')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Approval.countDocuments(query)
    ]);
    
    return {
      approvals,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  } catch (error) {
    logger.error('Error in getApprovals service:', error);
    throw error;
  }
};

/**
 * Get approval by ID
 */
exports.getApprovalById = async (approvalId, userRole, userId) => {
  try {
    const approval = await Approval.findById(approvalId)
      .populate('requested_by', 'name email role department employee_id')
      .populate('approver', 'name email role')
      .populate('asset_id', 'name unique_asset_id asset_type status')
      .lean();
    
    if (!approval) {
      return null;
    }
    
    // Check access rights
    const hasAccess = 
      userRole === 'ADMIN' ||
      userRole === 'INVENTORY_MANAGER' ||
      userRole === 'IT_MANAGER' ||
      approval.requested_by._id.toString() === userId.toString() ||
      approval.approver?._id.toString() === userId.toString();
    
    if (!hasAccess) {
      throw new Error('Unauthorized access to approval request');
    }
    
    return approval;
  } catch (error) {
    logger.error('Error in getApprovalById service:', error);
    throw error;
  }
};

/**
 * Create new approval request
 */
exports.createApproval = async (approvalData, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Create approval
    const approval = new Approval({
      ...approvalData,
      requested_by: userId,
      status: 'Pending'
    });
    
    await approval.save({ session });
    
    // Create notification for managers/admins who can approve
    const User = require('../models/user');
    const approvers = await User.find({
      role: { $in: ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER'] },
      is_active: true
    }).select('_id');
    
    // Create notifications for all approvers
    const notifications = approvers.map(approver => ({
      user_id: approver._id,
      type: 'approval_required',
      title: 'New Approval Request',
      message: `New ${approvalData.request_type} approval request requires your attention`,
      related_entity_type: 'Approval',
      related_entity_id: approval._id,
      priority: 'medium'
    }));
    
    if (notifications.length > 0) {
      await Notification.create(notifications, { session });
    }
    
    // Create audit log
    await AuditLog.create([{
      user_id: userId,
      action: 'CREATE',
      entity_type: 'Approval',
      entity_id: approval._id,
      changes: {
        new: approval.toObject()
      },
      ip_address: 'system',
      user_agent: 'backend-service'
    }], { session });
    
    await session.commitTransaction();
    
    logger.info('Approval request created', {
      approvalId: approval._id,
      type: approval.request_type,
      userId
    });
    
    return approval.toObject();
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error in createApproval service:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Process approval decision (approve or reject)
 */
exports.processApproval = async (approvalId, decision, comments, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const approval = await Approval.findById(approvalId).session(session);
    
    if (!approval) {
      await session.abortTransaction();
      session.endSession();
      return null;
    }
    
    // Verify request is still pending
    if (approval.status !== 'Pending') {
      await session.abortTransaction();
      session.endSession();
      throw new Error('This approval request has already been processed');
    }
    
    // Update approval status
    approval.status = decision === 'Approved' ? 'Accepted' : 'Rejected';
    approval.approver = userId;
    approval.comments = comments || '';
    approval.approved_at = new Date();
    approval.updated_at = new Date();
    
    await approval.save({ session });
    
    // Create notification for requester
    const notificationType = decision === 'Approved' ? 'approval_approved' : 'approval_rejected';
    const notificationTitle = decision === 'Approved' ? 'Request Approved' : 'Request Rejected';
    const notificationMessage = `Your ${approval.request_type} request has been ${decision.toLowerCase()}`;
    
    await Notification.create([{
      user_id: approval.requested_by,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      related_entity_type: 'Approval',
      related_entity_id: approval._id,
      priority: 'high'
    }], { session });
    
    // Create audit log
    await AuditLog.create([{
      user_id: userId,
      action: 'UPDATE',
      entity_type: 'Approval',
      entity_id: approval._id,
      changes: {
        status: decision === 'Approved' ? 'Accepted' : 'Rejected',
        comments
      },
      ip_address: 'system',
      user_agent: 'backend-service'
    }], { session });
    
    await session.commitTransaction();
    
    logger.info('Approval processed', {
      approvalId: approval._id,
      decision,
      userId
    });
    
    // Populate and return
    const populatedApproval = await Approval.findById(approvalId)
      .populate('requested_by', 'name email employee_id')
      .populate('approver', 'name email')
      .populate('asset_id', 'name unique_asset_id asset_type')
      .lean();
    
    return populatedApproval;
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error in processApproval service:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get pending approvals for a user (role-based)
 */
exports.getPendingApprovalsForUser = async (userId, userRole) => {
  try {
    // If user is an approver (Admin, Inventory Manager, IT Manager), show all pending
    const isApprover = ['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER'].includes(userRole);
    
    const query = {
      status: 'Pending'
    };
    
    // If not an approver, only show their own requests
    if (!isApprover) {
      query.requested_by = userId;
    }
    
    const pendingApprovals = await Approval.find(query)
      .populate('requested_by', 'name email employee_id')
      .populate('asset_id', 'name unique_asset_id asset_type')
      .sort({ created_at: -1 })
      .lean();
    
    return pendingApprovals;
  } catch (error) {
    logger.error('Error in getPendingApprovalsForUser service:', error);
    throw error;
  }
};

/**
 * Get approval statistics
 */
exports.getApprovalStats = async (userId, userRole) => {
  try {
    const matchQuery = userRole === 'Admin' ? {} : {
      $or: [
        { requested_by: userId },
        { current_approver_id: userId },
        { 'approval_chain.approver_id': userId }
      ]
    };
    
    const stats = await Approval.aggregate([
      { $match: matchQuery },
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          byType: [
            {
              $group: {
                _id: '$request_type',
                count: { $sum: 1 }
              }
            }
          ],
          avgProcessingTime: [
            {
              $match: {
                final_decision_date: { $exists: true }
              }
            },
            {
              $project: {
                processingTime: {
                  $subtract: ['$final_decision_date', '$created_at']
                }
              }
            },
            {
              $group: {
                _id: null,
                avgTime: { $avg: '$processingTime' }
              }
            }
          ],
          total: [
            { $count: 'total' }
          ]
        }
      }
    ]);
    
    // Convert avg time from ms to days
    const avgTimeDays = stats[0].avgProcessingTime[0]?.avgTime 
      ? (stats[0].avgProcessingTime[0].avgTime / (1000 * 60 * 60 * 24)).toFixed(2)
      : 0;
    
    return {
      byStatus: stats[0].byStatus,
      byType: stats[0].byType,
      avgProcessingTimeDays: avgTimeDays,
      total: stats[0].total[0]?.total || 0
    };
  } catch (error) {
    logger.error('Error in getApprovalStats service:', error);
    throw error;
  }
};
