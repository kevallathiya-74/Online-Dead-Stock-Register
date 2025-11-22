const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const inventoryController = require('../controllers/inventoryController');
const { validateObjectId } = require('../middleware/objectIdValidator');

// Apply authentication to all routes
router.use(authMiddleware);

// ========================================
// DEAD STOCK ROUTES
// ========================================

// GET /api/v1/inventory/dead-stock - Get all dead stock items
router.get('/dead-stock', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  inventoryController.getDeadStockItems
);

// GET /api/v1/inventory/dead-stock/stats - Get dead stock statistics
router.get('/dead-stock/stats', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  inventoryController.getDeadStockStats
);

// POST /api/v1/inventory/dead-stock - Mark asset as dead stock
router.post('/dead-stock', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  inventoryController.markAsDeadStock
);

// PUT /api/v1/inventory/dead-stock/:id - Update dead stock item
router.put('/dead-stock/:id', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  validateObjectId('id'),
  inventoryController.updateDeadStockItem
);

// DELETE /api/v1/inventory/dead-stock/:id - Remove from dead stock
router.delete('/dead-stock/:id', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  validateObjectId('id'),
  inventoryController.removeFromDeadStock
);

// ========================================
// DISPOSAL ROUTES
// ========================================

// GET /api/v1/inventory/disposal-records - Get all disposal records
router.get('/disposal-records', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  inventoryController.getDisposalRecords
);

// GET /api/v1/inventory/disposal-records/:id - Get disposal record by ID
router.get('/disposal-records/:id', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  validateObjectId('id'),
  inventoryController.getDisposalRecordById
);

// POST /api/v1/inventory/disposal-records - Create disposal record
router.post('/disposal-records', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  inventoryController.createDisposalRecord
);

// PUT /api/v1/inventory/disposal-records/:id - Update disposal record
router.put('/disposal-records/:id', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  validateObjectId('id'),
  inventoryController.updateDisposalRecord
);

// DELETE /api/v1/inventory/disposal-records/:id - Delete disposal record
router.delete('/disposal-records/:id', 
  requireRole(['ADMIN']),
  validateObjectId('id'),
  inventoryController.deleteDisposalRecord
);

// ========================================
// SCRAP MANAGEMENT ROUTES
// ========================================

// GET /api/v1/inventory/scrap - Get all scrap items
router.get('/scrap', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  inventoryController.getScrapItems
);

// POST /api/v1/inventory/scrap - Create new scrap request
router.post('/scrap',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  inventoryController.createScrapRequest
);

// GET /api/v1/inventory/scrap/stats - Get scrap statistics
router.get('/scrap/stats',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  inventoryController.getScrapStats
);

// GET /api/v1/inventory/scrap/export - Export scrap report
router.get('/scrap/export',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  inventoryController.exportScrapReport
);

// GET /api/v1/inventory/scrap/:id - Get scrap item by ID
router.get('/scrap/:id',
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  validateObjectId('id'),
  inventoryController.getScrapItemById
);

// PATCH /api/v1/inventory/scrap/:id - Update scrap item
router.patch('/scrap/:id',
  requireRole(['ADMIN', 'INVENTORY_MANAGER']),
  validateObjectId('id'),
  inventoryController.updateScrapItem
);

// DELETE /api/v1/inventory/scrap/:id - Delete scrap item
router.delete('/scrap/:id',
  requireRole(['ADMIN']),
  validateObjectId('id'),
  inventoryController.deleteScrapItem
);

// POST /api/v1/inventory/scrap/:id/approve - Approve scrap item
router.post('/scrap/:id/approve', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  validateObjectId('id'),
  inventoryController.approveScrapItem
);

// ========================================
// ASSET CATEGORIES ROUTES
// ========================================

// GET /api/v1/inventory/categories - Get all categories (moved from assets)
router.get('/categories', 
  inventoryController.getCategories
);

// POST /api/v1/inventory/categories - Create category
router.post('/categories', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  inventoryController.createCategory
);

// PUT /api/v1/inventory/categories/:id - Update category
router.put('/categories/:id', 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']),
  validateObjectId('id'),
  inventoryController.updateCategory
);

// DELETE /api/v1/inventory/categories/:id - Delete category
router.delete('/categories/:id', 
  requireRole(['ADMIN']),
  validateObjectId('id'),
  inventoryController.deleteCategory
);

module.exports = router;
