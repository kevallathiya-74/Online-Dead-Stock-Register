const express = require('express');
const router = express.Router();
const approvalCtrl = require('../controllers/approvalController');

router.get('/', approvalCtrl.getApprovals);
router.get('/:id', approvalCtrl.getApprovalById);
router.post('/', approvalCtrl.createApproval);
router.put('/:id/approve', approvalCtrl.approveRequest);
router.put('/:id/reject', approvalCtrl.rejectRequest);

module.exports = router;
