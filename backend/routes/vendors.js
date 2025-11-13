const express = require('express');
const router = express.Router();
const vendorCtrl = require('../controllers/vendorController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, vendorCtrl.getVendors);
router.post('/', authMiddleware, vendorCtrl.createVendor);
router.get('/:id', authMiddleware, vendorCtrl.getVendorById);
router.put('/:id', authMiddleware, vendorCtrl.updateVendor);
router.delete('/:id', authMiddleware, vendorCtrl.deleteVendor);

module.exports = router;
