const getSupabase = require("../config/db");
const logger = require("../utils/logger");
const cache = require("../config/redis");

// ========================================
// DEAD STOCK CONTROLLERS
// ========================================

/**
 * @desc    Get all dead stock items
 * @route   GET /api/v1/inventory/dead-stock
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getDeadStockItems = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 50,
      search = "",
      category = "",
      status = "",
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const supabase = getSupabase();
    if (sortBy === "createdAt") sortBy = "created_at";
    if (sortBy === "updatedAt") sortBy = "updated_at";
    if (sortBy === "createdAt") sortBy = "created_at";
    if (sortBy === "updatedAt") sortBy = "updated_at";
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const from = (pageInt - 1) * limitInt;
    const to = from + limitInt - 1;

    let query = supabase.from("assets").select("*", { count: "exact" });

    if (status) {
      // Explicit status filter overrides default dead-stock filter
      query = query.eq("status", status).neq("status", "Disposed");
    } else {
      // Default: assets that are Ready for Scrap, Obsolete, or Beyond Repair
      // and NOT disposed
      query = query.in("status", ["Ready for Scrap"]).neq("status", "Disposed");
    }

    if (search) {
      query = query.or(
        `unique_asset_id.ilike.%${search}%,asset_type.ilike.%${search}%,manufacturer.ilike.%${search}%,model.ilike.%${search}%,serial_number.ilike.%${search}%`,
      );
    }

    if (category) {
      query = query.eq("asset_type", category);
    }

    // Sort direction
    const ascending = sortOrder !== "desc";
    query = query.order(sortBy, { ascending }).range(from, to);

    const { data: assets, error, count: totalCount } = await query;

    if (error) throw error;

    const transformedAssets = (assets || []).map((asset) => ({
      id: asset.id,
      unique_asset_id: asset.unique_asset_id,
      category: asset.asset_type,
      model: asset.model,
      manufacturer: asset.manufacturer,
      serial_number: asset.serial_number,
      purchase_date: asset.purchase_date,
      purchase_value: asset.purchase_cost,
      reason_for_dead_stock: asset.condition || "Not specified",
      status: asset.status,
      location: asset.location,
      department: asset.department,
      warranty_expiry: asset.warranty_expiry,
    }));

    logger.info("Dead stock items retrieved", {
      userId: req.user.id,
      count: transformedAssets.length,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      data: transformedAssets,
      pagination: {
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil((totalCount || 0) / limitInt),
        totalItems: totalCount || 0,
        hasNextPage: from + transformedAssets.length < (totalCount || 0),
        hasPrevPage: pageInt > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching dead stock items:", error);
    next(error);
  }
};

/**
 * @desc    Get dead stock statistics
 * @route   GET /api/v1/inventory/dead-stock/stats
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getDeadStockStats = async (req, res, next) => {
  try {
    const supabase = getSupabase();

    // Count dead stock items (Ready for Scrap, not Disposed)
    const { count: deadStockAssets, error: countError } = await supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .in("status", ["Ready for Scrap"])
      .neq("status", "Disposed");

    if (countError) throw countError;

    // Sum total purchase_cost for dead stock items
    const { data: valueData, error: valueError } = await supabase
      .from("assets")
      .select("purchase_cost")
      .in("status", ["Ready for Scrap"])
      .neq("status", "Disposed");

    if (valueError) throw valueError;

    const totalValue = (valueData || []).reduce(
      (sum, asset) => sum + (parseFloat(asset.purchase_cost) || 0),
      0,
    );

    // Count disposed assets
    const { count: pendingDisposal, error: disposedError } = await supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("status", "Disposed");

    if (disposedError) throw disposedError;

    logger.info("Dead stock stats retrieved", { userId: req.user.id });

    return res.status(200).json({
      success: true,
      data: {
        totalDeadStock: deadStockAssets || 0,
        totalValue,
        pendingDisposal: pendingDisposal || 0,
      },
    });
  } catch (error) {
    logger.error("Error fetching dead stock stats:", error);
    next(error);
  }
};

/**
 * @desc    Mark asset as dead stock
 * @route   POST /api/v1/inventory/dead-stock
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.markAsDeadStock = async (req, res, next) => {
  try {
    const { assetId, reason, notes } = req.body;

    if (!assetId) {
      return res.status(400).json({
        success: false,
        message: "Asset ID is required",
      });
    }

    const supabase = getSupabase();

    const { data: existing, error: findError } = await supabase
      .from("assets")
      .select("*")
      .eq("id", assetId)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    const { data: asset, error: updateError } = await supabase
      .from("assets")
      .update({
        status: "Ready for Scrap",
        condition: reason || "Marked as Dead Stock",
        notes: notes || "",
      })
      .eq("id", assetId)
      .select()
      .single();

    if (updateError) throw updateError;

    logger.info("Asset marked as dead stock", {
      userId: req.user.id,
      assetId: asset.id,
      reason,
    });

    return res.status(200).json({
      success: true,
      message: "Asset marked as dead stock successfully",
      data: asset,
    });
  } catch (error) {
    logger.error("Error marking asset as dead stock:", error);
    next(error);
  }
};

/**
 * @desc    Update dead stock item
 * @route   PUT /api/v1/inventory/dead-stock/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.updateDeadStockItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const supabase = getSupabase();

    const { data: asset, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !asset) {
      return res.status(404).json({
        success: false,
        message: "Dead stock item not found",
      });
    }

    logger.info("Dead stock item updated", {
      userId: req.user.id,
      assetId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Dead stock item updated successfully",
      data: asset,
    });
  } catch (error) {
    logger.error("Error updating dead stock item:", error);
    next(error);
  }
};

/**
 * @desc    Remove from dead stock
 * @route   DELETE /api/v1/inventory/dead-stock/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.removeFromDeadStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newStatus = "Available" } = req.body;

    const supabase = getSupabase();

    const { data: asset, error } = await supabase
      .from("assets")
      .update({ status: newStatus, condition: "good" })
      .eq("id", id)
      .select()
      .single();

    if (error || !asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    logger.info("Asset removed from dead stock", {
      userId: req.user.id,
      assetId: id,
      newStatus,
    });

    return res.status(200).json({
      success: true,
      message: "Asset removed from dead stock successfully",
      data: asset,
    });
  } catch (error) {
    logger.error("Error removing from dead stock:", error);
    next(error);
  }
};

// ========================================
// DISPOSAL RECORDS CONTROLLERS
// ========================================

/**
 * @desc    Get all disposal records
 * @route   GET /api/v1/inventory/disposal-records
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getDisposalRecords = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 50,
      search = "",
      status = "",
      method = "",
      startDate = "",
      endDate = "",
      sortBy = "disposal_date",
      sortOrder = "desc",
    } = req.query;

    const supabase = getSupabase();
    if (sortBy === "createdAt") sortBy = "created_at";
    if (sortBy === "updatedAt") sortBy = "updated_at";
    if (sortBy === "createdAt") sortBy = "created_at";
    if (sortBy === "updatedAt") sortBy = "updated_at";
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const from = (pageInt - 1) * limitInt;
    const to = from + limitInt - 1;

    let query = supabase
      .from("disposal_records")
      .select("*", { count: "exact" });

    if (search) {
      query = query.or(
        `asset_id.ilike.%${search}%,asset_name.ilike.%${search}%,document_reference.ilike.%${search}%,approved_by.ilike.%${search}%`,
      );
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (method) {
      query = query.eq("disposal_method", method);
    }

    if (startDate) {
      query = query.gte("disposal_date", new Date(startDate).toISOString());
    }

    if (endDate) {
      query = query.lte("disposal_date", new Date(endDate).toISOString());
    }

    const ascending = sortOrder !== "desc";
    query = query.order(sortBy, { ascending }).range(from, to);

    const { data: records, error, count: totalCount } = await query;

    if (error) throw error;

    const transformedRecords = (records || []).map((r) => ({
      id: r.id || "",
      asset_id: r.asset_id,
      asset_name: r.asset_name,
      category: r.category,
      disposal_date: r.disposal_date || "",
      disposal_method: r.disposal_method,
      disposal_value:
        typeof r.disposal_value === "number"
          ? r.disposal_value
          : Number(r.disposal_value || 0),
      approved_by: r.approved_by,
      document_reference: r.document_reference,
      status: r.status || "pending",
      remarks: r.remarks || "",
    }));

    logger.info("Disposal records retrieved", {
      userId: req.user.id,
      count: transformedRecords.length,
    });

    return res.status(200).json({
      success: true,
      data: transformedRecords,
      pagination: {
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil((totalCount || 0) / limitInt),
        totalItems: totalCount || 0,
        hasNextPage: from + transformedRecords.length < (totalCount || 0),
        hasPrevPage: pageInt > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching disposal records:", error);
    next(error);
  }
};

/**
 * @desc    Get disposal record by ID
 * @route   GET /api/v1/inventory/disposal-records/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getDisposalRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supabase = getSupabase();

    const { data: record, error } = await supabase
      .from("disposal_records")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !record) {
      return res.status(404).json({
        success: false,
        message: "Disposal record not found",
      });
    }

    logger.info("Disposal record retrieved", {
      userId: req.user.id,
      recordId: id,
    });

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error) {
    logger.error("Error fetching disposal record:", error);
    next(error);
  }
};

/**
 * @desc    Create disposal record
 * @route   POST /api/v1/inventory/disposal-records
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.createDisposalRecord = async (req, res, next) => {
  try {
    const supabase = getSupabase();

    const recordData = {
      ...req.body,
      created_by: req.user.id,
      approved_by: req.user.email,
    };

    const { data: record, error } = await supabase
      .from("disposal_records")
      .insert(recordData)
      .select()
      .single();

    if (error) throw error;

    logger.info("Disposal record created", {
      userId: req.user.id,
      recordId: record.id,
    });

    return res.status(201).json({
      success: true,
      message: "Disposal record created successfully",
      data: record,
    });
  } catch (error) {
    logger.error("Error creating disposal record:", error);
    next(error);
  }
};

/**
 * @desc    Update disposal record
 * @route   PUT /api/v1/inventory/disposal-records/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.updateDisposalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const supabase = getSupabase();

    const { data: record, error } = await supabase
      .from("disposal_records")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !record) {
      return res.status(404).json({
        success: false,
        message: "Disposal record not found",
      });
    }

    logger.info("Disposal record updated", {
      userId: req.user.id,
      recordId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Disposal record updated successfully",
      data: record,
    });
  } catch (error) {
    logger.error("Error updating disposal record:", error);
    next(error);
  }
};

/**
 * @desc    Delete disposal record
 * @route   DELETE /api/v1/inventory/disposal-records/:id
 * @access  Private (ADMIN only)
 */
