const express = require('express');
const router = express.Router();
const scheduledAuditsController = require('../controllers/scheduledAuditsController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/scheduled-audits
 * @desc    Create a new scheduled audit
 * @access  ADMIN, INVENTORY_MANAGER
 */
router.post(
  '/',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  scheduledAuditsController.createScheduledAudit
);

/**
 * @route   GET /api/scheduled-audits
 * @desc    Get all scheduled audits
 * @access  All authenticated users
 */
router.get('/', scheduledAuditsController.getScheduledAudits);

/**
 * @route   GET /api/scheduled-audits/:audit_id
 * @desc    Get scheduled audit by ID
 * @access  Creator, assigned auditors, or ADMIN
 */
router.get('/:audit_id', scheduledAuditsController.getScheduledAuditById);

/**
 * @route   PUT /api/scheduled-audits/:audit_id
 * @desc    Update scheduled audit
 * @access  Creator or ADMIN
 */
router.put(
  '/:audit_id',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  scheduledAuditsController.updateScheduledAudit
);

/**
 * @route   DELETE /api/scheduled-audits/:audit_id
 * @desc    Delete scheduled audit
 * @access  Creator or ADMIN
 */
router.delete(
  '/:audit_id',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  scheduledAuditsController.deleteScheduledAudit
);

/**
 * @route   POST /api/scheduled-audits/:audit_id/trigger
 * @desc    Manually trigger an audit run
 * @access  ADMIN, INVENTORY_MANAGER, AUDITOR
 */
router.post(
  '/:audit_id/trigger',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR']),
  scheduledAuditsController.triggerAuditRun
);

/**
 * @route   GET /api/scheduled-audits/:audit_id/runs
 * @desc    Get all runs for a scheduled audit
 * @access  All authenticated users
 */
router.get('/:audit_id/runs', scheduledAuditsController.getAuditRuns);

/**
 * @route   PUT /api/scheduled-audits/runs/:run_id/progress
 * @desc    Update audit run progress (record audited asset)
 * @access  Assigned auditors
 */
router.put('/runs/:run_id/progress', scheduledAuditsController.updateAuditRunProgress);

/**
 * @route   POST /api/scheduled-audits/send-reminders
 * @desc    Send reminders for upcoming audits (typically called by cron job)
 * @access  ADMIN only (or system cron job)
 */
router.post(
  '/send-reminders',
  requireRole(['ADMIN']),
  scheduledAuditsController.sendAuditReminders
);

module.exports = router;
