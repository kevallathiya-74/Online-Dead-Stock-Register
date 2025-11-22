const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const reportsController = require('../controllers/reportsController');
const { validateObjectId } = require('../middleware/objectIdValidator');

// ========================================
// REPORT ROUTES
// ========================================

// All routes require authentication
router.use(authMiddleware);

// Get report templates
router.get(
  '/templates',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR']),
  reportsController.getReportTemplates
);

// Get asset summary for reports
router.get(
  '/asset-summary',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR']),
  reportsController.getAssetSummary
);

// Get report history
router.get(
  '/history',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR']),
  reportsController.getReportHistory
);

// Get report statistics
router.get(
  '/stats',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  reportsController.getReportStats
);

// Generate report 
router.post(
  '/generate',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR']),
  reportsController.generateReport
);

// Download report
router.get(
  '/:id/download',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR']),
  validateObjectId('id'),
  reportsController.downloadReport
);

module.exports = router;
