const getSupabase = require("../config/db");
const logger = require("../utils/logger");

/**
 * Custom Filters Controller
 * Handles advanced filtering with dynamic query building, saved filters, and presets
 */

// Build Supabase query from filter configuration
const applyFilters = (query, filterConfig) => {
  // Status filters
  if (filterConfig.status && filterConfig.status.length > 0) {
    query = query.in("status", filterConfig.status);
  }

  // Condition filters
  if (filterConfig.condition && filterConfig.condition.length > 0) {
    query = query.in("condition", filterConfig.condition);
  }

  // Location filters
  if (filterConfig.location) {
    if (typeof filterConfig.location === "string") {
      query = query.ilike("location", `%${filterConfig.location}%`);
    } else if (Array.isArray(filterConfig.location)) {
      query = query.in("location", filterConfig.location);
    }
  }

  // Department filters
  if (filterConfig.department && filterConfig.department.length > 0) {
    query = query.in("department", filterConfig.department);
  }

  // Category filters
  if (filterConfig.category && filterConfig.category.length > 0) {
    query = query.in("category", filterConfig.category);
  }

  // Date range filters
  if (filterConfig.purchase_date_from) {
    query = query.gte(
      "purchase_date",
      new Date(filterConfig.purchase_date_from).toISOString(),
    );
  }
  if (filterConfig.purchase_date_to) {
    query = query.lte(
      "purchase_date",
      new Date(filterConfig.purchase_date_to).toISOString(),
    );
  }

  // Warranty expiry filters
  if (filterConfig.warranty_expiry_from) {
    query = query.gte(
      "warranty_expiry",
      new Date(filterConfig.warranty_expiry_from).toISOString(),
    );
  }
  if (filterConfig.warranty_expiry_to) {
    query = query.lte(
      "warranty_expiry",
      new Date(filterConfig.warranty_expiry_to).toISOString(),
    );
  }

  // Last audit date filters
  if (filterConfig.last_audit_date_from) {
    query = query.gte(
      "last_audit_date",
      new Date(filterConfig.last_audit_date_from).toISOString(),
    );
  }
  if (filterConfig.last_audit_date_to) {
    query = query.lte(
      "last_audit_date",
      new Date(filterConfig.last_audit_date_to).toISOString(),
    );
  }

  // Price range filters
  if (filterConfig.purchase_cost_min !== undefined) {
    query = query.gte(
      "purchase_cost",
      parseFloat(filterConfig.purchase_cost_min),
    );
  }
  if (filterConfig.purchase_cost_max !== undefined) {
    query = query.lte(
      "purchase_cost",
      parseFloat(filterConfig.purchase_cost_max),
    );
  }

  // Assigned user filters
  if (filterConfig.assigned_user) {
    if (filterConfig.assigned_user === "unassigned") {
      query = query.is("assigned_user", null);
    } else if (filterConfig.assigned_user === "assigned") {
      query = query.not("assigned_user", "is", null);
    } else {
      query = query.eq("assigned_user", filterConfig.assigned_user);
    }
  }

  // Vendor filters
  if (filterConfig.vendor) {
    query = query.eq("vendor", filterConfig.vendor);
  }

  // Manufacturer filters
  if (filterConfig.manufacturer) {
    query = query.ilike("manufacturer", `%${filterConfig.manufacturer}%`);
  }

  // Model filters
  if (filterConfig.model) {
    query = query.ilike("model", `%${filterConfig.model}%`);
  }

  // Serial number filters
  if (filterConfig.serial_number) {
    query = query.ilike("serial_number", `%${filterConfig.serial_number}%`);
  }

  // Text search filters (searches multiple fields)
  if (filterConfig.search_text) {
    const term = `%${filterConfig.search_text}%`;
    query = query.or(
      `name.ilike.${term},unique_asset_id.ilike.${term},serial_number.ilike.${term},manufacturer.ilike.${term},model.ilike.${term},description.ilike.${term}`,
    );
  }

  // Maintenance status filters
  if (filterConfig.maintenance_status) {
    query = query.eq("maintenance_status", filterConfig.maintenance_status);
  }

  // Has images filter (checking JSONB array length if images exist)
  if (filterConfig.has_images !== undefined) {
    // Note: Supabase/PostgREST JSON length filtering is a bit complex. Assuming 'images' is an array in a related table or jsonb array
    // We do a rough filter - not entirely perfect via RPC, but close enough with not.is.null if text array, or via custom logic.
    // For now we'll skip complex JSON size checks and just check if it's not null.
    if (filterConfig.has_images) {
      query = query.not("images", "is", null);
    } else {
      query = query.is("images", null);
    }
  }

  // Expired warranty filter
  if (filterConfig.warranty_expired !== undefined) {
    if (filterConfig.warranty_expired) {
      query = query.lt("warranty_expiry", new Date().toISOString());
    } else {
      query = query.gte("warranty_expiry", new Date().toISOString());
    }
  }

  // Audit overdue filter (not audited in X days)
  if (filterConfig.audit_overdue_days) {
    const overdueDate = new Date();
    overdueDate.setDate(
      overdueDate.getDate() - parseInt(filterConfig.audit_overdue_days),
    );
    query = query.or(
      `last_audit_date.lt.${overdueDate.toISOString()},last_audit_date.is.null`,
    );
  }

  return query;
};

