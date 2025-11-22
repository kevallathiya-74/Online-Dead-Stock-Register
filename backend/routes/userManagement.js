const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const userManagementController = require('../controllers/userManagementController');
const { validateObjectId } = require('../middleware/objectIdValidator');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Apply admin middleware to all routes
router.use(requireAdmin);

// Get all users with pagination and filtering
router.get('/', userManagementController.getAllUsers);

// Get user statistics
router.get('/stats', userManagementController.getUserStats);

// Get specific user by ID
router.get('/:id', validateObjectId('id'), userManagementController.getUserById);

// Create new user
router.post('/', userManagementController.createUser);

// Update user details
router.put('/:id', validateObjectId('id'), userManagementController.updateUser);

// Change user role
router.put('/:id/role', validateObjectId('id'), userManagementController.changeUserRole);

// Change user status (activate/deactivate)
router.put('/:id/status', validateObjectId('id'), userManagementController.changeUserStatus);

// Reset user password (admin function)
router.put('/:id/reset-password', validateObjectId('id'), userManagementController.resetUserPassword);

// Delete user (soft delete)
router.delete('/:id', validateObjectId('id'), userManagementController.deleteUser);

module.exports = router;