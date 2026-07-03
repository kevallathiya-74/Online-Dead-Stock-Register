const getSupabase = require("../config/db");
const logger = require("../utils/logger");
const { logUserAction } = require("../utils/auditHelper");
const { validate: isValidUUID } = require("uuid");

// Get all vendors with pagination and filtering
exports.getAllVendors = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      vendor_type,
      category,
      is_active = true,
      sort_by = "name",
      sort_order = "asc",
    } = req.query;

    const skip = (page - 1) * limit;
    const supabase = getSupabase();

    // Build query
    let query = supabase.from("vendors").select("*", { count: "exact" });

    if (is_active !== undefined) {
      query = query.eq("is_active", is_active === "true" || is_active === true);
    }
    if (vendor_type) {
      query = query.eq("vendor_type", vendor_type);
    }
    if (category) {
      query = query.contains("categories", JSON.stringify([category]));
    }
    if (search) {
      const searchVal = `%${search}%`;
      query = query.or(
        `vendor_name.ilike.${searchVal},vendor_code.ilike.${searchVal},contact_person.ilike.${searchVal},contact_email.ilike.${searchVal}`,
      );
    }

    // Build sort
    let sortByField = sort_by;
    if (sort_by === "name") {
      sortByField = "vendor_name";
    }

    query = query.order(sortByField, { ascending: sort_order === "asc" });

    // Execute query with range
    const {
      data: vendors,
      count: total,
      error,
    } = await query.range(skip, skip + parseInt(limit) - 1);

    if (error) throw error;

    const mappedVendors = (vendors || []).map((v) => ({
      ...v,
      _id: v.id,
      name: v.vendor_name || v.company_name,
    }));

    res.json({
      vendors: mappedVendors,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_vendors: total,
        has_next: page * limit < total,
        has_prev: page > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching vendors:", error);
    res.status(500).json({ message: "Failed to fetch vendors" });
  }
};

// Get vendor by ID with performance metrics
exports.getVendorById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: "Invalid vendor ID format" });
    }

    const supabase = getSupabase();
    const { data: vendor, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const mappedVendor = {
      ...vendor,
      _id: vendor.id,
      name: vendor.vendor_name || vendor.company_name,
    };

    // Get vendor performance metrics
    const performance = await getVendorPerformance(id);

    res.json({
      vendor: mappedVendor,
      performance,
    });
  } catch (error) {
    logger.error("Error fetching vendor:", error);
    res.status(500).json({ message: "Failed to fetch vendor" });
  }
};

// Create new vendor
exports.createVendor = async (req, res) => {
  try {
    const vendorData = req.body;
    const supabase = getSupabase();

    // Check if vendor with same email already exists
    if (vendorData.contact_email) {
      const { data: existingVendor } = await supabase
        .from("vendors")
        .select("id")
        .eq("contact_email", vendorData.contact_email)
        .maybeSingle();

      if (existingVendor) {
        return res.status(400).json({
          message: "Vendor with this email already exists",
        });
      }
    }

    const insertData = {
      company_name:
        vendorData.company_name ||
        vendorData.vendor_name ||
        vendorData.name ||
        "",
      vendor_name: vendorData.vendor_name || vendorData.name || "",
      vendor_code: vendorData.vendor_code,
      contact_person: vendorData.contact_person,
      email: vendorData.email,
      contact_email: vendorData.contact_email || vendorData.email,
      phone: vendorData.phone,
      profile_photo: vendorData.profile_photo,
      payment_terms: vendorData.payment_terms,
      vendor_type: vendorData.vendor_type,
      rating: vendorData.rating,
      performance_rating: vendorData.performance_rating || 5,
      is_active:
        vendorData.is_active !== undefined ? vendorData.is_active : true,
      category: vendorData.category,
      categories: vendorData.categories,
      gst_number: vendorData.gst_number,
      pan_number: vendorData.pan_number,
    };

    const { data: vendor, error } = await supabase
      .from("vendors")
      .insert([insertData])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(400).json({ message: "Vendor code already exists" });
      }
      throw error;
    }

    const mappedVendor = {
      ...vendor,
      _id: vendor.id,
      name: vendor.vendor_name || vendor.company_name,
    };

    // Create audit log
    await logUserAction(
      req,
      "vendor_created",
      "Vendor",
      vendor.id,
      `Vendor ${mappedVendor.name} created successfully`,
      "info",
    );

    res.status(201).json({
      message: "Vendor created successfully",
      vendor: mappedVendor,
    });
  } catch (error) {
    logger.error("Error creating vendor:", error);
    res.status(500).json({ message: "Failed to create vendor" });
  }
};