exports.deleteDisposalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supabase = getSupabase();

    // Verify record exists first
    const { data: existing, error: findError } = await supabase
      .from("disposal_records")
      .select("id")
      .eq("id", id)
      .single();

    if (findError || !existing) {
      return res.status(404).json({
        success: false,
        message: "Disposal record not found",
      });
    }

    const { error } = await supabase
      .from("disposal_records")
      .delete()
      .eq("id", id);

    if (error) throw error;

    logger.info("Disposal record deleted", {
      userId: req.user.id,
      recordId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Disposal record deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting disposal record:", error);
    next(error);
  }
};

/**
 * @desc    Get scrap items (combines disposal records with assets ready for scrap)
 * @route   GET /api/v1/inventory/scrap
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getScrapItems = async (req, res, next) => {
  try {
    let {
      page = 1,
      limit = 50,
      search = "",
      status = "",
      sortBy = "created_at",
      sortOrder = "desc",
    } = req.query;

    const supabase = getSupabase();
    if (sortBy === "createdAt") sortBy = "created_at";
    if (sortBy === "updatedAt") sortBy = "updated_at";
    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const from = (pageInt - 1) * limitInt;
    const to = from + limitInt - 1;

    // Query assets with 'Ready for Scrap' status
    let assetsQuery = supabase
      .from("assets")
      .select("*", { count: "exact" })
      .eq("status", "Ready for Scrap");

    if (search) {
      assetsQuery = assetsQuery.or(
        `unique_asset_id.ilike.%${search}%,name.ilike.%${search}%,manufacturer.ilike.%${search}%,model.ilike.%${search}%,serial_number.ilike.%${search}%`,
      );
    }

    const ascending = sortOrder !== "desc";
    assetsQuery = assetsQuery.order(sortBy, { ascending }).range(from, to);

    const [assetsResult, disposalResult] = await Promise.all([
      assetsQuery,
      supabase.from("disposal_records").select("*"),
    ]);

    if (assetsResult.error) throw assetsResult.error;
    if (disposalResult.error) throw disposalResult.error;

    const assets = assetsResult.data || [];
    const disposalRecords = disposalResult.data || [];
    const totalCount = assetsResult.count || 0;

    // Build vendor id set for a batch lookup
    const vendorIds = [...new Set(assets.map((a) => a.vendor).filter(Boolean))];
    let vendorMap = {};
    if (vendorIds.length > 0) {
      const { data: vendors } = await supabase
        .from("vendors")
        .select("id, company_name")
        .in("id", vendorIds);
      (vendors || []).forEach((v) => {
        vendorMap[v.id] = v.company_name;
      });
    }

    // Disposal map keyed by asset_id string
    const disposalMap = {};
    disposalRecords.forEach((record) => {
      disposalMap[record.asset_id] = record;
    });

    const scrapItems = assets.map((asset) => {
      const disposal =
        disposalMap[asset.unique_asset_id] || disposalMap[asset.id];

      let scrapReason = "End of Life";
      if (
        asset.condition === "damaged" ||
        asset.condition === "Beyond Repair"
      ) {
        scrapReason = "Beyond Repair";
      } else if (asset.condition === "Obsolete") {
        scrapReason = "Obsolete";
      }

      let itemStatus = "Pending Approval";
      let approvalDate = null;
      let disposalDate = null;

      if (disposal) {
        if (disposal.status === "completed") {
          if (disposal.disposal_method === "Scrap") {
            itemStatus = "Recycled";
          } else if (disposal.disposal_method === "Sale") {
            itemStatus = "Sold";
          } else {
            itemStatus = "Disposed";
          }
          disposalDate = disposal.disposal_date;
          approvalDate = disposal.created_at;
        } else if (disposal.status === "in_progress") {
          itemStatus = "In Disposal Process";
          approvalDate = disposal.created_at;
        } else if (disposal.status === "pending") {
          itemStatus = "Approved for Scrap";
          approvalDate = disposal.created_at;
        }
      }

      return {
        id: asset.id,
        assetId: asset.unique_asset_id,
        assetName: asset.name || asset.model || "Unknown Asset",
        category: asset.asset_type || "General",
        manufacturer: asset.manufacturer || "Unknown",
        model: asset.model || "Unknown",
        serialNumber: asset.serial_number || "N/A",
        currentLocation: asset.location || "Unknown",
        scrapReason,
        scrapDate: asset.updated_at || new Date().toISOString(),
        approvalDate: approvalDate || null,
        disposalDate: disposalDate || null,
        status: itemStatus,
        originalValue: parseFloat(asset.purchase_cost) || 0,
        scrapValue:
          disposal?.disposal_value ||
          Math.round((parseFloat(asset.purchase_cost) || 0) * 0.1),
        disposalMethod: disposal?.disposal_method || "Recycle",
        approvedBy: disposal?.approved_by || null,
        vendorName: vendorMap[asset.vendor] || null,
        documentReference: disposal?.document_reference || null,
        environmentalCompliance: true,
      };
    });

    const filteredItems = status
      ? scrapItems.filter((item) => item.status === status)
      : scrapItems;

    logger.info("Scrap items retrieved", {
      userId: req.user.id,
      count: filteredItems.length,
    });

    return res.status(200).json({
      success: true,
      data: filteredItems,
      pagination: {
        page: pageInt,
        limit: limitInt,
        totalPages: Math.ceil(totalCount / limitInt),
        totalItems: totalCount,
      },
    });
  } catch (error) {
    logger.error("Error fetching scrap items:", error);
    next(error);
  }
};

/**
 * @desc    Approve scrap item
 * @route   POST /api/v1/inventory/scrap/:id/approve
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.approveScrapItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supabase = getSupabase();

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Check if disposal record exists for this asset
    const { data: existingDisposals } = await supabase
      .from("disposal_records")
      .select("*")
      .or(`asset_id.eq.${asset.unique_asset_id},asset_id.eq.${id}`);

    let disposal;

    if (!existingDisposals || existingDisposals.length === 0) {
      // Create new disposal record
      const { data: newDisposal, error: createError } = await supabase
        .from("disposal_records")
        .insert({
          asset_id: asset.unique_asset_id,
          asset_name: asset.name || asset.model,
          category: asset.asset_type,
          disposal_method: "Scrap",
          disposal_value: Math.round(
            (parseFloat(asset.purchase_cost) || 0) * 0.1,
          ),
          approved_by: req.user.email || req.user.full_name,
          status: "pending",
          created_by: req.user.id,
        })
        .select()
        .single();

      if (createError) throw createError;
      disposal = newDisposal;
    } else {
      // Update existing disposal record
      const { data: updatedDisposal, error: updateError } = await supabase
        .from("disposal_records")
        .update({
          status: "pending",
          approved_by: req.user.email || req.user.full_name,
        })
        .eq("id", existingDisposals[0].id)
        .select()
        .single();

      if (updateError) throw updateError;
      disposal = updatedDisposal;
    }

    logger.info("Scrap item approved", {
      userId: req.user.id,
      assetId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Scrap item approved successfully",
      data: disposal,
    });
  } catch (error) {
    logger.error("Error approving scrap item:", error);
    next(error);
  }
};

/**
 * @desc    Create new scrap request
 * @route   POST /api/v1/inventory/scrap
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.createScrapRequest = async (req, res, next) => {
  try {
    const { assetId, scrapReason, estimatedValue, disposalMethod, notes } =
      req.body;

    if (!assetId || !scrapReason) {
      return res.status(400).json({
        success: false,
        message: "Asset ID and scrap reason are required",
      });
    }

    const supabase = getSupabase();

    // Find the asset by unique_asset_id or id
    const { data: assets } = await supabase
      .from("assets")
      .select("*")
      .or(`unique_asset_id.eq.${assetId},id.eq.${assetId}`);

    const asset = assets && assets.length > 0 ? assets[0] : null;

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    if (asset.status === "Ready for Scrap") {
      return res.status(400).json({
        success: false,
        message: "Asset is already marked for scrap",
      });
    }

    // Determine new condition
    let newCondition = asset.condition;
    if (scrapReason === "Beyond Repair") newCondition = "damaged";
    else if (scrapReason === "Obsolete") newCondition = "poor";

    // Update asset status
    const { error: updateError } = await supabase
      .from("assets")
      .update({ status: "Ready for Scrap", condition: newCondition })
      .eq("id", asset.id);

    if (updateError) throw updateError;

    // Create disposal record
    const { data: disposal, error: disposalError } = await supabase
      .from("disposal_records")
      .insert({
        asset_id: asset.unique_asset_id,
        asset_name: asset.name || asset.model,
        category: asset.asset_type,
        disposal_method: disposalMethod || "Scrap",
        disposal_value:
          estimatedValue ||
          Math.round((parseFloat(asset.purchase_cost) || 0) * 0.1),
        remarks: notes,
        status: "pending",
        created_by: req.user.id,
      })
      .select()
      .single();

    if (disposalError) throw disposalError;

    logger.info("Scrap request created", {
      userId: req.user.id,
      assetId: asset.id,
      disposalId: disposal.id,
    });

    return res.status(201).json({
      success: true,
      message: "Scrap request created successfully",
      data: disposal,
    });
  } catch (error) {
    logger.error("Error creating scrap request:", error);
    next(error);
  }
};

/**
 * @desc    Get scrap item by ID
 * @route   GET /api/v1/inventory/scrap/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getScrapItemById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supabase = getSupabase();

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({
        success: false,
        message: "Scrap item not found",
      });
    }

    // Fetch vendor name if present
    let vendorName = null;
    if (asset.vendor) {
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("company_name")
        .eq("id", asset.vendor)
        .single();
      vendorName = vendorData?.company_name || null;
    }

    // Get disposal record
    const { data: disposals } = await supabase
      .from("disposal_records")
      .select("*")
      .or(`asset_id.eq.${asset.unique_asset_id},asset_id.eq.${id}`);

    const disposal = disposals && disposals.length > 0 ? disposals[0] : null;

    let scrapReason = "End of Life";
    if (asset.condition === "damaged" || asset.condition === "Beyond Repair") {
      scrapReason = "Beyond Repair";
    } else if (asset.condition === "Obsolete") {
      scrapReason = "Obsolete";
    }

    let itemStatus = "Pending Approval";
    let approvalDate = null;
    let disposalDate = null;

    if (disposal) {
      if (disposal.status === "completed") {
        itemStatus = disposal.disposal_method === "Sale" ? "Sold" : "Recycled";
        disposalDate = disposal.disposal_date;
        approvalDate = disposal.created_at;
      } else if (disposal.status === "in_progress") {
        itemStatus = "In Disposal Process";
        approvalDate = disposal.created_at;
      } else if (disposal.status === "pending") {
        itemStatus = "Approved for Scrap";
        approvalDate = disposal.created_at;
      }
    }

    const scrapItem = {
      id: asset.id,
      assetId: asset.unique_asset_id,
      assetName: asset.name || asset.model || "Unknown Asset",
      category: asset.asset_type || "General",
      manufacturer: asset.manufacturer || "Unknown",
      model: asset.model || "Unknown",
      serialNumber: asset.serial_number || "N/A",
      currentLocation: asset.location || "Unknown",
      scrapReason,
      scrapDate: asset.updated_at || new Date().toISOString(),
      approvalDate: approvalDate || null,
      disposalDate: disposalDate || null,
      status: itemStatus,
      originalValue: parseFloat(asset.purchase_cost) || 0,
      scrapValue:
        disposal?.disposal_value ||
        Math.round((parseFloat(asset.purchase_cost) || 0) * 0.1),
      disposalMethod: disposal?.disposal_method || "Recycle",
      approvedBy: disposal?.approved_by || null,
      vendorName,
      documentReference: disposal?.document_reference || null,
      environmentalCompliance: true,
    };

    return res.status(200).json({
      success: true,
      data: scrapItem,
    });
  } catch (error) {
    logger.error("Error fetching scrap item:", error);
    next(error);
  }
};

/**
 * @desc    Update scrap item
 * @route   PATCH /api/v1/inventory/scrap/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.updateScrapItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, disposalDate, vendorName, documentReference } = req.body;

    const supabase = getSupabase();

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Find disposal record
    const { data: disposals } = await supabase
      .from("disposal_records")
      .select("*")
      .or(`asset_id.eq.${asset.unique_asset_id},asset_id.eq.${id}`);

    if (!disposals || disposals.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Disposal record not found",
      });
    }

    const disposalId = disposals[0].id;
    const disposalUpdates = {};

    if (status === "In Disposal Process") {
      disposalUpdates.status = "in_progress";
    } else if (
      status === "Disposed" ||
      status === "Sold" ||
      status === "Recycled"
    ) {
      disposalUpdates.status = "completed";
      disposalUpdates.disposal_date = disposalDate || new Date().toISOString();
    }

    if (documentReference)
      disposalUpdates.document_reference = documentReference;
    // vendorName is not a column in disposal_records; it is stored in the vendors table

    const { data: disposal, error: updateError } = await supabase
      .from("disposal_records")
      .update(disposalUpdates)
      .eq("id", disposalId)
      .select()
      .single();

    if (updateError) throw updateError;

    logger.info("Scrap item updated", {
      userId: req.user.id,
      assetId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Scrap item updated successfully",
      data: disposal,
    });
  } catch (error) {
    logger.error("Error updating scrap item:", error);
    next(error);
  }
};

/**
 * @desc    Delete scrap item
 * @route   DELETE /api/v1/inventory/scrap/:id
 * @access  Private (ADMIN only)
 */
