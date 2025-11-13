const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');
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

// Apply auth middleware to all dashboard routes
router.use(authMiddleware);

// Admin & General Dashboard statistics routes
router.get('/stats', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'IT_MANAGER']), getDashboardStats);
router.get('/activities', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR']), getRecentActivities);
router.get('/approvals', requireRole(['ADMIN', 'INVENTORY_MANAGER']), getPendingApprovals);
router.get('/overview', requireRole(['ADMIN']), getSystemOverview);
router.get('/users-by-role', requireRole(['ADMIN']), getUsersByRole);
router.get('/assets-by-category', requireRole(['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR']), getAssetsByCategory);
router.get('/monthly-trends', requireRole(['ADMIN', 'INVENTORY_MANAGER']), getMonthlyTrends);

// Inventory Manager specific routes - RBAC protected
router.get('/inventory-stats', requireRole(['ADMIN', 'INVENTORY_MANAGER']), getInventoryStats);
router.get('/assets-by-location', requireRole(['ADMIN', 'INVENTORY_MANAGER']), getAssetsByLocationDetailed);
router.get('/warranty-expiring', requireRole(['ADMIN', 'INVENTORY_MANAGER']), getWarrantyExpiringAssets);
router.get('/maintenance-schedule', requireRole(['ADMIN', 'INVENTORY_MANAGER']), getMaintenanceScheduleDetailed);
router.get('/top-vendors', requireRole(['ADMIN', 'INVENTORY_MANAGER']), getTopVendorsDetailed);
router.get('/inventory-approvals', requireRole(['ADMIN', 'INVENTORY_MANAGER']), getInventoryApprovals);
router.get('/inventory-overview', requireRole(['ADMIN', 'INVENTORY_MANAGER']), getInventoryOverview);

// Auditor specific routes - RBAC protected
router.get('/auditor/stats', requireRole(['ADMIN', 'AUDITOR']), getAuditorStats);
router.get('/auditor/audit-items', requireRole(['ADMIN', 'AUDITOR']), getAuditItems);
router.get('/auditor/progress-chart', requireRole(['ADMIN', 'AUDITOR']), getAuditProgressChart);
router.get('/auditor/condition-chart', requireRole(['ADMIN', 'AUDITOR']), getConditionChart);
router.get('/auditor/recent-activities', requireRole(['ADMIN', 'AUDITOR']), getAuditorActivities);
router.get('/auditor/compliance-metrics', requireRole(['ADMIN', 'AUDITOR']), getComplianceMetrics);

// Employee specific routes - All authenticated users can access their own data
router.get('/employee/stats', getEmployeeStats);

module.exports = router;