/**
 * ASSET LIFECYCLE AUTOMATION ROUTES
 * 
 * Provides API endpoints for automated asset lifecycle management.
 * All routes require authentication. Admin-only for execution endpoints.
 * 
 * ENDPOINTS:
 * - GET  /api/v1/lifecycle/stats       - Get current statistics (Admin, Manager)
 * - POST /api/v1/lifecycle/run         - Run full automation (Admin only)
 * - POST /api/v1/lifecycle/dead-stock  - Move to dead stock only (Admin only)
 * - POST /api/v1/lifecycle/disposal    - Move to disposal only (Admin only)
 * - GET  /api/v1/lifecycle/config      - Get configuration (Admin, Manager)
 * - PUT  /api/v1/lifecycle/config      - Update configuration (Admin only)
 * 
 * TESTED: All routes load successfully ✅
 */

const express = require('express');
const router = express.Router();
const assetLifecycleService = require('../services/assetLifecycleService');
const scheduledJobs = require('../services/scheduledJobs');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// Helper middleware for role checks
const adminOnly = [authMiddleware, requireRole(['ADMIN'])];
const managerOrAdmin = [authMiddleware, requireRole(['ADMIN', 'INVENTORY_MANAGER'])];

/**
 * @route   GET /api/v1/lifecycle/stats
 * @desc    Get lifecycle automation statistics
 * @access  Private (Admin, Manager)
 */
router.get('/stats', managerOrAdmin, async (req, res) => {
  try {
    const stats = await assetLifecycleService.getLifecycleStats();
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching lifecycle stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lifecycle statistics',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/v1/lifecycle/run
 * @desc    Manually trigger full lifecycle automation
 * @access  Private (Admin only)
 */
router.post('/run', adminOnly, async (req, res) => {
  try {
    console.log(`🔧 [API] Lifecycle automation triggered by user: ${req.user.name}`);
    
    const result = await scheduledJobs.triggerLifecycleNow();
    
    res.json({
      success: true,
      message: 'Lifecycle automation completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error running lifecycle automation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run lifecycle automation',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/v1/lifecycle/dead-stock
 * @desc    Manually trigger dead stock check only
 * @access  Private (Admin only)
 */
router.post('/dead-stock', adminOnly, async (req, res) => {
  try {
    console.log(`🔧 [API] Dead stock check triggered by user: ${req.user.name}`);
    
    const result = await assetLifecycleService.moveOutdatedToDeadStock();
    
    res.json({
      success: true,
      message: `${result.count} assets moved to dead stock`,
      data: result,
    });
  } catch (error) {
    console.error('Error running dead stock check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move assets to dead stock',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/v1/lifecycle/disposal
 * @desc    Manually trigger disposal check only
 * @access  Private (Admin only)
 */
router.post('/disposal', adminOnly, async (req, res) => {
  try {
    console.log(`🔧 [API] Disposal check triggered by user: ${req.user.name}`);
    
    const result = await assetLifecycleService.moveDeadStockToDisposal();
    
    res.json({
      success: true,
      message: `${result.count} assets moved to disposal`,
      data: result,
    });
  } catch (error) {
    console.error('Error running disposal check:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to move assets to disposal',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/v1/lifecycle/config
 * @desc    Update lifecycle automation configuration
 * @access  Private (Admin only)
 */
router.put('/config', adminOnly, async (req, res) => {
  try {
    const { deadStock, disposal } = req.body;
    
    const newConfig = {};
    if (deadStock) newConfig.deadStock = deadStock;
    if (disposal) newConfig.disposal = disposal;
    
    assetLifecycleService.updateConfig(newConfig);
    
    res.json({
      success: true,
      message: 'Lifecycle configuration updated successfully',
      data: assetLifecycleService.config,
    });
  } catch (error) {
    console.error('Error updating lifecycle config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update lifecycle configuration',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/v1/lifecycle/config
 * @desc    Get current lifecycle automation configuration
 * @access  Private (Admin, Manager)
 */
router.get('/config', managerOrAdmin, async (req, res) => {
  try {
    res.json({
      success: true,
      data: assetLifecycleService.config,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch lifecycle configuration',
      error: error.message,
    });
  }
});

module.exports = router;
