const approvalService = require('../services/approvalService');
const logger = require('../utils/logger');

/**
 * Get all approvals with filters and RBAC
 */
exports.getApprovals = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, type, startDate, endDate } = req.query;
    
    const filters = {};
    if (status) {
      filters.status = status;
    }
    if (type) {
      filters.type = type;
    }
    if (startDate) {
      filters.startDate = startDate;
    }
    if (endDate) {
      filters.endDate = endDate;
    }
    
    const result = await approvalService.getApprovals(
      filters,
      { page: parseInt(page), limit: parseInt(limit) },
      req.user.role,
      req.user._id
    );
    
    res.status(200).json({
      success: true,
      data: result.approvals,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error fetching approvals:', error);
    next(error);
  }
};

/**
 * Get approval by ID
 */
exports.getApprovalById = async (req, res, next) => {
  try {
    const approval = await approvalService.getApprovalById(
      req.params.id,
      req.user.role,
      req.user._id
    );
    
    if (!approval) {
      return res.status(404).json({
        success: false,
        error: 'Approval not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: approval
    });
  } catch (error) {
    logger.error('Error fetching approval:', error);
    next(error);
  }
};

/**
 * Create new approval request
 */
exports.createApproval = async (req, res, next) => {
  try {
    const approval = await approvalService.createApproval(req.body, req.user._id);
    
    res.status(201).json({
      success: true,
      data: approval
    });
  } catch (error) {
    logger.error('Error creating approval:', error);
    next(error);
  }
};

/**
 * Approve request
 */
exports.approveRequest = async (req, res, next) => {
  try {
    const { comments } = req.body;
    
    const approval = await approvalService.processApproval(
      req.params.id,
      'Approved',
      comments,
      req.user._id
    );
    
    if (!approval) {
      return res.status(404).json({
        success: false,
        error: 'Approval request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: approval
    });
  } catch (error) {
    logger.error('Error approving request:', error);
    next(error);
  }
};

/**
 * Reject request
 */
exports.rejectRequest = async (req, res, next) => {
  try {
    const { comments } = req.body;
    
    const approval = await approvalService.processApproval(
      req.params.id,
      'Rejected',
      comments,
      req.user._id
    );
    
    if (!approval) {
      return res.status(404).json({
        success: false,
        error: 'Approval request not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: approval
    });
  } catch (error) {
    logger.error('Error rejecting request:', error);
    next(error);
  }
};

/**
 * Get pending approvals for current user
 */
exports.getPendingApprovals = async (req, res, next) => {
  try {
    const pendingApprovals = await approvalService.getPendingApprovalsForUser(req.user._id);
    
    res.status(200).json({
      success: true,
      data: pendingApprovals
    });
  } catch (error) {
    logger.error('Error fetching pending approvals:', error);
    next(error);
  }
};

/**
 * Get approval statistics
 */
exports.getApprovalStats = async (req, res, next) => {
  try {
    const stats = await approvalService.getApprovalStats(req.user._id, req.user.role);
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching approval stats:', error);
    next(error);
  }
};
