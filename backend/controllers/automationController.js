const assetDisposalAutomation = require('../services/assetDisposalAutomation');
const scheduledJobs = require('../services/scheduledJobs');
const logger = require('../utils/logger');

/**
 * 🤖 DISPOSAL AUTOMATION CONTROLLER
 * API endpoints to manage and monitor automated disposal system
 */

// GET /api/v1/automation/disposal/status
exports.getAutomationStatus = async (req, res) => {
  try {
    const [stats, jobStatus] = await Promise.all([
      assetDisposalAutomation.getAutomationStats(),
      Promise.resolve(scheduledJobs.getStatus()),
    ]);

    res.json({
      success: true,
      data: {
        automation_stats: stats,
        scheduler_status: jobStatus,
        rules: assetDisposalAutomation.disposalRules,
      },
    });
  } catch (error) {
    console.error('Failed to get automation status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve automation status',
    });
  }
};

// POST /api/v1/automation/disposal/trigger
// Manual trigger for disposal automation (Admin only)
exports.triggerDisposalCheck = async (req, res) => {
  try {
    console.log(`🔧 Manual disposal check triggered by user: ${req.user.email}`);
    
    const result = await scheduledJobs.triggerDisposalCheckNow();

    res.json({
      success: true,
      message: 'Disposal automation completed successfully',
      data: result,
    });
  } catch (error) {
    console.error('Failed to trigger disposal check:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run disposal automation',
    });
  }
};

// PUT /api/v1/automation/disposal/rules
// Update disposal automation rules (Admin only)
exports.updateDisposalRules = async (req, res) => {
  try {
    const {
      maxAgeInYears,
      maxDepreciationPercent,
      minDaysSinceLastUse,
      autoMarkConditions,
      minPurchaseCostForCheck,
    } = req.body;

    // Validation
    if (maxAgeInYears && (maxAgeInYears < 1 || maxAgeInYears > 50)) {
      return res.status(400).json({
        success: false,
        error: 'maxAgeInYears must be between 1 and 50',
      });
    }

    if (maxDepreciationPercent && (maxDepreciationPercent < 50 || maxDepreciationPercent > 100)) {
      return res.status(400).json({
        success: false,
        error: 'maxDepreciationPercent must be between 50 and 100',
      });
    }

    const updatedRules = {};
    if (maxAgeInYears !== undefined) updatedRules.maxAgeInYears = maxAgeInYears;
    if (maxDepreciationPercent !== undefined) updatedRules.maxDepreciationPercent = maxDepreciationPercent;
    if (minDaysSinceLastUse !== undefined) updatedRules.minDaysSinceLastUse = minDaysSinceLastUse;
    if (autoMarkConditions !== undefined) updatedRules.autoMarkConditions = autoMarkConditions;
    if (minPurchaseCostForCheck !== undefined) updatedRules.minPurchaseCostForCheck = minPurchaseCostForCheck;

    assetDisposalAutomation.updateRules(updatedRules);

    res.json({
      success: true,
      message: 'Disposal rules updated successfully',
      data: {
        rules: assetDisposalAutomation.disposalRules,
      },
    });
  } catch (error) {
    console.error('Failed to update disposal rules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update disposal rules',
    });
  }
};

// GET /api/v1/automation/disposal/eligible-assets
// Preview assets that will be marked in next automation run
exports.getEligibleAssets = async (req, res) => {
  try {
    const eligibleAssets = await assetDisposalAutomation.findEligibleAssets();

    const assetsWithReasons = eligibleAssets.map(asset => {
      const depreciationPercent = assetDisposalAutomation.calculateDepreciation(asset);
      const reason = assetDisposalAutomation.determineDisposalReason(asset, depreciationPercent);
      
      return {
        id: asset._id,
        unique_asset_id: asset.unique_asset_id,
        name: `${asset.manufacturer} ${asset.model}`,
        category: asset.category || asset.asset_type,
        status: asset.status,
        condition: asset.condition,
        purchase_date: asset.purchase_date,
        purchase_cost: asset.purchase_cost,
        depreciation_percent: Math.round(depreciationPercent),
        disposal_reason: reason,
        location: asset.location,
      };
    });

    res.json({
      success: true,
      data: {
        count: assetsWithReasons.length,
        assets: assetsWithReasons,
      },
    });
  } catch (error) {
    console.error('Failed to get eligible assets:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve eligible assets',
    });
  }
};

// GET /api/v1/automation/scheduler/status
// Get scheduler status and job information
exports.getSchedulerStatus = async (req, res) => {
  try {
    const status = scheduledJobs.getStatus();

    res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Failed to get scheduler status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve scheduler status',
    });
  }
};
