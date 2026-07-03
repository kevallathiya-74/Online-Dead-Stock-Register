const getSupabase = require("../config/db");
const logger = require("../utils/logger");
const { createAuditLog } = require("../utils/auditHelper");

/**
 * Helper to map Supabase database fields to match mongoose-like _id and object structures
 */
const mapAssetRequest = (request) => {
  if (!request) return null;
  const mapped = { ...request, _id: request.id };

  if (mapped.requester) {
    if (typeof mapped.requester === "object") {
      mapped.requester = {
        ...mapped.requester,
        _id: mapped.requester.id,
        id: mapped.requester.id,
        full_name: mapped.requester.name,
      };
    }
  }

  if (mapped.reviewed_by) {
    if (typeof mapped.reviewed_by === "object") {
      mapped.reviewed_by = {
        ...mapped.reviewed_by,
        _id: mapped.reviewed_by.id,
        id: mapped.reviewed_by.id,
        full_name: mapped.reviewed_by.name,
      };
    }
  }

  if (mapped.fulfilled_by) {
    if (typeof mapped.fulfilled_by === "object") {
      mapped.fulfilled_by = {
        ...mapped.fulfilled_by,
        _id: mapped.fulfilled_by.id,
        id: mapped.fulfilled_by.id,
        full_name: mapped.fulfilled_by.name,
      };
    }
  }

  if (mapped.assigned_asset) {
    if (typeof mapped.assigned_asset === "object") {
      mapped.assigned_asset = {
        ...mapped.assigned_asset,
        _id: mapped.assigned_asset.id,
        id: mapped.assigned_asset.id,
      };
    }
  }

  return mapped;
};

// Create new asset request
exports.createAssetRequest = async (req, res) => {
  try {
    const {
      asset_type,
      asset_category,
      brand_preference,
      specifications,
      justification,
      priority,
      expected_usage,
      required_by_date,
      department,
      location,
    } = req.body;

    const userId = req.user.id;
    const supabase = getSupabase();

    // Create new asset request data object (excluding budget_range since it doesn't exist in postgres schema)
    const requestData = {
      requester: userId,
      asset_type,
      asset_category,
      brand_preference,
      specifications,
      justification,
      priority,
      expected_usage,
      required_by_date: required_by_date
        ? new Date(required_by_date).toISOString()
        : new Date().toISOString(),
      department,
      location,
      status: "pending",
    };

    const { data: assetRequest, error: insertError } = await supabase
      .from("asset_requests")
      .insert([requestData])
      .select(
        `
        *,
        requester:users!requester(id, name, email, employee_id)
      `,
      )
      .single();

    if (insertError) {
      logger.error("Error inserting asset request", {
        error: insertError.message,
        userId,
      });
      return res
        .status(500)
        .json({ message: "Failed to create asset request" });
    }

    // Create audit log
    await createAuditLog(
      {
        action: "asset_request_created",
        performed_by: userId,
        details: {
          request_id: assetRequest.id,
          asset_type,
          priority,
          required_by_date,
        },
      },
      req,
    );

    // Create notification for inventory managers
    const { data: inventoryManagers, error: managersError } = await supabase
      .from("users")
      .select("id")
      .eq("role", "INVENTORY_MANAGER")
      .eq("is_active", true);

    if (managersError) {
      logger.error("Error fetching inventory managers for notification", {
        error: managersError.message,
      });
    } else if (inventoryManagers && inventoryManagers.length > 0) {
      const userName = req.user.name || req.user.full_name || "An employee";
      const notifications = inventoryManagers.map((manager) => ({
        recipient: manager.id,
        title: "New Asset Request",
        message: `${userName} has requested a ${asset_type}`,
        type: "asset_assigned",
        priority: priority || "medium",
        data: {
          request_id: assetRequest.id,
          requester_name: userName,
          asset_type,
        },
        action_url: `/inventory/asset-requests/${assetRequest.id}`,
      }));

      const { error: notifyError } = await supabase
        .from("notifications")
        .insert(notifications);

      if (notifyError) {
        logger.error("Error inserting notifications", {
          error: notifyError.message,
        });
      }
    }

    res.status(201).json({
      message: "Asset request created successfully",
      request: mapAssetRequest(assetRequest),
    });
  } catch (error) {
    logger.error("Error creating asset request", {
      error: error.message,
      userId: req.user.id,
    });
    res.status(500).json({ message: "Failed to create asset request" });
  }
};

