const express = require('express');
const router = express.Router();
const { 
  getVendorStats, 
  getRecentOrders,
  getAllOrders,
  getOrderById,
  getProducts,
  getInvoices,
  getProfile,
  updateProfile
} = require('../controllers/vendorPortalController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

// Apply authentication and role check to all vendor routes
router.use(authenticateToken);
router.use(requireRole(['VENDOR']));

// Dashboard routes
router.get('/dashboard/stats', getVendorStats);
router.get('/dashboard/recent-orders', getRecentOrders);

// Orders routes
router.get('/orders', getAllOrders);
router.get('/orders/:id', getOrderById);

// Products routes (assets supplied by vendor)
router.get('/products', getProducts);

// Invoices routes
router.get('/invoices', getInvoices);

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', updateProfile);

module.exports = router;
