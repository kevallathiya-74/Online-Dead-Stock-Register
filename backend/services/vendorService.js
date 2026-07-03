const getSupabase = require("../config/db");
const logger = require("../utils/logger");

/**
 * Get all vendors with filters and pagination
 */
exports.getVendors = async (filters = {}, pagination = {}) => {
  try {
    const supabase = getSupabase();
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    // Build query
    let queryBuilder = supabase.from("vendors").select("*", { count: "exact" });

    // Search filter
    if (filters.search) {
      const searchVal = `%${filters.search}%`;
      queryBuilder = queryBuilder.or(
        `vendor_name.ilike.${searchVal},contact_person.ilike.${searchVal},email.ilike.${searchVal},phone.ilike.${searchVal}`,
      );
    }

    // Status filter
    if (filters.status) {
      if (filters.status === "active") {
        queryBuilder = queryBuilder.eq("is_active", true);
      } else if (filters.status === "inactive") {
        queryBuilder = queryBuilder.eq("is_active", false);
      } else {
        queryBuilder = queryBuilder.eq("is_active", filters.status === "true");
      }
    }

    // Category filter
    if (filters.category) {
      queryBuilder = queryBuilder.eq("category->>name", filters.category);
    }

    // Execute query with pagination
    const {
      data: vendors,
      count: total,
      error,
    } = await queryBuilder
      .order("created_at", { ascending: false })
      .range(skip, skip + limit - 1);

    if (error) throw error;

    const mappedVendors = (vendors || []).map((v) => ({
      ...v,
      _id: v.id,
    }));

    return {
      vendors: mappedVendors,
      pagination: {
        total: total || 0,
        page,
        pages: Math.ceil((total || 0) / limit),
        limit,
      },
    };
  } catch (error) {
    logger.error("Error in getVendors service:", error);
    throw error;
  }
};

/**
 * Get vendor by ID with performance metrics
 */
exports.getVendorById = async (vendorId) => {
  try {
    const supabase = getSupabase();
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .maybeSingle();

    if (error) throw error;
    if (!vendor) {
      return null;
    }

    // Get asset count for this vendor
    const { count: assetCount, error: assetError } = await supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("vendor", vendorId);

    if (assetError) throw assetError;

    return {
      ...vendor,
      _id: vendor.id,
      assetCount: assetCount || 0,
    };
  } catch (error) {
    logger.error("Error in getVendorById service:", error);
    throw error;
  }
};

/**
 * Create new vendor with audit trail
 */
exports.createVendor = async (vendorData, userId) => {
  try {
    const supabase = getSupabase();

    // Check for duplicate vendor name
    const { data: existing, error: checkError } = await supabase
      .from("vendors")
      .select("id")
      .ilike("vendor_name", vendorData.vendor_name)
      .maybeSingle();

    if (checkError) throw checkError;
    if (existing) {
      throw new Error("Vendor with this name already exists");
    }

    // Map data for insert
    const insertData = {
      company_name: vendorData.company_name || vendorData.vendor_name || "",
      vendor_name: vendorData.vendor_name || "",
      vendor_code: vendorData.vendor_code || null,
      contact_person: vendorData.contact_person || null,
      email: vendorData.email || null,
      contact_email: vendorData.contact_email || vendorData.email || null,
      phone: vendorData.phone || null,
      profile_photo: vendorData.profile_photo || null,
      payment_terms: vendorData.payment_terms || null,
      vendor_type: vendorData.vendor_type || null,
      rating:
        vendorData.rating !== undefined ? parseInt(vendorData.rating) : null,
      performance_rating:
        vendorData.performance_rating !== undefined
          ? parseInt(vendorData.performance_rating)
          : null,
      is_active:
        vendorData.is_active !== undefined ? vendorData.is_active : true,
      category: vendorData.category || null,
      categories: vendorData.categories || null,
      gst_number: vendorData.gst_number || null,
      pan_number: vendorData.pan_number || null,
    };

    // Create vendor
    const { data: vendor, error: insertError } = await supabase
      .from("vendors")
      .insert([insertData])
      .select()
      .single();

    if (insertError) throw insertError;

    // Create audit log
    const { error: auditError } = await supabase.from("audit_logs").insert([
      {
        user_id: userId,
        action: "CREATE",
        entity_type: "Vendor",
        entity_id: vendor.id,
        changes: {
          new: vendor,
        },
        ip_address: "system",
        user_agent: "backend-service",
      },
    ]);

    if (auditError) {
      logger.error("Error creating audit log for vendor creation:", auditError);
    }

    logger.info("Vendor created successfully", {
      vendorId: vendor.id,
      vendorName: vendor.vendor_name,
      userId,
    });

    return {
      ...vendor,
      _id: vendor.id,
    };
  } catch (error) {
    logger.error("Error in createVendor service:", error);
    throw error;
  }
};

/**
 * Update vendor with audit trail
 */
