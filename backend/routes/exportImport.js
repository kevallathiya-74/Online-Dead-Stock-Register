const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { importUpload } = require('../middleware/uploadMiddleware');
const exportImportController = require('../controllers/exportImportController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Export routes
router.post('/export', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR']), exportImportController.exportData);

// Import routes - with file upload middleware
router.post('/import', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR']), importUpload.single('file'), exportImportController.importData);

module.exports = router;