exports.deleteScrapItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supabase = getSupabase();

    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    if (assetError || !asset) {
      return res.status(404).json({
        success: false,
        message: "Asset not found",
      });
    }

    // Restore asset status to Available
    const { error: updateError } = await supabase
      .from("assets")
      .update({ status: "Available" })
      .eq("id", id);

    if (updateError) throw updateError;

    // Delete related disposal records
    await supabase
      .from("disposal_records")
      .delete()
      .or(`asset_id.eq.${asset.unique_asset_id},asset_id.eq.${id}`);

    logger.info("Scrap item deleted", {
      userId: req.user.id,
      assetId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Scrap item deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting scrap item:", error);
    next(error);
  }
};

/**
 * @desc    Get scrap statistics
 * @route   GET /api/v1/inventory/scrap/stats
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getScrapStats = async (req, res, next) => {
  try {
    const supabase = getSupabase();

    const [assetsResult, disposalResult] = await Promise.all([
      supabase.from("assets").select("*").eq("status", "Ready for Scrap"),
      supabase.from("disposal_records").select("*"),
    ]);

    if (assetsResult.error) throw assetsResult.error;
    if (disposalResult.error) throw disposalResult.error;

    const assets = assetsResult.data || [];
    const disposalRecords = disposalResult.data || [];

    const disposalMap = {};
    disposalRecords.forEach((record) => {
      disposalMap[record.asset_id] = record;
    });

    let pendingCount = 0;
    let approvedCount = 0;
    let inProcessCount = 0;
    let completedCount = 0;
    let totalScrapValue = 0;
    let totalOriginalValue = 0;

    assets.forEach((asset) => {
      const disposal =
        disposalMap[asset.unique_asset_id] || disposalMap[asset.id];

      if (disposal) {
        if (disposal.status === "completed") {
          completedCount++;
          totalScrapValue += disposal.disposal_value || 0;
          totalOriginalValue += parseFloat(asset.purchase_cost) || 0;
        } else if (disposal.status === "in_progress") {
          inProcessCount++;
        } else if (disposal.status === "pending") {
          approvedCount++;
        }
      } else {
        pendingCount++;
      }
    });

    const stats = {
      pendingCount,
      approvedCount,
      inProcessCount,
      completedCount,
      totalScrapValue,
      totalLossValue: totalOriginalValue - totalScrapValue,
    };

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching scrap stats:", error);
    next(error);
  }
};

/**
 * @desc    Export scrap report
 * @route   GET /api/v1/inventory/scrap/export
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.exportScrapReport = async (req, res, next) => {
  try {
    const { format = "csv", search = "", status = "" } = req.query;

    const supabase = getSupabase();

    let assetsQuery = supabase
      .from("assets")
      .select("*")
      .eq("status", "Ready for Scrap");

    if (search) {
      assetsQuery = assetsQuery.or(
        `unique_asset_id.ilike.%${search}%,name.ilike.%${search}%,manufacturer.ilike.%${search}%,serial_number.ilike.%${search}%`,
      );
    }

    const [assetsResult, disposalResult] = await Promise.all([
      assetsQuery,
      supabase.from("disposal_records").select("*"),
    ]);

    if (assetsResult.error) throw assetsResult.error;
    if (disposalResult.error) throw disposalResult.error;

    const assets = assetsResult.data || [];
    const disposalRecords = disposalResult.data || [];

    const disposalMap = {};
    disposalRecords.forEach((record) => {
      disposalMap[record.asset_id] = record;
    });

    const scrapItems = assets.map((asset) => {
      const disposal =
        disposalMap[asset.unique_asset_id] || disposalMap[asset.id];

      let scrapReason = "End of Life";
      if (
        asset.condition === "damaged" ||
        asset.condition === "Beyond Repair"
      ) {
        scrapReason = "Beyond Repair";
      } else if (asset.condition === "Obsolete") {
        scrapReason = "Obsolete";
      }

      let itemStatus = "Pending Approval";
      if (disposal) {
        if (disposal.status === "completed") {
          itemStatus =
            disposal.disposal_method === "Sale" ? "Sold" : "Recycled";
        } else if (disposal.status === "in_progress") {
          itemStatus = "In Disposal Process";
        } else if (disposal.status === "pending") {
          itemStatus = "Approved for Scrap";
        }
      }

      return {
        assetId: asset.unique_asset_id,
        assetName: asset.name || asset.model || "Unknown Asset",
        category: asset.asset_type || "General",
        manufacturer: asset.manufacturer || "Unknown",
        model: asset.model || "Unknown",
        serialNumber: asset.serial_number || "N/A",
        location: asset.location || "Unknown",
        scrapReason,
        status: itemStatus,
        originalValue: parseFloat(asset.purchase_cost) || 0,
        scrapValue:
          disposal?.disposal_value ||
          Math.round((parseFloat(asset.purchase_cost) || 0) * 0.1),
        disposalMethod: disposal?.disposal_method || "Recycle",
        approvedBy: disposal?.approved_by || "N/A",
        scrapDate: asset.updated_at
          ? asset.updated_at.split("T")[0]
          : new Date().toISOString().split("T")[0],
      };
    });

    const filteredItems =
      status && status !== "All"
        ? scrapItems.filter((item) => item.status === status)
        : scrapItems;

    if (format === "csv") {
      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return "";
        const stringValue = String(value);
        if (
          stringValue.includes('"') ||
          stringValue.includes(",") ||
          stringValue.includes("\n") ||
          stringValue.includes("\r")
        ) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return `"${stringValue}"`;
      };

      const csvHeaders = [
        "Asset ID",
        "Asset Name",
        "Category",
        "Manufacturer",
        "Model",
        "Serial Number",
        "Location",
        "Scrap Reason",
        "Status",
        "Original Value (₹)",
        "Scrap Value (₹)",
        "Disposal Method",
        "Approved By",
        "Scrap Date",
      ];

      const csvRows = filteredItems.map((item) => [
        escapeCsvValue(item.assetId),
        escapeCsvValue(item.assetName),
        escapeCsvValue(item.category),
        escapeCsvValue(item.manufacturer),
        escapeCsvValue(item.model),
        escapeCsvValue(item.serialNumber),
        escapeCsvValue(item.location),
        escapeCsvValue(item.scrapReason),
        escapeCsvValue(item.status),
        escapeCsvValue(
          item.originalValue ? item.originalValue.toLocaleString("en-IN") : "0",
        ),
        escapeCsvValue(
          item.scrapValue ? item.scrapValue.toLocaleString("en-IN") : "0",
        ),
        escapeCsvValue(item.disposalMethod),
        escapeCsvValue(item.approvedBy),
        escapeCsvValue(item.scrapDate),
      ]);

      const BOM = "\uFEFF";
      const csvContent =
        BOM +
        [
          csvHeaders.map((h) => escapeCsvValue(h)).join(","),
          ...csvRows.map((row) => row.join(",")),
        ].join("\r\n");

      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=scrap-report-${new Date().toISOString().split("T")[0]}.csv`,
      );

      logger.info("Scrap report exported", {
        userId: req.user.id,
        format,
        count: filteredItems.length,
      });

      return res.send(csvContent);
    }

    return res.status(400).json({
      success: false,
      message: "Unsupported export format. Only CSV is supported.",
    });
  } catch (error) {
    logger.error("Error exporting scrap report:", error);
    next(error);
  }
};

// ========================================
// ASSET CATEGORIES CONTROLLERS
// ========================================

/**
 * @desc    Get all asset categories
 * @route   GET /api/v1/inventory/categories
 * @access  Public (All authenticated users)
 */
