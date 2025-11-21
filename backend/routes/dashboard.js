const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
const { cacheMiddleware, userCacheKey } = require('../middleware/cacheMiddleware');
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
  getComplianceMetrics
} = require('../controllers/dashboardController');

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

// Admin & General Dashboard statistics routes (with caching)
router.get('/stats', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), cacheMiddleware(300, userCacheKey('dashboard:stats')), getDashboardStats);
router.get('/activities', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR']), cacheMiddleware(60), getRecentActivities);
router.get('/approvals', requireRole(['ADMIN', 'INVENTORY_MANAGER']), cacheMiddleware(120), getPendingApprovals);
router.get('/overview', requireRole(['ADMIN']), cacheMiddleware(300), getSystemOverview);
router.get('/users-by-role', requireRole(['ADMIN']), cacheMiddleware(600), getUsersByRole);
router.get('/assets-by-category', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR']), cacheMiddleware(300), getAssetsByCategory);
router.get('/monthly-trends', requireRole(['ADMIN', 'INVENTORY_MANAGER']), cacheMiddleware(600), getMonthlyTrends);

// Inventory Manager specific routes - RBAC protected (with caching) - Also accessible by IT_MANAGER
router.get('/inventory-stats', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), cacheMiddleware(300), getInventoryStats);
router.get('/assets-by-location', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), cacheMiddleware(300), getAssetsByLocationDetailed);
router.get('/warranty-expiring', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), cacheMiddleware(600), getWarrantyExpiringAssets);
router.get('/maintenance-schedule', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), cacheMiddleware(600), getMaintenanceScheduleDetailed);
router.get('/top-vendors', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), cacheMiddleware(600), getTopVendorsDetailed);
router.get('/inventory-approvals', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), cacheMiddleware(120), getInventoryApprovals);
router.get('/inventory-overview', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), cacheMiddleware(300), getInventoryOverview);

// Auditor specific routes - RBAC protected
router.get('/auditor/stats', requireRole(['ADMIN', 'AUDITOR']), getAuditorStats);
router.get('/auditor/audit-items', requireRole(['ADMIN', 'AUDITOR']), getAuditItems);
router.get('/auditor/progress-chart', requireRole(['ADMIN', 'AUDITOR']), getAuditProgressChart);
router.get('/auditor/condition-chart', requireRole(['ADMIN', 'AUDITOR']), getConditionChart);
router.get('/auditor/recent-activities', requireRole(['ADMIN', 'AUDITOR']), getAuditorActivities);
router.get('/auditor/compliance-metrics', requireRole(['ADMIN', 'AUDITOR']), getComplianceMetrics);

module.exports = router;