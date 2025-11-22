const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/objectIdValidator');

// Protected: GET current user profile
router.get('/profile', authMiddleware, userCtrl.getProfile);

// Protected: PUT update current user profile
router.put('/profile', authMiddleware, userCtrl.updateProfile);

// Protected: POST change password
router.post('/change-password', authMiddleware, userCtrl.changePassword);

// Protected: GET all users (Admin only - AUDITOR role removed)
router.get('/', authMiddleware, requireRole(['ADMIN']), userCtrl.getUsers);

// Protected: GET single user
router.get('/:id', authMiddleware, validateObjectId('id'), userCtrl.getUserById);

// Admin only: POST create user
router.post('/', authMiddleware, requireRole(['ADMIN']), userCtrl.createUser);

// Protected: PUT update user
router.put('/:id', authMiddleware, validateObjectId('id'), userCtrl.updateUser);

// Admin only: DELETE user
router.delete('/:id', authMiddleware, requireRole(['ADMIN']), validateObjectId('id'), userCtrl.deleteUser);

module.exports = router;
