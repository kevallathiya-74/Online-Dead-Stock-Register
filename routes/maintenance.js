const express = require('express');
const router = express.Router();
const maintCtrl = require('../controllers/maintenanceController');

router.get('/', maintCtrl.getMaintenanceRecords);
router.post('/', maintCtrl.createMaintenanceRecord);
router.get('/:id', maintCtrl.getMaintenanceById);

module.exports = router;
