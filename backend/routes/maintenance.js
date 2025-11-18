const express = require('express');
const router = express.Router();
const maintCtrl = require('../controllers/maintenanceController');
const { authMiddleware } = require('../middleware/authMiddleware');

router.get('/', authMiddleware, maintCtrl.getMaintenanceRecords);
router.post('/', authMiddleware, maintCtrl.createMaintenanceRecord);
router.get('/technicians', authMiddleware, maintCtrl.getTechnicians);
router.get('/warranties', authMiddleware, maintCtrl.getWarranties);
router.post('/warranties/claim', authMiddleware, maintCtrl.fileWarrantyClaim);
router.get('/:id', authMiddleware, maintCtrl.getMaintenanceById);
router.put('/:id', authMiddleware, maintCtrl.updateMaintenanceRecord);
router.delete('/:id', authMiddleware, maintCtrl.deleteMaintenanceRecord);

module.exports = router;
