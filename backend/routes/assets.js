const express = require('express');
const router = express.Router();
const assetCtrl = require('../controllers/assetController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Protected: GET all assets
router.get('/', authMiddleware, assetCtrl.getAssets);

// Protected: GET single asset
router.get('/:id', authMiddleware, assetCtrl.getAssetById);

// Admin and Inventory Manager: POST create asset
router.post('/', authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER']), assetCtrl.createAsset);

// Admin and Inventory Manager: PUT update asset
router.put('/:id', authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER']), assetCtrl.updateAsset);

// Admin only: DELETE asset
router.delete('/:id', authMiddleware, requireRole(['ADMIN']), assetCtrl.deleteAsset);

module.exports = router;