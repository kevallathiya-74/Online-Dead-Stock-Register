const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const {
  createAssetIssue,
  getAssetIssues,
  getLatestAssetIssue,
  updateAssetIssue,
  deleteAssetIssue,
  getAllOpenIssues
} = require('../controllers/assetIssueController');
const { validateObjectId, validateObjectIds } = require('../middleware/objectIdValidator');

// Apply authentication to all routes
router.use(authMiddleware);

// Get all open issues across all assets (for dashboards)
router.get(
  '/open',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR']),
  getAllOpenIssues
);

// Asset-specific issue routes
router.post('/assets/:id/issues', validateObjectId('id'), createAssetIssue); // All authenticated users can report issues
router.get('/assets/:id/issues', validateObjectId('id'), getAssetIssues);
router.get('/assets/:id/issues/latest', validateObjectId('id'), getLatestAssetIssue);
router.put(
  '/assets/:id/issues/:issueId',
  validateObjectIds(['id', 'issueId']),
  updateAssetIssue
); // Reporter or Admin/Inventory Manager
router.delete(
  '/assets/:id/issues/:issueId',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  validateObjectIds(['id', 'issueId']),
  deleteAssetIssue
);

module.exports = router;
