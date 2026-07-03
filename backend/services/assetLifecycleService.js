const getSupabase = require("../config/db");

/**
 * 🔄 ASSET LIFECYCLE AUTOMATION SERVICE
 * Automatically manages asset lifecycle: Active → Dead Stock → Disposal
 *
 * CONFIGURATION:
 * - Dead Stock: Assets older than 5 years, poor condition 2+ years, no maintenance 24+ months
 * - Disposal: After 90 days in dead stock (requires approval by default)
 *
 * AUTOMATION:
 * - Runs daily at 1:00 AM IST via scheduledJobs.js
 * - Manual trigger: POST /api/v1/lifecycle/run
 * - View stats: GET /api/v1/lifecycle/stats
 * - Frontend: /admin/lifecycle
 *
 * WORKFLOW:
 * 1. findOutdatedAssets() - Identifies assets meeting criteria
 * 2. moveOutdatedToDeadStock() - Marks assets as "Ready for Scrap"
 * 3. moveDeadStockToDisposal() - Creates disposal records after 90 days
 * 4. Creates notifications and audit logs for all actions
 */

class AssetLifecycleService {
  constructor() {
    // Configurable thresholds
    this.config = {
      // Dead Stock Criteria
      deadStock: {
        maxAgeYears: 5, // Assets older than 5 years
        poorConditionAge: 2, // Assets in poor condition and 2+ years old
        noMaintenanceMonths: 24, // Not maintained in 24 months
        damageConditions: ["poor", "damaged"], // Auto-mark these conditions
      },
      // Disposal Criteria
      disposal: {
        daysInDeadStock: 90, // Move to disposal after 90 days in dead stock
        autoApprove: false, // Require manual approval by default
      },
    };
  }

  /**
   * 🎯 MAIN LIFECYCLE AUTOMATION
   * Run both dead stock and disposal checks
   */
  async runFullLifecycleAutomation() {
    console.log("🔄 [LIFECYCLE] Starting full asset lifecycle automation...");
    const startTime = Date.now();

    try {
      // Step 1: Move outdated assets to dead stock
      const deadStockResult = await this.moveOutdatedToDeadStock();

      // Step 2: Move long-term dead stock to disposal
      const disposalResult = await this.moveDeadStockToDisposal();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      const summary = {
        success: true,
        duration: `${duration}s`,
        deadStock: deadStockResult,
        disposal: disposalResult,
        timestamp: new Date(),
      };

      console.log(`✅ [LIFECYCLE] Completed in ${duration}s`);
      console.log(`   → Dead Stock: ${deadStockResult.count} assets`);
      console.log(`   → Disposal: ${disposalResult.count} assets`);

      // Notify admins
      await this.notifyAdminsAboutLifecycle(summary);

      return summary;
    } catch (error) {
      console.error("❌ [LIFECYCLE] Automation failed:", error);
      throw error;
    }
  }

