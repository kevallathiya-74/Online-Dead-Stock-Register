const assetService = require("../services/assetService");
const getSupabase = require("../config/db");
const logger = require("../utils/logger");
const { logUserAction } = require("../utils/auditHelper");
const { validate: isValidUUID } = require("uuid");

// GET all assets with pagination and filtering
exports.getAssets = async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      department: req.query.department,
      asset_type: req.query.asset_type,
      location: req.query.location,
      search: req.query.search,
      purchaseStartDate: req.query.purchaseStartDate,
      purchaseEndDate: req.query.purchaseEndDate,
    };

    const pagination = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50,
      sortBy:
        req.query.sortBy === "createdAt"
          ? "created_at"
          : req.query.sortBy || "created_at",
      sortOrder: req.query.sortOrder || "desc",
    };

    const result = await assetService.getAssets(filters, pagination, req.user);

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    logger.error("Get assets error", { error: err.message, requestId: req.id });
    next(err);
  }
};

// GET my assigned assets (employee-specific)
exports.getMyAssets = async (req, res, next) => {
  try {
    const assets = await assetService.getUserAssets(req.user.id);

    res.json({
      success: true,
      data: assets,
      total: assets.length,
    });
  } catch (err) {
    logger.error("Get my assets error", {
      error: err.message,
      userId: req.user.id,
      requestId: req.id,
    });
    next(err);
  }
};

// GET asset by id
exports.getAssetById = async (req, res, next) => {
  try {
    const asset = await assetService.getAssetById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    res.json({
      success: true,
      data: asset,
    });
  } catch (err) {
    logger.error("Error fetching asset by ID", {
      error: err.message,
      assetId: req.params.id,
      requestId: req.id,
    });
    next(err);
  }
};

// CREATE asset
exports.createAsset = async (req, res, next) => {
  try {
    // If not admin, ensure asset is created in user's department
    if (
      req.user.role !== "ADMIN" &&
      req.body.department !== req.user.department
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only create assets in your own department",
      });
    }

    // Set department if not admin
    const assetData = {
      ...req.body,
      department:
        req.user.role === "ADMIN" ? req.body.department : req.user.department,
    };

    const asset = await assetService.createAsset(assetData, req.user.id);

    res.status(201).json({
      success: true,
      data: asset,
      message: "Asset created successfully",
    });
  } catch (err) {
    logger.error("Create asset error", {
      error: err.message,
      userId: req.user.id,
      requestId: req.id,
    });
    next(err);
  }
};

// UPDATE asset
exports.updateAsset = async (req, res) => {
  try {
    const supabase = getSupabase();

    // Fetch the asset first
    const { data: asset, error: fetchError } = await supabase
      .from("assets")
      .select("*")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    // Check if the user is the assigned user or an Admin
    if (
      asset.assigned_user &&
      asset.assigned_user !== req.user.id &&
      req.user.role !== "ADMIN"
    ) {
      return res.status(403).json({
        message: "Can only update your own assets or admin access required",
      });
    }

    // If assigned_user is being updated and it's a string (email or employee_id), look up the user
    if (req.body.assigned_user && typeof req.body.assigned_user === "string") {
      // Check if it's already a valid UUID
      if (!isValidUUID(req.body.assigned_user)) {
        // Try to find user by email or employee_id
        const { data: user, error: userError } = await supabase
          .from("users")
          .select("id, name, email")
          .or(
            `email.eq.${req.body.assigned_user},employee_id.eq.${req.body.assigned_user}`,
          )
          .single();

        if (userError || !user) {
          return res.status(400).json({
            message: `User not found with email or employee ID: ${req.body.assigned_user}`,
          });
        }

        // Replace with the UUID
        req.body.assigned_user = user.id;
      }
    }

    // Store original values for audit log
    const originalLocation = asset.location;
    const originalAssignedUser = asset.assigned_user;

    // Use assetService to update (includes audit logging)
    const updatedAsset = await assetService.updateAsset(
      req.params.id,
      req.body,
      req.user.id,
    );

    // Create additional audit log if location changed (asset transfer)
    if (req.body.location && originalLocation !== req.body.location) {
      try {
        // Get assigned user name if UUID provided
        let assignedUserName = "Unassigned";
        if (req.body.assigned_user) {
          const { data: assignedUser } = await supabase
            .from("users")
            .select("name, email")
            .eq("id", req.body.assigned_user)
            .single();

          if (assignedUser) {
            assignedUserName = assignedUser.name || assignedUser.email;
          }
        }

        const description = `Asset ${asset.unique_asset_id} transferred from "${originalLocation}" to "${req.body.location}"${req.body.assigned_user ? ` and assigned to ${assignedUserName}` : ""}`;

        // Use new audit helper for proper IP tracking
        await logUserAction(
          req,
          "asset_transferred",
          "Asset",
          asset.id,
          description,
          "info",
        );

        logger.info("Audit log created for asset transfer", {
          assetId: asset.id,
        });
      } catch (auditErr) {
        logger.error("Audit log creation failed", { error: auditErr.message });
        // Don't fail the request if audit log fails
      }
    }

    res.json(updatedAsset);
  } catch (err) {
    logger.error("Update asset error", {
      error: err.message,
      assetId: req.params.id,
    });
    res.status(400).json({ message: err.message });
  }
};

// DELETE asset
exports.deleteAsset = async (req, res) => {
  try {
    await assetService.deleteAsset(req.params.id, req.user.id);
    res.json({
      success: true,
      message: "Asset deleted successfully",
    });
  } catch (err) {
    logger.error("Delete asset error", {
      error: err.message,
      assetId: req.params.id,
    });
    if (err.message === "Asset not found") {
      return res.status(404).json({ success: false, message: err.message });
    }
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET asset statistics - Uses assetService
exports.getAssetStats = async (req, res) => {
  try {
    const stats = await assetService.getAssetStats(req.user);

    res.json({
      success: true,
      data: stats,
    });
  } catch (err) {
    logger.error("Get asset stats error", { error: err.message });
    res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};
