const express = require('express');
const router = express.Router();
const userCtrl = require('../controllers/userController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Protected: GET all users (Admin/Auditor only)
router.get('/', authMiddleware, requireRole(['Admin', 'Auditor']), userCtrl.getUsers);

// Protected: GET single user
router.get('/:id', authMiddleware, userCtrl.getUserById);

// Admin only: POST create user
router.post('/', authMiddleware, requireRole(['Admin']), userCtrl.createUser);

// Protected: PUT update user
router.put('/:id', authMiddleware, userCtrl.updateUser);

// Admin only: DELETE user
router.delete('/:id', authMiddleware, requireRole(['Admin']), userCtrl.deleteUser);

module.exports = router;
