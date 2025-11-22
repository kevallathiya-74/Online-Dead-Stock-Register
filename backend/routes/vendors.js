const express = require('express');
const router = express.Router();
const vendorCtrl = require('../controllers/vendorController');
const { authMiddleware } = require('../middleware/authMiddleware');
const { validateObjectId } = require('../middleware/objectIdValidator');

router.get('/', authMiddleware, vendorCtrl.getVendors);
router.post('/', authMiddleware, vendorCtrl.createVendor);
router.get('/:id', authMiddleware, validateObjectId('id'), vendorCtrl.getVendorById);
router.put('/:id', authMiddleware, validateObjectId('id'), vendorCtrl.updateVendor);
router.delete('/:id', authMiddleware, validateObjectId('id'), vendorCtrl.deleteVendor);

module.exports = router;