exports.updateVendor = async (vendorId, updateData, userId) => {
  try {
    const supabase = getSupabase();

    // Fetch current vendor
    const { data: oldVendor, error: fetchError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!oldVendor) {
      return null;
    }

    // Prepare updated fields
    const allowedFields = [
      "company_name",
      "vendor_name",
      "vendor_code",
      "contact_person",
      "email",
      "contact_email",
      "phone",
      "profile_photo",
      "payment_terms",
      "vendor_type",
      "rating",
      "performance_rating",
      "is_active",
      "category",
      "categories",
      "gst_number",
      "pan_number",
    ];

    const dbUpdateData = {};
    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        dbUpdateData[key] = updateData[key];
      }
    }

    if (updateData.name && !updateData.vendor_name) {
      dbUpdateData.vendor_name = updateData.name;
    }

    dbUpdateData.updated_at = new Date().toISOString();

    // Update vendor
    const { data: updatedVendor, error: updateError } = await supabase
      .from("vendors")
      .update(dbUpdateData)
      .eq("id", vendorId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create audit log
    const { error: auditError } = await supabase.from("audit_logs").insert([
      {
        user_id: userId,
        action: "UPDATE",
        entity_type: "Vendor",
        entity_id: vendorId,
        changes: {
          old: oldVendor,
          new: updatedVendor,
        },
        ip_address: "system",
        user_agent: "backend-service",
      },
    ]);

    if (auditError) {
      logger.error("Error creating audit log for vendor update:", auditError);
    }

    logger.info("Vendor updated successfully", {
      vendorId: vendorId,
      userId,
    });

    return {
      ...updatedVendor,
      _id: updatedVendor.id,
    };
  } catch (error) {
    logger.error("Error in updateVendor service:", error);
    throw error;
  }
};

/**
 * Soft delete vendor
 */
exports.deleteVendor = async (vendorId, userId) => {
  try {
    const supabase = getSupabase();

    // Fetch current vendor
    const { data: vendor, error: fetchError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!vendor) {
      return null;
    }

    // Check if vendor has active assets
    const { count: activeAssets, error: countError } = await supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("vendor", vendorId)
      .in("status", [
        "Active",
        "active",
        "assigned",
        "Available",
        "available",
        "Under Maintenance",
      ]);

    if (countError) throw countError;
    if (activeAssets > 0) {
      throw new Error(
        `Cannot delete vendor with ${activeAssets} active assets`,
      );
    }

    // Deactivate vendor
    const { data: updatedVendor, error: updateError } = await supabase
      .from("vendors")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", vendorId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create audit log
    const { error: auditError } = await supabase.from("audit_logs").insert([
      {
        user_id: userId,
        action: "DELETE",
        entity_type: "Vendor",
        entity_id: vendorId,
        changes: {
          old: vendor,
        },
        ip_address: "system",
        user_agent: "backend-service",
      },
    ]);

    if (auditError) {
      logger.error("Error creating audit log for vendor deletion:", auditError);
    }

    logger.info("Vendor deleted successfully", {
      vendorId: vendorId,
      userId,
    });

    return {
      ...updatedVendor,
      _id: updatedVendor.id,
    };
  } catch (error) {
    logger.error("Error in deleteVendor service:", error);
    throw error;
  }
};

/**
 * Get vendor statistics
 */
exports.getVendorStats = async () => {
  try {
    const supabase = getSupabase();
    const { data: vendors, error } = await supabase
      .from("vendors")
      .select("rating, is_active");

    if (error) throw error;

    const statusCounts = {};
    vendors.forEach((v) => {
      const statusKey = v.is_active ? "active" : "inactive";
      statusCounts[statusKey] = (statusCounts[statusKey] || 0) + 1;
    });

    const byStatus = Object.keys(statusCounts).map((k) => ({
      _id: k,
      count: statusCounts[k],
    }));

    const ratingBuckets = {
      0: 0,
      2: 0,
      3: 0,
      4: 0,
      "No Rating": 0,
    };

    let sumRating = 0;
    let ratedCount = 0;

    vendors.forEach((v) => {
      const r = v.rating;
      if (r === null || r === undefined) {
        ratingBuckets["No Rating"]++;
      } else {
        sumRating += r;
        ratedCount++;
        if (r >= 0 && r < 2) ratingBuckets["0"]++;
        else if (r >= 2 && r < 3) ratingBuckets["2"]++;
        else if (r >= 3 && r < 4) ratingBuckets["3"]++;
        else if (r >= 4) ratingBuckets["4"]++;
      }
    });

    const byRating = Object.keys(ratingBuckets).map((k) => ({
      _id: k === "No Rating" ? "No Rating" : parseInt(k),
      count: ratingBuckets[k],
    }));

    const total = vendors.length;
    const avgRating = ratedCount > 0 ? sumRating / ratedCount : 0;

    return {
      byStatus,
      byRating,
      total,
      avgRating,
    };
  } catch (error) {
    logger.error("Error in getVendorStats service:", error);
    throw error;
  }
};

/**
 * Get vendor performance metrics
 */
exports.getVendorPerformance = async (vendorId) => {
  try {
    const supabase = getSupabase();
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .maybeSingle();

    if (vendorError) throw vendorError;
    if (!vendor) {
      return null;
    }

    // Get assets from this vendor
    const { data: assets, error: assetsError } = await supabase
      .from("assets")
      .select(
        "status, purchase_date, warranty_expiry, current_value, purchase_cost",
      )
      .eq("vendor", vendorId);

    if (assetsError) throw assetsError;

    // Calculate metrics
    const totalAssets = assets.length;
    const activeAssets = assets.filter((a) =>
      ["Active", "In Use", "Available"].includes(a.status),
    ).length;
    const totalValue = assets.reduce(
      (sum, a) => sum + (a.current_value || 0),
      0,
    );

    // Warranty coverage
    const now = new Date();
    const underWarranty = assets.filter(
      (a) => a.warranty_expiry && new Date(a.warranty_expiry) > now,
    ).length;

    return {
      vendor: {
        _id: vendor.id,
        vendor_name: vendor.vendor_name || vendor.company_name,
        rating: vendor.rating,
        status: vendor.is_active ? "active" : "inactive",
      },
      metrics: {
        totalAssets,
        activeAssets,
        totalValue,
        underWarranty,
        warrantyPercentage:
          totalAssets > 0
            ? parseFloat(((underWarranty / totalAssets) * 100).toFixed(2))
            : 0,
      },
    };
  } catch (error) {
    logger.error("Error in getVendorPerformance service:", error);
    throw error;
  }
};
