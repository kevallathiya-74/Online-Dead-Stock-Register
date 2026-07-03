const getSupabase = require("../config/db");
const logger = require("../utils/logger");

/**
 * @desc    Create a new asset issue
 * @route   POST /api/assets/:id/issues
 * @access  Private (All authenticated users)
 */
const createAssetIssue = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id: assetId } = req.params;
    const { issue_description, issue_type, severity, scan_location } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!issue_description || issue_description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Issue description is required",
      });
    }

    // Find the asset to get unique_asset_id
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, unique_asset_id")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Create the issue
    const { data: newIssue, error: insertError } = await supabase
      .from("asset_issues")
      .insert({
        asset_id: assetId,
        unique_asset_id: asset.unique_asset_id,
        issue_description: issue_description.trim(),
        issue_type: issue_type || "Other",
        severity: severity || "Medium",
        status: "Open",
        reported_by: userId,
        scan_location: scan_location || "QR Scanner",
        reported_at: new Date().toISOString(),
      })
      .select(
        `
        *,
        reporter:users!reported_by(name, email)
      `,
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "Asset Issue Reported",
      entity_type: "AssetIssue",
      entity_id: newIssue.id,
      details: {
        asset_id: assetId,
        unique_asset_id: asset.unique_asset_id,
        issue_type: newIssue.issue_type,
        severity: newIssue.severity,
        description:
          issue_description.substring(0, 100) +
          (issue_description.length > 100 ? "..." : ""),
      },
    });

    return res.status(201).json({
      success: true,
      message: "Asset issue reported successfully",
      data: newIssue,
    });
  } catch (error) {
    logger.error("Error creating asset issue", {
      error: error.message,
      assetId: req.params.id,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to create asset issue",
    });
  }
};

/**
 * @desc    Get all issues for a specific asset
 * @route   GET /api/assets/:id/issues
 * @access  Private
 */
const getAssetIssues = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id: assetId } = req.params;
    const { status, limit = 50 } = req.query;

    // Build query for issues
    let query = supabase
      .from("asset_issues")
      .select(
        `
        *,
        reporter:users!reported_by(name, email),
        resolver:users!resolved_by(name, email)
      `,
      )
      .eq("asset_id", assetId)
      .order("reported_at", { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq("status", status);
    }

    const { data: issues, error } = await query;

    if (error) {
      throw error;
    }

    // Get open issues count
    const { count: openIssuesCount, error: countError } = await supabase
      .from("asset_issues")
      .select("*", { count: "exact", head: true })
      .eq("asset_id", assetId)
      .in("status", ["Open", "In Progress"]);

    if (countError) {
      throw countError;
    }

    return res.json({
      success: true,
      data: {
        issues,
        total: issues.length,
        openCount: openIssuesCount || 0,
      },
    });
  } catch (error) {
    logger.error("Error fetching asset issues", {
      error: error.message,
      assetId: req.params.id,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch asset issues",
    });
  }
};

/**
 * @desc    Get latest open issue for an asset
 * @route   GET /api/assets/:id/issues/latest
 * @access  Private
 */
const getLatestAssetIssue = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id: assetId } = req.params;

    const { data: latestIssue, error } = await supabase
      .from("asset_issues")
      .select(
        `
        *,
        reporter:users!reported_by(name, email)
      `,
      )
      .eq("asset_id", assetId)
      .in("status", ["Open", "In Progress"])
      .order("reported_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!latestIssue) {
      return res.json({
        success: true,
        data: null,
        message: "No open issues found for this asset",
      });
    }

    return res.json({
      success: true,
      data: latestIssue,
    });
  } catch (error) {
    logger.error("Error fetching latest asset issue", {
      error: error.message,
      assetId: req.params.id,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch latest asset issue",
    });
  }
};

/**
 * @desc    Update an asset issue
 * @route   PUT /api/assets/:id/issues/:issueId
 * @access  Private (Reporter or Admin/Inventory Manager)
 */