// Apply filters to assets
exports.filterAssets = async (req, res) => {
  try {
    const filterConfig = req.body;
    const {
      page = 1,
      limit = 50,
      sort_by = "created_at",
      sort_order = "desc",
      include_count = true,
    } = req.query;

    const skip = (page - 1) * limit;
    const supabase = getSupabase();

    let query = supabase.from("assets").select(
      `
        *,
        assigned_user:users!assigned_user(id, name, email, department),
        vendor:vendors!vendor(id, vendor_name, email)
      `,
      { count: include_count === "true" ? "exact" : null },
    );

    // Build query from filter configuration
    query = applyFilters(query, filterConfig);

    // Build sort object
    query = query.order(sort_by, { ascending: sort_order === "asc" });

    // Execute query with pagination
    query = query.range(skip, skip + parseInt(limit) - 1);

    const { data: assets, error, count: total } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      assets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages:
          include_count === "true" && total ? Math.ceil(total / limit) : null,
      },
      filter_applied: Object.keys(filterConfig).length > 0,
      query_summary: {
        filters_count: Object.keys(filterConfig).length,
        results_count: assets.length,
      },
    });
  } catch (error) {
    logger.error("Error filtering assets:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to filter assets",
    });
  }
};

// Save filter configuration
exports.saveFilter = async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      name,
      description,
      filter_config,
      is_public = false,
      category = "custom",
    } = req.body;

    if (!name || !filter_config) {
      return res.status(400).json({
        success: false,
        message: "Name and filter configuration are required",
      });
    }

    // Check if filter name already exists for this user
    const { data: existingFilter } = await supabase
      .from("saved_filters")
      .select("id")
      .eq("name", name)
      .eq("created_by", req.user.id)
      .single();

    if (existingFilter) {
      return res.status(400).json({
        success: false,
        message: "A filter with this name already exists",
      });
    }

    const { data: savedFilter, error: insertError } = await supabase
      .from("saved_filters")
      .insert({
        name,
        description,
        filter_config,
        is_public,
        category,
        created_by: req.user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Log filter creation
    await supabase.from("audit_logs").insert({
      action: "filter_created",
      performed_by: req.user.id,
      details: {
        filter_id: savedFilter.id,
        filter_name: name,
        is_public,
        category,
      },
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      success: true,
      message: "Filter saved successfully",
      filter: savedFilter,
    });
  } catch (error) {
    logger.error("Error saving filter:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save filter",
    });
  }
};

