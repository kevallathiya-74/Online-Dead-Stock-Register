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
    if (userRole === 'Employee' || userRole === 'Vendor') {
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
        .populate('requested_by', 'name email role')
        .populate('approver', 'name email role')
        .populate('asset_id', 'asset_name unique_asset_id')
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
      .populate('requested_by', 'name email role department')
      .populate('approver', 'name email role')
      .populate('asset_id', 'asset_name unique_asset_id category status')
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
    // Build approval chain based on request type and amount
    const approvalChain = await buildApprovalChain(
      approvalData.request_type,
      approvalData.estimated_value || 0,
      userId
    );
    
    if (approvalChain.length === 0) {
      throw new Error('No approval chain could be constructed');
    }
    
    // Create approval
    const approval = new Approval({
      ...approvalData,
      requested_by: userId,
      current_approver_id: approvalChain[0].approver_id,
      approval_chain: approvalChain,
      status: 'Pending'
    });
    
    await approval.save({ session });
    
    // Create notification for first approver
    await Notification.create([{
      user_id: approvalChain[0].approver_id,
      type: 'approval_required',
      title: 'New Approval Request',
      message: `New ${approvalData.request_type} approval request requires your attention`,
      related_entity_type: 'Approval',
      related_entity_id: approval._id,
      priority: 'medium'
    }], { session });
    
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
      return null;
    }
    
    // Verify user is current approver
    if (approval.current_approver_id.toString() !== userId.toString()) {
      throw new Error('You are not authorized to approve this request');
    }
    
    // Verify request is still pending
    if (approval.status !== 'Pending') {
      throw new Error('This approval request has already been processed');
    }
    
    // Find current level in approval chain
    const currentLevelIndex = approval.approval_chain.findIndex(
      chain => chain.approver_id.toString() === userId.toString() && !chain.approved_at
    );
    
    if (currentLevelIndex === -1) {
      throw new Error('Approval level not found');
    }
    
    // Update approval chain
    approval.approval_chain[currentLevelIndex].status = decision;
    approval.approval_chain[currentLevelIndex].comments = comments;
    approval.approval_chain[currentLevelIndex].approved_at = new Date();
    
    if (decision === 'Rejected') {
      // Rejection - stop the chain
      approval.status = 'Rejected';
      approval.final_decision = 'Rejected';
      approval.final_decision_date = new Date();
      
      // Notify requester
      await Notification.create([{
        user_id: approval.requested_by,
        type: 'approval_rejected',
        title: 'Approval Request Rejected',
        message: `Your ${approval.request_type} request has been rejected`,
        related_entity_type: 'Approval',
        related_entity_id: approval._id,
        priority: 'high'
      }], { session });
      
    } else if (decision === 'Approved') {
      // Check if there are more levels
      const nextLevel = approval.approval_chain[currentLevelIndex + 1];
      
      if (nextLevel) {
        // Move to next approver
        approval.current_approver_id = nextLevel.approver_id;
        
        // Notify next approver
        await Notification.create([{
          user_id: nextLevel.approver_id,
          type: 'approval_required',
          title: 'Approval Request',
          message: `${approval.request_type} approval request requires your attention`,
          related_entity_type: 'Approval',
          related_entity_id: approval._id,
          priority: 'medium'
        }], { session });
        
      } else {
        // Final approval - all levels approved
        approval.status = 'Approved';
        approval.final_decision = 'Approved';
        approval.final_decision_date = new Date();
        
        // Notify requester
        await Notification.create([{
          user_id: approval.requested_by,
          type: 'approval_approved',
          title: 'Approval Request Approved',
          message: `Your ${approval.request_type} request has been fully approved`,
          related_entity_type: 'Approval',
          related_entity_id: approval._id,
          priority: 'high'
        }], { session });
      }
    }
    
    approval.updated_at = new Date();
    await approval.save({ session });
    
    // Create audit log
    await AuditLog.create([{
      user_id: userId,
      action: 'UPDATE',
      entity_type: 'Approval',
      entity_id: approval._id,
      changes: {
        decision,
        comments,
        level: currentLevelIndex + 1
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
    
    return approval.toObject();
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error in processApproval service:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get pending approvals for a user
 */
exports.getPendingApprovalsForUser = async (userId) => {
  try {
    const pendingApprovals = await Approval.find({
      current_approver_id: userId,
      status: 'Pending'
    })
      .populate('requested_by', 'name email')
      .populate('asset_id', 'asset_name unique_asset_id')
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

/**
 * Build approval chain based on request type and value
 */
async function buildApprovalChain(requestType, estimatedValue, requesterId) {
  const User = require('../models/user');
  const chain = [];
  
  // Get requester's department and manager
  const requester = await User.findById(requesterId).select('department manager_id');
  
  if (!requester) {
    throw new Error('Requester not found');
  }
  
  // Level 1: Direct Manager (if exists)
  if (requester.manager_id) {
    chain.push({
      level: 1,
      approver_id: requester.manager_id,
      required: true,
      status: 'Pending'
    });
  }
  
  // Level 2: Department Head
  const deptHead = await User.findOne({
    department: requester.department,
    role: 'Department Head',
    is_active: true
  });
  
  if (deptHead && deptHead._id.toString() !== requesterId.toString()) {
    chain.push({
      level: chain.length + 1,
      approver_id: deptHead._id,
      required: true,
      status: 'Pending'
    });
  }
  
  // Level 3: Admin approval for high-value requests or specific types
  const requiresAdminApproval = 
    estimatedValue > 100000 ||
    ['Asset Purchase', 'Asset Disposal'].includes(requestType);
  
  if (requiresAdminApproval) {
    const admin = await User.findOne({
      role: 'Admin',
      is_active: true
    }).sort({ created_at: 1 }); // Get first admin
    
    if (admin) {
      chain.push({
        level: chain.length + 1,
        approver_id: admin._id,
        required: true,
        status: 'Pending'
      });
    }
  }
  
  return chain;
}
