const getSupabase = require("../config/db");
const logger = require("../utils/logger");

/**
 * Helper to map Supabase database fields to match mongoose-like _id and object structures
 */
const mapApproval = (approval) => {
  if (!approval) return null;
  const mapped = { ...approval, _id: approval.id };
  if (mapped.requested_by) {
    mapped.requested_by = {
      ...mapped.requested_by,
      _id: mapped.requested_by.id,
      id: mapped.requested_by.id,
    };
  }
  if (mapped.approver) {
    mapped.approver = {
      ...mapped.approver,
      _id: mapped.approver.id,
      id: mapped.approver.id,
    };
  }
  if (mapped.asset_id) {
    mapped.asset_id = {
      ...mapped.asset_id,
      _id: mapped.asset_id.id,
      id: mapped.asset_id.id,
    };
  }
  return mapped;
};

/**
 * Get all approval requests with filters
 */
exports.getApprovals = async (
  filters = {},
  pagination = {},
  userRole,
  userId,
) => {
  const supabase = getSupabase();
  try {
    const { page = 1, limit = 10 } = pagination;
    const fromRange = (page - 1) * limit;
    const toRange = fromRange + limit - 1;

    // Start building query
    let query = supabase.from("approvals").select(
      `
        *,
        requested_by:users!requested_by(id, name, email, role, employee_id),
        approver:users!approver(id, name, email, role),
        asset_id:assets!asset_id(id, name, unique_asset_id, asset_type)
      `,
      { count: "exact" },
    );

    // Role-based access control
    if (userRole === "Vendor") {
      query = query.eq("requested_by", userId);
    } else if (userRole === "Manager" || userRole === "Department Head") {
      // Managers see approvals they need to approve or have approved, or requested
      query = query.or(`approver.eq.${userId},requested_by.eq.${userId}`);
    }
    // Admin, INVENTORY_MANAGER, and IT_MANAGER see all approvals

    // Status filter
    if (filters.status) {
      query = query.eq("status", filters.status);
    }

    // Type filter
    if (filters.type) {
      query = query.eq("request_type", filters.type);
    }

    // Date range filter
    if (filters.startDate) {
      query = query.gte(
        "created_at",
        new Date(filters.startDate).toISOString(),
      );
    }
    if (filters.endDate) {
      query = query.lte("created_at", new Date(filters.endDate).toISOString());
    }

    // Execute query with sorting and range pagination
    const {
      data: approvals,
      count: total,
      error,
    } = await query
      .order("created_at", { ascending: false })
      .range(fromRange, toRange);

    if (error) throw error;

    const mappedApprovals = (approvals || []).map(mapApproval);

    return {
      approvals: mappedApprovals,
      pagination: {
        total: total || 0,
        page,
        pages: Math.ceil((total || 0) / limit),
        limit,
      },
    };
  } catch (error) {
    logger.error("Error in getApprovals service:", error);
    throw error;
  }
};

/**
 * Get approval by ID
 */
exports.getApprovalById = async (approvalId, userRole, userId) => {
  const supabase = getSupabase();
  try {
    const { data: approval, error } = await supabase
      .from("approvals")
      .select(
        `
        *,
        requested_by:users!requested_by(id, name, email, role, department, employee_id),
        approver:users!approver(id, name, email, role),
        asset_id:assets!asset_id(id, name, unique_asset_id, asset_type, status)
      `,
      )
      .eq("id", approvalId)
      .maybeSingle();

    if (error) throw error;
    if (!approval) {
      return null;
    }

    const mapped = mapApproval(approval);

    // Check access rights
    const hasAccess =
      userRole === "ADMIN" ||
      userRole === "INVENTORY_MANAGER" ||
      userRole === "IT_MANAGER" ||
      (mapped.requested_by &&
        (mapped.requested_by.id.toString() === userId.toString() ||
          mapped.requested_by._id.toString() === userId.toString())) ||
      (mapped.approver &&
        (mapped.approver.id.toString() === userId.toString() ||
          mapped.approver._id.toString() === userId.toString()));

    if (!hasAccess) {
      throw new Error("Unauthorized access to approval request");
    }

    return mapped;
  } catch (error) {
    logger.error("Error in getApprovalById service:", error);
    throw error;
  }
};

