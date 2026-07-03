const getSupabase = require("../config/db");
const logger = require("../utils/logger");

// Get all asset transfers with filtering
exports.getAllAssetTransfers = async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      page = 1,
      limit = 10,
      status,
      from_user,
      to_user,
      asset_id,
      transfer_reason,
      priority,
      date_from,
      date_to,
      overdue_only,
      search,
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build base query with joins
    let query = supabase
      .from("asset_transfers")
      .select(
        `
        *,
        asset:assets!asset(unique_asset_id, name, asset_type),
        from_user_info:users!from_user(name, email, employee_id),
        to_user_info:users!to_user(name, email, employee_id),
        initiator:users!initiated_by(name, email),
        approver:users!approved_by(name, email)
      `,
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(skip, skip + limitNum - 1);

    // Apply filters
    if (status) query = query.eq("status", status);
    if (from_user) query = query.eq("from_user", from_user);
    if (to_user) query = query.eq("to_user", to_user);
    if (asset_id) query = query.eq("asset", asset_id);
    if (transfer_reason) query = query.eq("transfer_reason", transfer_reason);
    if (priority) query = query.eq("priority", priority);

    // Date range filter
    if (date_from)
      query = query.gte(
        "expected_transfer_date",
        new Date(date_from).toISOString(),
      );
    if (date_to)
      query = query.lte(
        "expected_transfer_date",
        new Date(date_to).toISOString(),
      );

    // Overdue filter
    if (overdue_only === "true") {
      query = query
        .lt("expected_transfer_date", new Date().toISOString())
        .in("status", ["pending", "approved", "in_transit"]);
    }

    // Search filter (transfer_id, description, from_location, to_location)
    if (search) {
      query = query.or(
        `transfer_id.ilike.%${search}%,description.ilike.%${search}%,from_location.ilike.%${search}%,to_location.ilike.%${search}%`,
      );
    }

    const { data: transfers, error, count: total } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      transfers,
      pagination: {
        current_page: pageNum,
        total_pages: Math.ceil((total || 0) / limitNum),
        total_transfers: total || 0,
        has_next: pageNum * limitNum < (total || 0),
        has_prev: pageNum > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching asset transfers:", error);
    return res.status(500).json({ message: "Failed to fetch asset transfers" });
  }
};

// Get asset transfer by ID
exports.getAssetTransferById = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: transfer, error } = await supabase
      .from("asset_transfers")
      .select(
        `
        *,
        asset:assets!asset(unique_asset_id, name, asset_type, location, status),
        from_user_info:users!from_user(name, email, employee_id, department),
        to_user_info:users!to_user(name, email, employee_id, department),
        initiator:users!initiated_by(name, email, employee_id),
        approver:users!approved_by(name, email),
        transferrer:users!transferred_by(name, email)
      `,
      )
      .eq("id", id)
      .single();

    if (error || !transfer) {
      return res.status(404).json({ message: "Asset transfer not found" });
    }

    return res.json({
      success: true,
      data: transfer,
    });
  } catch (error) {
    logger.error("Error fetching asset transfer:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch asset transfer" });
  }
};