// Update vendor
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: "Invalid vendor ID format" });
    }

    const supabase = getSupabase();

    // Check if vendor exists
    const { data: vendor, error: fetchError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Check for duplicate email (excluding current vendor)
    if (updateData.contact_email) {
      const { data: existingVendor } = await supabase
        .from("vendors")
        .select("id")
        .neq("id", id)
        .eq("contact_email", updateData.contact_email)
        .maybeSingle();

      if (existingVendor) {
        return res.status(400).json({
          message: "Another vendor with this email already exists",
        });
      }
    }

    // Prepare fields to update
    const dbUpdateData = {
      updated_at: new Date().toISOString(),
    };

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

    for (const key of allowedFields) {
      if (updateData[key] !== undefined) {
        dbUpdateData[key] = updateData[key];
      }
    }

    if (updateData.name && !updateData.vendor_name) {
      dbUpdateData.vendor_name = updateData.name;
    }
    if (updateData.name && !updateData.company_name) {
      dbUpdateData.company_name = updateData.name;
    }

    const { data: updatedVendor, error: updateError } = await supabase
      .from("vendors")
      .update(dbUpdateData)
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    const mappedVendor = {
      ...updatedVendor,
      _id: updatedVendor.id,
      name: updatedVendor.vendor_name || updatedVendor.company_name,
    };

    // Create audit log
    await logUserAction(
      req,
      "vendor_updated",
      "Vendor",
      id,
      `Vendor ${mappedVendor.name} updated successfully`,
      "info",
    );

    res.json({
      message: "Vendor updated successfully",
      vendor: mappedVendor,
    });
  } catch (error) {
    logger.error("Error updating vendor:", error);
    res.status(500).json({ message: "Failed to update vendor" });
  }
};

// Delete vendor (soft delete)
exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: "Invalid vendor ID format" });
    }

    const supabase = getSupabase();

    const { data: vendor, error: fetchError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    // Check if vendor has active assets
    const { count: activeAssets, error: countError } = await supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("vendor", id)
      .in("status", ["Active", "In Use"]);

    if (countError) throw countError;

    if (activeAssets > 0) {
      return res.status(400).json({
        message: `Cannot delete vendor. ${activeAssets} active assets are linked to this vendor.`,
      });
    }

    // Soft delete by setting is_active to false
    const { data: updatedVendor, error: updateError } = await supabase
      .from("vendors")
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create audit log
    await logUserAction(
      req,
      "vendor_deleted",
      "Vendor",
      id,
      `Vendor ${vendor.vendor_name || vendor.company_name} deleted (soft delete)`,
      "info",
    );

    res.json({ message: "Vendor deactivated successfully" });
  } catch (error) {
    logger.error("Error deleting vendor:", error);
    res.status(500).json({ message: "Failed to delete vendor" });
  }
};

// Get vendor performance metrics
exports.getVendorPerformance = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: "Invalid vendor ID format" });
    }

    const supabase = getSupabase();

    const { data: vendor, error: fetchError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const performance = await getVendorPerformance(id);

    res.json({
      vendor_id: id,
      vendor_name: vendor.vendor_name || vendor.company_name,
      performance,
    });
  } catch (error) {
    logger.error("Error fetching vendor performance:", error);
    res.status(500).json({ message: "Failed to fetch vendor performance" });
  }
};

