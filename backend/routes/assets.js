const express = require('express');
const router = express.Router();
const assetCtrl = require('../controllers/assetController');
const inventoryCtrl = require('../controllers/inventoryController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { 
  validateAssetCreation, 
  validateQueryParams,
  validateObjectId 
} = require('../middleware/validationMiddleware');

// Protected: GET all assets with pagination and filtering
router.get('/', authMiddleware, validateQueryParams, assetCtrl.getAssets);

// GET my assigned assets (employee-specific)
router.get('/my-assets', authMiddleware, assetCtrl.getMyAssets);

// GET asset statistics - DYNAMIC STATS
router.get('/stats', authMiddleware, assetCtrl.getAssetStats);

// Asset Categories (for backward compatibility - main route is in inventory)
// IMPORTANT: Define specific routes BEFORE param routes like '/:id' to avoid conflicts
router.get('/categories', authMiddleware, inventoryCtrl.getCategories);
router.post('/categories', authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER']), inventoryCtrl.createCategory);
router.put('/categories/:id', authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER']), inventoryCtrl.updateCategory);
router.delete('/categories/:id', authMiddleware, requireRole(['ADMIN']), inventoryCtrl.deleteCategory);

// Protected: GET single asset
router.get('/:id', authMiddleware, validateObjectId, assetCtrl.getAssetById);

// Admin and Inventory Manager: POST create asset
router.post('/', 
  authMiddleware, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER']), 
  validateAssetCreation,
  assetCtrl.createAsset
);

// Admin, Inventory Manager, and Auditor: PUT update asset
// Auditors can update for audit purposes (condition, status, last_audit_date)
router.put('/:id', 
  authMiddleware, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR']),
  validateObjectId,
  assetCtrl.updateAsset
);

// Admin only: DELETE asset
router.delete('/:id', 
  authMiddleware, 
  requireRole(['ADMIN']),
  validateObjectId,
  assetCtrl.deleteAsset
);

module.exports = router;