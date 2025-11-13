const Asset = require('../models/asset');
const DisposalRecord = require('../models/disposalRecord');
const Notification = require('../models/notification');
const AuditLog = require('../models/auditLog');
const User = require('../models/user');
const mongoose = require('mongoose');

/**
 * 🤖 AUTOMATED ASSET DISPOSAL SERVICE
 * Automatically marks assets for disposal based on configurable rules
 */

class AssetDisposalAutomation {
  constructor() {
    // Default disposal rules (can be overridden from settings)
    this.disposalRules = {
      maxAgeInYears: 7, // Assets older than 7 years
      maxDepreciationPercent: 90, // Depreciated more than 90%
      minDaysSinceLastUse: 365, // Not used for 1 year
      autoMarkConditions: ['Beyond Repair', 'Obsolete'], // Auto-mark these conditions
      minPurchaseCostForCheck: 1000, // Only check assets worth more than ₹1000
    };
  }

  /**
   * 🎯 MAIN AUTOMATION FUNCTION
   * Runs direct disposal check
   */
  async runDisposalCheck(triggeredBy = 'SCHEDULED_JOB') {
    try {
      console.log('🤖 [DISPOSAL AUTOMATION] Starting direct disposal check...');
      return await this.runDisposalCheckDirect(triggeredBy);
    } catch (error) {
      console.error('❌ Failed to run disposal check:', error);
      throw error;
    }
  }

  /**
   * DIRECT PROCESSING (FALLBACK)
   * Used when job queue is not available
   */
  async runDisposalCheckDirect() {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      console.log('🤖 [DISPOSAL AUTOMATION] Starting direct disposal check...');
      
      const startTime = Date.now();
      const eligibleAssets = await this.findEligibleAssets();
      
      console.log(`📊 Found ${eligibleAssets.length} assets eligible for disposal`);

      if (eligibleAssets.length === 0) {
        await session.commitTransaction();
        return {
          success: true,
          processed: 0,
          message: 'No assets eligible for disposal at this time',
        };
      }

      const results = {
        processed: 0,
        success: 0,
        failed: 0,
        errors: [],
      };

      // Process each eligible asset
      for (const asset of eligibleAssets) {
        try {
          await this.processAssetForDisposal(asset, session);
          results.success++;
        } catch (error) {
          console.error(`❌ Failed to process asset ${asset.unique_asset_id}:`, error.message);
          results.failed++;
          results.errors.push({
            asset_id: asset.unique_asset_id,
            error: error.message,
          });
        }
        results.processed++;
      }

      await session.commitTransaction();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`✅ [DISPOSAL AUTOMATION] Completed in ${duration}s - Success: ${results.success}, Failed: ${results.failed}`);

      // Notify admins about the automation run
      await this.notifyAdminsAboutAutomation(results);