// Get vendor statistics for dashboard
exports.getVendorStats = async (req, res) => {
  try {
    const supabase = getSupabase();

    // Total active vendors count
    const { count: totalVendors, error: countActiveErr } = await supabase
      .from("vendors")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Inactive vendors count
    const { count: inactiveVendors, error: countInactiveErr } = await supabase
      .from("vendors")
      .select("*", { count: "exact", head: true })
      .eq("is_active", false);

    // Fetch all active vendors to calculate distributions
    const { data: allActiveVendors, error: allVendorsErr } = await supabase
      .from("vendors")
      .select(
        "vendor_type, performance_rating, vendor_name, company_name, rating, vendor_code",
      )
      .eq("is_active", true);

    if (countActiveErr || countInactiveErr || allVendorsErr) {
      throw countActiveErr || countInactiveErr || allVendorsErr;
    }

    // Type distribution
    const typeCounts = {};
    allActiveVendors.forEach((v) => {
      const type = v.vendor_type || "Unknown";
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });
    const typeDistribution = Object.keys(typeCounts).map((type) => ({
      _id: type,
      count: typeCounts[type],
    }));

    // Performance rating distribution
    const perfCounts = {
      Excellent: 0,
      Good: 0,
      Average: 0,
      Poor: 0,
      Unrated: 0,
    };
    allActiveVendors.forEach((v) => {
      const pr = v.performance_rating;
      if (pr === null || pr === undefined) {
        perfCounts.Unrated++;
      } else if (pr >= 4.5) {
        perfCounts.Excellent++;
      } else if (pr >= 3.5) {
        perfCounts.Good++;
      } else if (pr >= 2.5) {
        perfCounts.Average++;
      } else {
        perfCounts.Poor++;
      }
    });
    const performanceDistribution = Object.keys(perfCounts).map((bucket) => ({
      _id: bucket,
      count: perfCounts[bucket],
    }));

    // Top performing vendors
    const topVendors = [...allActiveVendors]
      .filter(
        (v) =>
          v.performance_rating !== null && v.performance_rating !== undefined,
      )
      .sort((a, b) => b.performance_rating - a.performance_rating)
      .slice(0, 5)
      .map((v) => ({
        name: v.vendor_name || v.company_name,
        vendor_code: v.vendor_code,
        performance_rating: v.performance_rating,
        vendor_type: v.vendor_type,
      }));

    // Recent vendor activities
    const { data: rawActivities, error: auditErr } = await supabase
      .from("audit_logs")
      .select(
        `
        id,
        action,
        timestamp,
        created_at,
        performed_by,
        user_id,
        users!fk_audit_logs_user_id(id, name)
      `,
      )
      .in("action", [
        "vendor_created",
        "vendor_updated",
        "vendor_deleted",
        "CREATE",
        "UPDATE",
        "DELETE",
      ])
      .order("created_at", { ascending: false })
      .limit(10);

    if (auditErr) {
      logger.error("Error fetching recent activities for vendors:", auditErr);
    }

    const recentActivities = (rawActivities || []).map((act) => ({
      _id: act.id,
      action: act.action,
      timestamp: act.created_at || act.timestamp,
      performed_by: act.users ? { full_name: act.users.name } : null,
    }));

    res.json({
      total_active_vendors: totalVendors || 0,
      inactive_vendors: inactiveVendors || 0,
      type_distribution: typeDistribution,
      performance_distribution: performanceDistribution,
      top_vendors: topVendors,
      recent_activities: recentActivities,
    });
  } catch (error) {
    logger.error("Error fetching vendor stats:", error);
    res.status(500).json({ message: "Failed to fetch vendor statistics" });
  }
};

// Get vendors by category
exports.getVendorsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const supabase = getSupabase();

    const { data: vendors, error } = await supabase
      .from("vendors")
      .select(
        "id, vendor_name, company_name, vendor_code, contact_person, contact_email, performance_rating, categories",
      )
      .eq("is_active", true)
      .contains("categories", JSON.stringify([category]))
      .order("performance_rating", { ascending: false });

    if (error) throw error;

    const mappedVendors = (vendors || []).map((v) => ({
      ...v,
      _id: v.id,
      name: v.vendor_name || v.company_name,
    }));

    res.json({
      category,
      vendors: mappedVendors,
      total_count: mappedVendors.length,
    });
  } catch (error) {
    logger.error("Error fetching vendors by category:", error);
    res.status(500).json({ message: "Failed to fetch vendors by category" });
  }
};