  /**
   * 📦 MOVE OUTDATED ASSETS TO DEAD STOCK
   */
  async moveOutdatedToDeadStock() {
    try {
      console.log("📦 [LIFECYCLE] Checking for outdated assets...");

      const outdatedAssets = await this.findOutdatedAssets();
      console.log(`   Found ${outdatedAssets.length} outdated assets`);

      if (outdatedAssets.length === 0) {
        return { count: 0, assets: [] };
      }

      const movedAssets = [];
      const supabase = getSupabase();

      for (const asset of outdatedAssets) {
        try {
          const reason = this.determineDeadStockReason(asset);

          // Update asset status
          const { error: assetError } = await supabase
            .from("assets")
            .update({
              status: "Ready for Scrap", // Use existing enum value
              condition: this.config.deadStock.damageConditions.includes(
                asset.condition,
              )
                ? asset.condition
                : "poor",
              notes:
                `${asset.notes || ""}\n[AUTO-DEAD-STOCK] ${new Date().toLocaleDateString()}: ${reason}`.trim(),
              last_audit_date: new Date().toISOString(), // Mark as reviewed
            })
            .eq("id", asset.id);

          if (assetError) throw assetError;

          // Create audit log
          const { error: auditError } = await supabase
            .from("audit_logs")
            .insert({
              action: "AUTO_MOVE_TO_DEAD_STOCK",
              entity_type: "Asset",
              entity_id: asset.id,
              asset_id: asset.id,
              description: `Asset automatically moved to dead stock: ${reason}`,
              changes: {
                old_status: asset.status,
                new_status: "Ready for Scrap",
                reason: reason,
                automation: "lifecycle",
              },
              performed_by: null,
              ip_address: "system-lifecycle",
            });

          if (auditError) throw auditError;

          // Create notifications for managers
          await this.notifyAboutDeadStock(asset, reason);

          movedAssets.push({
            assetId: asset.unique_asset_id,
            name: `${asset.manufacturer} ${asset.model}`,
            reason: reason,
          });

          console.log(`   ✓ ${asset.unique_asset_id} → Dead Stock (${reason})`);
        } catch (error) {
          console.error(
            `   ✗ Failed to process ${asset.unique_asset_id}:`,
            error.message,
          );
        }
      }

      return {
        count: movedAssets.length,
        assets: movedAssets,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🗑️ MOVE DEAD STOCK TO DISPOSAL
   */
  async moveDeadStockToDisposal() {
    try {
      console.log("🗑️  [LIFECYCLE] Checking dead stock for disposal...");

      const assetsForDisposal = await this.findAssetsReadyForDisposal();
      console.log(
        `   Found ${assetsForDisposal.length} assets ready for disposal`,
      );

      if (assetsForDisposal.length === 0) {
        return { count: 0, records: [] };
      }

      const disposalRecords = [];
      const supabase = getSupabase();

      for (const asset of assetsForDisposal) {
        try {
          const daysInDeadStock = this.calculateDaysInDeadStock(asset);
          const disposalMethod = this.determineDisposalMethod(asset);
          const disposalValue = this.calculateDisposalValue(asset);

          // Create disposal record
          const { data: disposalRecordData, error: disposalError } =
            await supabase
              .from("disposal_records")
              .insert({
                asset_id: asset.unique_asset_id,
                asset_name: `${asset.manufacturer} ${asset.model}`,
                category: asset.asset_type,
                disposal_method: disposalMethod,
                disposal_value: disposalValue,
                disposal_date: new Date().toISOString(),
                approved_by: this.config.disposal.autoApprove
                  ? "SYSTEM-AUTO"
                  : "SYSTEM",
                status: this.config.disposal.autoApprove
                  ? "completed"
                  : "pending",
                remarks: `Automated disposal after ${daysInDeadStock} days in dead stock. Condition: ${asset.condition}`,
                document_reference: `AUTO-DISP-${Date.now()}-${asset.unique_asset_id}`,
                created_by: null,
              })
              .select();

          if (disposalError) throw disposalError;

          const disposalRecord = disposalRecordData[0];

          // Update asset to disposed
          const { error: assetError } = await supabase
            .from("assets")
            .update({
              status: "Disposed",
              notes:
                `${asset.notes || ""}\n[AUTO-DISPOSAL] ${new Date().toLocaleDateString()}: ${disposalMethod} - ₹${disposalValue}`.trim(),
            })
            .eq("id", asset.id);

          if (assetError) throw assetError;

          // Create audit log
          const { error: auditError } = await supabase
            .from("audit_logs")
            .insert({
              action: "AUTO_MOVE_TO_DISPOSAL",
              entity_type: "Asset",
              entity_id: asset.id,
              asset_id: asset.id,
              description: `Asset automatically moved to disposal after ${daysInDeadStock} days`,
              changes: {
                old_status: "Ready for Scrap",
                new_status: "Disposed",
                disposal_method: disposalMethod,
                disposal_value: disposalValue,
                days_in_dead_stock: daysInDeadStock,
              },
              performed_by: null,
              ip_address: "system-lifecycle",
            });

          if (auditError) throw auditError;

          // Notify about disposal
          await this.notifyAboutDisposal(
            asset,
            disposalRecord,
            daysInDeadStock,
          );

          disposalRecords.push({
            assetId: asset.unique_asset_id,
            name: `${asset.manufacturer} ${asset.model}`,
            method: disposalMethod,
            value: disposalValue,
            daysInDeadStock: daysInDeadStock,
          });

          console.log(
            `   ✓ ${asset.unique_asset_id} → Disposal (${disposalMethod}, ₹${disposalValue})`,
          );
        } catch (error) {
          console.error(
            `   ✗ Failed to dispose ${asset.unique_asset_id}:`,
            error.message,
          );
        }
      }

      return {
        count: disposalRecords.length,
        records: disposalRecords,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * 🔍 FIND OUTDATED ASSETS (for Dead Stock)
   */
  async findOutdatedAssets() {
    const currentDate = new Date();
    const fiveYearsAgo = new Date(
      currentDate.setFullYear(currentDate.getFullYear() - 5),
    );
    const twoYearsAgo = new Date(
      new Date().setFullYear(new Date().getFullYear() - 2),
    );
    const twentyFourMonthsAgo = new Date(
      new Date().setMonth(new Date().getMonth() - 24),
    );

    const supabase = getSupabase();
    const { data: assets, error } = await supabase
      .from("assets")
      .select("*, assigned_user:users(name, email)")
      .in("status", ["Active", "Available", "Under Maintenance"]);

    if (error) throw error;
    if (!assets) return [];

    return assets.filter((asset) => {
      // Rule 1: Old assets (5+ years)
      if (
        asset.purchase_date &&
        new Date(asset.purchase_date) <= fiveYearsAgo
      ) {
        return true;
      }
      // Rule 2: Poor/Damaged condition and 2+ years old
      if (
        asset.condition &&
        this.config.deadStock.damageConditions.includes(asset.condition) &&
        asset.purchase_date &&
        new Date(asset.purchase_date) <= twoYearsAgo
      ) {
        return true;
      }
      // Rule 3: Not maintained in 24+ months
      if (
        asset.last_maintenance_date &&
        new Date(asset.last_maintenance_date) <= twentyFourMonthsAgo &&
        asset.condition &&
        ["poor", "fair"].includes(asset.condition)
      ) {
        return true;
      }
      return false;
    });
  }

  /**
   * 🔍 FIND ASSETS READY FOR DISPOSAL
   */
  async findAssetsReadyForDisposal() {
    const thresholdDate = new Date();
    thresholdDate.setDate(
      thresholdDate.getDate() - this.config.disposal.daysInDeadStock,
    );

    const supabase = getSupabase();
    const { data: assets, error } = await supabase
      .from("assets")
      .select("*")
      .eq("status", "Ready for Scrap")
      .lte("last_audit_date", thresholdDate.toISOString())
      .not("last_audit_date", "is", null);

    if (error) throw error;
    return assets || [];
  }

  /**
   * 📊 DETERMINE DEAD STOCK REASON
   */
  determineDeadStockReason(asset) {
    const reasons = [];

    if (asset.purchase_date) {
      const ageInYears = (
        (new Date() - new Date(asset.purchase_date)) /
        (1000 * 60 * 60 * 24 * 365)
      ).toFixed(1);
      if (ageInYears >= this.config.deadStock.maxAgeYears) {
        reasons.push(`Age: ${ageInYears} years (obsolete)`);
      }
    }

    if (this.config.deadStock.damageConditions.includes(asset.condition)) {
      reasons.push(`Condition: ${asset.condition}`);
    }

    if (asset.last_maintenance_date) {
      const monthsSinceMaintenance = Math.floor(
        (new Date() - new Date(asset.last_maintenance_date)) /
          (1000 * 60 * 60 * 24 * 30),
      );
      if (monthsSinceMaintenance >= this.config.deadStock.noMaintenanceMonths) {
        reasons.push(`No maintenance for ${monthsSinceMaintenance} months`);
      }
    }

    return reasons.join(", ") || "Automated lifecycle criteria met";
  }

  /**
   * 🗑️ DETERMINE DISPOSAL METHOD
   */
  determineDisposalMethod(asset) {
    // Map conditions to disposal methods
    if (asset.condition === "damaged") return "Recycling";
    if (asset.purchase_cost > 50000) return "Auction";
    if (asset.asset_type?.toLowerCase().includes("electronics"))
      return "Recycling";
    if (asset.condition === "poor") return "Scrap";
    return "Donation";
  }

  /**
   * 💰 CALCULATE DISPOSAL VALUE
   */
  calculateDisposalValue(asset) {
    if (!asset.purchase_cost) return 0;

    const ageInYears = asset.purchase_date
      ? (new Date() - new Date(asset.purchase_date)) /
        (1000 * 60 * 60 * 24 * 365)
      : 5;

    // Depreciation: 15% per year
    const depreciationPercent = Math.min(ageInYears * 15, 95);
    const currentValue = asset.purchase_cost * (1 - depreciationPercent / 100);

    // Disposal value: 5-20% of current value based on condition
    const conditionMultiplier = {
      excellent: 0.2,
      good: 0.15,
      fair: 0.1,
      poor: 0.05,
      damaged: 0.05,
    };

    return Math.round(
      currentValue * (conditionMultiplier[asset.condition] || 0.05),
    );
  }

  /**
   * 📅 CALCULATE DAYS IN DEAD STOCK
   */
  calculateDaysInDeadStock(asset) {
    if (!asset.last_audit_date) return this.config.disposal.daysInDeadStock;
    return Math.floor(
      (new Date() - new Date(asset.last_audit_date)) / (1000 * 60 * 60 * 24),
    );
  }

  /**
   * 🔔 NOTIFY ABOUT DEAD STOCK
   */
  async notifyAboutDeadStock(asset, reason) {
    const supabase = getSupabase();
    // Get all active admins and inventory managers
    const { data: recipients, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("is_active", true)
      .in("role", ["ADMIN", "INVENTORY_MANAGER"]);

    if (userError) throw userError;
    if (!recipients || recipients.length === 0) return;

    const notifications = recipients.map((user) => ({
      recipient: user.id,
      sender: null,
      title: "📦 Asset Moved to Dead Stock",
      message: `Asset "${asset.manufacturer} ${asset.model}" (${asset.unique_asset_id}) moved to dead stock. Reason: ${reason}`,
      type: "warning",
      priority: "medium",
      is_read: false,
      action_url: `/inventory/dead-stock`,
      data: {
        asset_id: asset.unique_asset_id,
        automation_type: "dead_stock",
        reason: reason,
      },
    }));

    const { error: notifyError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifyError) throw notifyError;
  }

  /**
   * 🔔 NOTIFY ABOUT DISPOSAL
   */
  async notifyAboutDisposal(asset, disposalRecord, daysInDeadStock) {
    const supabase = getSupabase();
    const { data: admins, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "ADMIN")
      .eq("is_active", true);

    if (userError) throw userError;
    if (!admins || admins.length === 0) return;

    const notifications = admins.map((admin) => ({
      recipient: admin.id,
      sender: null,
      title: "🗑️ Asset Moved to Disposal",
      message: `Asset "${asset.manufacturer} ${asset.model}" (${asset.unique_asset_id}) moved to disposal after ${daysInDeadStock} days. Method: ${disposalRecord.disposal_method}`,
      type: "info",
      priority: "high",
      is_read: false,
      action_url: `/inventory/disposal-records`,
      data: {
        asset_id: asset.unique_asset_id,
        disposal_record_id: disposalRecord.id,
        automation_type: "disposal",
        days_in_dead_stock: daysInDeadStock,
      },
    }));

    const { error: notifyError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifyError) throw notifyError;
  }

  /**
   * 🔔 NOTIFY ADMINS ABOUT LIFECYCLE SUMMARY
   */
  async notifyAdminsAboutLifecycle(summary) {
    if (summary.deadStock.count === 0 && summary.disposal.count === 0) return;

    const supabase = getSupabase();
    const { data: admins, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "ADMIN")
      .eq("is_active", true);

    if (userError) throw userError;
    if (!admins || admins.length === 0) return;

    const notifications = admins.map((admin) => ({
      recipient: admin.id,
      sender: null,
      title: "📊 Lifecycle Automation Summary",
      message: `Lifecycle automation completed: ${summary.deadStock.count} assets → dead stock, ${summary.disposal.count} assets → disposal`,
      type: "info",
      priority: "low",
      is_read: false,
      action_url: "/inventory/reports",
      data: {
        automation_type: "lifecycle_summary",
        dead_stock_count: summary.deadStock.count,
        disposal_count: summary.disposal.count,
        duration: summary.duration,
      },
    }));

    const { error: notifyError } = await supabase
      .from("notifications")
      .insert(notifications);

    if (notifyError) throw notifyError;
  }

  /**
   * 📊 GET LIFECYCLE STATISTICS
   */
  async getLifecycleStats() {
    const supabase = getSupabase();

    const getCount = async (tableName, builderFn) => {
      let query = supabase
        .from(tableName)
        .select("*", { count: "exact", head: true });
      if (builderFn) {
        query = builderFn(query);
      }
      const { count, error } = await query;
      if (error) throw error;
      return count || 0;
    };

    const [
      activeAssets,
      deadStockAssets,
      disposedAssets,
      eligibleForDeadStock,
      eligibleForDisposal,
    ] = await Promise.all([
      getCount("assets", (q) => q.in("status", ["Active", "Available"])),
      getCount("assets", (q) => q.eq("status", "Ready for Scrap")),
      getCount("assets", (q) => q.eq("status", "Disposed")),
      this.findOutdatedAssets().then((assets) => assets.length),
      this.findAssetsReadyForDisposal().then((assets) => assets.length),
    ]);

    return {
      current_state: {
        active: activeAssets,
        dead_stock: deadStockAssets,
        disposed: disposedAssets,
      },
      eligible: {
        for_dead_stock: eligibleForDeadStock,
        for_disposal: eligibleForDisposal,
      },
      configuration: this.config,
    };
  }

  /**
   * ⚙️ UPDATE CONFIGURATION
   */
  updateConfig(newConfig) {
    this.config = {
      ...this.config,
      ...newConfig,
    };
    console.log("✅ Lifecycle configuration updated:", this.config);
  }
}

// Export singleton instance
module.exports = new AssetLifecycleService();
