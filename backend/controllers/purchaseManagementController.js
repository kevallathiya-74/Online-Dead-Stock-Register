const getSupabase = require("../config/db");
const logger = require("../utils/logger");

// ========================================
// PURCHASE ORDERS
// ========================================

/**
 * Get all purchase orders with filtering and pagination
 */
exports.getAllPurchaseOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      vendor_id,
      department,
      priority,
      date_from,
      date_to,
      search,
    } = req.query;

    const supabase = getSupabase();
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const from = (pageInt - 1) * limitInt;
    const to = from + limitInt - 1;

    let query = supabase
      .from("purchase_orders")
      .select("*", { count: "exact" });

    if (status) query = query.eq("status", status);
    if (vendor_id) query = query.eq("vendor", vendor_id);
    if (department) query = query.eq("department", department);
    if (priority) query = query.eq("priority", priority);
    if (date_from)
      query = query.gte("created_at", new Date(date_from).toISOString());
    if (date_to)
      query = query.lte("created_at", new Date(date_to).toISOString());

    if (search) {
      query = query.or(`po_number.ilike.%${search}%,notes.ilike.%${search}%`);
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: purchaseOrders, error, count: total } = await query;
    if (error) throw error;

    // Enrich with vendor and user info via separate lookups
    const enriched = await enrichPurchaseOrders(supabase, purchaseOrders || []);

    return res.json({
      purchase_orders: enriched,
      pagination: {
        current_page: pageInt,
        total_pages: Math.ceil((total || 0) / limitInt),
        total_orders: total || 0,
        has_next: pageInt * limitInt < (total || 0),
        has_prev: pageInt > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching purchase orders:", error);
    return res.status(500).json({ message: "Failed to fetch purchase orders" });
  }
};

/**
 * Get purchase order by ID
 */
exports.getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const supabase = getSupabase();

    const { data: purchaseOrder, error } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const [enriched] = await enrichPurchaseOrders(supabase, [purchaseOrder]);
    return res.json(enriched);
  } catch (error) {
    logger.error("Error fetching purchase order:", error);
    return res.status(500).json({ message: "Failed to fetch purchase order" });
  }
};

/**
 * Create purchase order
 */
exports.createPurchaseOrder = async (req, res) => {
  try {
    const poData = { ...req.body };
    poData.requested_by = req.user.id;

    // Calculate totals
    let subtotal = 0;
    if (Array.isArray(poData.items)) {
      poData.items = poData.items.map((item) => {
        const total_price = item.quantity * item.unit_price;
        subtotal += total_price;
        return { ...item, total_price };
      });
    }

    poData.subtotal = subtotal;
    poData.total_amount =
      subtotal + (poData.tax_amount || 0) + (poData.shipping_cost || 0);

    // Initialise approval_history as JSONB array
    poData.approval_history = [
      {
        action: "submitted",
        performed_by: req.user.id,
        comments: "Purchase order created",
        timestamp: new Date().toISOString(),
      },
    ];

    const supabase = getSupabase();

    const { data: purchaseOrder, error: poError } = await supabase
      .from("purchase_orders")
      .insert(poData)
      .select()
      .single();

    if (poError) throw poError;

    // Create audit log
    await supabase.from("audit_logs").insert({
      action: "purchase_order_created",
      performed_by: req.user.id,
      details: {
        po_id: purchaseOrder.id,
        po_number: purchaseOrder.po_number,
        vendor_id: purchaseOrder.vendor,
        total_amount: purchaseOrder.total_amount,
      },
      timestamp: new Date().toISOString(),
    });

    // Notify approvers (ADMIN, INVENTORY_MANAGER)
    const { data: approvers } = await supabase
      .from("users")
      .select("id")
      .in("role", ["ADMIN", "INVENTORY_MANAGER"])
      .eq("is_active", true);

    if (approvers && approvers.length > 0) {
      const notifications = approvers.map((approver) => ({
        recipient: approver.id,
        title: "New Purchase Order Requires Approval",
        message: `Purchase Order ${purchaseOrder.po_number} for ${purchaseOrder.total_amount} requires your approval`,
        type: "approval",
        priority: poData.priority || "medium",
        data: {
          po_id: purchaseOrder.id,
          po_number: purchaseOrder.po_number,
          total_amount: purchaseOrder.total_amount,
        },
        action_url: `/inventory/purchase-orders/${purchaseOrder.id}`,
      }));
      await supabase.from("notifications").insert(notifications);
    }

    return res.status(201).json({
      message: "Purchase order created successfully",
      purchase_order: purchaseOrder,
    });
  } catch (error) {
    logger.error("Error creating purchase order:", error);
    return res.status(500).json({ message: "Failed to create purchase order" });
  }
};

/**
 * Update purchase order status
 */
