const getSupabase = require("../config/db");
const logger = require("../utils/logger");

// Get vendor dashboard statistics (REAL DATA)
const getVendorStats = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to a vendor account",
      });
    }

    const supabase = getSupabase();

    // Get all purchase orders for this vendor to calculate stats in one go
    const { data: pos, error: poError } = await supabase
      .from("purchase_orders")
      .select(
        "status, total_amount, expected_delivery_date, actual_delivery_date, payment_status",
      )
      .eq("vendor", vendorId);

    if (poError) throw poError;

    // Total orders count
    const totalOrders = pos.length;

    // Pending orders (waiting for approval or in progress)
    const pendingOrders = pos.filter((po) =>
      [
        "pending_approval",
        "approved",
        "sent_to_vendor",
        "acknowledged",
        "in_progress",
      ].includes(po.status),
    ).length;

    // Completed orders
    const completedOrders = pos.filter(
      (po) => po.status === "completed",
    ).length;

    // Total revenue from completed orders
    const totalRevenue = pos
      .filter((po) => po.status === "completed")
      .reduce((sum, po) => sum + Number(po.total_amount || 0), 0);

    // Calculate on-time delivery rate
    const deliveredOrders = pos.filter(
      (po) => po.status === "completed" && po.actual_delivery_date,
    );

    const onTimeDeliveries = deliveredOrders.filter((order) => {
      return (
        new Date(order.actual_delivery_date) <=
        new Date(order.expected_delivery_date)
      );
    }).length;

    const onTimeDeliveryRate =
      deliveredOrders.length > 0
        ? Math.round((onTimeDeliveries / deliveredOrders.length) * 100)
        : 100;

    // Get active products count
    const { count: activeProducts, error: assetError } = await supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("vendor", vendorId)
      .neq("status", "Disposed");

    if (assetError) throw assetError;

    // Get pending invoices count (orders that are completed but not fully paid)
    const pendingInvoices = pos.filter(
      (po) => po.status === "completed" && po.payment_status !== "paid",
    ).length;

    res.json({
      success: true,
      stats: {
        totalOrders,
        pendingOrders,
        completedOrders,
        totalRevenue: totalRevenue,
        activeProducts,
        pendingInvoices,
        onTimeDeliveryRate,
        performanceScore: onTimeDeliveryRate, // Based on delivery performance
      },
    });
  } catch (error) {
    logger.error("Error fetching vendor stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor statistics",
      error: error.message,
    });
  }
};

// Get recent orders (REAL DATA)
const getRecentOrders = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to a vendor account",
      });
    }

    const supabase = getSupabase();

    const { data: recentOrders, error: poError } = await supabase
      .from("purchase_orders")
      .select(
        `
        id,
        po_number,
        status,
        total_amount,
        expected_delivery_date,
        items,
        created_at,
        priority,
        requested_by:requested_by(name, email),
        approved_by:approved_by(name, email)
      `,
      )
      .eq("vendor", vendorId)
      .order("created_at", { ascending: false })
      .limit(5);

    if (poError) throw poError;

    const formattedOrders = recentOrders.map((order) => ({
      _id: order.id,
      po_number: order.po_number,
      status: order.status,
      total_amount: order.total_amount,
      expected_delivery_date: order.expected_delivery_date,
      order_date: order.created_at,
      items_count: Array.isArray(order.items) ? order.items.length : 0,
      priority: order.priority,
      requested_by: order.requested_by ? order.requested_by.name : "N/A",
    }));

    res.json({
      success: true,
      orders: formattedOrders,
    });
  } catch (error) {
    logger.error("Error fetching recent orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch recent orders",
      error: error.message,
    });
  }
};

