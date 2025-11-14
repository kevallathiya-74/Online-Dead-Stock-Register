const Notification = require('../models/notification');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Send notification to user(s)
 */
exports.sendNotification = async (notificationData) => {
  try {
    // Support single user or multiple users
    const userIds = Array.isArray(notificationData.user_id) 
      ? notificationData.user_id 
      : [notificationData.user_id];
    
    // Create notifications for all users
    const notifications = userIds.map(userId => ({
      user_id: userId,
      type: notificationData.type,
      title: notificationData.title,
      message: notificationData.message,
      related_entity_type: notificationData.related_entity_type,
      related_entity_id: notificationData.related_entity_id,
      priority: notificationData.priority || 'medium',
      is_read: false
    }));
    
    const created = await Notification.insertMany(notifications);
    
    logger.info('Notifications sent', {
      count: created.length,
      type: notificationData.type,
      userIds
    });
    
    return created;
  } catch (error) {
    logger.error('Error sending notification:', error);
    throw error;
  }
};

/**
 * Get notifications for a user
 */
exports.getUserNotifications = async (userId, filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;
    
    const query = { user_id: userId };
    
    // Filter by read status
    if (filters.unreadOnly) {
      query.is_read = false;
    }
    
    // Filter by type
    if (filters.type) {
      query.type = filters.type;
    }
    
    // Filter by priority
    if (filters.priority) {
      query.priority = filters.priority;
    }
    
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ user_id: userId, is_read: false })
    ]);
    
    return {
      notifications,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      },
      unreadCount
    };
  } catch (error) {
    logger.error('Error fetching user notifications:', error);
    throw error;
  }
};

/**
 * Mark notification as read
 */
exports.markAsRead = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user_id: userId },
      { is_read: true, read_at: new Date() },
      { new: true }
    );
    
    if (!notification) {
      return null;
    }
    
    return notification;
  } catch (error) {
    logger.error('Error marking notification as read:', error);
    throw error;
  }
};

/**
 * Mark all notifications as read for a user
 */
exports.markAllAsRead = async (userId) => {
  try {
    const result = await Notification.updateMany(
      { user_id: userId, is_read: false },
      { is_read: true, read_at: new Date() }
    );
    
    logger.info('All notifications marked as read', {
      userId,
      count: result.modifiedCount
    });
    
    return result.modifiedCount;
  } catch (error) {
    logger.error('Error marking all notifications as read:', error);
    throw error;
  }
};

/**
 * Delete notification
 */
exports.deleteNotification = async (notificationId, userId) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user_id: userId
    });
    
    if (!notification) {
      return null;
    }
    
    return notification;
  } catch (error) {
    logger.error('Error deleting notification:', error);
    throw error;
  }
};

/**
 * Get unread count for a user
 */
exports.getUnreadCount = async (userId) => {
  try {
    const count = await Notification.countDocuments({
      user_id: userId,
      is_read: false
    });
    
    return count;
  } catch (error) {
    logger.error('Error getting unread count:', error);
    throw error;
  }
};

/**
 * Send notification to multiple users by role
 */
exports.sendNotificationByRole = async (role, notificationData) => {
  try {
    const User = require('../models/user');
    
    // Find all active users with the specified role
    const users = await User.find({
      role,
      is_active: true
    }).select('_id');
    
    if (users.length === 0) {
      logger.warn('No users found with role:', role);
      return [];
    }
    
    const userIds = users.map(u => u._id);
    
    return await this.sendNotification({
      ...notificationData,
      user_id: userIds
    });
  } catch (error) {
    logger.error('Error sending notification by role:', error);
    throw error;
  }
};

/**
 * Send notification to department
 */
exports.sendNotificationToDepartment = async (department, notificationData) => {
  try {
    const User = require('../models/user');
    
    // Find all active users in the department
    const users = await User.find({
      department,
      is_active: true
    }).select('_id');
    
    if (users.length === 0) {
      logger.warn('No users found in department:', department);
      return [];
    }
    
    const userIds = users.map(u => u._id);
    
    return await this.sendNotification({
      ...notificationData,
      user_id: userIds
    });
  } catch (error) {
    logger.error('Error sending notification to department:', error);
    throw error;
  }
};

/**
 * Clean up old read notifications (retention policy)
 */
exports.cleanupOldNotifications = async (daysToKeep = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = await Notification.deleteMany({
      is_read: true,
      read_at: { $lt: cutoffDate }
    });
    
    logger.info('Old notifications cleaned up', {
      count: result.deletedCount,
      daysToKeep
    });
    
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up old notifications:', error);
    throw error;
  }
};

/**
 * Get notification statistics
 */
exports.getNotificationStats = async (userId) => {
  try {
    const stats = await Notification.aggregate([
      { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
      {
        $facet: {
          byType: [
            {
              $group: {
                _id: '$type',
                count: { $sum: 1 }
              }
            }
          ],
          byPriority: [
            {
              $group: {
                _id: '$priority',
                count: { $sum: 1 }
              }
            }
          ],
          readStats: [
            {
              $group: {
                _id: '$is_read',
                count: { $sum: 1 }
              }
            }
          ],
          recent: [
            { $sort: { created_at: -1 } },
            { $limit: 5 },
            {
              $project: {
                type: 1,
                title: 1,
                created_at: 1,
                is_read: 1
              }
            }
          ]
        }
      }
    ]);
    
    return {
      byType: stats[0].byType,
      byPriority: stats[0].byPriority,
      readStats: stats[0].readStats,
      recentNotifications: stats[0].recent
    };
  } catch (error) {
    logger.error('Error getting notification stats:', error);
    throw error;
  }
};

/**
 * Notification templates for common scenarios
 */
exports.templates = {
  assetAssigned: (assetName, assignedTo) => ({
    type: 'asset_assigned',
    title: 'Asset Assigned',
    message: `Asset "${assetName}" has been assigned to ${assignedTo}`,
    priority: 'medium'
  }),
  
  assetTransferred: (assetName, fromUser, toUser) => ({
    type: 'asset_transferred',
    title: 'Asset Transferred',
    message: `Asset "${assetName}" transferred from ${fromUser} to ${toUser}`,
    priority: 'medium'
  }),
  
  maintenanceDue: (assetName, dueDate) => ({
    type: 'maintenance_due',
    title: 'Maintenance Due',
    message: `Maintenance for "${assetName}" is due on ${dueDate}`,
    priority: 'high'
  }),
  
  approvalRequired: (requestType, requester) => ({
    type: 'approval_required',
    title: 'Approval Required',
    message: `${requestType} request from ${requester} requires your approval`,
    priority: 'high'
  }),
  
  approvalApproved: (requestType) => ({
    type: 'approval_approved',
    title: 'Request Approved',
    message: `Your ${requestType} request has been approved`,
    priority: 'medium'
  }),
  
  approvalRejected: (requestType, reason) => ({
    type: 'approval_rejected',
    title: 'Request Rejected',
    message: `Your ${requestType} request has been rejected${reason ? `: ${reason}` : ''}`,
    priority: 'high'
  }),
  
  warrantyExpiring: (assetName, daysLeft) => ({
    type: 'warranty_expiring',
    title: 'Warranty Expiring Soon',
    message: `Warranty for "${assetName}" expires in ${daysLeft} days`,
    priority: 'medium'
  }),
  
  auditScheduled: (auditDate, assets) => ({
    type: 'audit_scheduled',
    title: 'Asset Audit Scheduled',
    message: `Asset audit scheduled for ${auditDate} covering ${assets} assets`,
    priority: 'high'
  })
};
