const getSupabase = require("../config/db");

/**
 * 🤖 AUTOMATED ASSET DISPOSAL SERVICE
 * Automatically marks assets for disposal based on configurable rules using Supabase
 */

class AssetDisposalAutomation {
  constructor() {
    // Default disposal rules (can be overridden from settings)
    this.disposalRules = {
      maxAgeInYears: 7, // Assets older than 7 years
      maxDepreciationPercent: 90, // Depreciated more than 90%
      minDaysSinceLastUse: 365, // Not used for 1 year
      autoMarkConditions: ["Beyond Repair", "Obsolete"], // Auto-mark these conditions
      minPurchaseCostForCheck: 1000, // Only check assets worth more than ₹1000
    };
  }

  /**
   * 🎯 MAIN AUTOMATION FUNCTION
   * Runs direct disposal check
   */
  async runDisposalCheck(triggeredBy = "SCHEDULED_JOB") {
    try {
      console.log("🤖 [DISPOSAL AUTOMATION] Starting direct disposal check...");
      return await this.runDisposalCheckDirect(triggeredBy);
    } catch (error) {
      console.error("❌ Failed to run disposal check:", error);
      throw error;
    }
  }

  /**
   * DIRECT PROCESSING
   */
  async runDisposalCheckDirect() {
    try {
      console.log("🤖 [DISPOSAL AUTOMATION] Starting direct disposal check...");

      const startTime = Date.now();
      const eligibleAssets = await this.findEligibleAssets();

      console.log(
        `📊 Found ${eligibleAssets.length} assets eligible for disposal`,
      );

      if (eligibleAssets.length === 0) {
        return {
          success: true,
          processed: 0,
          message: "No assets eligible for disposal at this time",
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
          await this.processAssetForDisposal(asset);
          results.success++;
        } catch (error) {
          console.error(
            `❌ Failed to process asset ${asset.unique_asset_id}:`,
            error.message,
          );
          results.failed++;
          results.errors.push({
            asset_id: asset.unique_asset_id,
            error: error.message,
          });
        }
        results.processed++;
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(
        `✅ [DISPOSAL AUTOMATION] Completed in ${duration}s - Success: ${results.success}, Failed: ${results.failed}`,
      );

      // Notify admins about the automation run
      await this.notifyAdminsAboutAutomation(results);

      return {
        success: true,
        ...results,
        duration,
      };
    } catch (error) {
      console.error("❌ [DISPOSAL AUTOMATION] Fatal error:", error);
      throw error;
    }
  }

  /**
   * 🔍 FIND ELIGIBLE ASSETS
   * Query assets that meet disposal criteria
   */
  async findEligibleAssets() {
    const maxAgeCutoff = new Date();
    maxAgeCutoff.setFullYear(
      maxAgeCutoff.getFullYear() - this.disposalRules.maxAgeInYears,
    );

    const lastUseCutoff = new Date();
    lastUseCutoff.setDate(
      lastUseCutoff.getDate() - this.disposalRules.minDaysSinceLastUse,
    );

    const supabase = getSupabase();
    const { data: assets, error } = await supabase
      .from("assets")
      .select(
        "*, assigned_user:users(name, email), vendor:vendors(vendor_name)",
      )
      .not("status", "eq", "Disposed")
      .not("status", "eq", "Ready for Scrap");

    if (error) {
      console.error("Error fetching assets for disposal:", error);
      throw error;
    }

    if (!assets) return [];

    // Filter by depreciation percentage (calculated runtime) and other rules
    return assets.filter((asset) => {
      if (!asset.purchase_date || !asset.purchase_cost) return false;

      const depreciationPercent = this.calculateDepreciation(asset);
      const meetsDepreciation =
        depreciationPercent >= this.disposalRules.maxDepreciationPercent;

      const isOldEnough = new Date(asset.purchase_date) <= maxAgeCutoff;
      const hasAutoCondition = this.disposalRules.autoMarkConditions.some(
        (cond) => cond.toLowerCase() === (asset.condition || "").toLowerCase(),
      );
      const notUsedRecently =
        asset.last_audit_date &&
        new Date(asset.last_audit_date) <= lastUseCutoff;

      return (
        meetsDepreciation || isOldEnough || hasAutoCondition || notUsedRecently
      );
    });
  }

  /**
   * 💰 CALCULATE DEPRECIATION PERCENTAGE
   */
  calculateDepreciation(asset) {
    if (!asset.purchase_date || !asset.purchase_cost) return 0;

    const purchaseDate = new Date(asset.purchase_date);
    const currentDate = new Date();
    const ageInYears =
      (currentDate - purchaseDate) / (1000 * 60 * 60 * 24 * 365);

    // Straight-line depreciation: 10% per year
    const depreciationPercent = Math.min(ageInYears * 10, 100);

    return depreciationPercent;
  }

  /**
   * ⚙️ PROCESS SINGLE ASSET FOR DISPOSAL
   */
  async processAssetForDisposal(asset) {
    console.log(`🔄 Processing asset: ${asset.unique_asset_id}`);
    const supabase = getSupabase();

    // Step 1: Calculate current value after depreciation
    const depreciationPercent = this.calculateDepreciation(asset);
    const currentValue = asset.purchase_cost * (1 - depreciationPercent / 100);
    const disposalValue = Math.round(currentValue * 0.1); // 10% of current value

    // Step 2: Determine disposal reason
    const reason = this.determineDisposalReason(asset, depreciationPercent);

    // Map condition to allowed database check constraint values: excellent, good, fair, poor, damaged
    let currentCondition = (asset.condition || "").toLowerCase();
    const validConditions = ["excellent", "good", "fair", "poor", "damaged"];
    if (!validConditions.includes(currentCondition)) {
      currentCondition = "poor";
    }
    // If condition was excellent/good, update to poor (obsolete replacement in PG schema)
    const condition =
      currentCondition === "excellent" || currentCondition === "good"
        ? "poor"
        : currentCondition;

    // Step 3: Update asset status to "Ready for Scrap"
    const { error: assetError } = await supabase
      .from("assets")
      .update({
        status: "Ready for Scrap",
        condition: condition,
        notes:
          `${asset.notes || ""}\n[AUTO] Marked for disposal on ${new Date().toLocaleDateString()}: ${reason}`.trim(),
      })
      .eq("id", asset.id);

    if (assetError) throw assetError;

    // Step 4: Create disposal record
    const { error: disposalError } = await supabase
      .from("disposal_records")
      .insert({
        asset_id: asset.unique_asset_id,
        asset_name: `${asset.manufacturer} ${asset.model}`,
        category: asset.category || asset.asset_type || "Other",
        disposal_method: "Scrap",
        disposal_value: disposalValue,
        disposal_date: new Date().toISOString(),
        approved_by: "SYSTEM", // Automated system approval
        status: "pending",
        remarks: `Automated disposal marking: ${reason}`,
        document_reference: `AUTO-${Date.now()}-${asset.unique_asset_id}`,
        created_by: null, // System-generated
      });

    if (disposalError) throw disposalError;

    // Step 5: Create audit log
    const { error: auditError } = await supabase.from("audit_logs").insert({
      action: "AUTOMATED_DISPOSAL_MARK",
      entity_type: "Asset",
      entity_id: asset.id,
      asset_id: asset.id,
      description: `Asset automatically marked for disposal. Reason: ${reason}`,
      severity: "warning",
      changes: {
        old_status: asset.status,
        new_status: "Ready for Scrap",
        depreciation_percent: Math.round(depreciationPercent),
        disposal_value: disposalValue,
      },
      performed_by: null, // System-generated
      ip_address: "system-automation",
      timestamp: new Date().toISOString(),
    });

    if (auditError) throw auditError;

    // Step 6: Notify assigned user and inventory managers
    await this.createNotifications(asset, reason);

    console.log(`✅ Asset ${asset.unique_asset_id} marked for disposal`);
  }

  /**
   * 📝 DETERMINE DISPOSAL REASON
   */
  determineDisposalReason(asset, depreciationPercent) {
    const reasons = [];

    const hasAutoCondition = this.disposalRules.autoMarkConditions.some(
      (cond) => cond.toLowerCase() === (asset.condition || "").toLowerCase(),
    );
    if (hasAutoCondition) {
      reasons.push(`Condition: ${asset.condition}`);
    }

    if (depreciationPercent >= this.disposalRules.maxDepreciationPercent) {
      reasons.push(`Depreciation: ${Math.round(depreciationPercent)}%`);
    }

    if (asset.purchase_date) {
      const ageInYears = (
        (new Date() - new Date(asset.purchase_date)) /
        (1000 * 60 * 60 * 24 * 365)
      ).toFixed(1);
      if (ageInYears >= this.disposalRules.maxAgeInYears) {
        reasons.push(`Age: ${ageInYears} years`);
      }
    }

    if (asset.last_audit_date) {
      const daysSinceAudit = Math.floor(
        (new Date() - new Date(asset.last_audit_date)) / (1000 * 60 * 60 * 24),
      );
      if (daysSinceAudit >= this.disposalRules.minDaysSinceLastUse) {
        reasons.push(
          `Not audited for ${Math.floor(daysSinceAudit / 30)} months`,
        );
      }
    }

    return reasons.join(", ") || "Automated disposal criteria met";
  }

  /**
   * 🔔 CREATE NOTIFICATIONS
   */
  async createNotifications(asset, reason) {
    const supabase = getSupabase();

    // Find all inventory managers and admins
    const { data: recipients, error } = await supabase
      .from("users")
      .select("id")
      .in("role", ["ADMIN", "INVENTORY_MANAGER"])
      .eq("is_active", true);

    if (error || !recipients || recipients.length === 0) return;

    const notifications = recipients.map((user) => ({
      recipient: user.id,
      sender: null, // System-generated notification
      title: "🤖 Asset Auto-Marked for Disposal",
      message: `Asset "${asset.manufacturer} ${asset.model}" (${asset.unique_asset_id}) has been automatically marked for disposal. Reason: ${reason}`,
      type: "warning", // Use valid enum value
      priority: "medium",
      is_read: false,
      action_url: `/inventory/dead-stock`,
      data: {
        asset_id: asset.unique_asset_id,
        automation_type: "disposal_marking",
        reason: reason,
      },
    }));

    await supabase.from("notifications").insert(notifications);
  }

  /**
   * 📧 NOTIFY ADMINS ABOUT AUTOMATION RUN
   */
  async notifyAdminsAboutAutomation(results) {
    if (results.success === 0) return; // No need to notify if nothing processed

    const supabase = getSupabase();
    const { data: admins, error } = await supabase
      .from("users")
      .select("id")
      .eq("role", "ADMIN")
      .eq("is_active", true);

    if (error || !admins || admins.length === 0) return;

    const notifications = admins.map((admin) => ({
      recipient: admin.id,
      sender: null, // System-generated
      title: "📊 Disposal Automation Summary",
      message: `Automated disposal check completed. ${results.success} assets marked for disposal, ${results.failed} failed.`,
      type: "info",
      priority: "low",
      is_read: false,
      action_url: "/inventory/disposal-records",
      data: {
        automation_type: "summary",
        processed: results.processed,
        success: results.success,
        failed: results.failed,
      },
    }));

    await supabase.from("notifications").insert(notifications);
  }

  /**
   * ⚙️ UPDATE DISPOSAL RULES
   */
  updateRules(newRules) {
    this.disposalRules = { ...this.disposalRules, ...newRules };
    console.log("✅ Disposal rules updated:", this.disposalRules);
  }

  /**
   * 📊 GET AUTOMATION STATISTICS
   */
  async getAutomationStats() {
    const supabase = getSupabase();

    const [totalAssetsRes, eligibleAssets, disposedAssetsRes] =
      await Promise.all([
        supabase
          .from("assets")
          .select("*", { count: "exact", head: true })
          .not("status", "eq", "Disposed"),
        this.findEligibleAssets().then((assets) => assets.length),
        supabase
          .from("assets")
          .select("*", { count: "exact", head: true })
          .eq("status", "Ready for Scrap"),
      ]);

    return {
      total_assets: totalAssetsRes.count || 0,
      eligible_for_disposal: eligibleAssets,
      already_marked: disposedAssetsRes.count || 0,
      rules: this.disposalRules,
    };
  }
}

// Export singleton instance
module.exports = new AssetDisposalAutomation();
