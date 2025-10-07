const express = require('express');
const router = express.Router();
const auditCtrl = require('../controllers/auditLogController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/',authMiddleware, auditCtrl.getAuditLogs);

module.exports = router;
