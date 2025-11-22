const express = require('express');
const router = express.Router();
const {
  getAllAssetTransfers,
  getAssetTransferById,
  createAssetTransfer,
  updateAssetTransferStatus,
  getAssetTransferStats
} = require('../controllers/assetTransferController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/objectIdValidator');

// GET /api/asset-transfers - Get all asset transfers (Role-based filtering applied in controller)
router.get('/', 
  authenticateToken, 
  getAllAssetTransfers
);

// GET /api/asset-transfers/stats - Get asset transfer statistics (Admin, Inventory Manager, Auditor)
router.get('/stats', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR']), 
  getAssetTransferStats
);

// GET /api/asset-transfers/:id - Get asset transfer by ID (Role-based access in controller)
router.get('/:id', 
  authenticateToken, 
  validateObjectId('id'),
  getAssetTransferById
);

// POST /api/asset-transfers - Create new asset transfer (All authenticated users)
router.post('/', 
  authenticateToken, 
  createAssetTransfer
);

// PATCH /api/asset-transfers/:id/status - Update asset transfer status (Admin, Inventory Manager)
router.patch('/:id/status', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER']), 
  validateObjectId('id'),
  updateAssetTransferStatus
);

module.exports = router;