// Get user's asset requests
exports.getUserAssetRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, status } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const fromRange = (parsedPage - 1) * parsedLimit;
    const toRange = fromRange + parsedLimit - 1;

    const supabase = getSupabase();

    let query = supabase
      .from("asset_requests")
      .select(
        `
        *,
        requester:users!requester(id, name, email, employee_id),
        reviewed_by:users!reviewed_by(id, name, email),
        assigned_asset:assets!assigned_asset(id, unique_asset_id, manufacturer, model),
        fulfilled_by:users!fulfilled_by(id, name, email)
      `,
        { count: "exact" },
      )
      .eq("requester", userId);

    if (status) {
      query = query.eq("status", status);
    }

    const {
      data: requests,
      count: total,
      error,
    } = await query
      .order("created_at", { ascending: false })
      .range(fromRange, toRange);

    if (error) {
      logger.error("Error fetching user asset requests", {
        error: error.message,
        userId,
      });
      return res
        .status(500)
        .json({ message: "Failed to fetch asset requests" });
    }

    const mappedRequests = (requests || []).map(mapAssetRequest);

    res.json({
      requests: mappedRequests,
      pagination: {
        current_page: parsedPage,
        total_pages: Math.ceil((total || 0) / parsedLimit),
        total_requests: total || 0,
        has_next: parsedPage * parsedLimit < (total || 0),
        has_prev: parsedPage > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching asset requests", {
      error: error.message,
      userId: req.user.id,
    });
    res.status(500).json({ message: "Failed to fetch asset requests" });
  }
};

// Get specific asset request by ID
exports.getAssetRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const supabase = getSupabase();

    const { data: request, error } = await supabase
      .from("asset_requests")
      .select(
        `
        *,
        requester:users!requester(id, name, email, employee_id, department),
        reviewed_by:users!reviewed_by(id, name, email),
        assigned_asset:assets!assigned_asset(id, unique_asset_id, manufacturer, model, serial_number),
        fulfilled_by:users!fulfilled_by(id, name, email)
      `,
      )
      .eq("id", id)
      .single();

    if (error || !request) {
      return res.status(404).json({ message: "Asset request not found" });
    }

    // Check if user has permission to view this request
    const requesterId = request.requester?.id || request.requester;
    const canView =
      requesterId === userId || // Requester
      ["ADMIN", "INVENTORY_MANAGER"].includes(req.user.role); // Admin or Inventory Manager

    if (!canView) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(mapAssetRequest(request));
  } catch (error) {
    logger.error("Error fetching asset request", {
      error: error.message,
      requestId: req.params.id,
    });
    res.status(500).json({ message: "Failed to fetch asset request" });
  }
};

// Update asset request (only for pending requests)
exports.updateAssetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const updateData = req.body;
    const supabase = getSupabase();

    const { data: request, error: fetchError } = await supabase
      .from("asset_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ message: "Asset request not found" });
    }

    // Check if user owns this request
    if (request.requester !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if request can be updated
    if (!["pending", "under_review"].includes(request.status)) {
      return res.status(400).json({
        message: "Request cannot be updated in current status",
      });
    }

    // Update allowed fields (excluding budget_range since it doesn't exist in postgres schema)
    const allowedFields = [
      "specifications",
      "justification",
      "expected_usage",
      "required_by_date",
      "location",
    ];

    const filteredUpdateData = {};
    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        filteredUpdateData[field] = updateData[field];
      }
    });

    if (filteredUpdateData.required_by_date) {
      filteredUpdateData.required_by_date = new Date(
        filteredUpdateData.required_by_date,
      ).toISOString();
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from("asset_requests")
      .update(filteredUpdateData)
      .eq("id", id)
      .select(
        `
        *,
        requester:users!requester(id, name, email, employee_id)
      `,
      )
      .single();

    if (updateError) {
      logger.error("Error updating asset request", {
        error: updateError.message,
        requestId: id,
      });
      return res
        .status(500)
        .json({ message: "Failed to update asset request" });
    }

    // Create audit log
    await createAuditLog(
      {
        action: "asset_request_updated",
        performed_by: userId,
        details: {
          request_id: id,
          updated_fields: Object.keys(filteredUpdateData),
        },
      },
      req,
    );

    res.json({
      message: "Asset request updated successfully",
      request: mapAssetRequest(updatedRequest),
    });
  } catch (error) {
    logger.error("Error updating asset request", {
      error: error.message,
      requestId: req.params.id,
    });
    res.status(500).json({ message: "Failed to update asset request" });
  }
};

