const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const assetRequestController = require('../controllers/assetRequestController');
const { validateObjectId } = require('../middleware/objectIdValidator');

// Apply auth middleware to all routes
router.use(authMiddleware);

// Employee routes
// Get user's asset requests
router.get('/my-requests', assetRequestController.getUserAssetRequests);

// Get asset request statistics for employee
router.get('/my-stats', assetRequestController.getAssetRequestStats);

// Create new asset request
router.post('/', assetRequestController.createAssetRequest);

// Get specific asset request by ID
router.get('/:id', validateObjectId('id'), assetRequestController.getAssetRequestById);

// Update asset request (only for pending requests)
router.put('/:id', validateObjectId('id'), assetRequestController.updateAssetRequest);

// Cancel asset request
router.put('/:id/cancel', validateObjectId('id'), assetRequestController.cancelAssetRequest);

// Admin/Inventory Manager routes
// Get all asset requests (requires elevated permissions)
router.get('/', (req, res, next) => {
  if (!['ADMIN', 'INVENTORY_MANAGER'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Insufficient permissions' });
  }
  next();
}, assetRequestController.getAllAssetRequests);

module.exports = router;