// Create new asset transfer
exports.createAssetTransfer = async (req, res) => {
  try {
    const supabase = getSupabase();
    const transferData = { ...req.body };
    transferData.initiated_by = req.user.id;
    transferData.created_by = req.user.id;

    // Validate asset exists and is available
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, unique_asset_id, name, status, assigned_user")
      .eq("id", transferData.asset)
      .single();

    if (assetError || !asset) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    if (asset.status !== "assigned") {
      return res.status(400).json({
        success: false,
        message: "Asset must be in assigned status to initiate transfer",
      });
    }

    // Validate users exist
    const [{ data: fromUser, error: fromErr }, { data: toUser, error: toErr }] =
      await Promise.all([
        supabase
          .from("users")
          .select("id, name, email")
          .eq("id", transferData.from_user)
          .single(),
        supabase
          .from("users")
          .select("id, name, email")
          .eq("id", transferData.to_user)
          .single(),
      ]);

    if (fromErr || !fromUser || toErr || !toUser) {
      return res.status(404).json({ message: "One or more users not found" });
    }

    // Validate that asset is currently assigned to from_user
    if (asset.assigned_user !== transferData.from_user) {
      return res.status(400).json({
        message: "Asset is not currently assigned to the specified from_user",
      });
    }

    // Build initial approval history entry
    const initialHistory = [
      {
        action: "submitted",
        performed_by: req.user.id,
        comments: "Asset transfer request submitted",
        timestamp: new Date().toISOString(),
      },
    ];

    // Create transfer
    const { data: transfer, error: insertError } = await supabase
      .from("asset_transfers")
      .insert({
        ...transferData,
        status: transferData.status || "pending",
        approval_history: initialHistory,
      })
      .select(
        `
        *,
        asset:assets!asset(unique_asset_id, name, asset_type),
        from_user_info:users!from_user(name, email, employee_id),
        to_user_info:users!to_user(name, email, employee_id),
        initiator:users!initiated_by(name, email)
      `,
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      action: "asset_transfer_requested",
      performed_by: req.user.id,
      details: {
        transfer_id: transfer.transfer_id,
        asset_id: asset.unique_asset_id,
        from_user: fromUser.name,
        to_user: toUser.name,
        reason: transfer.transfer_reason,
      },
      timestamp: new Date().toISOString(),
    });

    // Notify approvers (Admin and Inventory Managers)
    const { data: approvers } = await supabase
      .from("users")
      .select("id")
      .in("role", ["ADMIN", "INVENTORY_MANAGER"])
      .eq("is_active", true);

    if (approvers && approvers.length > 0) {
      const notifications = approvers.map((approver) => ({
        recipient: approver.id,
        title: "Asset Transfer Approval Required",
        message: `Asset transfer request ${transfer.transfer_id} requires your approval`,
        type: "approval",
        priority: transfer.priority || "medium",
        data: {
          transfer_id: transfer.id,
          transfer_number: transfer.transfer_id,
          asset_name: asset.name,
          from_user: fromUser.name,
          to_user: toUser.name,
        },
        action_url: `/assets/transfers/${transfer.id}`,
      }));

      await supabase.from("notifications").insert(notifications);
    }

    return res.status(201).json({
      message: "Asset transfer request created successfully",
      transfer,
    });
  } catch (error) {
    logger.error("Error creating asset transfer:", error);
    return res.status(500).json({ message: "Failed to create asset transfer" });
  }
};

// Update asset transfer status
exports.updateAssetTransferStatus = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { status, comments, rejection_reason } = req.body;

    // Fetch current transfer with joins
    const { data: transfer, error: fetchError } = await supabase
      .from("asset_transfers")
      .select(
        `
        *,
        asset:assets!asset(id, unique_asset_id, assigned_user, location),
        from_user_info:users!from_user(id, name),
        to_user_info:users!to_user(id, name)
      `,
      )
      .eq("id", id)
      .single();

    if (fetchError || !transfer) {
      return res.status(404).json({ message: "Asset transfer not found" });
    }

    // Validate status transition
    const validTransitions = {
      pending: ["approved", "rejected", "cancelled"],
      approved: ["in_transit", "cancelled"],
      in_transit: ["completed", "cancelled"],
      rejected: [],
      completed: [],
      cancelled: [],
    };

    if (
      !validTransitions[transfer.status] ||
      !validTransitions[transfer.status].includes(status)
    ) {
      return res.status(400).json({
        message: `Cannot change status from ${transfer.status} to ${status}`,
      });
    }

    const oldStatus = transfer.status;
    const updatePayload = {
      status,
      last_updated_by: req.user.id,
    };

    // Handle specific status changes
    if (status === "approved") {
      updatePayload.approved_by = req.user.id;
      updatePayload.approved_at = new Date().toISOString();
    } else if (status === "rejected") {
      updatePayload.rejection_reason = rejection_reason;
    } else if (status === "in_transit") {
      updatePayload.transferred_by = req.user.id;
      updatePayload.actual_transfer_date = new Date().toISOString();
    } else if (status === "completed") {
      updatePayload.completion_date = new Date().toISOString();

      // Update asset assignment to the new user
      await supabase
        .from("assets")
        .update({
          assigned_user: transfer.to_user,
          location: transfer.to_location,
          last_audited_by: req.user.id,
        })
        .eq("id", transfer.asset.id);
    }

    // Append to approval_history JSONB array
    const newHistoryEntry = {
      action: status,
      performed_by: req.user.id,
      comments: comments || "",
      timestamp: new Date().toISOString(),
    };
    const updatedHistory = [
      ...(transfer.approval_history || []),
      newHistoryEntry,
    ];
    updatePayload.approval_history = updatedHistory;

    const { data: updatedTransfer, error: updateError } = await supabase
      .from("asset_transfers")
      .update(updatePayload)
      .eq("id", id)
      .select("id, transfer_id, status")
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      action: "asset_transfer_status_updated",
      performed_by: req.user.id,
      details: {
        transfer_id: transfer.transfer_id,
        asset_id: transfer.asset ? transfer.asset.unique_asset_id : null,
        old_status: oldStatus,
        new_status: status,
        comments,
      },
      timestamp: new Date().toISOString(),
    });

    // Send notifications
    const recipientIds = new Set([transfer.initiated_by]);
    if (
      transfer.from_user_info &&
      transfer.from_user !== transfer.initiated_by
    ) {
      recipientIds.add(transfer.from_user);
    }
    if (transfer.to_user_info && transfer.to_user !== transfer.initiated_by) {
      recipientIds.add(transfer.to_user);
    }

    const statusMessages = {
      approved: "has been approved and will proceed",
      rejected: "has been rejected",
      in_transit: "is now in transit",
      completed: "has been completed successfully",
      cancelled: "has been cancelled",
    };

    const notifications = Array.from(recipientIds).map((recipientId) => ({
      recipient: recipientId,
      title: `Asset Transfer ${status.replace("_", " ").toUpperCase()}`,
      message: `Asset transfer ${transfer.transfer_id} ${statusMessages[status]}`,
      type:
        status === "approved" || status === "completed"
          ? "success"
          : status === "rejected"
            ? "error"
            : "info",
      priority: "medium",
      data: {
        transfer_id: transfer.id,
        transfer_number: transfer.transfer_id,
        status,
      },
      action_url: `/assets/transfers/${transfer.id}`,
    }));

    await supabase.from("notifications").insert(notifications);

    return res.json({
      message: "Asset transfer status updated successfully",
      transfer: {
        id: updatedTransfer.id,
        transfer_id: updatedTransfer.transfer_id,
        status: updatedTransfer.status,
      },
    });
  } catch (error) {
    logger.error("Error updating asset transfer status:", error);
    return res
      .status(500)
      .json({ message: "Failed to update asset transfer status" });
  }
};

