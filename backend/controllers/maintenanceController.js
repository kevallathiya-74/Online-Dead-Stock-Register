const getSupabase = require("../config/db");
const logger = require("../utils/logger");

exports.getMaintenanceRecords = async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: records, error } = await supabase.from("maintenances")
      .select(`
        *,
        assets:asset_id ( id, name, unique_asset_id, asset_type ),
        vendors:vendor_id ( id, company_name )
      `);

    if (error) throw error;

    const transformedRecords = (records || []).map((record) => {
      const asset = record.assets;
      return {
        id: record.id,
        asset_id: asset?.id || "",
        asset_name: asset?.name || asset?.unique_asset_id || "Unknown Asset",
        type: record.maintenance_type || "Corrective",
        description: record.description || "No description provided",
        scheduled_date: record.maintenance_date || new Date().toISOString(),
        completed_date:
          record.status === "Completed" && record.updated_at
            ? record.updated_at
            : null,
        status: record.status || "Scheduled",
        priority: record.priority || "Medium",
        assigned_technician: record.performed_by || "Unassigned",
        estimated_cost: record.cost || 0,
        actual_cost: record.status === "Completed" ? record.cost : null,
        estimated_duration: record.estimated_duration || 2,
        actual_duration:
          record.status === "Completed" ? record.estimated_duration : null,
        next_maintenance_date: record.next_maintenance_date || null,
        notes: record.description || "",
        downtime_impact: record.downtime_impact || "Low",
      };
    });

    logger.info("Maintenance records retrieved", {
      userId: req.user?.id,
      count: transformedRecords.length,
    });

    return res.json({ success: true, data: transformedRecords });
  } catch (err) {
    logger.error("Error fetching maintenance records:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance records",
    });
  }
};

exports.createMaintenanceRecord = async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      asset_id,
      maintenance_type,
      maintenance_date,
      description,
      cost,
      performed_by,
      priority,
      status,
      estimated_duration,
      downtime_impact,
    } = req.body;

    if (!asset_id) {
      return res
        .status(400)
        .json({ success: false, message: "Asset ID is required" });
    }
    if (!maintenance_type) {
      return res
        .status(400)
        .json({ success: false, message: "Maintenance type is required" });
    }
    if (!maintenance_date) {
      return res
        .status(400)
        .json({ success: false, message: "Maintenance date is required" });
    }

    // Verify asset exists
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, name, unique_asset_id, asset_type")
      .eq("id", asset_id)
      .single();

    if (assetError || !asset) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    const maintenanceData = {
      asset_id,
      maintenance_type,
      maintenance_date: new Date(maintenance_date).toISOString(),
      description:
        description ||
        `${maintenance_type} maintenance for ${asset.name || asset.unique_asset_id}`,
      cost: cost || 0,
      performed_by: performed_by || "Unassigned",
      priority: priority || "Medium",
      status: status || "Scheduled",
      estimated_duration: estimated_duration || 2,
      downtime_impact: downtime_impact || "Low",
      created_by: req.user?.id || null,
    };

    const { data: saved, error: insertError } = await supabase
      .from("maintenances")
      .insert(maintenanceData)
      .select(`*, assets:asset_id ( id, name, unique_asset_id, asset_type )`)
      .single();

    if (insertError) throw insertError;

    logger.info("Maintenance record created", {
      userId: req.user?.id,
      maintenanceId: saved.id,
      assetId: asset_id,
    });

    return res.status(201).json({
      success: true,
      message: "Maintenance scheduled successfully",
      data: saved,
    });
  } catch (err) {
    logger.error("Error creating maintenance record:", err);
    return res.status(400).json({
      success: false,
      message: "Failed to create maintenance record",
    });
  }
};

exports.getMaintenanceById = async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: rec, error } = await supabase
      .from("maintenances")
      .select(`*, assets:asset_id ( id, name, unique_asset_id, asset_type )`)
      .eq("id", req.params.id)
      .single();

    if (error || !rec) {
      return res
        .status(404)
        .json({ success: false, message: "Maintenance record not found" });
    }

    return res.json({ success: true, data: rec });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Failed to fetch maintenance record",
    });
  }
};

