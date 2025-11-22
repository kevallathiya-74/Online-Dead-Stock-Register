const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const notificationController = require('../controllers/notificationController');
const { validateObjectId } = require('../middleware/objectIdValidator');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Get user notifications with pagination and filtering
router.get('/', notificationController.getUserNotifications);

// Get unread notification count
router.get('/unread-count', notificationController.getUnreadCount);

// Get notification types for filtering
router.get('/types', notificationController.getNotificationTypes);

// Mark notification as read
router.put('/:id/read', validateObjectId('id'), notificationController.markAsRead);

// Mark all notifications as read
router.put('/read-all', notificationController.markAllAsRead);

// Delete specific notification
router.delete('/:id', validateObjectId('id'), notificationController.deleteNotification);

// Delete all read notifications
router.delete('/read-all', notificationController.deleteAllRead);

// Create notification (requires admin or system role)
router.post('/', (req, res, next) => {
  if (!['ADMIN', 'SYSTEM'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions to create notifications' });
  }
  next();
}, notificationController.createNotification);

// Create system notification (admin only)
router.post('/system', (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}, notificationController.createSystemNotification);

module.exports = router;