exports.updatePurchaseOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    const supabase = getSupabase();

    // Fetch existing PO
    const { data: purchaseOrder, error: findError } = await supabase
      .from("purchase_orders")
      .select("*")
      .eq("id", id)
      .single();

    if (findError || !purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }

    const oldStatus = purchaseOrder.status;

    // Append to approval_history JSONB array
    const approvalHistory = Array.isArray(purchaseOrder.approval_history)
      ? purchaseOrder.approval_history
      : [];

    approvalHistory.push({
      action: status,
      performed_by: req.user.id,
      comments: comments || "",
      timestamp: new Date().toISOString(),
    });

    const updatePayload = {
      status,
      approval_history: approvalHistory,
    };

    if (status === "approved") {
      updatePayload.approved_by = req.user.id;
    }

    const { data: updated, error: updateError } = await supabase
      .from("purchase_orders")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Audit log
    await supabase.from("audit_logs").insert({
      action: "purchase_order_status_updated",
      performed_by: req.user.id,
      details: {
        po_id: id,
        po_number: purchaseOrder.po_number,
        old_status: oldStatus,
        new_status: status,
        comments,
      },
      timestamp: new Date().toISOString(),
    });

    // Notify requester
    await supabase.from("notifications").insert({
      recipient: purchaseOrder.requested_by,
      title: `Purchase Order ${status.replace(/_/g, " ").toUpperCase()}`,
      message: `Your purchase order ${purchaseOrder.po_number} has been ${status.replace(/_/g, " ")}`,
      type:
        status === "approved"
          ? "success"
          : status === "rejected"
            ? "error"
            : "info",
      priority: "medium",
      data: {
        po_id: id,
        po_number: purchaseOrder.po_number,
        status,
      },
      action_url: `/inventory/purchase-orders/${id}`,
    });

    return res.json({
      message: "Purchase order status updated successfully",
      purchase_order: {
        id: updated.id,
        po_number: updated.po_number,
        status: updated.status,
      },
    });
  } catch (error) {
    logger.error("Error updating purchase order status:", error);
    return res
      .status(500)
      .json({ message: "Failed to update purchase order status" });
  }
};

// ========================================
// PURCHASE REQUESTS
// ========================================

/**
 * Get all purchase requests
 */