exports.updateMaintenanceRecord = async (req, res) => {
  try {
    const supabase = getSupabase();

    const {
      asset_id,
      maintenance_type,
      maintenance_date,
      description,
      notes,
      cost,
      performed_by,
      priority,
      status,
      estimated_duration,
      actual_duration,
      downtime_impact,
      next_maintenance_date,
      vendor_id,
    } = req.body;

    const updatePayload = {};
    if (asset_id !== undefined) updatePayload.asset_id = asset_id;
    if (maintenance_type !== undefined)
      updatePayload.maintenance_type = maintenance_type;
    if (maintenance_date !== undefined)
      updatePayload.maintenance_date = maintenance_date;
    if (description !== undefined) updatePayload.description = description;
    if (notes !== undefined) updatePayload.description = notes;
    if (cost !== undefined) updatePayload.cost = cost;
    if (performed_by !== undefined) updatePayload.performed_by = performed_by;
    if (priority !== undefined) updatePayload.priority = priority;
    if (status !== undefined) updatePayload.status = status;
    if (estimated_duration !== undefined)
      updatePayload.estimated_duration = estimated_duration;
    if (actual_duration !== undefined)
      updatePayload.actual_duration = actual_duration;
    if (downtime_impact !== undefined)
      updatePayload.downtime_impact = downtime_impact;
    if (next_maintenance_date !== undefined)
      updatePayload.next_maintenance_date = next_maintenance_date;
    if (vendor_id !== undefined) updatePayload.vendor_id = vendor_id;

    const { data: rec, error } = await supabase
      .from("maintenances")
      .update(updatePayload)
      .eq("id", req.params.id)
      .select(`*, assets:asset_id ( id, name, unique_asset_id, asset_type )`)
      .single();

    if (error || !rec) {
      return res
        .status(404)
        .json({ success: false, message: "Maintenance record not found" });
    }

    logger.info("Maintenance record updated", {
      userId: req.user?.id,
      maintenanceId: rec.id,
    });

    return res.json({
      success: true,
      message: "Maintenance record updated successfully",
      data: rec,
    });
  } catch (err) {
    logger.error("Error updating maintenance record:", err);
    return res.status(400).json({
      success: false,
      message: "Failed to update maintenance record",
    });
  }
};

exports.deleteMaintenanceRecord = async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: rec, error: fetchError } = await supabase
      .from("maintenances")
      .select("id")
      .eq("id", req.params.id)
      .single();

    if (fetchError || !rec) {
      return res
        .status(404)
        .json({ success: false, message: "Maintenance record not found" });
    }

    const { error: deleteError } = await supabase
      .from("maintenances")
      .delete()
      .eq("id", req.params.id);

    if (deleteError) throw deleteError;

    logger.info("Maintenance record deleted", {
      userId: req.user?.id,
      maintenanceId: req.params.id,
    });

    return res.json({
      success: true,
      message: "Maintenance record deleted successfully",
    });
  } catch (err) {
    logger.error("Error deleting maintenance record:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to delete maintenance record",
    });
  }
};

// Get technicians (users with maintenance capabilities and their workload)
exports.getTechnicians = async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, name, email, role")
      .in("role", ["ADMIN", "INVENTORY_MANAGER"]);

    if (usersError) throw usersError;

    if (!users || users.length === 0) {
      return res.json({ success: true, data: [] });
    }

    const techniciansWithWorkload = await Promise.all(
      users.map(async (user) => {
        const userName = user.name || user.email.split("@")[0];

        const { count: currentWorkload } = await supabase
          .from("maintenances")
          .select("id", { count: "exact", head: true })
          .eq("performed_by", userName)
          .in("status", ["Scheduled", "In Progress"]);

        const { count: totalCompleted } = await supabase
          .from("maintenances")
          .select("id", { count: "exact", head: true })
          .eq("performed_by", userName)
          .eq("status", "Completed");

        return {
          id: user.id,
          name: userName,
          email: user.email,
          specialization: ["General Maintenance", "Equipment Repair"],
          current_workload: currentWorkload || 0,
          rating:
            totalCompleted > 0 ? Math.min(5.0, 3.5 + totalCompleted / 20) : 4.0,
          total_completed: totalCompleted || 0,
        };
      }),
    );

    logger.info("Technicians retrieved", {
      userId: req.user?.id,
      count: techniciansWithWorkload.length,
    });

    return res.json({ success: true, data: techniciansWithWorkload });
  } catch (err) {
    logger.error("Error fetching technicians:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch technicians",
    });
  }
};

