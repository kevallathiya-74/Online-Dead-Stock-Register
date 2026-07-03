const getSupabase = require("../config/db");
const logger = require("../utils/logger");

/**
 * Bulk Operations Controller
 * Handles batch operations on multiple assets with validation and rollback support
 */

// Helper: validate asset IDs and return found assets + missing IDs
const validateAssetIds = async (assetIds) => {
  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    throw new Error("Asset IDs array is required and must not be empty");
  }

  if (assetIds.length > 500) {
    throw new Error("Maximum 500 assets can be processed at once");
  }

  const supabase = getSupabase();
  const { data: assets, error } = await supabase
    .from("assets")
    .select(
      "id, unique_asset_id, name, status, condition, location, department, assigned_user",
    )
    .in("id", assetIds);

  if (error) throw new Error(error.message);

  const foundIds = (assets || []).map((a) => a.id);
  const missingIds = assetIds.filter((id) => !foundIds.includes(id));

  return { assets: assets || [], missingIds };
};

// Helper: insert audit logs in bulk
const insertAuditLogs = async (logs) => {
  if (!logs || logs.length === 0) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("audit_logs").insert(logs);
  if (error) logger.error("Failed to insert audit logs:", error.message);
};

// Helper: insert notifications in bulk
const insertNotifications = async (notifications) => {
  if (!notifications || notifications.length === 0) return;
  const supabase = getSupabase();
  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) logger.error("Failed to insert notifications:", error.message);
};

