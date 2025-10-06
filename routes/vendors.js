const express = require('express');
const router = express.Router();
const vendorCtrl = require('../controllers/vendorController');

router.get('/', vendorCtrl.getVendors);
router.post('/', vendorCtrl.createVendor);
router.get('/:id', vendorCtrl.getVendorById);

module.exports = router;