// Get warranties (assets with warranty information)
exports.getWarranties = async (req, res) => {
  try {
    const supabase = getSupabase();

    const { data: assets, error } = await supabase
      .from("assets")
      .select(
        `
        id, unique_asset_id, name, manufacturer, model, serial_number,
        asset_type, purchase_date, purchase_cost, warranty_expiry,
        vendors:vendor ( id, company_name )
      `,
      )
      .not("warranty_expiry", "is", null);

    if (error) throw error;

    const today = new Date();
    const warranties = (assets || []).map((asset) => {
      const warrantyExpiry = new Date(asset.warranty_expiry);
      const warrantyStart = asset.purchase_date
        ? new Date(asset.purchase_date)
        : new Date(
            warrantyExpiry.getFullYear() - 1,
            warrantyExpiry.getMonth(),
            warrantyExpiry.getDate(),
          );
      const daysUntilExpiry = Math.ceil(
        (warrantyExpiry - today) / (1000 * 60 * 60 * 24),
      );

      let status = "Active";
      if (daysUntilExpiry < 0) status = "Expired";
      else if (daysUntilExpiry <= 30) status = "Expiring Soon";

      const warrantyDuration = Math.ceil(
        (warrantyExpiry - warrantyStart) / (1000 * 60 * 60 * 24),
      );
      let warrantyType = "Standard";
      if (warrantyDuration > 730) warrantyType = "Extended";
      else if (warrantyDuration > 365) warrantyType = "Comprehensive";

      return {
        id: asset.id,
        assetId: asset.unique_asset_id || asset.id,
        assetName: asset.name || asset.model || "Unknown Asset",
        manufacturer: asset.manufacturer || "Unknown",
        model: asset.model || "Unknown",
        serialNumber: asset.serial_number || "N/A",
        warrantyType,
        startDate: warrantyStart.toISOString(),
        endDate: warrantyExpiry.toISOString(),
        status,
        vendor: asset.vendors?.company_name || "Unknown Vendor",
        claimHistory: 0,
        coverageDetails: `${warrantyType} warranty coverage for ${asset.asset_type || "asset"}. Includes parts and labor.`,
        coverageValue: asset.purchase_cost || 0,
        lastClaimDate: null,
      };
    });

    return res.json({
      success: true,
      data: warranties,
      total: warranties.length,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred" });
  }
};

// File warranty claim
exports.fileWarrantyClaim = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { assetId, description, issueType, contactPerson } = req.body;

    if (!assetId) {
      return res
        .status(400)
        .json({ success: false, message: "Asset ID is required" });
    }

    // Find asset by id or unique_asset_id
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("id, name, unique_asset_id")
      .or(`id.eq.${assetId},unique_asset_id.eq.${assetId}`)
      .maybeSingle();

    if (assetError || !asset) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    const maintenanceData = {
      asset,
      maintenance_type: "Corrective",
      description: `Warranty Claim: ${description || "Warranty service request"}`,
      status: "Scheduled",
      priority: "High",
      created_by: req.user.id,
      maintenance_date: new Date().toISOString(),
      performed_by: contactPerson || "Vendor Support",
      cost: 0,
    };

    const { data: maintenanceRecord, error: insertError } = await supabase
      .from("maintenances")
      .insert(maintenanceData)
      .select()
      .single();

    if (insertError) throw insertError;

    logger.info("Warranty claim filed", {
      userId: req.user.id,
      assetId: asset.id,
      maintenanceId: maintenanceRecord.id,
    });

    return res.json({
      success: true,
      message: "Warranty claim filed successfully",
      data: maintenanceRecord,
    });
  } catch (err) {
    logger.error("Error filing warranty claim:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to file warranty claim",
    });
  }
};

