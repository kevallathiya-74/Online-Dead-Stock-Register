const express = require('express');
const router = express.Router();
const automationController = require('../controllers/automationController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * 🤖 DISPOSAL AUTOMATION ROUTES
 */

// GET /api/v1/automation/disposal/status
// Get automation status and statistics
router.get(
  '/disposal/status',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  automationController.getAutomationStatus
);

// POST /api/v1/automation/disposal/trigger
// Manually trigger disposal automation (Admin only)
router.post(
  '/disposal/trigger',
  requireRole(['ADMIN']),
  automationController.triggerDisposalCheck
);

// PUT /api/v1/automation/disposal/rules
// Update disposal automation rules (Admin only)
router.put(
  '/disposal/rules',
  requireRole(['ADMIN']),
  automationController.updateDisposalRules
);

// GET /api/v1/automation/disposal/eligible-assets
// Preview assets eligible for disposal
router.get(
  '/disposal/eligible-assets',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  automationController.getEligibleAssets
);

/**
 * 🕐 SCHEDULER ROUTES
 */

// GET /api/v1/automation/scheduler/status
// Get scheduler status
router.get(
  '/scheduler/status',
  requireRole(['ADMIN']),
  automationController.getSchedulerStatus
);

module.exports = router;
