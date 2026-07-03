const getSupabase = require("../config/db");
const logger = require("../utils/logger");

/**
 * Get all invoices with filters and pagination
 */
exports.getAllInvoices = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { page = 1, limit = 50, status, vendor, search } = req.query;

    let query = supabase.from("invoices").select(
      `
        *,
        vendor:vendors!vendor_id(id, company_name, contact_person, contact_email, phone),
        purchase_order:purchase_orders!po_id(id, po_number, status),
        created_by_user:users!created_by(id, name, email),
        approved_by_user:users!approved_by(id, name, email)
      `,
      { count: "exact" },
    );

    // Status filter
    if (status && status !== "All") {
      query = query.eq("status", status.toLowerCase());
    }

    // Vendor filter
    if (vendor) {
      query = query.eq("vendor_id", vendor);
    }

    // Search by invoice number
    if (search) {
      query = query.ilike("invoice_number", `%${search}%`);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    query = query
      .order("created_at", { ascending: false })
      .range(skip, skip + parseInt(limit) - 1);

    const { data: invoices, error, count: total } = await query;

    if (error) {
      throw error;
    }

    return res.status(200).json({
      success: true,
      data: invoices,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / parseInt(limit)),
        total_invoices: total,
        has_next: skip + invoices.length < total,
        has_prev: parseInt(page) > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching invoices:", error);
    next(error);
  }
};

/**
 * Get invoice by ID
 */
exports.getInvoiceById = async (req, res, next) => {
  try {
    const supabase = getSupabase();

    const { data: invoice, error } = await supabase
      .from("invoices")
      .select(
        `
        *,
        vendor:vendors!vendor_id(id, company_name, contact_person, contact_email, phone, address, payment_terms),
        purchase_order:purchase_orders!po_id(*),
        created_by_user:users!created_by(id, name, email),
        approved_by_user:users!approved_by(id, name, email)
      `,
      )
      .eq("id", req.params.id)
      .single();

    if (error || !invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    logger.error("Error fetching invoice:", error);
    next(error);
  }
};

/**
 * Create new invoice
 */
exports.createInvoice = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const {
      purchase_order,
      vendor,
      invoice_number,
      invoice_date,
      due_date,
      items,
      subtotal,
      tax_amount,
      total_amount,
      payment_method,
      vendor_gstin,
      notes,
    } = req.body;

    // Validate required fields
    if (
      !purchase_order ||
      !vendor ||
      !due_date ||
      !items ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: purchase_order, vendor, due_date, and items are required",
      });
    }

    // Verify purchase order exists
    const { data: po, error: poError } = await supabase
      .from("purchase_orders")
      .select("id, po_number")
      .eq("id", purchase_order)
      .single();

    if (poError || !po) {
      return res.status(404).json({
        success: false,
        message: "Purchase order not found",
      });
    }

    const calculatedSubtotal =
      subtotal || items.reduce((sum, item) => sum + item.total_amount, 0);

    const { data: invoice, error: insertError } = await supabase
      .from("invoices")
      .insert({
        po_id: purchase_order,
        vendor_id: vendor,
        invoice_number: invoice_number || `INV-${Date.now()}`,
        invoice_date: invoice_date || new Date().toISOString(),
        due_date,
        items, // JSONB
        subtotal: calculatedSubtotal,
        tax_amount: tax_amount || 0,
        total_amount: total_amount || calculatedSubtotal + (tax_amount || 0),
        payment_method: payment_method || "bank_transfer",
        vendor_gstin: vendor_gstin || "",
        notes: notes || "",
        created_by: req.user.id,
        status: "draft",
      })
      .select(
        `
        *,
        vendor:vendors!vendor_id(id, company_name, contact_person, contact_email),
        purchase_order:purchase_orders!po_id(id, po_number),
        created_by_user:users!created_by(id, name, email)
      `,
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    logger.info(
      `Invoice ${invoice.invoice_number} created by user ${req.user.email}`,
    );

    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      data: invoice,
    });
  } catch (error) {
    logger.error("Error creating invoice:", error);
    next(error);
  }
};

/**
 * Update invoice status
 */
exports.updateInvoiceStatus = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { status, payment_date, payment_reference } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: "Status is required",
      });
    }

    const validStatuses = [
      "draft",
      "sent",
      "received",
      "approved",
      "paid",
      "overdue",
      "cancelled",
    ];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updateData = { status };

    if (status === "paid") {
      updateData.payment_date = payment_date || new Date().toISOString();
      if (payment_reference) {
        updateData.payment_reference = payment_reference;
      }
    }

    if (status === "approved") {
      updateData.approved_by = req.user.id;
    }

    const { data: invoice, error: updateError } = await supabase
      .from("invoices")
      .update(updateData)
      .eq("id", req.params.id)
      .select(
        `
        *,
        vendor:vendors!vendor_id(id, company_name, contact_person, contact_email),
        purchase_order:purchase_orders!po_id(id, po_number)
      `,
      )
      .single();

    if (updateError || !invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found or could not be updated",
      });
    }

    logger.info(
      `Invoice ${invoice.invoice_number} status updated to ${status} by user ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: `Invoice status updated to ${status}`,
      data: invoice,
    });
  } catch (error) {
    logger.error("Error updating invoice status:", error);
    next(error);
  }
};

/**
 * Delete invoice (soft delete/hard delete based on setup)
 */
exports.deleteInvoice = async (req, res, next) => {
  try {
    const supabase = getSupabase();

    // Check if exists
    const { data: existing, error: checkError } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("id", req.params.id)
      .single();

    if (checkError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    const { error: deleteError } = await supabase
      .from("invoices")
      .delete()
      .eq("id", req.params.id);

    if (deleteError) {
      throw deleteError;
    }

    logger.info(
      `Invoice ${existing.invoice_number} deleted by user ${req.user.email}`,
    );

    return res.status(200).json({
      success: true,
      message: "Invoice deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting invoice:", error);
    next(error);
  }
};

/**
 * Get invoice statistics
 */
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const supabase = getSupabase();

    // Make these queries in parallel
    const [allInvoicesResult, paidRevenueResult] = await Promise.all([
      supabase.from("invoices").select("status, due_date, total_amount"),
      supabase.from("invoices").select("total_amount").eq("status", "paid"),
    ]);

    if (allInvoicesResult.error) throw allInvoicesResult.error;

    const invoices = allInvoicesResult.data || [];

    const totalInvoices = invoices.length;
    const paidInvoices = invoices.filter((inv) => inv.status === "paid").length;
    const pendingInvoices = invoices.filter((inv) =>
      ["draft", "sent", "received", "approved"].includes(inv.status),
    ).length;

    const now = new Date();
    const overdueInvoices = invoices.filter((inv) => {
      if (["paid", "cancelled"].includes(inv.status)) return false;
      return new Date(inv.due_date) < now;
    }).length;

    const totalRevenue = (paidRevenueResult.data || []).reduce(
      (sum, inv) => sum + parseFloat(inv.total_amount || 0),
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        total_invoices: totalInvoices,
        paid_invoices: paidInvoices,
        pending_invoices: pendingInvoices,
        overdue_invoices: overdueInvoices,
        total_revenue: totalRevenue,
      },
    });
  } catch (error) {
    logger.error("Error fetching invoice stats:", error);
    next(error);
  }
};
