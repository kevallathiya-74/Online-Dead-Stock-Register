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
const {
  getAllInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoiceStatus,
  deleteInvoice,
  getInvoiceStats
} = require('../controllers/invoiceController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/objectIdValidator');

// Purchase Order Routes
// GET /api/purchase-management/orders - Get all purchase orders (Admin, Inventory Manager, IT Manager)
router.get('/orders', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  getAllPurchaseOrders
);

// GET /api/purchase-management/orders/:id - Get purchase order by ID (Admin, Inventory Manager, IT Manager)
router.get('/orders/:id', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  validateObjectId('id'),
  getPurchaseOrderById
);

// POST /api/purchase-management/orders - Create purchase order (Admin, Inventory Manager, IT Manager)
router.post('/orders', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  createPurchaseOrder
);

// PATCH /api/purchase-management/orders/:id/status - Update purchase order status (Admin, Inventory Manager, IT Manager)
router.patch('/orders/:id/status', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  validateObjectId('id'),
  updatePurchaseOrderStatus
);

// Purchase Request Routes
// GET /api/purchase-management/requests - Get all purchase requests (Admin, Inventory Manager, IT Manager)
router.get('/requests', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  getAllPurchaseRequests
);

// POST /api/purchase-management/requests - Create purchase request (All authenticated users)
router.post('/requests', 
  authenticateToken, 
  createPurchaseRequest
);

// Statistics Route
// GET /api/purchase-management/stats - Get purchase statistics (Admin, Inventory Manager, IT Manager)
router.get('/stats', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  getPurchaseStats
);

// Invoice Routes
// GET /api/purchase-management/invoices - Get all invoices (Admin, Inventory Manager, IT Manager)
router.get('/invoices', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  getAllInvoices
);

// GET /api/purchase-management/invoices/stats - Get invoice statistics (Admin, Inventory Manager, IT Manager)
router.get('/invoices/stats', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  getInvoiceStats
);

// GET /api/purchase-management/invoices/:id - Get invoice by ID (Admin, Inventory Manager, IT Manager)
router.get('/invoices/:id', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  validateObjectId('id'),
  getInvoiceById
);

// POST /api/purchase-management/invoices - Create invoice (Admin, Inventory Manager, IT Manager)
router.post('/invoices', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  createInvoice
);

// PATCH /api/purchase-management/invoices/:id/status - Update invoice status (Admin, Inventory Manager, IT Manager)
router.patch('/invoices/:id/status', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  validateObjectId('id'),
  updateInvoiceStatus
);

// DELETE /api/purchase-management/invoices/:id - Delete invoice (Admin, Inventory Manager, IT Manager)
router.delete('/invoices/:id', 
  authenticateToken, 
  requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), 
  validateObjectId('id'),
  deleteInvoice
);

module.exports = router;