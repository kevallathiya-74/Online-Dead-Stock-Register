const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const backupController = require('../controllers/backupController');

// All routes require authentication and admin role
router.use(authMiddleware);
router.use(requireRole(['ADMIN']));

// Get all backups
router.get('/', backupController.getAllBackups);

// Get backup jobs
router.get('/jobs', backupController.getBackupJobs);

// Create backup
router.post('/', backupController.createBackup);

// Restore backup
router.post('/:id/restore', backupController.restoreBackup);

// Download backup
router.get('/:id/download', backupController.downloadBackup);

// Delete backup
router.delete('/:id', backupController.deleteBackup);

module.exports = router;