// Get all orders with pagination (REAL DATA)
const getAllOrders = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to a vendor account",
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const supabase = getSupabase();

    // Filters
    let query = supabase
      .from("purchase_orders")
      .select(
        `
        id,
        po_number,
        status,
        priority,
        total_amount,
        expected_delivery_date,
        actual_delivery_date,
        created_at,
        items,
        requested_by:requested_by(name, email, department),
        approved_by:approved_by(name, email),
        payment_terms,
        payment_method
      `,
        { count: "exact" },
      )
      .eq("vendor", vendorId);

    if (req.query.status) {
      query = query.eq("status", req.query.status);
    }

    if (req.query.search) {
      query = query.ilike("po_number", `%${req.query.search}%`);
    }

    if (req.query.priority) {
      query = query.eq("priority", req.query.priority);
    }

    // Date range filter
    if (req.query.startDate) {
      query = query.gte(
        "created_at",
        new Date(req.query.startDate).toISOString(),
      );
    }
    if (req.query.endDate) {
      query = query.lte(
        "created_at",
        new Date(req.query.endDate).toISOString(),
      );
    }

    const {
      data: orders,
      count: totalOrders,
      error: orderError,
    } = await query
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (orderError) throw orderError;

    const formattedOrders = orders.map((order) => ({
      _id: order.id,
      po_number: order.po_number,
      status: order.status,
      priority: order.priority,
      total_amount: order.total_amount,
      expected_delivery_date: order.expected_delivery_date,
      actual_delivery_date: order.actual_delivery_date,
      order_date: order.created_at,
      items_count: Array.isArray(order.items) ? order.items.length : 0,
      requested_by: order.requested_by
        ? {
            name: order.requested_by.name,
            email: order.requested_by.email,
            department: order.requested_by.department,
          }
        : null,
      approved_by: order.approved_by
        ? {
            name: order.approved_by.name,
            email: order.approved_by.email,
          }
        : null,
      payment_terms: order.payment_terms,
      payment_method: order.payment_method,
    }));

    res.json({
      success: true,
      orders: formattedOrders,
      pagination: {
        currentPage: page,
        page: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        total: totalOrders,
        limit,
      },
    });
  } catch (error) {
    logger.error("Error fetching all orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

// Get single order details (REAL DATA)
const getOrderById = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;
    const orderId = req.params.id;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to a vendor account",
      });
    }

    const supabase = getSupabase();

    const { data: order, error: orderError } = await supabase
      .from("purchase_orders")
      .select(
        `
        *,
        requested_by:requested_by(id, name, email, department, employee_id),
        approved_by:approved_by(id, name, email),
        vendor:vendor(id, company_name, contact_person, email, phone)
      `,
      )
      .eq("id", orderId)
      .eq("vendor", vendorId)
      .single();

    if (orderError) {
      if (orderError.code === "PGRST116") {
        return res.status(404).json({
          success: false,
          message: "Order not found or access denied",
        });
      }
      throw orderError;
    }

    // Populate user details inside jsonb arrays (attachments, approval_history, received_items)
    const userIds = new Set();
    if (Array.isArray(order.attachments)) {
      order.attachments.forEach((att) => {
        if (att && att.uploaded_by) {
          userIds.add(
            typeof att.uploaded_by === "string"
              ? att.uploaded_by
              : att.uploaded_by.id || att.uploaded_by._id,
          );
        }
      });
    }
    if (Array.isArray(order.approval_history)) {
      order.approval_history.forEach((hist) => {
        if (hist && hist.performed_by) {
          userIds.add(
            typeof hist.performed_by === "string"
              ? hist.performed_by
              : hist.performed_by.id || hist.performed_by._id,
          );
        }
      });
    }
    if (Array.isArray(order.received_items)) {
      order.received_items.forEach((item) => {
        if (item && item.received_by) {
          userIds.add(
            typeof item.received_by === "string"
              ? item.received_by
              : item.received_by.id || item.received_by._id,
          );
        }
      });
    }

    if (userIds.size > 0) {
      const { data: usersList } = await supabase
        .from("users")
        .select("id, name, email")
        .in("id", Array.from(userIds));

      if (usersList) {
        const userMap = new Map(usersList.map((u) => [u.id, u]));

        if (Array.isArray(order.attachments)) {
          order.attachments = order.attachments.map((att) => {
            const uId =
              att &&
              att.uploaded_by &&
              (typeof att.uploaded_by === "string"
                ? att.uploaded_by
                : att.uploaded_by.id || att.uploaded_by._id);
            if (uId && userMap.has(uId)) {
              return { ...att, uploaded_by: userMap.get(uId) };
            }
            return att;
          });
        }
        if (Array.isArray(order.approval_history)) {
          order.approval_history = order.approval_history.map((hist) => {
            const uId =
              hist &&
              hist.performed_by &&
              (typeof hist.performed_by === "string"
                ? hist.performed_by
                : hist.performed_by.id || hist.performed_by._id);
            if (uId && userMap.has(uId)) {
              return { ...hist, performed_by: userMap.get(uId) };
            }
            return hist;
          });
        }
        if (Array.isArray(order.received_items)) {
          order.received_items = order.received_items.map((item) => {
            const uId =
              item &&
              item.received_by &&
              (typeof item.received_by === "string"
                ? item.received_by
                : item.received_by.id || item.received_by._id);
            if (uId && userMap.has(uId)) {
              return { ...item, received_by: userMap.get(uId) };
            }
            return item;
          });
        }
      }
    }

    // Keep the _id mapping for compatibility if needed
    order._id = order.id;

    res.json({
      success: true,
      order,
    });
  } catch (error) {
    logger.error("Error fetching order details:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
};

// Get vendor products (assets supplied by vendor) (REAL DATA)
const getProducts = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to a vendor account",
      });
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const supabase = getSupabase();

    // Filters
    let query = supabase
      .from("assets")
      .select(
        `
        id,
        unique_asset_id,
        name,
        manufacturer,
        model,
        serial_number,
        notes,
        asset_type,
        status,
        condition,
        purchase_cost,
        current_value,
        purchase_date,
        warranty_expiry,
        assigned_user:assigned_user(name, email, department),
        location,
        quantity
      `,
        { count: "exact" },
      )
      .eq("vendor", vendorId);

    if (req.query.search) {
      query = query.or(
        `unique_asset_id.ilike.%${req.query.search}%,name.ilike.%${req.query.search}%,notes.ilike.%${req.query.search}%`,
      );
    }

    if (req.query.category) {
      query = query.eq("asset_type", req.query.category);
    }

    if (req.query.status) {
      query = query.eq("status", req.query.status);
    }

    const {
      data: products,
      count: totalProducts,
      error: assetError,
    } = await query
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (assetError) throw assetError;

    const formattedProducts = products.map((product) => ({
      _id: product.id,
      asset_id: product.unique_asset_id,
      name: product.name || `${product.manufacturer} ${product.model}`,
      description:
        product.notes ||
        `${product.manufacturer} ${product.model} - ${product.serial_number}`,
      category: product.asset_type,
      status: product.status?.toLowerCase().replace(/\s+/g, "_") || "active",
      condition: product.condition || "good",
      purchase_cost: product.purchase_cost || 0,
      current_value: product.current_value || product.purchase_cost || 0,
      purchase_date: product.purchase_date,
      warranty_expiry: product.warranty_expiry,
      assigned_to: product.assigned_user
        ? {
            name: product.assigned_user.name,
            email: product.assigned_user.email,
            department: product.assigned_user.department,
          }
        : null,
      location: product.location,
      quantity: product.quantity || 1,
      serial_number: product.serial_number,
      model_number: product.model,
    }));

    res.json({
      success: true,
      products: formattedProducts,
      pagination: {
        currentPage: page,
        page: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
        total: totalProducts,
        limit,
      },
    });
  } catch (error) {
    logger.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

// Get vendor invoices (from completed purchase orders) (REAL DATA)
const getInvoices = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to a vendor account",
      });
    }

    const supabase = getSupabase();

    // Get completed purchase orders as invoices
    let query = supabase
      .from("purchase_orders")
      .select(
        `
        id,
        po_number,
        total_amount,
        payment_terms,
        payment_method,
        payment_status,
        created_at,
        expected_delivery_date,
        actual_delivery_date,
        items,
        currency,
        requested_by:requested_by(name, email, department),
        approved_by:approved_by(name, email)
      `,
      )
      .eq("vendor", vendorId)
      .in("status", ["completed", "partially_received"]);

    if (req.query.status === "paid") {
      query = query.eq("payment_status", "paid");
    } else if (req.query.status === "pending") {
      query = query.in("payment_status", ["pending", "partial"]);
    }

    const { data: invoices, error: invoiceError } = await query.order(
      "created_at",
      {
        ascending: false,
      },
    );

    if (invoiceError) throw invoiceError;

    // Calculate invoice status based on payment and delivery
    const formattedInvoices = invoices.map((order) => {
      let invoiceStatus = "pending";

      if (order.payment_status === "paid") {
        invoiceStatus = "paid";
      } else if (
        order.expected_delivery_date &&
        new Date() > new Date(order.expected_delivery_date)
      ) {
        invoiceStatus = "overdue";
      }

      return {
        _id: order.id,
        invoice_number: order.po_number, // Using PO number as invoice number
        order_number: order.po_number,
        invoice_date: order.created_at,
        due_date: order.expected_delivery_date,
        amount: Number(order.total_amount || 0),
        currency: order.currency || "INR",
        status: invoiceStatus,
        payment_method: order.payment_method || "bank_transfer",
        payment_terms: order.payment_terms || "Net 30",
        items_count: Array.isArray(order.items) ? order.items.length : 0,
        requested_by: order.requested_by ? order.requested_by.name : "N/A",
      };
    });

    // Calculate summary
    const totalAmount = formattedInvoices.reduce(
      (sum, inv) => sum + inv.amount,
      0,
    );
    const paidAmount = formattedInvoices
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = formattedInvoices
      .filter((inv) => inv.status !== "paid")
      .reduce((sum, inv) => sum + inv.amount, 0);

    res.json({
      success: true,
      invoices: formattedInvoices,
      summary: {
        totalInvoices: formattedInvoices.length,
        totalAmount: totalAmount,
        paidAmount: paidAmount,
        pendingAmount: pendingAmount,
        currency: "INR",
      },
    });
  } catch (error) {
    logger.error("Error fetching invoices:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch invoices",
      error: error.message,
    });
  }
};

