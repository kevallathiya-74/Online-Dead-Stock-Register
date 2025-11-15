const Notification = require('../models/notification');
const User = require('../models/user');

// Get user notifications with pagination
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, is_read, type } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    let filter = { recipient: userId };
    if (is_read !== undefined) filter.is_read = is_read === 'true';
    if (type) filter.type = type;

    const notifications = await Notification.find(filter)
      .populate('sender', 'full_name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      is_read: false 
    });

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_notifications: total,
          unread_count: unreadCount,
          has_next: page * limit < total,
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
  }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const unreadCount = await Notification.countDocuments({ 
      recipient: userId, 
      is_read: false 
    });

    res.json({ success: true, data: { unread_count: unreadCount } });
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipient: userId },
      { 
        is_read: true,
        read_at: new Date()
      },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.json({
      success: true,
      data: notification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Failed to mark notification as read' });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany(
      { recipient: userId, is_read: false },
      { 
        is_read: true,
        read_at: new Date()
      }
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Failed to mark all notifications as read' });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      recipient: userId
    });

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Failed to delete notification' });
  }
};

// Delete all read notifications
exports.deleteAllRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({
      recipient: userId,
      is_read: true
    });

    res.json({ message: 'All read notifications deleted successfully' });
  } catch (error) {
    console.error('Error deleting read notifications:', error);
    res.status(500).json({ message: 'Failed to delete read notifications' });
  }
};

// Create notification (for admin/system use)
exports.createNotification = async (req, res) => {
  try {
    const {
      recipient_id,
      title,
      message,
      type = 'info',
      priority = 'medium',
      data = null,
      action_url = null,
      expires_at = null
    } = req.body;

    // Verify recipient exists
    const recipient = await User.findById(recipient_id);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found' });
    }

    const notification = new Notification({
      recipient: recipient_id,
      sender: req.user.id,
      title,
      message,
      type,
      priority,
      data,
      action_url,
      expires_at
    });

    await notification.save();

    // Populate sender info for response
    await notification.populate('sender', 'full_name email');
    await notification.populate('recipient', 'full_name email');

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Failed to create notification' });
  }
};

// Create system notification (no sender)
exports.createSystemNotification = async (req, res) => {
  try {
    const {
      recipient_id,
      title,
      message,
      type = 'system',
      priority = 'medium',
      data = null,
      action_url = null,
      expires_at = null
    } = req.body;

    // If recipient_id is 'all', send to all active users
    let recipients = [];
    if (recipient_id === 'all') {
      const users = await User.find({ status: 'active' }).select('_id');
      recipients = users.map(user => user._id);
    } else {
      // Verify recipient exists
      const recipient = await User.findById(recipient_id);
      if (!recipient) {
        return res.status(404).json({ message: 'Recipient user not found' });
      }
      recipients = [recipient_id];
    }

    // Create notifications for all recipients
    const notifications = recipients.map(recipientId => ({
      recipient: recipientId,
      title,
      message,
      type,
      priority,
      data,
      action_url,
      expires_at
    }));

    await Notification.insertMany(notifications);

    res.status(201).json({
      message: `System notification sent to ${recipients.length} user(s)`,
      count: recipients.length
    });
  } catch (error) {
    console.error('Error creating system notification:', error);
    res.status(500).json({ message: 'Failed to create system notification' });
  }
};

// Get notification types for filtering
exports.getNotificationTypes = async (req, res) => {
  try {
    const types = [
      'info',
      'warning', 
      'error',
      'success',
      'maintenance',
      'audit',
      'approval',
      'asset_assigned',
      'asset_returned',
      'warranty_expiring',
      'system'
    ];

    res.json({ types });
  } catch (error) {
    console.error('Error fetching notification types:', error);
    res.status(500).json({ message: 'Failed to fetch notification types' });
  }
};