// Get saved filters
exports.getSavedFilters = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { category, include_public = true } = req.query;

    let query = supabase.from("saved_filters").select(`
        *,
        created_by:users!created_by(id, name, email)
      `);

    // Combine OR conditions for permissions
    if (include_public === "true") {
      query = query.or(`created_by.eq.${req.user.id},is_public.eq.true`);
    } else {
      query = query.eq("created_by", req.user.id);
    }

    // Filter by category
    if (category) {
      query = query.eq("category", category);
    }

    query = query
      .order("usage_count", { ascending: false })
      .order("updated_at", { ascending: false });

    const { data: filters, error } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      filters: (filters || []).map((f) => ({
        ...f,
        is_owner: f.created_by?.id === req.user.id,
      })),
    });
  } catch (error) {
    logger.error("Error fetching saved filters:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filters",
    });
  }
};

// Get filter by ID
exports.getFilterById = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { filter_id } = req.params;

    const { data: filter, error: fetchError } = await supabase
      .from("saved_filters")
      .select(
        `
        *,
        created_by:users!created_by(id, name, email)
      `,
      )
      .eq("id", filter_id)
      .single();

    if (fetchError || !filter) {
      return res.status(404).json({
        success: false,
        message: "Filter not found",
      });
    }

    // Check access (owner or public filter)
    if (filter.created_by?.id !== req.user.id && !filter.is_public) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this filter",
      });
    }

    // Update usage stats
    await supabase
      .from("saved_filters")
      .update({
        usage_count: (filter.usage_count || 0) + 1,
        last_used_at: new Date().toISOString(),
      })
      .eq("id", filter_id);

    filter.usage_count = (filter.usage_count || 0) + 1;
    filter.last_used_at = new Date().toISOString();

    return res.json({
      success: true,
      filter: {
        ...filter,
        is_owner: filter.created_by?.id === req.user.id,
      },
    });
  } catch (error) {
    logger.error("Error fetching filter:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filter",
    });
  }
};

// Update saved filter
exports.updateFilter = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { filter_id } = req.params;
    const { name, description, filter_config, is_public, category } = req.body;

    const { data: filter, error: checkError } = await supabase
      .from("saved_filters")
      .select("created_by, id, name")
      .eq("id", filter_id)
      .single();

    if (checkError || !filter) {
      return res.status(404).json({
        success: false,
        message: "Filter not found",
      });
    }

    // Check ownership
    if (filter.created_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own filters",
      });
    }

    const updateData = { updated_at: new Date().toISOString() };
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (filter_config) updateData.filter_config = filter_config;
    if (is_public !== undefined) updateData.is_public = is_public;
    if (category) updateData.category = category;

    const { data: updatedFilter, error: updateError } = await supabase
      .from("saved_filters")
      .update(updateData)
      .eq("id", filter_id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log update
    await supabase.from("audit_logs").insert({
      action: "filter_updated",
      performed_by: req.user.id,
      details: {
        filter_id: filter.id,
        filter_name: name || filter.name,
      },
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: "Filter updated successfully",
      filter: updatedFilter,
    });
  } catch (error) {
    logger.error("Error updating filter:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update filter",
    });
  }
};

// Delete saved filter
exports.deleteFilter = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { filter_id } = req.params;

    const { data: filter, error: checkError } = await supabase
      .from("saved_filters")
      .select("created_by, id, name, is_preset")
      .eq("id", filter_id)
      .single();

    if (checkError || !filter) {
      return res.status(404).json({
        success: false,
        message: "Filter not found",
      });
    }

    // Check ownership (admin can delete any filter)
    if (filter.created_by !== req.user.id && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own filters",
      });
    }

    // Prevent deletion of preset filters
    if (filter.is_preset && req.user.role !== "ADMIN") {
      return res.status(403).json({
        success: false,
        message: "Preset filters cannot be deleted",
      });
    }

    const { error: deleteError } = await supabase
      .from("saved_filters")
      .delete()
      .eq("id", filter_id);

    if (deleteError) {
      throw deleteError;
    }

    // Log deletion
    await supabase.from("audit_logs").insert({
      action: "filter_deleted",
      performed_by: req.user.id,
      details: {
        filter_id,
        filter_name: filter.name,
      },
      timestamp: new Date().toISOString(),
    });

    return res.json({
      success: true,
      message: "Filter deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting filter:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete filter",
    });
  }
};