// ─────────────────────────────────────────────────────────────────────────────
// Bulk update asset status
// ─────────────────────────────────────────────────────────────────────────────
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { asset_ids, status, notes } = req.body;

    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });
    }

    const validStatuses = [
      "Active",
      "Inactive",
      "Under Maintenance",
      "Damaged",
      "Disposed",
      "Lost",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No valid assets found" });
    }

    const supabase = getSupabase();
    const ids = assets.map((a) => a.id);

    const { error: updateError } = await supabase
      .from("assets")
      .update({ status, updated_at: new Date().toISOString() })
      .in("id", ids);

    if (updateError) throw new Error(updateError.message);

    // Audit logs
    const auditLogs = assets.map((asset) => ({
      asset,
      action: "bulk_status_update",
      performed_by: req.user.id,
      details: {
        old_status: asset.status,
        new_status: status,
        notes,
        batch_size: assets.length,
      },
      timestamp: new Date().toISOString(),
    }));
    await insertAuditLogs(auditLogs);

    // Notifications for assigned users
    const notifications = assets
      .filter((a) => a.assigned_user)
      .map((a) => ({
        recipient: a.assigned_user,
        type: "info",
        title: "Asset Status Updated",
        message: `Status of ${a.name || a.unique_asset_id} changed to ${status}`,
        is_read: false,
      }));
    await insertNotifications(notifications);

    return res.json({
      success: true,
      message: `Successfully updated ${assets.length} asset(s)`,
      updated_count: assets.length,
      missing_ids: missingIds,
      notifications_sent: notifications.length,
    });
  } catch (error) {
    logger.error("Error in bulk status update:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update asset statuses",
      error: "An internal server error occurred",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Bulk assign assets to user
// ─────────────────────────────────────────────────────────────────────────────
exports.bulkAssign = async (req, res) => {
  try {
    const { asset_ids, user_id, department, notes } = req.body;

    if (!user_id) {
      return res
        .status(400)
        .json({ success: false, message: "User ID is required" });
    }

    const supabase = getSupabase();

    // Verify user exists
    const { data: userRows, error: userErr } = await supabase
      .from("users")
      .select("id, name, email, department")
      .eq("id", user_id)
      .limit(1);

    if (userErr) throw new Error(userErr.message);

    const user = userRows && userRows[0];
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No valid assets found" });
    }

    const alreadyAssigned = assets.filter(
      (a) => a.assigned_user && a.assigned_user !== user_id,
    );

    if (alreadyAssigned.length > 0 && req.query.force !== "true") {
      return res.status(400).json({
        success: false,
        message: `${alreadyAssigned.length} asset(s) are already assigned to other users`,
        already_assigned: alreadyAssigned.map((a) => ({
          id: a.id,
          unique_asset_id: a.unique_asset_id,
          assigned_to: a.assigned_user,
        })),
        hint: "Use ?force=true to reassign these assets",
      });
    }

    const ids = assets.map((a) => a.id);

    const updatePayload = {
      assigned_user: user_id,
      status: "Active",
      updated_at: new Date().toISOString(),
    };
    if (department) updatePayload.department = department;

    const { error: updateError } = await supabase
      .from("assets")
      .update(updatePayload)
      .in("id", ids);

    if (updateError) throw new Error(updateError.message);

    // Audit logs
    const auditLogs = assets.map((asset) => ({
      asset,
      action: "bulk_assign",
      performed_by: req.user.id,
      details: {
        old_user: asset.assigned_user || null,
        new_user: user_id,
        user_name: user.name,
        department: department || asset.department,
        notes,
        batch_size: assets.length,
      },
      timestamp: new Date().toISOString(),
    }));
    await insertAuditLogs(auditLogs);

    // Notify newly assigned user
    await insertNotifications([
      {
        recipient: user_id,
        type: "asset_assigned",
        title: "Assets Assigned to You",
        message: `${assets.length} asset(s) have been assigned to you`,
        is_read: false,
      },
    ]);

    return res.json({
      success: true,
      message: `Successfully assigned ${assets.length} asset(s) to ${user.name}`,
      assigned_count: assets.length,
      assigned_to: {
        id: user.id,
        name: user.name,
        email: user.email,
        department: user.department,
      },
      missing_ids: missingIds,
      reassigned_count: alreadyAssigned.length,
    });
  } catch (error) {
    logger.error("Error in bulk assign:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to assign assets",
      error: "An internal server error occurred",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Bulk delete assets (soft or permanent)
// ─────────────────────────────────────────────────────────────────────────────
exports.bulkDelete = async (req, res) => {
  try {
    const { asset_ids, reason, permanent = false } = req.body;

    if (permanent && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can permanently delete assets",
      });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No valid assets found" });
    }

    const activeAssets = assets.filter(
      (a) =>
        a.status === "Active" ||
        a.status === "Under Maintenance" ||
        a.assigned_user,
    );

    if (activeAssets.length > 0 && req.query.force !== "true") {
      return res.status(400).json({
        success: false,
        message: `${activeAssets.length} asset(s) are active or assigned`,
        active_assets: activeAssets.map((a) => ({
          id: a.id,
          unique_asset_id: a.unique_asset_id,
          status: a.status,
          assigned_user: a.assigned_user,
        })),
        hint: "Use ?force=true to delete these assets anyway",
      });
    }

    const supabase = getSupabase();
    const ids = assets.map((a) => a.id);
    const deletedCount = ids.length;

    if (permanent) {
      const { error } = await supabase.from("assets").delete().in("id", ids);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("assets")
        .update({ status: "Disposed", updated_at: new Date().toISOString() })
        .in("id", ids);
      if (error) throw new Error(error.message);
    }

    // Audit logs
    const auditLogs = assets.map((asset) => ({
      asset,
      action: permanent ? "bulk_delete_permanent" : "bulk_delete_soft",
      performed_by: req.user.id,
      details: {
        unique_asset_id: asset.unique_asset_id,
        name: asset.name,
        reason,
        permanent,
        batch_size: assets.length,
      },
      timestamp: new Date().toISOString(),
    }));
    await insertAuditLogs(auditLogs);

    // Notify affected users
    const affectedUserIds = [
      ...new Set(
        assets.filter((a) => a.assigned_user).map((a) => a.assigned_user),
      ),
    ];
    const notifications = affectedUserIds.map((userId) => ({
      recipient: userId,
      type: "warning",
      title: "Asset Deleted",
      message: "One or more assets assigned to you have been deleted",
      is_read: false,
    }));
    await insertNotifications(notifications);

    return res.json({
      success: true,
      message: `Successfully ${permanent ? "permanently deleted" : "deleted"} ${deletedCount} asset(s)`,
      deleted_count: deletedCount,
      missing_ids: missingIds,
      permanent,
      notifications_sent: affectedUserIds.length,
    });
  } catch (error) {
    logger.error("Error in bulk delete:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete assets",
      error: "An internal server error occurred",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Bulk schedule maintenance
// ─────────────────────────────────────────────────────────────────────────────
exports.bulkScheduleMaintenance = async (req, res) => {
  try {
    const {
      asset_ids,
      maintenance_type,
      scheduled_date,
      description,
      priority = "Medium",
      assigned_technician,
    } = req.body;

    if (!maintenance_type || !scheduled_date) {
      return res.status(400).json({
        success: false,
        message: "Maintenance type and scheduled date are required",
      });
    }

    const validTypes = [
      "Preventive",
      "Corrective",
      "Inspection",
      "Calibration",
      "Cleaning",
    ];
    if (!validTypes.includes(maintenance_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid maintenance type. Must be one of: ${validTypes.join(", ")}`,
      });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No valid assets found" });
    }

    const supabase = getSupabase();

    // Verify technician if provided
    let technician = null;
    if (assigned_technician) {
      const { data: techRows, error: techErr } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("id", assigned_technician)
        .limit(1);
      if (techErr) throw new Error(techErr.message);
      technician = techRows && techRows[0];
      if (!technician) {
        return res
          .status(404)
          .json({ success: false, message: "Assigned technician not found" });
      }
    }

    const scheduledDateIso = new Date(scheduled_date).toISOString();

    // Create maintenance records
    const maintenanceRecords = assets.map((asset) => ({
      asset,
      maintenance_type,
      maintenance_date: scheduledDateIso,
      description: description || `Bulk ${maintenance_type} maintenance`,
      status: "Scheduled",
      priority,
      performed_by: technician ? technician.name : null,
      created_by: req.user.id,
      created_at: new Date().toISOString(),
    }));

    const { data: insertedRecords, error: insertErr } = await supabase
      .from("maintenances")
      .insert(maintenanceRecords)
      .select("id");

    if (insertErr) throw new Error(insertErr.message);

    // Update asset last_maintenance_date if maintenance is within 7 days
    const scheduledDateObj = new Date(scheduled_date);
    const daysUntil = Math.ceil(
      (scheduledDateObj - new Date()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntil <= 7 && daysUntil >= 0) {
      const ids = assets.map((a) => a.id);
      await supabase
        .from("assets")
        .update({
          last_maintenance_date: scheduledDateIso,
          updated_at: new Date().toISOString(),
        })
        .in("id", ids);
    }

    // Audit logs
    const auditLogs = assets.map((asset) => ({
      asset,
      action: "bulk_maintenance_scheduled",
      performed_by: req.user.id,
      details: {
        maintenance_type,
        scheduled_date,
        priority,
        assigned_technician: technician ? technician.name : "Unassigned",
        batch_size: assets.length,
      },
      timestamp: new Date().toISOString(),
    }));
    await insertAuditLogs(auditLogs);

    // Notify technician
    if (technician) {
      await insertNotifications([
        {
          recipient: technician.id,
          type: "maintenance",
          title: "Maintenance Tasks Assigned",
          message: `${assets.length} ${maintenance_type} maintenance task(s) scheduled for ${scheduledDateObj.toLocaleDateString()}`,
          is_read: false,
        },
      ]);
    }

    // Notify asset owners
    const assetOwnerIds = [
      ...new Set(
        assets.filter((a) => a.assigned_user).map((a) => a.assigned_user),
      ),
    ];
    const ownerNotifications = assetOwnerIds.map((userId) => ({
      recipient: userId,
      type: "maintenance",
      title: "Maintenance Scheduled",
      message: `${maintenance_type} maintenance scheduled for your asset(s) on ${scheduledDateObj.toLocaleDateString()}`,
      is_read: false,
    }));
    await insertNotifications(ownerNotifications);

    return res.json({
      success: true,
      message: `Successfully scheduled ${insertedRecords.length} maintenance task(s)`,
      scheduled_count: insertedRecords.length,
      maintenance_type,
      scheduled_date: scheduledDateObj,
      assigned_to: technician
        ? { id: technician.id, name: technician.name, email: technician.email }
        : null,
      missing_ids: missingIds,
      notifications_sent: (technician ? 1 : 0) + assetOwnerIds.length,
    });
  } catch (error) {
    logger.error("Error in bulk schedule maintenance:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to schedule maintenance",
      error: "An internal server error occurred",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Bulk update asset location
// ─────────────────────────────────────────────────────────────────────────────
exports.bulkUpdateLocation = async (req, res) => {
  try {
    const { asset_ids, location, notes } = req.body;

    if (!location) {
      return res
        .status(400)
        .json({ success: false, message: "Location is required" });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No valid assets found" });
    }

    const supabase = getSupabase();
    const ids = assets.map((a) => a.id);

    const { error: updateError } = await supabase
      .from("assets")
      .update({ location, updated_at: new Date().toISOString() })
      .in("id", ids);

    if (updateError) throw new Error(updateError.message);

    // Audit logs
    const auditLogs = assets.map((asset) => ({
      asset,
      action: "bulk_location_update",
      performed_by: req.user.id,
      details: {
        old_location: asset.location,
        new_location: location,
        notes,
        batch_size: assets.length,
      },
      timestamp: new Date().toISOString(),
    }));
    await insertAuditLogs(auditLogs);

    return res.json({
      success: true,
      message: `Successfully updated location for ${assets.length} asset(s)`,
      updated_count: assets.length,
      new_location: location,
      missing_ids: missingIds,
    });
  } catch (error) {
    logger.error("Error in bulk location update:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update asset locations",
      error: "An internal server error occurred",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Bulk update asset condition
// ─────────────────────────────────────────────────────────────────────────────
exports.bulkUpdateCondition = async (req, res) => {
  try {
    const { asset_ids, condition, notes } = req.body;

    if (!condition) {
      return res
        .status(400)
        .json({ success: false, message: "Condition is required" });
    }

    const validConditions = ["excellent", "good", "fair", "poor", "damaged"];
    if (!validConditions.includes(condition.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid condition. Must be one of: ${validConditions.join(", ")}`,
      });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No valid assets found" });
    }

    const supabase = getSupabase();
    const ids = assets.map((a) => a.id);

    const { error: updateError } = await supabase
      .from("assets")
      .update({
        condition: condition.toLowerCase(),
        last_audit_date: new Date().toISOString(),
        last_audited_by: req.user.id,
        updated_at: new Date().toISOString(),
      })
      .in("id", ids);

    if (updateError) throw new Error(updateError.message);

    // Audit logs
    const auditLogs = assets.map((asset) => ({
      asset,
      action: "bulk_condition_update",
      performed_by: req.user.id,
      details: {
        old_condition: asset.condition,
        new_condition: condition.toLowerCase(),
        notes,
        batch_size: assets.length,
      },
      timestamp: new Date().toISOString(),
    }));
    await insertAuditLogs(auditLogs);

    return res.json({
      success: true,
      message: `Successfully updated condition for ${assets.length} asset(s)`,
      updated_count: assets.length,
      new_condition: condition.toLowerCase(),
      missing_ids: missingIds,
    });
  } catch (error) {
    logger.error("Error in bulk condition update:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update asset conditions",
      error: "An internal server error occurred",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Get bulk operation history
// ─────────────────────────────────────────────────────────────────────────────
exports.getBulkOperationHistory = async (req, res) => {
  try {
    const { limit = 50, page = 1, action_type } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    const bulkActions = [
      "bulk_status_update",
      "bulk_assign",
      "bulk_delete_soft",
      "bulk_delete_permanent",
      "bulk_maintenance_scheduled",
      "bulk_location_update",
      "bulk_condition_update",
    ];

    const supabase = getSupabase();

    let query = supabase
      .from("audit_logs")
      .select("id, action, performed_by, asset_id, details, timestamp", {
        count: "exact",
      })
      .order("timestamp", { ascending: false })
      .range(from, to);

    if (action_type) {
      query = query.eq("action", action_type);
    } else {
      query = query.in("action", bulkActions);
    }

    if (req.user.role !== "ADMIN") {
      query = query.eq("performed_by", req.user.id);
    }

    const { data: operations, error, count } = await query;
    if (error) throw new Error(error.message);

    // Gather unique user and asset IDs for a secondary lookup
    const userIds = [
      ...new Set((operations || []).map((o) => o.performed_by).filter(Boolean)),
    ];
    const assetIds = [
      ...new Set((operations || []).map((o) => o.asset_id).filter(Boolean)),
    ];

    const [{ data: usersData }, { data: assetsData }] = await Promise.all([
      userIds.length > 0
        ? supabase
            .from("users")
            .select("id, name, email, role")
            .in("id", userIds)
        : Promise.resolve({ data: [] }),
      assetIds.length > 0
        ? supabase
            .from("assets")
            .select("id, unique_asset_id, name")
            .in("id", assetIds)
        : Promise.resolve({ data: [] }),
    ]);

    const usersMap = Object.fromEntries(
      (usersData || []).map((u) => [u.id, u]),
    );
    const assetsMap = Object.fromEntries(
      (assetsData || []).map((a) => [a.id, a]),
    );

    // Group by timestamp + action to surface as single batch operations
    const groupedOperations = {};
    (operations || []).forEach((op) => {
      const ts = op.timestamp ? new Date(op.timestamp).getTime() : 0;
      const key = `${ts}-${op.action}`;
      if (!groupedOperations[key]) {
        groupedOperations[key] = {
          id: op.id,
          action: op.action,
          performed_by: usersMap[op.performed_by] || op.performed_by,
          timestamp: op.timestamp,
          batch_size: (op.details && op.details.batch_size) || 1,
          assets: [],
          details: op.details,
        };
      }
      if (op.asset_id && assetsMap[op.asset_id]) {
        groupedOperations[key].assets.push(assetsMap[op.asset_id]);
      }
    });

    const result = Object.values(groupedOperations);
    const total = count || 0;

    return res.json({
      success: true,
      operations: result,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    logger.error("Error fetching bulk operation history:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch operation history",
      error: "An internal server error occurred",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Validate bulk operation (dry run)
// ─────────────────────────────────────────────────────────────────────────────
exports.validateBulkOperation = async (req, res) => {
  try {
    const { asset_ids, operation } = req.body;

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    const validation = {
      success: true,
      valid_count: assets.length,
      invalid_count: missingIds.length,
      missing_ids: missingIds,
      warnings: [],
      can_proceed: true,
    };

    switch (operation) {
      case "update_status": {
        const activeCount = assets.filter((a) => a.status === "Active").length;
        if (activeCount > 0) {
          validation.warnings.push(
            `${activeCount} asset(s) are currently active`,
          );
        }
        break;
      }
      case "assign": {
        const alreadyAssigned = assets.filter((a) => a.assigned_user).length;
        if (alreadyAssigned > 0) {
          validation.warnings.push(
            `${alreadyAssigned} asset(s) are already assigned`,
          );
        }
        break;
      }
      case "delete": {
        const inUse = assets.filter(
          (a) => a.status === "Active" || a.status === "Under Maintenance",
        ).length;
        if (inUse > 0) {
          validation.warnings.push(`${inUse} asset(s) are currently in use`);
          validation.can_proceed = false;
        }
        break;
      }
      case "schedule_maintenance": {
        const underMaintenance = assets.filter(
          (a) => a.status === "Under Maintenance",
        ).length;
        if (underMaintenance > 0) {
          validation.warnings.push(
            `${underMaintenance} asset(s) already under maintenance`,
          );
        }
        break;
      }
      default:
        break;
    }

    return res.json(validation);
  } catch (error) {
    logger.error("Error validating bulk operation:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to validate operation",
      error: "An internal server error occurred",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Bulk import assets from CSV/Excel file
// ─────────────────────────────────────────────────────────────────────────────
exports.importAssets = async (req, res) => {
  const fs = require("fs");
  const csv = require("csv-parser");
  const XLSX = require("xlsx");
  const path = require("path");

  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const results = [];
    const errors = [];

    if (fileExtension === ".csv") {
      await new Promise((resolve, reject) => {
        let rowNumber = 0;
        fs.createReadStream(filePath)
          .pipe(csv())
          .on("data", (data) => {
            rowNumber++;
            results.push({ row: rowNumber, data });
          })
          .on("end", resolve)
          .on("error", reject);
      });
    } else if (fileExtension === ".xlsx" || fileExtension === ".xls") {
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      data.forEach((row, index) => {
        results.push({ row: index + 2, data: row });
      });
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: "Unsupported file format. Please upload CSV or Excel file.",
      });
    }

    const supabase = getSupabase();
    let successCount = 0;
    let failedCount = 0;

    for (const item of results) {
      try {
        const { row, data } = item;

        // Normalize field names
        const normalizedData = {};
        for (const [key, value] of Object.entries(data)) {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, "_");
          normalizedData[normalizedKey] = value;
        }

        const name = normalizedData.name || normalizedData.asset_name;
        const unique_asset_id =
          normalizedData.unique_asset_id ||
          normalizedData.asset_id ||
          normalizedData.id;
        const asset_type =
          normalizedData.asset_type ||
          normalizedData.type ||
          normalizedData.category;

        if (!name || !unique_asset_id || !asset_type) {
          errors.push({
            row,
            error:
              "Missing required fields (name, unique_asset_id, asset_type)",
            data,
          });
          failedCount++;
          continue;
        }

        // Check duplicate
        const { data: existing } = await supabase
          .from("assets")
          .select("id")
          .eq("unique_asset_id", unique_asset_id)
          .limit(1);

        if (existing && existing.length > 0) {
          errors.push({
            row,
            error: `Asset ID ${unique_asset_id} already exists`,
            data,
          });
          failedCount++;
          continue;
        }

        const assetData = {
          unique_asset_id,
          name,
          asset_type,
          manufacturer: normalizedData.manufacturer || "Unknown",
          model: normalizedData.model || "Unknown",
          serial_number:
            normalizedData.serial_number || normalizedData.serial || "N/A",
          location: normalizedData.location || "Unknown",
          assigned_user:
            normalizedData.assigned_user || normalizedData.assigned_to || null,
          status: normalizedData.status || "Available",
          department: normalizedData.department || "INVENTORY",
          purchase_date: normalizedData.purchase_date
            ? new Date(normalizedData.purchase_date).toISOString()
            : new Date().toISOString(),
          purchase_cost: parseFloat(
            normalizedData.purchase_cost ||
              normalizedData.purchase_value ||
              normalizedData.value ||
              0,
          ),
          warranty_expiry: normalizedData.warranty_expiry
            ? new Date(normalizedData.warranty_expiry).toISOString()
            : null,
          last_audit_date: normalizedData.last_audit_date
            ? new Date(normalizedData.last_audit_date).toISOString()
            : new Date().toISOString(),
          condition: normalizedData.condition
            ? normalizedData.condition.toLowerCase()
            : "good",
          configuration: normalizedData.configuration
            ? typeof normalizedData.configuration === "string"
              ? JSON.parse(normalizedData.configuration)
              : normalizedData.configuration
            : {},
          expected_lifespan: parseInt(
            normalizedData.expected_lifespan || normalizedData.lifespan || 5,
          ),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const { data: newAsset, error: insertErr } = await supabase
          .from("assets")
          .insert(assetData)
          .select("id, unique_asset_id")
          .single();

        if (insertErr) throw new Error(insertErr.message);

        // Audit log
        await supabase.from("audit_logs").insert({
          performed_by: req.user.id,
          action: "BULK_IMPORT_ASSET",
          asset_id: newAsset.id,
          description: `Asset ${newAsset.unique_asset_id} imported from ${fileExtension} file`,
          ip_address: req.ip,
          timestamp: new Date().toISOString(),
        });

        successCount++;
      } catch (err) {
        errors.push({
          row: item.row,
          error: "An internal server error occurred",
          data: item.data,
        });
        failedCount++;
      }
    }

    // Clean up uploaded file
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    // Notify importing user
    await insertNotifications([
      {
        recipient: req.user.id,
        title: "Bulk Import Completed",
        message: `Imported ${successCount} assets successfully. ${failedCount} failed.`,
        type: successCount > 0 ? "success" : "warning",
        is_read: false,
      },
    ]);

    return res.json({
      success: true,
      message: `Import completed: ${successCount} successful, ${failedCount} failed`,
      imported: successCount,
      failed: failedCount,
      total: results.length,
      errors,
    });
  } catch (error) {
    logger.error("Error importing assets:", error);

    const fs = require("fs");
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      message: "Failed to import assets",
      error: "An internal server error occurred",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Generate CSV/Excel template for bulk import
// ─────────────────────────────────────────────────────────────────────────────
exports.generateImportTemplate = async (req, res) => {
  try {
    const format = req.query.format || "csv";

    const headers = [
      "name",
      "unique_asset_id",
      "asset_type",
      "category",
      "manufacturer",
      "model",
      "serial_number",
      "purchase_date",
      "purchase_cost",
      "warranty_expiry",
      "status",
      "condition",
      "location",
      "department",
      "description",
    ];

    const sampleData = [
      {
        name: "Dell XPS 15 Laptop",
        unique_asset_id: "AST-123",
        asset_type: "IT Equipment",
        category: "Laptop",
        manufacturer: "Dell",
        model: "XPS 15",
        serial_number: "DL123456789",
        purchase_date: "2024-01-15",
        purchase_cost: "85000",
        warranty_expiry: "2026-01-15",
        status: "Available",
        condition: "excellent",
        location: "IT Department",
        department: "IT",
        description: "High-performance laptop for development work",
      },
      {
        name: "HP LaserJet Printer",
        unique_asset_id: "AST-456",
        asset_type: "Office Equipment",
        category: "Printer",
        manufacturer: "HP",
        model: "LaserJet Pro M404n",
        serial_number: "HP987654321",
        purchase_date: "2024-02-20",
        purchase_cost: "25000",
        warranty_expiry: "2025-02-20",
        status: "Available",
        condition: "good",
        location: "Admin Office",
        department: "ADMIN",
        description: "Network printer for office use",
      },
    ];

    if (format === "xlsx" || format === "excel") {
      const XLSX = require("xlsx");
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Assets");
      const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=asset-import-template.xlsx",
      );
      res.send(buffer);
    } else {
      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (
          stringValue.includes('"') ||
          stringValue.includes(",") ||
          stringValue.includes("\n") ||
          stringValue.includes("\r")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return `"${stringValue}"`;
      };

      const csvRows = [];
      csvRows.push(headers.map((h) => escapeCsvValue(h)).join(","));
      sampleData.forEach((row) => {
        csvRows.push(
          headers.map((header) => escapeCsvValue(row[header] || "")).join(","),
        );
      });

      const BOM = "\uFEFF";
      const csvContent = BOM + csvRows.join("\r\n");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=asset-import-template.csv",
      );
      res.send(csvContent);
    }
  } catch (error) {
    logger.error("Error generating template:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to generate template",
      error: "An internal server error occurred",
    });
  }
};

module.exports = exports;
