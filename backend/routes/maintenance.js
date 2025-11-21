const express = require('express');
const router = express.Router();
const maintCtrl = require('../controllers/maintenanceController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Warranty routes - MUST BE BEFORE /:id route to avoid route conflict
router.get('/warranties', authMiddleware, maintCtrl.getWarranties);
router.get('/warranties/stats', authMiddleware, maintCtrl.getWarrantyStats);
router.get('/warranties/export', authMiddleware, maintCtrl.exportWarrantyReport);
router.post('/warranties/claim', authMiddleware, maintCtrl.fileWarrantyClaim);
router.get('/warranties/:id', authMiddleware, maintCtrl.getWarrantyById);
router.patch('/warranties/:id', authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER']), maintCtrl.updateWarranty);
router.post('/warranties/:id/extend', authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER']), maintCtrl.extendWarranty);
router.get('/warranties/:id/claims', authMiddleware, maintCtrl.getWarrantyClaimHistory);

// Maintenance records - Generic routes
router.get('/', authMiddleware, maintCtrl.getMaintenanceRecords);
router.post('/', authMiddleware, maintCtrl.createMaintenanceRecord);
router.get('/technicians', authMiddleware, maintCtrl.getTechnicians);
router.get('/:id', authMiddleware, maintCtrl.getMaintenanceById);
router.put('/:id', authMiddleware, maintCtrl.updateMaintenanceRecord);
router.delete('/:id', authMiddleware, maintCtrl.deleteMaintenanceRecord);

module.exports = router;