// Get asset transfer statistics
exports.getAssetTransferStats = async (req, res) => {
  try {
    const supabase = getSupabase();

    // Status breakdown — use a PostgreSQL RPC / raw SQL via supabase.rpc or manual grouping
    const { data: allTransfers, error: allErr } = await supabase
      .from("asset_transfers")
      .select("status, transfer_reason, created_at, completion_date");

    if (allErr) {
      throw allErr;
    }

    // Status breakdown
    const statusMap = {};
    for (const t of allTransfers) {
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    }
    const statusStats = Object.entries(statusMap).map(([id, count]) => ({
      id,
      count,
    }));

    // Transfer reason breakdown
    const reasonMap = {};
    for (const t of allTransfers) {
      reasonMap[t.transfer_reason] = (reasonMap[t.transfer_reason] || 0) + 1;
    }
    const reasonStats = Object.entries(reasonMap).map(([id, count]) => ({
      id,
      count,
    }));

    // Monthly trends — last 12 months
    const twelveMonthsAgo = new Date(
      Date.now() - 12 * 30 * 24 * 60 * 60 * 1000,
    );
    const recentTransfers = allTransfers.filter(
      (t) => t.created_at && new Date(t.created_at) >= twelveMonthsAgo,
    );
    const monthlyMap = {};
    for (const t of recentTransfers) {
      const d = new Date(t.created_at);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          count: 0,
          completed: 0,
        };
      }
      monthlyMap[key].count += 1;
      if (t.status === "completed") monthlyMap[key].completed += 1;
    }
    const monthlyTrends = Object.values(monthlyMap).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month,
    );

    // Overdue transfers count
    const { count: overdueCount, error: overdueErr } = await supabase
      .from("asset_transfers")
      .select("*", { count: "exact", head: true })
      .in("status", ["pending", "approved", "in_transit"])
      .lt("expected_transfer_date", new Date().toISOString());

    if (overdueErr) {
      throw overdueErr;
    }

    // Average completion time for completed transfers
    const completed = allTransfers.filter(
      (t) => t.status === "completed" && t.completion_date && t.created_at,
    );
    let avgCompletionDays = 0;
    let minCompletionDays = 0;
    let maxCompletionDays = 0;

    if (completed.length > 0) {
      const days = completed.map(
        (t) =>
          (new Date(t.completion_date) - new Date(t.created_at)) /
          (1000 * 60 * 60 * 24),
      );
      avgCompletionDays = days.reduce((a, b) => a + b, 0) / days.length;
      minCompletionDays = Math.min(...days);
      maxCompletionDays = Math.max(...days);
    }

    return res.json({
      total_transfers: allTransfers.length,
      status_breakdown: statusStats,
      reason_breakdown: reasonStats,
      monthly_trends: monthlyTrends,
      overdue_count: overdueCount || 0,
      completion_stats: {
        avg_completion_days: avgCompletionDays,
        min_completion_days: minCompletionDays,
        max_completion_days: maxCompletionDays,
      },
    });
  } catch (error) {
    logger.error("Error fetching asset transfer statistics:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch asset transfer statistics" });
  }
};