// Get vendor profile (REAL DATA)
const getProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to a vendor account",
      });
    }

    const supabase = getSupabase();

    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .single();

    if (vendorError || !vendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      });
    }

    // Calculate performance metrics
    const { data: pos, error: poError } = await supabase
      .from("purchase_orders")
      .select("status, expected_delivery_date, actual_delivery_date")
      .eq("vendor", vendorId);

    if (poError) throw poError;

    const completedOrdersCount = pos.filter(
      (po) => po.status === "completed",
    ).length;
    const deliveredOrders = pos.filter(
      (po) => po.status === "completed" && po.actual_delivery_date,
    );

    const onTimeDeliveries = deliveredOrders.filter((order) => {
      return (
        new Date(order.actual_delivery_date) <=
        new Date(order.expected_delivery_date)
      );
    }).length;

    const onTimeDeliveryRate =
      deliveredOrders.length > 0
        ? Math.round((onTimeDeliveries / deliveredOrders.length) * 100)
        : 100;

    // Calculate average rating (if available)
    const rating = vendor.rating || 4.5; // Default if no rating system yet

    res.json({
      success: true,
      profile: {
        ...vendor,
        _id: vendor.id,
        performance: {
          total_orders: completedOrdersCount,
          on_time_delivery_rate: onTimeDeliveryRate,
          rating: rating,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching vendor profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vendor profile",
      error: error.message,
    });
  }
};