/**
 * Create new approval request
 */
exports.createApproval = async (approvalData, userId) => {
  const supabase = getSupabase();
  try {
    const now = new Date().toISOString();

    // Map Mongoose-like fields to PostgreSQL approvals schema columns
    const newApproval = {
      request_type: approvalData.request_type || approvalData.requestType,
      asset_id: approvalData.asset_id || approvalData.assetId || null,
      requested_by: userId,
      approver: approvalData.approver || null,
      current_approver_id:
        approvalData.current_approver_id ||
        approvalData.currentApproverId ||
        null,
      status: "Pending",
      request_data:
        approvalData.request_data || approvalData.requestData || null,
      comments: approvalData.comments || null,
      approval_chain:
        approvalData.approval_chain || approvalData.approvalChain || null,
      final_decision:
        approvalData.final_decision || approvalData.finalDecision || null,
      final_decision_date:
        approvalData.final_decision_date ||
        approvalData.finalDecisionDate ||
        null,
      created_at: now,
      updated_at: now,
    };

    const { data: approval, error } = await supabase
      .from("approvals")
      .insert([newApproval])
      .select()
      .single();

    if (error) throw error;

    // Create notification for managers/admins who can approve
    const { data: approvers, error: approversError } = await supabase
      .from("users")
      .select("id")
      .in("role", ["ADMIN", "INVENTORY_MANAGER", "IT_MANAGER"])
      .eq("is_active", true);

    if (!approversError && approvers && approvers.length > 0) {
      const notifications = approvers.map((approver) => ({
        recipient: approver.id,
        type: "approval",
        title: "New Approval Request",
        message: `New ${newApproval.request_type} approval request requires your attention`,
        priority: "medium",
        data: {
          related_entity_type: "Approval",
          related_entity_id: approval.id,
        },
      }));

      await supabase.from("notifications").insert(notifications);
    }

    // Create audit log
    await supabase.from("audit_logs").insert([
      {
        user_id: userId,
        action: "CREATE",
        entity_type: "Approval",
        entity_id: approval.id,
        changes: {
          new: approval,
        },
        ip_address: "system",
        user_agent: "backend-service",
      },
    ]);

    logger.info("Approval request created", {
      approvalId: approval.id,
      type: approval.request_type,
      userId,
    });

    return mapApproval(approval);
  } catch (error) {
    logger.error("Error in createApproval service:", error);
    throw error;
  }
};

/**
 * Process approval decision (approve or reject)
 */