const updateAssetIssue = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id: assetId, issueId } = req.params;
    const {
      issue_description,
      issue_type,
      severity,
      status,
      resolution_notes,
    } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the issue
    const { data: issue, error: fetchError } = await supabase
      .from("asset_issues")
      .select("*")
      .eq("id", issueId)
      .eq("asset_id", assetId)
      .single();

    if (fetchError || !issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    // Check permissions: Only reporter, admin, or inventory manager can update
    const isReporter = issue.reported_by === userId;
    const isAuthorized =
      isReporter || ["ADMIN", "INVENTORY_MANAGER"].includes(userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to update this issue",
      });
    }

    // Build update payload
    const updatePayload = {};
    if (issue_description)
      updatePayload.issue_description = issue_description.trim();
    if (issue_type) updatePayload.issue_type = issue_type;
    if (severity) updatePayload.severity = severity;

    if (status) {
      updatePayload.status = status;
      if (status === "Resolved" || status === "Closed") {
        updatePayload.resolved_at = new Date().toISOString();
        updatePayload.resolved_by = userId;
        if (resolution_notes) {
          updatePayload.resolution_notes = resolution_notes;
        }
      }
    }

    const { data: updatedIssue, error: updateError } = await supabase
      .from("asset_issues")
      .update(updatePayload)
      .eq("id", issueId)
      .select(
        `
        *,
        reporter:users!reported_by(name, email),
        resolver:users!resolved_by(name, email)
      `,
      )
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "Asset Issue Updated",
      entity_type: "AssetIssue",
      entity_id: issueId,
      details: {
        asset_id: assetId,
        unique_asset_id: issue.unique_asset_id,
        changes: { status, issue_type, severity },
      },
    });

    return res.json({
      success: true,
      message: "Asset issue updated successfully",
      data: updatedIssue,
    });
  } catch (error) {
    logger.error("Error updating asset issue", {
      error: error.message,
      issueId: req.params.issueId,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to update asset issue",
    });
  }
};

/**
 * @desc    Delete an asset issue
 * @route   DELETE /api/assets/:id/issues/:issueId
 * @access  Private (Admin/Inventory Manager only)
 */
const deleteAssetIssue = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id: assetId, issueId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only admin or inventory manager can delete
    if (!["ADMIN", "INVENTORY_MANAGER"].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete issues",
      });
    }

    // Fetch the issue first to confirm existence and capture metadata for audit log
    const { data: issue, error: fetchError } = await supabase
      .from("asset_issues")
      .select("id, unique_asset_id, issue_type")
      .eq("id", issueId)
      .eq("asset_id", assetId)
      .single();

    if (fetchError || !issue) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const { error: deleteError } = await supabase
      .from("asset_issues")
      .delete()
      .eq("id", issueId)
      .eq("asset_id", assetId);

    if (deleteError) {
      throw deleteError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action: "Asset Issue Deleted",
      entity_type: "AssetIssue",
      entity_id: issueId,
      details: {
        asset_id: assetId,
        unique_asset_id: issue.unique_asset_id,
        deleted_issue_type: issue.issue_type,
      },
    });

    return res.json({
      success: true,
      message: "Asset issue deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting asset issue", {
      error: error.message,
      issueId: req.params.issueId,
    });
    return res.status(500).json({
      success: false,
      message: "Failed to delete asset issue",
    });
  }
};

/**
 * @desc    Get all open issues (for dashboard/overview)
 * @route   GET /api/asset-issues/open
 * @access  Private (Admin/Inventory Manager/Auditor)
 */
const getAllOpenIssues = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { limit = 100, severity, issue_type } = req.query;

    // Build open-issues query
    let query = supabase
      .from("asset_issues")
      .select(
        `
        *,
        asset:assets!asset_id(unique_asset_id, manufacturer, model, location),
        reporter:users!reported_by(name, email)
      `,
      )
      .in("status", ["Open", "In Progress"])
      .order("severity", { ascending: false })
      .order("reported_at", { ascending: false })
      .limit(parseInt(limit));

    if (severity) query = query.eq("severity", severity);
    if (issue_type) query = query.eq("issue_type", issue_type);

    const { data: issues, error } = await query;

    if (error) {
      throw error;
    }

    // Critical count
    let criticalQuery = supabase
      .from("asset_issues")
      .select("*", { count: "exact", head: true })
      .in("status", ["Open", "In Progress"])
      .eq("severity", "Critical");
    if (issue_type) criticalQuery = criticalQuery.eq("issue_type", issue_type);
    const { count: criticalCount } = await criticalQuery;

    // High count
    let highQuery = supabase
      .from("asset_issues")
      .select("*", { count: "exact", head: true })
      .in("status", ["Open", "In Progress"])
      .eq("severity", "High");
    if (issue_type) highQuery = highQuery.eq("issue_type", issue_type);
    const { count: highCount } = await highQuery;

    return res.json({
      success: true,
      data: {
        issues,
        total: issues.length,
        criticalCount: criticalCount || 0,
        highCount: highCount || 0,
      },
    });
  } catch (error) {
    logger.error("Error fetching open issues", { error: error.message });
    return res.status(500).json({
      success: false,
      message: "Failed to fetch open issues",
    });
  }
};

module.exports = {
  createAssetIssue,
  getAssetIssues,
  getLatestAssetIssue,
  updateAssetIssue,
  deleteAssetIssue,
  getAllOpenIssues,
};