// Cancel asset request
exports.cancelAssetRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { cancellation_reason } = req.body;
    const supabase = getSupabase();

    const { data: request, error: fetchError } = await supabase
      .from("asset_requests")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !request) {
      return res.status(404).json({ message: "Asset request not found" });
    }

    // Check if user owns this request
    if (request.requester !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check if request can be cancelled
    if (["fulfilled", "cancelled"].includes(request.status)) {
      return res.status(400).json({
        message: "Request cannot be cancelled in current status",
      });
    }

    const { data: updatedRequest, error: updateError } = await supabase
      .from("asset_requests")
      .update({
        status: "cancelled",
        review_comments: cancellation_reason || "Cancelled by requester",
        review_date: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      logger.error("Error cancelling asset request", {
        error: updateError.message,
        requestId: id,
      });
      return res
        .status(500)
        .json({ message: "Failed to cancel asset request" });
    }

    // Create audit log
    await createAuditLog(
      {
        action: "asset_request_cancelled",
        performed_by: userId,
        details: {
          request_id: id,
          cancellation_reason,
        },
      },
      req,
    );

    res.json({
      message: "Asset request cancelled successfully",
      request: mapAssetRequest(updatedRequest),
    });
  } catch (error) {
    logger.error("Error cancelling asset request", {
      error: error.message,
      requestId: req.params.id,
    });
    res.status(500).json({ message: "Failed to cancel asset request" });
  }
};

// Get asset request statistics for employee
exports.getAssetRequestStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const supabase = getSupabase();

    const { data: statsData, error } = await supabase
      .from("asset_requests")
      .select("status")
      .eq("requester", userId);

    if (error) {
      logger.error("Error fetching asset request stats", {
        error: error.message,
        userId,
      });
      return res
        .status(500)
        .json({ message: "Failed to fetch asset request statistics" });
    }

    const statusCounts = {
      pending: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
      fulfilled: 0,
      cancelled: 0,
    };

    (statsData || []).forEach((row) => {
      if (statusCounts[row.status] !== undefined) {
        statusCounts[row.status]++;
      }
    });

    const totalRequests = (statsData || []).length;

    res.json({
      total_requests: totalRequests,
      status_breakdown: statusCounts,
    });
  } catch (error) {
    logger.error("Error fetching asset request stats", {
      error: error.message,
      userId: req.user.id,
    });
    res
      .status(500)
      .json({ message: "Failed to fetch asset request statistics" });
  }
};

// Get all asset requests (for inventory managers/admins)
exports.getAllAssetRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      asset_type,
      department,
    } = req.query;

    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const fromRange = (parsedPage - 1) * parsedLimit;
    const toRange = fromRange + parsedLimit - 1;

    const supabase = getSupabase();

    let query = supabase.from("asset_requests").select(
      `
        *,
        requester:users!requester(id, name, email, employee_id, department),
        reviewed_by:users!reviewed_by(id, name, email),
        assigned_asset:assets!assigned_asset(id, unique_asset_id, manufacturer, model),
        fulfilled_by:users!fulfilled_by(id, name, email)
      `,
      { count: "exact" },
    );

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);
    if (asset_type) query = query.eq("asset_type", asset_type);
    if (department) query = query.eq("department", department);

    const {
      data: requests,
      count: total,
      error,
    } = await query
      .order("created_at", { ascending: false })
      .range(fromRange, toRange);

    if (error) {
      logger.error("Error fetching all asset requests", {
        error: error.message,
      });
      return res
        .status(500)
        .json({ message: "Failed to fetch asset requests" });
    }

    const mappedRequests = (requests || []).map(mapAssetRequest);

    res.json({
      requests: mappedRequests,
      pagination: {
        current_page: parsedPage,
        total_pages: Math.ceil((total || 0) / parsedLimit),
        total_requests: total || 0,
        has_next: parsedPage * parsedLimit < (total || 0),
        has_prev: parsedPage > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching all asset requests", { error: error.message });
    res.status(500).json({ message: "Failed to fetch asset requests" });
  }
};