// Update vendor performance rating
exports.updateVendorRating = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, notes } = req.body;

    if (!isValidUUID(id)) {
      return res.status(400).json({ message: "Invalid vendor ID format" });
    }

    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }

    const supabase = getSupabase();

    const { data: vendor, error: fetchError } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }

    const oldRating = vendor.performance_rating;

    const { data: updatedVendor, error: updateError } = await supabase
      .from("vendors")
      .update({
        performance_rating: rating,
        notes: notes || vendor.notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create audit log
    await logUserAction(
      req,
      "vendor_rating_updated",
      "Vendor",
      id,
      `Vendor rating updated from ${oldRating} to ${rating}`,
      "info",
    );

    res.json({
      message: "Vendor rating updated successfully",
      vendor: {
        id: updatedVendor.id,
        name: updatedVendor.vendor_name || updatedVendor.company_name,
        performance_rating: updatedVendor.performance_rating,
      },
    });
  } catch (error) {
    logger.error("Error updating vendor rating:", error);
    res.status(500).json({ message: "Failed to update vendor rating" });
  }
};

// Helper function to calculate vendor performance
async function getVendorPerformance(vendorId) {
  try {
    const supabase = getSupabase();

    // Get assets from this vendor
    const { data: assets, error: assetsErr } = await supabase
      .from("assets")
      .select("id, status, condition, purchase_cost, current_value")
      .eq("vendor", vendorId);

    if (assetsErr) throw assetsErr;

    const totalAssets = assets ? assets.length : 0;
    const activeAssets = assets
      ? assets.filter(
          (asset) => asset.status === "Active" || asset.status === "active",
        ).length
      : 0;

    // Get average asset condition
    const conditionCounts = {};
    if (assets) {
      assets.forEach((asset) => {
        if (asset.condition) {
          conditionCounts[asset.condition] =
            (conditionCounts[asset.condition] || 0) + 1;
        }
      });
    }

    const assetIds = assets ? assets.map((asset) => asset.id) : [];

    let maintenanceCount = 0;
    let transactions = [];

    if (assetIds.length > 0) {
      const { count, error: maintErr } = await supabase
        .from("maintenances")
        .select("*", { count: "exact", head: true })
        .in("asset_id", assetIds);

      if (!maintErr) {
        maintenanceCount = count || 0;
      }

      const { data: txns, error: txnErr } = await supabase
        .from("transactions")
        .select("*")
        .in("asset_id", assetIds);

      if (!txnErr && txns) {
        transactions = txns;
      }
    }

    const totalValue = assets
      ? assets.reduce(
          (sum, asset) => sum + (Number(asset.purchase_cost) || 0),
          0,
        )
      : 0;

    const onTimeDeliveries = transactions.filter((txn) => {
      if (!txn.expected_delivery_date) return true;
      const txDate = txn.transaction_date
        ? new Date(txn.transaction_date)
        : new Date(txn.created_at);
      return txDate <= new Date(txn.expected_delivery_date);
    }).length;

    const deliveryPerformance =
      transactions.length > 0
        ? (onTimeDeliveries / transactions.length) * 100
        : 0;

    const lastTxnDate =
      transactions.length > 0
        ? Math.max(
            ...transactions.map((t) =>
              new Date(t.transaction_date || t.created_at).getTime(),
            ),
          )
        : null;

    return {
      total_assets: totalAssets,
      active_assets: activeAssets,
      asset_utilization:
        totalAssets > 0 ? (activeAssets / totalAssets) * 100 : 0,
      condition_breakdown: conditionCounts,
      maintenance_frequency:
        totalAssets > 0 ? maintenanceCount / totalAssets : 0,
      total_purchase_value: totalValue,
      total_transactions: transactions.length,
      delivery_performance: deliveryPerformance,
      last_transaction_date: lastTxnDate
        ? new Date(lastTxnDate).toISOString()
        : null,
    };
  } catch (error) {
    logger.error("Error calculating vendor performance:", error);
    return {
      total_assets: 0,
      active_assets: 0,
      asset_utilization: 0,
      condition_breakdown: {},
      maintenance_frequency: 0,
      total_purchase_value: 0,
      total_transactions: 0,
      delivery_performance: 0,
      last_transaction_date: null,
    };
  }
}