exports.getAllPurchaseRequests = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      department,
      priority,
      requester_id,
      search,
    } = req.query;

    const supabase = getSupabase();
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const from = (pageInt - 1) * limitInt;
    const to = from + limitInt - 1;

    let query = supabase
      .from("purchase_requests")
      .select("*", { count: "exact" });

    if (status) query = query.eq("status", status);
    if (department) query = query.eq("department", department);
    if (priority) query = query.eq("priority", priority);
    if (requester_id) query = query.eq("requester", requester_id);

    if (search) {
      query = query.or(
        `request_number.ilike.%${search}%,purpose.ilike.%${search}%`,
      );
    }

    query = query.order("created_at", { ascending: false }).range(from, to);

    const { data: purchaseRequests, error, count: total } = await query;
    if (error) throw error;

    return res.json({
      purchase_requests: purchaseRequests || [],
      pagination: {
        current_page: pageInt,
        total_pages: Math.ceil((total || 0) / limitInt),
        total_requests: total || 0,
        has_next: pageInt * limitInt < (total || 0),
        has_prev: pageInt > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching purchase requests:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch purchase requests" });
  }
};

/**
 * Create purchase request
 */
exports.createPurchaseRequest = async (req, res) => {
  try {
    const requestData = { ...req.body };
    requestData.requester = req.user.id;

    // Calculate total estimated cost
    let totalCost = 0;
    if (Array.isArray(requestData.items)) {
      requestData.items = requestData.items.map((item) => {
        const estimated_total = item.quantity * item.estimated_unit_price;
        totalCost += estimated_total;
        return { ...item, estimated_total };
      });
    }
    requestData.total_estimated_cost = totalCost;

    const supabase = getSupabase();

    const { data: purchaseRequest, error: prError } = await supabase
      .from("purchase_requests")
      .insert(requestData)
      .select()
      .single();

    if (prError) throw prError;

    // Audit log
    await supabase.from("audit_logs").insert({
      action: "purchase_request_created",
      performed_by: req.user.id,
      details: {
        request_id: purchaseRequest.id,
        request_number: purchaseRequest.request_number,
        total_cost: purchaseRequest.total_estimated_cost,
      },
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      message: "Purchase request created successfully",
      purchase_request: purchaseRequest,
    });
  } catch (error) {
    logger.error("Error creating purchase request:", error);
    return res
      .status(500)
      .json({ message: "Failed to create purchase request" });
  }
};

// ========================================
// STATISTICS
// ========================================

/**
 * Get purchase statistics
 */
exports.getPurchaseStats = async (req, res) => {
  try {
    const supabase = getSupabase();

    // Fetch all POs and PRs for aggregation
    const [posResult, prsResult] = await Promise.all([
      supabase
        .from("purchase_orders")
        .select("status, total_amount, created_at, vendor"),
      supabase.from("purchase_requests").select("status, total_estimated_cost"),
    ]);

    if (posResult.error) throw posResult.error;
    if (prsResult.error) throw prsResult.error;

    const allPOs = posResult.data || [];
    const allPRs = prsResult.data || [];

    // PO stats – group by status
    const poStatusMap = {};
    allPOs.forEach((po) => {
      const s = po.status || "unknown";
      if (!poStatusMap[s]) poStatusMap[s] = { id: s, count: 0, total_value: 0 };
      poStatusMap[s].count++;
      poStatusMap[s].total_value += parseFloat(po.total_amount) || 0;
    });
    const poStats = Object.values(poStatusMap);

    // PR stats – group by status
    const prStatusMap = {};
    allPRs.forEach((pr) => {
      const s = pr.status || "unknown";
      if (!prStatusMap[s]) prStatusMap[s] = { id: s, count: 0, total_value: 0 };
      prStatusMap[s].count++;
      prStatusMap[s].total_value += parseFloat(pr.total_estimated_cost) || 0;
    });
    const prStats = Object.values(prStatusMap);

    // Monthly spending (last 12 months) – completed / partially_received POs
    const twelveMonthsAgo = new Date(
      Date.now() - 12 * 30 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const eligiblePOs = allPOs.filter(
      (po) =>
        (po.status === "completed" || po.status === "partially_received") &&
        po.created_at >= twelveMonthsAgo,
    );

    const monthlyMap = {};
    eligiblePOs.forEach((po) => {
      const d = new Date(po.created_at);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          year: d.getFullYear(),
          month: d.getMonth() + 1,
          total_spent: 0,
          order_count: 0,
        };
      }
      monthlyMap[key].total_spent += parseFloat(po.total_amount) || 0;
      monthlyMap[key].order_count++;
    });
    const monthlySpending = Object.values(monthlyMap).sort((a, b) =>
      a.year !== b.year ? a.year - b.year : a.month - b.month,
    );

    // Top 5 vendors by spending
    const vendorMap = {};
    eligiblePOs.forEach((po) => {
      const vid = po.vendor;
      if (!vid) return;
      if (!vendorMap[vid])
        vendorMap[vid] = { id: vid, total_spent: 0, order_count: 0 };
      vendorMap[vid].total_spent += parseFloat(po.total_amount) || 0;
      vendorMap[vid].order_count++;
    });

    const topVendorEntries = Object.values(vendorMap)
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 5);

    // Enrich vendor entries with names
    const vendorIds = topVendorEntries.map((v) => v.id);
    let vendorNameMap = {};
    if (vendorIds.length > 0) {
      const { data: vendors } = await supabase
        .from("vendors")
        .select("id, company_name, vendor_code")
        .in("id", vendorIds);
      (vendors || []).forEach((v) => {
        vendorNameMap[v.id] = v;
      });
    }

    const topVendors = topVendorEntries.map((v) => ({
      ...v,
      vendor_info: vendorNameMap[v.id] || null,
    }));

    return res.json({
      purchase_orders: {
        status_breakdown: poStats,
        total_orders: poStats.reduce((sum, s) => sum + s.count, 0),
        total_value: poStats.reduce((sum, s) => sum + s.total_value, 0),
      },
      purchase_requests: {
        status_breakdown: prStats,
        total_requests: prStats.reduce((sum, s) => sum + s.count, 0),
        total_estimated_value: prStats.reduce(
          (sum, s) => sum + s.total_value,
          0,
        ),
      },
      monthly_spending: monthlySpending,
      top_vendors: topVendors,
    });
  } catch (error) {
    logger.error("Error fetching purchase stats:", error);
    return res
      .status(500)
      .json({ message: "Failed to fetch purchase statistics" });
  }
};

// ========================================
// INTERNAL HELPER
// ========================================

/**
 * Batch-fetch vendor and user data to enrich an array of purchase orders.
 * Avoids N+1 by collecting all referenced IDs and doing two extra queries.
 */
async function enrichPurchaseOrders(supabase, orders) {
  if (!orders || orders.length === 0) return orders;

  const vendorIds = [...new Set(orders.map((o) => o.vendor).filter(Boolean))];
  const userIds = [
    ...new Set(
      [
        ...orders.map((o) => o.requested_by),
        ...orders.map((o) => o.approved_by),
      ].filter(Boolean),
    ),
  ];

  const [vendorsResult, usersResult] = await Promise.all([
    vendorIds.length > 0
      ? supabase
          .from("vendors")
          .select(
            "id, company_name, vendor_code, contact_person, contact_email, phone",
          )
          .in("id", vendorIds)
      : Promise.resolve({ data: [] }),
    userIds.length > 0
      ? supabase
          .from("users")
          .select("id, name, email, employee_id")
          .in("id", userIds)
      : Promise.resolve({ data: [] }),
  ]);

  const vendorMap = {};
  (vendorsResult.data || []).forEach((v) => {
    vendorMap[v.id] = v;
  });

  const userMap = {};
  (usersResult.data || []).forEach((u) => {
    userMap[u.id] = u;
  });

  return orders.map((o) => ({
    ...o,
    vendor: vendorMap[o.vendor] || o.vendor,
    requested_by: userMap[o.requested_by] || o.requested_by,
    approved_by: userMap[o.approved_by] || o.approved_by,
  }));
}
