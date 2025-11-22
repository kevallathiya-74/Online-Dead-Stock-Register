const express = require('express');
const router = express.Router();
const approvalCtrl = require('../controllers/approvalController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/objectIdValidator');

// Protected: GET all approvals
router.get('/', authMiddleware, approvalCtrl.getApprovals);

// Protected: GET single approval
router.get('/:id', authMiddleware, validateObjectId('id'), approvalCtrl.getApprovalById);

// Protected: POST create approval
router.post('/', authMiddleware, approvalCtrl.createApproval);

// Approver role only: PUT approve/reject (Admin, Inventory Manager, IT Manager)
router.put('/:id/approve', authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), validateObjectId('id'), approvalCtrl.approveRequest);
router.put('/:id/reject', authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), validateObjectId('id'), approvalCtrl.rejectRequest);

module.exports = router;
