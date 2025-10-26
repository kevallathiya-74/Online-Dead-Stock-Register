const express = require('express');
const router = express.Router();
const {
  getAllPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  updatePurchaseOrderStatus,
  getAllPurchaseRequests,
  createPurchaseRequest,
  getPurchaseStats
} = require('../controllers/purchaseManagementController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Purchase Order Routes
// GET /api/purchase-management/orders - Get all purchase orders (Admin, Inventory Manager)
router.get('/orders', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER']), 
  getAllPurchaseOrders
);

// GET /api/purchase-management/orders/:id - Get purchase order by ID (Admin, Inventory Manager)
router.get('/orders/:id', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER']), 
  getPurchaseOrderById
);

// POST /api/purchase-management/orders - Create purchase order (Admin, Inventory Manager)
router.post('/orders', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER']), 
  createPurchaseOrder
);

// PATCH /api/purchase-management/orders/:id/status - Update purchase order status (Admin, Inventory Manager)
router.patch('/orders/:id/status', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER']), 
  updatePurchaseOrderStatus
);

// Purchase Request Routes
// GET /api/purchase-management/requests - Get all purchase requests (Admin, Inventory Manager)
router.get('/requests', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER']), 
  getAllPurchaseRequests
);

// POST /api/purchase-management/requests - Create purchase request (All authenticated users)
router.post('/requests', 
  authenticateToken, 
  createPurchaseRequest
);

// Statistics Route
// GET /api/purchase-management/stats - Get purchase statistics (Admin, Inventory Manager)
router.get('/stats', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER']), 
  getPurchaseStats
);

module.exports = router;