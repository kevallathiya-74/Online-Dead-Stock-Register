const express = require('express');
const router = express.Router();
const qrScanController = require('../controllers/qrScanController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/qr/scan/:qrCode
 * @desc    Scan single asset by QR code
 * @access  All authenticated users
 * @query   mode (lookup|audit|checkout), include_history (boolean)
 */
router.get('/scan/:qrCode', qrScanController.scanAsset);

/**
 * @route   POST /api/qr/batch-scan
 * @desc    Batch scan multiple QR codes
 * @access  All authenticated users
 * @body    { qr_codes: string[], mode: string }
 */
router.post('/batch-scan', qrScanController.batchScan);

/**
 * @route   GET /api/qr/history
 * @desc    Get scan history for current user
 * @access  All authenticated users
 * @query   limit, page, mode, asset_id
 */
router.get('/history', qrScanController.getScanHistory);

/**
 * @route   GET /api/qr/stats
 * @desc    Get scan statistics for current user
 * @access  All authenticated users
 * @query   period (24h|7d|30d|90d)
 */
router.get('/stats', qrScanController.getScanStats);

/**
 * @route   POST /api/qr/quick-audit/:qrCode
 * @desc    Quick audit scan with condition update
 * @access  Auditor role
 * @body    { condition, status, location_verified, notes, photos }
 */
router.post(
  '/quick-audit/:qrCode',
  requireRole(['AUDITOR', 'ADMIN']),
  qrScanController.quickAuditScan
);

module.exports = router;
