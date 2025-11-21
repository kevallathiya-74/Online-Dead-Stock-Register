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

// Apply authentication to all routes
router.use(authMiddleware);

// Get all open issues across all assets (for dashboards)
router.get(
  '/open',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER', 'AUDITOR']),
  getAllOpenIssues
);

// Asset-specific issue routes
router.post('/assets/:id/issues', createAssetIssue); // All authenticated users can report issues
router.get('/assets/:id/issues', getAssetIssues);
router.get('/assets/:id/issues/latest', getLatestAssetIssue);
router.put(
  '/assets/:id/issues/:issueId',
  updateAssetIssue
); // Reporter or Admin/Inventory Manager
router.delete(
  '/assets/:id/issues/:issueId',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  deleteAssetIssue
);

module.exports = router;
