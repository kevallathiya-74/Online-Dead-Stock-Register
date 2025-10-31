const express = require('express');
const router = express.Router();
const auditCtrl = require('../controllers/auditLogController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get audit logs with filtering
router.get('/', requireRole(['ADMIN', 'AUDITOR', 'IT_MANAGER']), auditCtrl.getAuditLogs);

// Get audit statistics
router.get('/stats', requireRole(['ADMIN', 'AUDITOR']), auditCtrl.getAuditStats);

// Export audit logs
router.get('/export', requireRole(['ADMIN', 'AUDITOR']), auditCtrl.exportAuditLogs);

module.exports = router;