exports.processApproval = async (approvalId, decision, comments, userId) => {
  const supabase = getSupabase();
  try {
    const { data: approval, error: findError } = await supabase
      .from("approvals")
      .select("*")
      .eq("id", approvalId)
      .maybeSingle();

    if (findError) throw findError;
    if (!approval) {
      return null;
    }

    // Verify request is still pending
    if (approval.status !== "Pending") {
      throw new Error("This approval request has already been processed");
    }

    // Update approval status
    const decisionStatus = decision === "Approved" ? "Accepted" : "Rejected";
    const now = new Date().toISOString();

    const { data: updatedApproval, error: updateError } = await supabase
      .from("approvals")
      .update({
        status: decisionStatus,
        approver: userId,
        comments: comments || "",
        approved_at: now,
        updated_at: now,
      })
      .eq("id", approvalId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create notification for requester
    const notificationType = "approval";
    const notificationTitle =
      decision === "Approved" ? "Request Approved" : "Request Rejected";
    const notificationMessage = `Your ${approval.request_type} request has been ${decision.toLowerCase()}`;

    await supabase.from("notifications").insert([
      {
        recipient: approval.requested_by,
        type: notificationType,
        title: notificationTitle,
        message: notificationMessage,
        priority: "high",
        data: {
          related_entity_type: "Approval",
          related_entity_id: approvalId,
        },
      },
    ]);

    // Create audit log
    await supabase.from("audit_logs").insert([
      {
        user_id: userId,
        action: "UPDATE",
        entity_type: "Approval",
        entity_id: approvalId,
        changes: {
          status: decisionStatus,
          comments,
        },
        ip_address: "system",
        user_agent: "backend-service",
      },
    ]);

    logger.info("Approval processed", {
      approvalId: approvalId,
      decision,
      userId,
    });

    // Populate and return
    const { data: populatedApproval, error: popError } = await supabase
      .from("approvals")
      .select(
        `
        *,
        requested_by:users!requested_by(id, name, email, employee_id),
        approver:users!approver(id, name, email),
        asset_id:assets!asset_id(id, name, unique_asset_id, asset_type)
      `,
      )
      .eq("id", approvalId)
      .single();

    if (popError) throw popError;

    return mapApproval(populatedApproval);
  } catch (error) {
    logger.error("Error in processApproval service:", error);
    throw error;
  }
};

/**
 * Get pending approvals for a user (role-based)
 */
exports.getPendingApprovalsForUser = async (userId, userRole) => {
  const supabase = getSupabase();
  try {
    // If user is an approver (Admin, Inventory Manager, IT Manager), show all pending
    const isApprover = ["ADMIN", "INVENTORY_MANAGER", "IT_MANAGER"].includes(
      userRole,
    );

    let query = supabase
      .from("approvals")
      .select(
        `
        *,
        requested_by:users!requested_by(id, name, email, employee_id),
        asset_id:assets!asset_id(id, name, unique_asset_id, asset_type)
      `,
      )
      .eq("status", "Pending");

    // If not an approver, only show their own requests
    if (!isApprover) {
      query = query.eq("requested_by", userId);
    }

    const { data: pendingApprovals, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;

    return (pendingApprovals || []).map(mapApproval);
  } catch (error) {
    logger.error("Error in getPendingApprovalsForUser service:", error);
    throw error;
  }
};

/**
 * Get approval statistics
 */
exports.getApprovalStats = async (userId, userRole) => {
  const supabase = getSupabase();
  try {
    const { data: allApprovals, error } = await supabase
      .from("approvals")
      .select(
        "status, request_type, created_at, final_decision_date, approval_chain, requested_by, current_approver_id",
      );

    if (error) throw error;

    // Filter approvals in JS based on role
    const filteredApprovals = (allApprovals || []).filter((approval) => {
      if (userRole && userRole.toUpperCase() === "ADMIN") {
        return true;
      }

      const requestedByStr = approval.requested_by
        ? approval.requested_by.toString()
        : "";
      const currentApproverStr = approval.current_approver_id
        ? approval.current_approver_id.toString()
        : "";
      const userIdStr = userId ? userId.toString() : "";

      if (requestedByStr === userIdStr || currentApproverStr === userIdStr) {
        return true;
      }

      // Check approval_chain (JSONB)
      if (approval.approval_chain && Array.isArray(approval.approval_chain)) {
        return approval.approval_chain.some((chainItem) => {
          const approverIdStr =
            chainItem && chainItem.approver_id
              ? chainItem.approver_id.toString()
              : "";
          return approverIdStr === userIdStr;
        });
      }

      return false;
    });

    const statusMap = {};
    const typeMap = {};
    let totalProcessingTime = 0;
    let processedCount = 0;

    filteredApprovals.forEach((app) => {
      // byStatus
      if (app.status) {
        statusMap[app.status] = (statusMap[app.status] || 0) + 1;
      }

      // byType
      if (app.request_type) {
        typeMap[app.request_type] = (typeMap[app.request_type] || 0) + 1;
      }

      // avgProcessingTime
      if (app.final_decision_date && app.created_at) {
        const timeDiff =
          new Date(app.final_decision_date) - new Date(app.created_at);
        totalProcessingTime += timeDiff;
        processedCount += 1;
      }
    });

    const byStatus = Object.entries(statusMap).map(([_id, count]) => ({
      _id,
      count,
    }));
    const byType = Object.entries(typeMap).map(([_id, count]) => ({
      _id,
      count,
    }));

    // Convert avg time from ms to days
    const avgTimeDays =
      processedCount > 0
        ? (
            totalProcessingTime /
            (1000 * 60 * 60 * 24) /
            processedCount
          ).toFixed(2)
        : 0;

    return {
      byStatus,
      byType,
      avgProcessingTimeDays: avgTimeDays,
      total: filteredApprovals.length,
    };
  } catch (error) {
    logger.error("Error in getApprovalStats service:", error);
    throw error;
  }
};
