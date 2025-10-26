const express = require('express');
const router = express.Router();
const bulkOpsController = require('../controllers/bulkOperationsController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/bulk/validate
 * @desc    Validate bulk operation (dry run)
 * @access  All authenticated users
 * @body    { asset_ids: string[], operation: string, ...params }
 */
router.post('/validate', bulkOpsController.validateBulkOperation);

/**
 * @route   POST /api/bulk/update-status
 * @desc    Bulk update asset status
 * @access  Admin, Inventory Manager
 * @body    { asset_ids: string[], status: string, notes: string }
 */
router.post(
  '/update-status',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  bulkOpsController.bulkUpdateStatus
);

/**
 * @route   POST /api/bulk/assign
 * @desc    Bulk assign assets to user
 * @access  Admin, Inventory Manager
 * @body    { asset_ids: string[], user_id: string, department: string, notes: string }
 * @query   force=true (to reassign already assigned assets)
 */
router.post(
  '/assign',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  bulkOpsController.bulkAssign
);

/**
 * @route   POST /api/bulk/delete
 * @desc    Bulk delete assets (soft delete by default)
 * @access  Admin only for permanent delete, Admin + Inventory Manager for soft delete
 * @body    { asset_ids: string[], reason: string, permanent: boolean }
 * @query   force=true (to delete active/assigned assets)
 */
router.post(
  '/delete',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  bulkOpsController.bulkDelete
);

/**
 * @route   POST /api/bulk/schedule-maintenance
 * @desc    Bulk schedule maintenance for assets
 * @access  Admin, Inventory Manager
 * @body    { asset_ids: string[], maintenance_type: string, scheduled_date: string, description: string, priority: string, assigned_technician: string }
 */
router.post(
  '/schedule-maintenance',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  bulkOpsController.bulkScheduleMaintenance
);

/**
 * @route   POST /api/bulk/update-location
 * @desc    Bulk update asset location
 * @access  Admin, Inventory Manager
 * @body    { asset_ids: string[], location: string, notes: string }
 */
router.post(
  '/update-location',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  bulkOpsController.bulkUpdateLocation
);

/**
 * @route   POST /api/bulk/update-condition
 * @desc    Bulk update asset condition
 * @access  Admin, Inventory Manager, Auditor
 * @body    { asset_ids: string[], condition: string, notes: string }
 */
router.post(
  '/update-condition',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR']),
  bulkOpsController.bulkUpdateCondition
);

/**
 * @route   GET /api/bulk/history
 * @desc    Get bulk operation history
 * @access  All authenticated users (own operations), Admin (all operations)
 * @query   limit, page, action_type
 */
router.get('/history', bulkOpsController.getBulkOperationHistory);

module.exports = router;