exports.getCategories = async (req, res, next) => {
  try {
    const cacheKey = "inventory:categories";
    const cachedData = await cache.get(cacheKey);
    if (cachedData) {
      logger.info("Asset categories retrieved from cache", {
        userId: req.user?.id,
      });
      return res.status(200).json({
        success: true,
        data: cachedData,
      });
    }

    const supabase = getSupabase();

    const [categoriesResult, countsResult] = await Promise.all([
      supabase.from("asset_categories").select("*").eq("active", true),
      supabase.from("assets").select("asset_type"),
    ]);

    if (categoriesResult.error) throw categoriesResult.error;
    if (countsResult.error) throw countsResult.error;

    const categories = categoriesResult.data || [];
    const assetRows = countsResult.data || [];

    // Build count map
    const countMap = {};
    assetRows.forEach((row) => {
      countMap[row.asset_type] = (countMap[row.asset_type] || 0) + 1;
    });

    const categoriesWithCounts = categories.map((category) => ({
      ...category,
      count: countMap[category.name] || 0,
    }));

    // Cache categories for 5 minutes (300 seconds)
    await cache.set(cacheKey, categoriesWithCounts, 300);

    logger.info("Asset categories retrieved from database and cached", {
      userId: req.user?.id,
    });

    return res.status(200).json({
      success: true,
      data: categoriesWithCounts,
    });
  } catch (error) {
    logger.error("Error fetching categories:", error);
    next(error);
  }
};

