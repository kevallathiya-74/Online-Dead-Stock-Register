const express = require('express');
const router = express.Router();
const auditCtrl = require('../controllers/auditLogController');

router.get('/', auditCtrl.getAuditLogs);

module.exports = router;