// Get warranty by ID
exports.getWarrantyById = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: asset, error } = await supabase
      .from("assets")
      .select(
        `
        id, unique_asset_id, name, manufacturer, model, serial_number,
        asset_type, purchase_date, purchase_cost, warranty_expiry,
        vendors:vendor ( id, company_name )
      `,
      )
      .eq("id", id)
      .single();

    if (error || !asset || !asset.warranty_expiry) {
      return res
        .status(404)
        .json({ success: false, message: "Warranty not found" });
    }

    const today = new Date();
    const warrantyExpiry = new Date(asset.warranty_expiry);
    const warrantyStart = asset.purchase_date
      ? new Date(asset.purchase_date)
      : new Date(
          warrantyExpiry.getFullYear() - 1,
          warrantyExpiry.getMonth(),
          warrantyExpiry.getDate(),
        );
    const daysUntilExpiry = Math.ceil(
      (warrantyExpiry - today) / (1000 * 60 * 60 * 24),
    );

    let status = "Active";
    if (daysUntilExpiry < 0) status = "Expired";
    else if (daysUntilExpiry <= 30) status = "Expiring Soon";

    const warrantyDuration = Math.ceil(
      (warrantyExpiry - warrantyStart) / (1000 * 60 * 60 * 24),
    );
    let warrantyType = "Standard";
    if (warrantyDuration > 730) warrantyType = "Extended";
    else if (warrantyDuration > 365) warrantyType = "Comprehensive";

    const warranty = {
      id: asset.id,
      assetId: asset.unique_asset_id || asset.id,
      assetName: asset.name || asset.model || "Unknown Asset",
      manufacturer: asset.manufacturer || "Unknown",
      model: asset.model || "Unknown",
      serialNumber: asset.serial_number || "N/A",
      warrantyType,
      startDate: warrantyStart.toISOString(),
      endDate: warrantyExpiry.toISOString(),
      status,
      vendor: asset.vendors?.company_name || "Unknown Vendor",
      claimHistory: 0,
      coverageDetails: `${warrantyType} warranty coverage for ${asset.asset_type || "asset"}. Includes parts and labor.`,
      coverageValue: asset.purchase_cost || 0,
      lastClaimDate: null,
    };

    return res.json({ success: true, data: warranty });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred" });
  }
};

// Update warranty
exports.updateWarranty = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { endDate } = req.body;

    const { data: existing, error: fetchError } = await supabase
      .from("assets")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    const updatePayload = {};
    if (endDate)
      updatePayload.warranty_expiry = new Date(endDate).toISOString();

    const { data: asset, error: updateError } = await supabase
      .from("assets")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.json({
      success: true,
      message: "Warranty updated successfully",
      data: asset,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred" });
  }
};

// Extend warranty
exports.extendWarranty = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { newEndDate } = req.body;

    const { data: existing, error: fetchError } = await supabase
      .from("assets")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !existing) {
      return res
        .status(404)
        .json({ success: false, message: "Asset not found" });
    }

    const { data: asset, error: updateError } = await supabase
      .from("assets")
      .update({ warranty_expiry: new Date(newEndDate).toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (updateError) throw updateError;

    logger.info("Warranty extended", {
      userId: req.user.id,
      assetId: id,
      newEndDate,
    });

    return res.json({
      success: true,
      message: "Warranty extended successfully",
      data: asset,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred" });
  }
};

// Get warranty claim history
exports.getWarrantyClaimHistory = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: claims, error } = await supabase
      .from("maintenances")
      .select("*")
      .eq("asset_id", id)
      .ilike("description", "%Warranty Claim%")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return res.json({ success: true, data: claims || [] });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred" });
  }
};

