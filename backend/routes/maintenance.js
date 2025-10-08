const express = require('express');
const router = express.Router();
const maintCtrl = require('../controllers/maintenanceController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, maintCtrl.getMaintenanceRecords);
router.post('/', authMiddleware, maintCtrl.createMaintenanceRecord);
router.get('/:id', authMiddleware, maintCtrl.getMaintenanceById);

module.exports = router;
