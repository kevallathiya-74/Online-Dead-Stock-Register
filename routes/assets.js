const express = require('express');
const router = express.Router();
const assetCtrl = require('../controllers/assetController');

// GET /api/assets
router.get('/', assetCtrl.getAssets);

// GET /api/assets/:id
router.get('/:id', assetCtrl.getAssetById);

// POST /api/assets
router.post('/', assetCtrl.createAsset);

// PUT /api/assets/:id
router.put('/:id', assetCtrl.updateAsset);

// DELETE /api/assets/:id
router.delete('/:id', assetCtrl.deleteAsset);

module.exports = router;