// Get warranty statistics
exports.getWarrantyStats = async (req, res) => {
  try {
    const supabase = getSupabase();

    const today = new Date().toISOString();
    const thirtyDaysFromNow = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ).toISOString();

    const [
      { count: activeCount },
      { count: expiringCount },
      { count: expiredCount },
      { data: allWarrantyAssets },
      { count: claimsCount },
    ] = await Promise.all([
      supabase
        .from("assets")
        .select("id", { count: "exact", head: true })
        .not("warranty_expiry", "is", null)
        .gt("warranty_expiry", thirtyDaysFromNow),
      supabase
        .from("assets")
        .select("id", { count: "exact", head: true })
        .gte("warranty_expiry", today)
        .lte("warranty_expiry", thirtyDaysFromNow),
      supabase
        .from("assets")
        .select("id", { count: "exact", head: true })
        .lt("warranty_expiry", today),
      supabase
        .from("assets")
        .select("purchase_cost")
        .not("warranty_expiry", "is", null),
      supabase
        .from("maintenances")
        .select("id", { count: "exact", head: true })
        .ilike("description", "%Warranty Claim%"),
    ]);

    const totalCoverageValue = (allWarrantyAssets || []).reduce(
      (sum, a) => sum + (a.purchase_cost || 0),
      0,
    );
    const totalWarranties =
      (activeCount || 0) + (expiringCount || 0) + (expiredCount || 0);
    const claimRate =
      totalWarranties > 0 ? ((claimsCount || 0) / totalWarranties) * 100 : 0;

    return res.json({
      success: true,
      data: {
        activeCount: activeCount || 0,
        expiringCount: expiringCount || 0,
        expiredCount: expiredCount || 0,
        totalCoverageValue,
        claimRate: claimRate.toFixed(2),
      },
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred" });
  }
};

// Export warranty report
exports.exportWarrantyReport = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { format = "csv", search = "", status = "" } = req.query;

    let query = supabase
      .from("assets")
      .select(
        `
        id, unique_asset_id, name, manufacturer, model, serial_number,
        asset_type, purchase_date, purchase_cost, warranty_expiry,
        vendors:vendor ( id, company_name )
      `,
      )
      .not("warranty_expiry", "is", null);

    if (search) {
      query = query.or(
        `unique_asset_id.ilike.%${search}%,name.ilike.%${search}%,manufacturer.ilike.%${search}%,serial_number.ilike.%${search}%`,
      );
    }

    const { data: assets, error } = await query;
    if (error) throw error;

    const today = new Date();
    const warranties = (assets || []).map((asset) => {
      const warrantyExpiry = new Date(asset.warranty_expiry);
      const warrantyStart = asset.purchase_date
        ? new Date(asset.purchase_date)
        : new Date(
            warrantyExpiry.getFullYear() - 1,
            warrantyExpiry.getMonth(),
            warrantyExpiry.getDate(),
          );
      const daysUntilExpiry = Math.ceil(
        (warrantyExpiry - today) / (1000 * 60 * 60 * 24),
      );

      let itemStatus = "Active";
      if (daysUntilExpiry < 0) itemStatus = "Expired";
      else if (daysUntilExpiry <= 30) itemStatus = "Expiring Soon";

      const warrantyDuration = Math.ceil(
        (warrantyExpiry - warrantyStart) / (1000 * 60 * 60 * 24),
      );
      let warrantyType = "Standard";
      if (warrantyDuration > 730) warrantyType = "Extended";
      else if (warrantyDuration > 365) warrantyType = "Comprehensive";

      return {
        assetId: asset.unique_asset_id || asset.id,
        assetName: asset.name || asset.model || "Unknown Asset",
        manufacturer: asset.manufacturer || "Unknown",
        model: asset.model || "Unknown",
        serialNumber: asset.serial_number || "N/A",
        warrantyType,
        vendor: asset.vendors?.company_name || "Unknown Vendor",
        startDate: warrantyStart.toISOString().split("T")[0],
        endDate: warrantyExpiry.toISOString().split("T")[0],
        daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
        status: itemStatus,
        coverageValue: asset.purchase_cost || 0,
      };
    });

    const filteredWarranties =
      status && status !== "All"
        ? warranties.filter((w) => w.status === status)
        : warranties;

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
        "Manufacturer",
        "Model",
        "Serial Number",
        "Warranty Type",
        "Vendor",
        "Start Date",
        "End Date",
        "Days Until Expiry",
        "Status",
        "Coverage Value (Rs.)",
      ];

      const csvRows = filteredWarranties.map((w) => [
        escapeCsvValue(w.assetId),
        escapeCsvValue(w.assetName),
        escapeCsvValue(w.manufacturer),
        escapeCsvValue(w.model),
        escapeCsvValue(w.serialNumber),
        escapeCsvValue(w.warrantyType),
        escapeCsvValue(w.vendor),
        escapeCsvValue(w.startDate),
        escapeCsvValue(w.endDate),
        escapeCsvValue(w.daysUntilExpiry),
        escapeCsvValue(w.status),
        escapeCsvValue(
          w.coverageValue ? w.coverageValue.toLocaleString("en-IN") : "0",
        ),
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
        `attachment; filename=warranty-report-${new Date().toISOString().split("T")[0]}.csv`,
      );

      logger.info("Warranty report exported", {
        userId: req.user?.id,
        format,
        count: filteredWarranties.length,
      });

      return res.send(csvContent);
    }

    return res.status(400).json({
      success: false,
      message: "Unsupported export format. Only CSV is supported.",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "An internal server error occurred" });
  }
};
