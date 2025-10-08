const express = require('express');
const router = express.Router();
const assetCtrl = require('../controllers/assetController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Protected: GET all assets
router.get('/', authMiddleware, assetCtrl.getAssets);

// Protected: GET single asset
router.get('/:id', authMiddleware, assetCtrl.getAssetById);

// Admin only: POST create asset
router.post('/', authMiddleware, requireRole(['Admin']), assetCtrl.createAsset);

// Protected: PUT update asset
router.put('/:id', authMiddleware, assetCtrl.updateAsset);

// Admin only: DELETE asset
router.delete('/:id', authMiddleware, requireRole(['Admin']), assetCtrl.deleteAsset);

module.exports = router;