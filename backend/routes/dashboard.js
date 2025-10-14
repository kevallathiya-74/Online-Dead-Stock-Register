const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/authMiddleware');
const {
  getDashboardStats,
  getRecentActivities,
  getPendingApprovals,
  getSystemOverview,
  getUsersByRole,
  getAssetsByCategory,
  getMonthlyTrends,
  // Inventory Manager endpoints
  getInventoryStats,
  getAssetsByLocationDetailed,
  getWarrantyExpiringAssets,
  getMaintenanceScheduleDetailed,
  getTopVendorsDetailed,
  getInventoryApprovals,
  getInventoryOverview,
  // Auditor endpoints
  getAuditorStats,
  getAuditItems,
  getAuditProgressChart,
  getConditionChart,
  getAuditorActivities,
  getComplianceMetrics,
  // Employee endpoints
  getEmployeeStats
} = require('../controllers/dashboardController');

// Test route without auth
router.get('/test', (req, res) => {
  res.json({ message: 'Dashboard routes working!', timestamp: new Date().toISOString() });
});

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

// Dashboard statistics routes
router.get('/stats', getDashboardStats);
router.get('/activities', getRecentActivities);
router.get('/approvals', getPendingApprovals);
router.get('/overview', getSystemOverview);
router.get('/users-by-role', getUsersByRole);
router.get('/assets-by-category', getAssetsByCategory);
router.get('/monthly-trends', getMonthlyTrends);

// Inventory Manager specific routes
router.get('/inventory-stats', getInventoryStats);
router.get('/assets-by-location', getAssetsByLocationDetailed);
router.get('/warranty-expiring', getWarrantyExpiringAssets);
router.get('/maintenance-schedule', getMaintenanceScheduleDetailed);
router.get('/top-vendors', getTopVendorsDetailed);
router.get('/inventory-approvals', getInventoryApprovals);
router.get('/inventory-overview', getInventoryOverview);

// Auditor specific routes
router.get('/auditor/stats', getAuditorStats);
router.get('/auditor/audit-items', getAuditItems);
router.get('/auditor/progress-chart', getAuditProgressChart);
router.get('/auditor/condition-chart', getConditionChart);
router.get('/auditor/recent-activities', getAuditorActivities);
router.get('/auditor/compliance-metrics', getComplianceMetrics);

// Employee specific routes
router.get('/employee/stats', getEmployeeStats);

module.exports = router;