// Update vendor profile (REAL DATA)
const updateProfile = async (req, res) => {
  try {
    const vendorId = req.user.vendor_id;

    if (!vendorId) {
      return res.status(400).json({
        success: false,
        message: "User is not linked to a vendor account",
      });
    }

    const supabase = getSupabase();
    const updateData = { ...req.body };

    // Remove fields that shouldn't be updated directly
    delete updateData._id;
    delete updateData.id;
    delete updateData.created_at;
    delete updateData.updated_at;
    delete updateData.createdAt;
    delete updateData.updatedAt;
    delete updateData.rating; // Rating should be calculated, not manually set

    updateData.updated_at = new Date().toISOString();

    const { data: updatedVendor, error: updateError } = await supabase
      .from("vendors")
      .update(updateData)
      .eq("id", vendorId)
      .select()
      .single();

    if (updateError) throw updateError;

    if (!updatedVendor) {
      return res.status(404).json({
        success: false,
        message: "Vendor profile not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: {
        ...updatedVendor,
        _id: updatedVendor.id,
      },
    });
  } catch (error) {
    logger.error("Error updating vendor profile:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update vendor profile",
      error: error.message,
    });
  }
};

module.exports = {
  getVendorStats,
  getRecentOrders,
  getAllOrders,
  getOrderById,
  getProducts,
  getInvoices,
  getProfile,
  updateProfile,
};
