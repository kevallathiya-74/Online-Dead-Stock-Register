const express = require('express');
const router = express.Router();
const approvalCtrl = require('../controllers/approvalController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Protected: GET all approvals
router.get('/', authMiddleware, approvalCtrl.getApprovals);

// Protected: GET single approval
router.get('/:id', authMiddleware, approvalCtrl.getApprovalById);

// Protected: POST create approval
router.post('/', authMiddleware, approvalCtrl.createApproval);

// Approver role only: PUT approve/reject
router.put('/:id/approve', authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER']), approvalCtrl.approveRequest);
router.put('/:id/reject', authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER']), approvalCtrl.rejectRequest);

module.exports = router;