      return {
        success: true,
        ...results,
        duration,
      };
    } catch (error) {
      await session.abortTransaction();
      console.error('❌ [DISPOSAL AUTOMATION] Fatal error:', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * 🔍 FIND ELIGIBLE ASSETS
   * Query assets that meet disposal criteria
   */
  async findEligibleAssets() {
    const currentDate = new Date();
    
    // Calculate cutoff dates
    const maxAgeCutoff = new Date();
    maxAgeCutoff.setFullYear(maxAgeCutoff.getFullYear() - this.disposalRules.maxAgeInYears);
    
    const lastUseCutoff = new Date();
    lastUseCutoff.setDate(lastUseCutoff.getDate() - this.disposalRules.minDaysSinceLastUse);

    // Build query for eligible assets
    const query = {
      status: { 
        $nin: ['Disposed', 'Ready for Scrap'] // Don't re-process already marked assets
      },
      $or: [
        // Rule 1: Assets older than max age
        {
          purchase_date: { $lte: maxAgeCutoff },
          purchase_cost: { $gte: this.disposalRules.minPurchaseCostForCheck }
        },
        // Rule 2: Assets with auto-mark conditions
        {
          condition: { $in: this.disposalRules.autoMarkConditions }
        },
        // Rule 3: High depreciation (calculated field)
        {
          purchase_date: { $exists: true },
          purchase_cost: { $gte: this.disposalRules.minPurchaseCostForCheck }
        },
        // Rule 4: Not used for extended period
        {
          last_audit_date: { 
            $lte: lastUseCutoff,
            $ne: null 
          }
        }
      ]
    };

    const assets = await Asset.find(query)
      .populate('assigned_user', 'name email')
      .populate('vendor', 'vendor_name')
      .lean();

    // Filter by depreciation percentage (calculated runtime)
    return assets.filter(asset => {
      if (!asset.purchase_date || !asset.purchase_cost) return false;
      
      const depreciationPercent = this.calculateDepreciation(asset);
      const meetsDepreciation = depreciationPercent >= this.disposalRules.maxDepreciationPercent;
      
      const isOldEnough = new Date(asset.purchase_date) <= maxAgeCutoff;
      const hasAutoCondition = this.disposalRules.autoMarkConditions.includes(asset.condition);
      const notUsedRecently = asset.last_audit_date && new Date(asset.last_audit_date) <= lastUseCutoff;

      return meetsDepreciation || isOldEnough || hasAutoCondition || notUsedRecently;
    });
  }

  /**
   * 💰 CALCULATE DEPRECIATION PERCENTAGE
   */
  calculateDepreciation(asset) {
    if (!asset.purchase_date || !asset.purchase_cost) return 0;
    
    const purchaseDate = new Date(asset.purchase_date);
    const currentDate = new Date();
    const ageInYears = (currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 365);
    
    // Straight-line depreciation: 10% per year
    const depreciationPercent = Math.min(ageInYears * 10, 100);
    
    return depreciationPercent;
  }

  /**
   * ⚙️ PROCESS SINGLE ASSET FOR DISPOSAL
   */
  async processAssetForDisposal(asset, session) {
    console.log(`🔄 Processing asset: ${asset.unique_asset_id}`);

    // Step 1: Calculate current value after depreciation
    const depreciationPercent = this.calculateDepreciation(asset);
    const currentValue = asset.purchase_cost * (1 - depreciationPercent / 100);
    const disposalValue = Math.round(currentValue * 0.1); // 10% of current value

    // Step 2: Determine disposal reason
    const reason = this.determineDisposalReason(asset, depreciationPercent);

    // Step 3: Update asset status to "Ready for Scrap"
    await Asset.findByIdAndUpdate(
      asset._id,
      {
        status: 'Ready for Scrap',
        condition: asset.condition === 'Excellent' || asset.condition === 'Good' 
          ? 'Obsolete' 
          : asset.condition,
        notes: `${asset.notes || ''}\n[AUTO] Marked for disposal on ${new Date().toLocaleDateString()}: ${reason}`.trim(),
      },
      { session }
    );

    // Step 4: Create disposal record
    const disposalRecord = await DisposalRecord.create([{
      asset_id: asset.unique_asset_id,
      asset_name: `${asset.manufacturer} ${asset.model}`,
      category: asset.category || asset.asset_type,
      disposal_method: 'Scrap',
      disposal_value: disposalValue,
      disposal_date: new Date(),
      approved_by: 'SYSTEM', // Automated system approval
      approved_at: new Date(), // Auto-approved timestamp
      status: 'pending',
      remarks: `Automated disposal marking: ${reason}`,
      document_reference: `AUTO-${Date.now()}-${asset.unique_asset_id}`,
      created_by: null, // System-generated
    }], { session });

    // Step 5: Create audit log
    await AuditLog.create([{
      action: 'AUTOMATED_DISPOSAL_MARK',
      entity_type: 'Asset',
      entity_id: asset._id,
      description: `Asset automatically marked for disposal. Reason: ${reason}`,
      changes: {
        old_status: asset.status,
        new_status: 'Ready for Scrap',
        depreciation_percent: Math.round(depreciationPercent),
        disposal_value: disposalValue,
      },
      performed_by: null, // System-generated
      ip_address: 'system-automation',
    }], { session });

    // Step 6: Notify assigned user and inventory managers
    await this.createNotifications(asset, reason, session);

    console.log(`✅ Asset ${asset.unique_asset_id} marked for disposal`);
  }

  /**
   * 📝 DETERMINE DISPOSAL REASON
   */
  determineDisposalReason(asset, depreciationPercent) {
    const reasons = [];
    
    if (this.disposalRules.autoMarkConditions.includes(asset.condition)) {
      reasons.push(`Condition: ${asset.condition}`);
    }
    
    if (depreciationPercent >= this.disposalRules.maxDepreciationPercent) {
      reasons.push(`Depreciation: ${Math.round(depreciationPercent)}%`);
    }
    
    if (asset.purchase_date) {
      const ageInYears = ((new Date() - new Date(asset.purchase_date)) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);
      if (ageInYears >= this.disposalRules.maxAgeInYears) {
        reasons.push(`Age: ${ageInYears} years`);
      }
    }
    
    if (asset.last_audit_date) {
      const daysSinceAudit = Math.floor((new Date() - new Date(asset.last_audit_date)) / (1000 * 60 * 60 * 24));
      if (daysSinceAudit >= this.disposalRules.minDaysSinceLastUse) {
        reasons.push(`Not audited for ${Math.floor(daysSinceAudit / 30)} months`);
      }
    }
    
    return reasons.join(', ') || 'Automated disposal criteria met';
  }

  /**
   * 🔔 CREATE NOTIFICATIONS
   */
  async createNotifications(asset, reason, session) {
    // Find all inventory managers and admins
    const recipients = await User.find({
      role: { $in: ['ADMIN', 'INVENTORY_MANAGER'] },
      is_active: true,
    }).select('_id').lean();

    if (recipients.length === 0) return;

    const notifications = recipients.map(user => ({
      recipient: user._id,
      sender: null, // System-generated notification
      title: '🤖 Asset Auto-Marked for Disposal',
      message: `Asset "${asset.manufacturer} ${asset.model}" (${asset.unique_asset_id}) has been automatically marked for disposal. Reason: ${reason}`,
      type: 'warning', // Use valid enum value
      priority: 'medium',
      is_read: false,
      action_url: `/inventory/dead-stock`,
      data: {
        asset_id: asset.unique_asset_id,
        automation_type: 'disposal_marking',
        reason: reason,
      },
    }));

    await Notification.insertMany(notifications, { session });
  }

  /**
   * 📧 NOTIFY ADMINS ABOUT AUTOMATION RUN
   */
  async notifyAdminsAboutAutomation(results) {
    if (results.success === 0) return; // No need to notify if nothing processed

    const admins = await User.find({
      role: 'ADMIN',
      is_active: true,
    }).select('_id').lean();

    if (admins.length === 0) return;

    const notifications = admins.map(admin => ({
      recipient: admin._id,
      sender: null, // System-generated
      title: '📊 Disposal Automation Summary',
      message: `Automated disposal check completed. ${results.success} assets marked for disposal, ${results.failed} failed.`,
      type: 'info',
      priority: 'low',
      is_read: false,
      action_url: '/inventory/disposal-records',
      data: {
        automation_type: 'summary',
        processed: results.processed,
        success: results.success,
        failed: results.failed,
      },
    }));

    await Notification.insertMany(notifications);
  }

  /**
   * ⚙️ UPDATE DISPOSAL RULES
   */
  updateRules(newRules) {
    this.disposalRules = { ...this.disposalRules, ...newRules };
    console.log('✅ Disposal rules updated:', this.disposalRules);
  }

  /**
   * 📊 GET AUTOMATION STATISTICS
   */
  async getAutomationStats() {
    const [totalAssets, eligibleAssets, disposedAssets] = await Promise.all([
      Asset.countDocuments({ status: { $nin: ['Disposed'] } }),
      this.findEligibleAssets().then(assets => assets.length),
      Asset.countDocuments({ status: 'Ready for Scrap' }),
    ]);

    return {
      total_assets: totalAssets,
      eligible_for_disposal: eligibleAssets,
      already_marked: disposedAssets,
      rules: this.disposalRules,
    };
  }
}

// Export singleton instance
module.exports = new AssetDisposalAutomation();