/**
 * @desc    Create asset category
 * @route   POST /api/v1/inventory/categories
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const supabase = getSupabase();

    // Check duplicate
    const { data: existingCategory } = await supabase
      .from("asset_categories")
      .select("id")
      .eq("name", name)
      .single();

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists",
      });
    }

    const { data: category, error } = await supabase
      .from("asset_categories")
      .insert({ name, description, color, created_by: req.user.id })
      .select()
      .single();

    if (error) throw error;

    // Invalidate categories cache
    await cache.del("inventory:categories");

    logger.info("Asset category created", {
      userId: req.user.id,
      categoryId: category.id,
      name,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    logger.error("Error creating category:", error);
    next(error);
  }
};

/**
 * @desc    Update asset category
 * @route   PUT /api/v1/inventory/categories/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const supabase = getSupabase();

    const { data: category, error } = await supabase
      .from("asset_categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error || !category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    logger.info("Asset category updated", {
      userId: req.user.id,
      categoryId: id,
    });

    // Invalidate categories cache
    await cache.del("inventory:categories");

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    logger.error("Error updating category:", error);
    next(error);
  }
};

/**
 * @desc    Delete asset category
 * @route   DELETE /api/v1/inventory/categories/:id
 * @access  Private (ADMIN only)
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const supabase = getSupabase();

    // Get category name first
    const { data: categoryRow, error: findError } = await supabase
      .from("asset_categories")
      .select("name")
      .eq("id", id)
      .single();

    if (findError || !categoryRow) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Check if any assets use this category
    const { count: assetsUsingCategory, error: countError } = await supabase
      .from("assets")
      .select("*", { count: "exact", head: true })
      .eq("asset_type", categoryRow.name);

    if (countError) throw countError;

    if (assetsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${assetsUsingCategory} assets are using this category.`,
      });
    }

    const { error } = await supabase
      .from("asset_categories")
      .delete()
      .eq("id", id);

    if (error) throw error;

    // Invalidate categories cache
    await cache.del("inventory:categories");

    logger.info("Asset category deleted", {
      userId: req.user.id,
      categoryId: id,
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting category:", error);
    next(error);
  }
};