// Get filter presets
exports.getFilterPresets = async (req, res) => {
  try {
    const presets = [
      {
        id: "active-assets",
        name: "Active Assets",
        description: "All assets with active status",
        category: "status",
        filter_config: { status: ["Active"] },
        is_preset: true,
      },
      {
        id: "unassigned-assets",
        name: "Unassigned Assets",
        description: "Assets not assigned to any user",
        category: "user",
        filter_config: { assigned_user: "unassigned" },
        is_preset: true,
      },
      {
        id: "maintenance-due",
        name: "Maintenance Due",
        description: "Assets requiring maintenance",
        category: "maintenance",
        filter_config: { maintenance_status: "Scheduled" },
        is_preset: true,
      },
      {
        id: "warranty-expiring",
        name: "Warranty Expiring Soon",
        description: "Assets with warranty expiring in 30 days",
        category: "date",
        filter_config: {
          warranty_expiry_from: new Date().toISOString(),
          warranty_expiry_to: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000,
          ).toISOString(),
        },
        is_preset: true,
      },
      {
        id: "poor-condition",
        name: "Poor Condition Assets",
        description: "Assets in poor or non-functional condition",
        category: "condition",
        filter_config: { condition: ["Poor", "Non-functional"] },
        is_preset: true,
      },
      {
        id: "audit-overdue",
        name: "Audit Overdue",
        description: "Assets not audited in 90 days",
        category: "date",
        filter_config: { audit_overdue_days: 90 },
        is_preset: true,
      },
      {
        id: "high-value",
        name: "High Value Assets",
        description: "Assets with purchase cost over ₹10,00,000",
        category: "financial",
        filter_config: { purchase_cost_min: 1000000 },
        is_preset: true,
      },
      {
        id: "missing-images",
        name: "Missing Images",
        description: "Assets without any photos",
        category: "custom",
        filter_config: { has_images: false },
        is_preset: true,
      },
    ];

    return res.json({
      success: true,
      presets,
    });
  } catch (error) {
    logger.error("Error fetching filter presets:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filter presets",
    });
  }
};

// Get available filter fields
exports.getFilterFields = async (req, res) => {
  try {
    const fields = {
      basic: [
        {
          name: "status",
          type: "select",
          options: [
            "Active",
            "Inactive",
            "Under Maintenance",
            "Damaged",
            "Disposed",
            "Lost",
          ],
        },
        {
          name: "condition",
          type: "select",
          options: ["Excellent", "Good", "Fair", "Poor", "Non-functional"],
        },
        {
          name: "category",
          type: "select",
          options: [
            "Electronics",
            "Furniture",
            "Vehicles",
            "Machinery",
            "IT Equipment",
            "Office Supplies",
            "Other",
          ],
        },
        {
          name: "department",
          type: "select",
          options: ["IT", "HR", "Finance", "Operations", "Inventory", "Admin"],
        },
      ],
      location: [{ name: "location", type: "text" }],
      dates: [
        { name: "purchase_date", type: "date_range" },
        { name: "warranty_expiry", type: "date_range" },
        { name: "last_audit_date", type: "date_range" },
      ],
      financial: [{ name: "purchase_cost", type: "number_range" }],
      assignment: [
        {
          name: "assigned_user",
          type: "select",
          special: ["unassigned", "assigned"],
        },
      ],
      details: [
        { name: "manufacturer", type: "text" },
        { name: "model", type: "text" },
        { name: "serial_number", type: "text" },
        { name: "vendor", type: "reference" },
      ],
      advanced: [
        {
          name: "search_text",
          type: "text",
          description: "Search across multiple fields",
        },
        { name: "has_images", type: "boolean" },
        { name: "warranty_expired", type: "boolean" },
        { name: "audit_overdue_days", type: "number" },
        {
          name: "maintenance_status",
          type: "select",
          options: ["None", "Scheduled", "In Progress", "Completed", "Overdue"],
        },
      ],
    };

    return res.json({
      success: true,
      fields,
    });
  } catch (error) {
    logger.error("Error fetching filter fields:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch filter fields",
    });
  }
};

module.exports = exports;
