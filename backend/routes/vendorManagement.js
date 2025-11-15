const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const vendorManagementController = require('../controllers/vendorManagementController');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Middleware to check inventory manager or admin role
const requireInventoryAccess = (req, res, next) => {
  if (!['ADMIN', 'INVENTORY_MANAGER'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Inventory management access required' });
  }
  next();
};

// Public vendor routes (read-only for all authenticated users)
// Get all vendors with filtering and pagination
router.get('/', vendorManagementController.getAllVendors);

// Protected vendor routes (inventory manager/admin only)
// Get vendor statistics for dashboard - MUST come before /:id
router.get('/dashboard/stats', requireInventoryAccess, vendorManagementController.getVendorStats);

// Get vendors by category - MUST come before /:id
router.get('/category/:category', vendorManagementController.getVendorsByCategory);

// Get vendor performance metrics - specific route before generic :id
router.get('/:id/performance', vendorManagementController.getVendorPerformance);

// Get vendor by ID with performance metrics - MUST be last among GET routes
router.get('/:id', vendorManagementController.getVendorById);

// Create new vendor
router.post('/', requireInventoryAccess, vendorManagementController.createVendor);

// Update vendor
router.put('/:id', requireInventoryAccess, vendorManagementController.updateVendor);

// Update vendor performance rating
router.put('/:id/rating', requireInventoryAccess, vendorManagementController.updateVendorRating);

// Delete vendor (soft delete)
router.delete('/:id', requireInventoryAccess, vendorManagementController.deleteVendor);

module.exports = router;