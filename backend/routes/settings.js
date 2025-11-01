const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const settingsController = require('../controllers/settingsController');

// Apply auth middleware and require ADMIN role for all settings routes
router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

/**
 * @route   GET /api/v1/settings
 * @desc    Get all system settings
 * @access  Private (ADMIN only)
 */
router.get('/', settingsController.getAllSettings);

/**
 * @route   GET /api/v1/settings/:id
 * @desc    Get single system setting
 * @access  Private (ADMIN only)
 */
router.get('/:id', settingsController.getSetting);

/**
 * @route   PUT /api/v1/settings/:id
 * @desc    Update system setting
 * @access  Private (ADMIN only)
 */
router.put('/:id', settingsController.updateSetting);

/**
 * @route   POST /api/v1/settings/test-connection/:type
 * @desc    Test connection (email, database, etc.)
 * @access  Private (ADMIN only)
 */
router.post('/test-connection/:type', settingsController.testConnection);

/**
 * @route   POST /api/v1/settings/backup
 * @desc    Create system backup
 * @access  Private (ADMIN only)
 */
router.post('/backup', settingsController.createBackup);

/**
 * @route   GET /api/v1/settings/backups
 * @desc    Get backup history
 * @access  Private (ADMIN only)
 */
router.get('/backups/history', settingsController.getBackupHistory);

module.exports = router;
