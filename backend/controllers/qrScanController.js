const getSupabase = require("../config/db");
const logger = require("../utils/logger");

/**
 * Enhanced QR Scanning Controller
 * Handles QR code scanning, batch scanning, and scan history tracking
 */

// Helper: insert into audit_logs
async function insertAuditLog(supabase, payload) {
  const { error } = await supabase.from("audit_logs").insert([payload]);
  if (error) logger.error("Audit log insert error:", error.message);
}

// Scan single asset by QR code
exports.scanAsset = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { qrCode } = req.params;
    const { mode = "lookup", include_history = false } = req.query;

    // Validate QR code parameter
    if (!qrCode || qrCode.trim().length === 0) {
      logger.warn("\u26a0\ufe0f Invalid QR code parameter - empty or null");
      return res.status(400).json({
        success: false,
        message: "QR code parameter is required",
        suggestions: [
          "Ensure QR code is not empty",
          "Check if the QR code was scanned correctly",
        ],
      });
    }

    // Decode URI component to handle special characters
    const decodedQrCode = decodeURIComponent(qrCode).trim();

    logger.debug("\ud83d\udcf1 QR Scan Request:");
    logger.debug("  - Original QR Code:", qrCode);
    logger.debug("  - Decoded QR Code:", decodedQrCode);
    logger.debug("  - Mode:", mode);
    logger.debug("  - User:", req.user?.id, req.user?.name);
    logger.debug("  - Include History:", include_history);
    logger.debug("  - IP:", req.ip || req.connection.remoteAddress);

    // Parse QR code if it's JSON format
    let searchValue = decodedQrCode;
    try {
      const parsed = JSON.parse(decodedQrCode);
      if (parsed.asset_id) {
        searchValue = parsed.asset_id;
      } else if (parsed.unique_asset_id) {
        searchValue = parsed.unique_asset_id;
      } else if (parsed.serial_number) {
        searchValue = parsed.serial_number;
      } else if (parsed.qr_code) {
        searchValue = parsed.qr_code;
      }
      logger.debug("  - Parsed QR JSON, using:", searchValue);
    } catch (parseError) {
      // Not JSON, use decoded value as-is
      logger.debug("  - Not JSON format, using raw value");
    }

    // Find asset by multiple possible fields using OR filter
    const searchValues = [...new Set([searchValue, decodedQrCode])];

    let asset = null;
    for (const val of searchValues) {
      const { data, error } = await supabase
        .from("assets")
        .select(
          `
          *,
          assigned_user:users!assets_assigned_user_fkey(id, name, email, department),
          vendor:vendors!assets_vendor_fkey(id, vendor_name, email, phone),
          last_audited_by:users!assets_last_audited_by_fkey(id, name, email)
        `,
        )
        .or(
          `qr_code.eq.${val},unique_asset_id.eq.${val},serial_number.eq.${val}`,
        )
        .maybeSingle();

      if (error) {
        logger.warn("Asset lookup error:", error.message);
        continue;
      }
      if (data) {
        asset = data;
        break;
      }
    }

    logger.debug("  - Asset found:", !!asset);
    if (asset) {
      logger.debug("  - Asset ID:", asset.id);
      logger.debug(
        "  - Asset Name:",
        asset.name || asset.manufacturer + " " + asset.model,
      );
      logger.debug("  - Unique Asset ID:", asset.unique_asset_id);
      logger.debug("  - QR Code:", asset.qr_code);
    }

    if (!asset) {
      logger.debug("\u274c Asset not found for QR code:", decodedQrCode);

      await insertAuditLog(supabase, {
        user_id: req.user.id,
        performed_by: req.user.id,
        action: "qr_scan_failed",
        entity_type: "Unknown",
        description:
          "Failed QR scan attempt: Asset not found for code " + decodedQrCode,
        severity: "warning",
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("user-agent"),
        details: {
          attempted_qr_code: decodedQrCode,
          mode: mode,
        },
        timestamp: new Date().toISOString(),
      });

      return res.status(404).json({
        success: false,
        message: "Asset not found. Please verify the QR code is correct.",
        qr_code: decodedQrCode,
        suggestions: [
          "Ensure the QR code is not damaged or obscured",
          "Try scanning the asset's serial number instead",
          "Check if the asset exists in the system",
        ],
      });
    }

    // Get scan history if requested
    let scanHistory = [];
    if (include_history === "true") {
      const { data: historyData } = await supabase
        .from("audit_logs")
        .select("id, action, performed_by, timestamp, details")
        .eq("asset_id", asset.id)
        .in("action", ["qr_scan_success", "audit_scanned", "checkout_scanned"])
        .order("timestamp", { ascending: false })
        .limit(10);

      scanHistory = historyData || [];
    }

    // UPDATE: Always update last_audit_date and last_audited_by when scanning
    const oldAuditDate = asset.last_audit_date;
    const oldAuditedBy = asset.last_audited_by;

    const { data: updatedAssetData, error: updateError } = await supabase
      .from("assets")
      .update({
        last_audit_date: new Date().toISOString(),
        last_audited_by: req.user.id,
      })
      .eq("id", asset.id)
      .select(
        `
        *,
        assigned_user:users!assets_assigned_user_fkey(id, name, email, department),
        vendor:vendors!assets_vendor_fkey(id, vendor_name, email, phone),
        last_audited_by:users!assets_last_audited_by_fkey(id, name, email)
      `,
      )
      .maybeSingle();

    if (updateError) {
      logger.error("Asset update error:", updateError.message);
    }

    const updatedAsset = updatedAssetData || asset;

    // Log successful scan
    await insertAuditLog(supabase, {
      user_id: req.user.id,
      performed_by: req.user.id,
      action:
        mode === "audit"
          ? "audit_scanned"
          : mode === "checkout"
            ? "checkout_scanned"
            : "qr_scan_success",
      entity_type: "Asset",
      entity_id: asset.id,
      asset_id: asset.id,
      description:
        "QR code scanned for asset " +
        asset.unique_asset_id +
        " (" +
        (asset.name || asset.manufacturer + " " + asset.model) +
        ")",
      severity: "info",
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get("user-agent"),
      old_values: {
        last_audit_date: oldAuditDate,
        last_audited_by:
          typeof oldAuditedBy === "object"
            ? oldAuditedBy && oldAuditedBy.id
            : oldAuditedBy,
      },
      new_values: {
        last_audit_date: updatedAsset.last_audit_date,
        last_audited_by: req.user.id,
      },
      timestamp: new Date().toISOString(),
    });

    // Prepare response based on mode
    const response = {
      success: true,
      asset: {
        id: updatedAsset.id,
        unique_asset_id: updatedAsset.unique_asset_id,
        qr_code: updatedAsset.qr_code,
        name: updatedAsset.name,
        manufacturer: updatedAsset.manufacturer,
        model: updatedAsset.model,
        serial_number: updatedAsset.serial_number,
        category: updatedAsset.asset_type,
        status: updatedAsset.status,
        condition: updatedAsset.condition,
        location: updatedAsset.location,
        location_verified: updatedAsset.location_verified,
        last_location_verification_date:
          updatedAsset.last_location_verification_date,
        department: updatedAsset.department,
        purchase_date: updatedAsset.purchase_date,
        purchase_cost: updatedAsset.purchase_cost,
        warranty_expiry: updatedAsset.warranty_expiry,
        assigned_user: updatedAsset.assigned_user
          ? {
              id: updatedAsset.assigned_user.id,
              name: updatedAsset.assigned_user.name,
              email: updatedAsset.assigned_user.email,
              department: updatedAsset.assigned_user.department,
            }
          : null,
        vendor: updatedAsset.vendor
          ? {
              id: updatedAsset.vendor.id,
              name: updatedAsset.vendor.vendor_name,
              email: updatedAsset.vendor.email,
              phone: updatedAsset.vendor.phone,
            }
          : null,
        last_audit_date: updatedAsset.last_audit_date,
        last_audited_by: updatedAsset.last_audited_by
          ? {
              id: updatedAsset.last_audited_by.id,
              name: updatedAsset.last_audited_by.name,
              email: updatedAsset.last_audited_by.email,
            }
          : null,
        last_maintenance_date: updatedAsset.last_maintenance_date,
        images: updatedAsset.images || [],
        notes: updatedAsset.notes,
        quantity: updatedAsset.quantity,
      },
      scan_history: scanHistory,
      scanned_at: new Date(),
      scanned_by: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
      },
      mode: mode,
    };

    logger.debug("\u2705 QR Scan successful, returning asset data");
    res.json(response);
  } catch (error) {
    logger.error("\u274c Error scanning asset:", error);
    logger.error("  - Error name:", error.name);
    logger.error("  - Error message:", error.message);
    logger.error("  - Stack:", error.stack);

    res.status(500).json({
      success: false,
      message: "Failed to scan asset",
      error: error.message,
    });
  }
};

// Batch scan multiple assets
exports.batchScan = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { qr_codes, mode = "lookup" } = req.body;

    // Validate input
    if (!Array.isArray(qr_codes) || qr_codes.length === 0) {
      logger.warn(
        "\u26a0\ufe0f Invalid batch scan request - qr_codes not an array or empty",
      );
      return res.status(400).json({
        success: false,
        message: "qr_codes array is required and must not be empty",
        suggestions: [
          "Provide an array of QR codes",
          "Ensure at least one QR code is in the array",
        ],
      });
    }

    if (qr_codes.length > 100) {
      logger.warn(
        "\u26a0\ufe0f Too many QR codes in batch scan: " + qr_codes.length,
      );
      return res.status(400).json({
        success: false,
        message: "Maximum 100 QR codes can be scanned at once",
        actual_count: qr_codes.length,
        suggestions: [
          "Split your batch into multiple requests",
          "Each batch should have 100 or fewer codes",
        ],
      });
    }

    logger.info(
      "\ud83d\udcc4 Batch scan started: " + qr_codes.length + " codes",
    );

    const results = {
      success: true,
      total: qr_codes.length,
      found: 0,
      not_found: 0,
      invalid: 0,
      assets: [],
      errors: [],
    };

    for (const qrCode of qr_codes) {
      try {
        // Validate individual QR code
        if (
          !qrCode ||
          (typeof qrCode === "string" && qrCode.trim().length === 0)
        ) {
          results.invalid++;
          results.errors.push({
            qr_code: qrCode || "(empty)",
            error: "Invalid or empty QR code",
          });
          continue;
        }

        const decodedQrCode =
          typeof qrCode === "string" ? qrCode.trim() : String(qrCode).trim();

        // Parse QR code if it's JSON format
        let searchValue = decodedQrCode;
        try {
          const parsed = JSON.parse(decodedQrCode);
          searchValue =
            parsed.asset_id ||
            parsed.unique_asset_id ||
            parsed.serial_number ||
            parsed.qr_code ||
            decodedQrCode;
        } catch (parseError) {
          // Not JSON, use as-is
        }

        const { data: assetData } = await supabase
          .from("assets")
          .select(
            `
            *,
            assigned_user:users!assets_assigned_user_fkey(id, name, email, department)
          `,
          )
          .or(
            "qr_code.eq." +
              searchValue +
              ",unique_asset_id.eq." +
              searchValue +
              ",serial_number.eq." +
              searchValue,
          )
          .maybeSingle();

        if (assetData) {
          results.found++;
          results.assets.push({
            qr_code: decodedQrCode,
            asset_id: assetData.id,
            unique_asset_id: assetData.unique_asset_id,
            name: assetData.name,
            manufacturer: assetData.manufacturer,
            model: assetData.model,
            status: assetData.status,
            condition: assetData.condition,
            location: assetData.location,
            assigned_user: assetData.assigned_user
              ? assetData.assigned_user.name
              : null,
            last_audit_date: assetData.last_audit_date,
          });

          // Update last_audit_date for batch scans
          await supabase
            .from("assets")
            .update({
              last_audit_date: new Date().toISOString(),
              last_audited_by: req.user.id,
            })
            .eq("id", assetData.id);

          // Log scan
          await insertAuditLog(supabase, {
            user_id: req.user.id,
            performed_by: req.user.id,
            action: "batch_scan",
            entity_type: "Asset",
            entity_id: assetData.id,
            asset_id: assetData.id,
            description: "Batch scan: " + assetData.unique_asset_id,
            severity: "info",
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get("user-agent"),
          });
        } else {
          results.not_found++;
          results.errors.push({
            qr_code: decodedQrCode,
            error: "Asset not found in database",
          });
        }
      } catch (err) {
        results.errors.push({
          qr_code: qrCode,
          error: err.message,
        });
      }
    }

    // Log batch scan completion with detailed results
    logger.info(
      "\u2705 Batch scan completed: Found=" +
        results.found +
        ", Not Found=" +
        results.not_found +
        ", Invalid=" +
        results.invalid,
    );

    await insertAuditLog(supabase, {
      user_id: req.user.id,
      performed_by: req.user.id,
      action: "batch_scan_completed",
      entity_type: "System",
      description:
        "Batch scan completed: " +
        results.found +
        " found, " +
        results.not_found +
        " not found, " +
        results.invalid +
        " invalid",
      severity: results.not_found > results.found ? "warning" : "info",
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get("user-agent"),
      details: {
        total_scanned: qr_codes.length,
        found: results.found,
        not_found: results.not_found,
        invalid: results.invalid,
        success_rate:
          ((results.found / qr_codes.length) * 100).toFixed(2) + "%",
        mode,
      },
      timestamp: new Date().toISOString(),
    });

    res.json(results);
  } catch (error) {
    logger.error("\u274c Error in batch scan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process batch scan",
      error: error.message,
      suggestions: [
        "Check if backend server is running",
        "Verify database connection",
        "Try again with fewer QR codes",
      ],
    });
  }
};

// Get scan history for user
exports.getScanHistory = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { limit = 50, page = 1, mode, asset_id } = req.query;

    // Validate pagination parameters
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);

    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      logger.warn("\u26a0\ufe0f Invalid limit parameter: " + limit);
      return res.status(400).json({
        success: false,
        message: "Invalid limit parameter. Must be between 1 and 100.",
      });
    }

    if (isNaN(parsedPage) || parsedPage < 1) {
      logger.warn("\u26a0\ufe0f Invalid page parameter: " + page);
      return res.status(400).json({
        success: false,
        message: "Invalid page parameter. Must be 1 or greater.",
      });
    }

    const skip = (parsedPage - 1) * parsedLimit;

    logger.debug(
      "\ud83d\udccb Fetching scan history: user=" +
        req.user.id +
        ", limit=" +
        parsedLimit +
        ", page=" +
        parsedPage,
    );

    // Build the valid actions list
    let validActions = [
      "qr_scan_success",
      "audit_scanned",
      "checkout_scanned",
      "batch_scan",
    ];
    if (mode) {
      const actionMap = {
        audit: ["audit_scanned"],
        checkout: ["checkout_scanned"],
        lookup: ["qr_scan_success"],
      };
      if (actionMap[mode]) {
        validActions = actionMap[mode];
      }
    }

    // Build query
    let query = supabase
      .from("audit_logs")
      .select("id, action, asset_id, details, timestamp", { count: "exact" })
      .eq("performed_by", req.user.id)
      .in("action", validActions)
      .order("timestamp", { ascending: false })
      .range(skip, skip + parsedLimit - 1);

    if (asset_id) {
      query = query.eq("asset_id", asset_id);
    }

    const { data: scans, error, count } = await query;

    if (error) {
      logger.error("Scan history query error:", error.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch scan history",
        error: error.message,
      });
    }

    // Enrich with asset details
    const assetIds = [
      ...new Set(
        (scans || []).filter((s) => s.asset_id).map((s) => s.asset_id),
      ),
    ];
    let assetsMap = {};
    if (assetIds.length > 0) {
      const { data: assetsData } = await supabase
        .from("assets")
        .select(
          "id, unique_asset_id, name, manufacturer, model, location, status",
        )
        .in("id", assetIds);
      if (assetsData) {
        assetsData.forEach(function (a) {
          assetsMap[a.id] = a;
        });
      }
    }

    const total = count || 0;
    logger.debug(
      "\u2705 Found " +
        (scans || []).length +
        " scan history items (total: " +
        total +
        ")",
    );

    res.json({
      success: true,
      scans: (scans || []).map(function (scan) {
        return {
          id: scan.id,
          action: scan.action,
          asset:
            scan.asset_id && assetsMap[scan.asset_id]
              ? {
                  id: assetsMap[scan.asset_id].id,
                  unique_asset_id: assetsMap[scan.asset_id].unique_asset_id,
                  name: assetsMap[scan.asset_id].name,
                  manufacturer: assetsMap[scan.asset_id].manufacturer,
                  model: assetsMap[scan.asset_id].model,
                  location: assetsMap[scan.asset_id].location,
                  status: assetsMap[scan.asset_id].status,
                }
              : null,
          details: scan.details,
          timestamp: scan.timestamp,
        };
      }),
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total: total,
        pages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    logger.error("Error fetching scan history:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scan history",
      error: error.message,
    });
  }
};

// Get scan statistics
exports.getScanStats = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { period = "7d" } = req.query;

    // Calculate date range
    const now = new Date();
    let startDate;
    switch (period) {
      case "24h":
        startDate = new Date(now - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        startDate = new Date(now - 30 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now - 7 * 24 * 60 * 60 * 1000);
    }

    const scanActions = [
      "qr_scan_success",
      "audit_scanned",
      "checkout_scanned",
    ];

    // Fetch all relevant scan logs in the period
    const { data: scanLogs, error: scanError } = await supabase
      .from("audit_logs")
      .select("id, action, asset_id, timestamp")
      .eq("performed_by", req.user.id)
      .in("action", scanActions)
      .gte("timestamp", startDate.toISOString());

    if (scanError) {
      logger.error("Scan stats query error:", scanError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to fetch scan statistics",
        error: scanError.message,
      });
    }

    const logs = scanLogs || [];

    // Count by action type in-memory
    const scansByType = {};
    logs.forEach(function (log) {
      scansByType[log.action] = (scansByType[log.action] || 0) + 1;
    });
    const totalScans = logs.length;

    // Compute top scanned assets
    const assetScanCount = {};
    const assetLastScanned = {};
    logs
      .filter(function (l) {
        return l.asset_id;
      })
      .forEach(function (log) {
        assetScanCount[log.asset_id] = (assetScanCount[log.asset_id] || 0) + 1;
        if (
          !assetLastScanned[log.asset_id] ||
          log.timestamp > assetLastScanned[log.asset_id]
        ) {
          assetLastScanned[log.asset_id] = log.timestamp;
        }
      });

    // Get top 10 asset ids by scan count
    const topAssetIds = Object.entries(assetScanCount)
      .sort(function (a, b) {
        return b[1] - a[1];
      })
      .slice(0, 10)
      .map(function (entry) {
        return entry[0];
      });

    let topAssets = [];
    if (topAssetIds.length > 0) {
      const { data: assetsData } = await supabase
        .from("assets")
        .select("id, unique_asset_id, name")
        .in("id", topAssetIds);

      if (assetsData) {
        topAssets = topAssetIds
          .map(function (id) {
            const asset = assetsData.find(function (a) {
              return a.id === id;
            });
            if (!asset) return null;
            return {
              asset_id: id,
              unique_asset_id: asset.unique_asset_id,
              name: asset.name,
              scan_count: assetScanCount[id],
              last_scanned: assetLastScanned[id],
            };
          })
          .filter(Boolean);
      }
    }

    res.json({
      success: true,
      period: period,
      total_scans: totalScans,
      scans_by_type: scansByType,
      top_scanned_assets: topAssets,
    });
  } catch (error) {
    logger.error("Error fetching scan stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch scan statistics",
      error: error.message,
    });
  }
};

// Quick audit scan (mobile-optimized)
exports.quickAuditScan = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { qrCode } = req.params;
    const {
      condition,
      status,
      location_verified,
      notes,
      photos = [],
    } = req.body;

    // Validate QR code parameter
    if (!qrCode || typeof qrCode !== "string") {
      logger.warn("\u26a0\ufe0f Quick audit scan missing qrCode parameter");
      return res.status(400).json({
        success: false,
        message: "QR code is required",
        suggestions: ["Provide a valid QR code in the URL parameter"],
      });
    }

    const decodedQrCode = decodeURIComponent(qrCode).trim();

    if (decodedQrCode === "") {
      logger.warn(
        "\u26a0\ufe0f Quick audit scan received empty qrCode after decode",
      );
      return res.status(400).json({
        success: false,
        message: "QR code cannot be empty",
        suggestions: ["Ensure the QR code is readable and not blank"],
      });
    }

    // Validate optional fields
    if (
      condition &&
      !["Excellent", "Good", "Fair", "Poor", "Non-Functional"].includes(
        condition,
      )
    ) {
      logger.warn("\u26a0\ufe0f Invalid condition value: " + condition);
      return res.status(400).json({
        success: false,
        message: "Invalid condition value",
        suggestions: [
          "Valid conditions: Excellent, Good, Fair, Poor, Non-Functional",
        ],
      });
    }

    if (
      status &&
      ![
        "Active",
        "Inactive",
        "Under Maintenance",
        "Disposed",
        "Reserved",
      ].includes(status)
    ) {
      logger.warn("\u26a0\ufe0f Invalid status value: " + status);
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
        suggestions: [
          "Valid statuses: Active, Inactive, Under Maintenance, Disposed, Reserved",
        ],
      });
    }

    logger.info(
      "\ud83d\udcf1 Quick audit scan initiated: " +
        decodedQrCode.substring(0, 50) +
        "...",
    );

    // Parse QR code if JSON
    let searchValue = decodedQrCode;
    try {
      const parsed = JSON.parse(decodedQrCode);
      searchValue =
        parsed.asset_id ||
        parsed.unique_asset_id ||
        parsed.serial_number ||
        parsed.qr_code ||
        decodedQrCode;
      logger.debug(
        "\ud83d\udcdd Parsed JSON QR code, search value: " + searchValue,
      );
    } catch (parseError) {
      logger.debug("\ud83d\udd0d Using plain text QR code: " + searchValue);
    }

    // Find asset
    const { data: asset, error: findError } = await supabase
      .from("assets")
      .select("*")
      .or(
        "qr_code.eq." +
          searchValue +
          ",unique_asset_id.eq." +
          searchValue +
          ",serial_number.eq." +
          searchValue,
      )
      .maybeSingle();

    if (findError) {
      logger.error("Asset lookup error:", findError.message);
      return res.status(500).json({
        success: false,
        message: "Failed to look up asset",
        error: findError.message,
      });
    }

    if (!asset) {
      logger.warn(
        "\u274c Quick audit: Asset not found for QR: " +
          decodedQrCode.substring(0, 30) +
          "...",
      );

      // Log failed audit
      await insertAuditLog(supabase, {
        user_id: req.user.id,
        performed_by: req.user.id,
        action: "quick_audit_failed",
        entity_type: "Asset",
        entity_id: null,
        description: "Quick audit failed: Asset not found",
        severity: "warning",
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("user-agent"),
        details: {
          qr_code: decodedQrCode,
          reason: "Asset not found",
        },
      });

      return res.status(404).json({
        success: false,
        message: "Asset not found for quick audit",
        qr_code: decodedQrCode,
        suggestions: [
          "Verify the QR code is correct",
          "Check if the asset exists in the database",
          "Try scanning again",
        ],
      });
    }

    // Store old values for audit trail
    const oldValues = {
      condition: asset.condition,
      status: asset.status,
      location_verified: asset.location_verified,
      last_audit_date: asset.last_audit_date,
    };

    // Build update payload
    const updatePayload = {
      last_audit_date: new Date().toISOString(),
      last_audited_by: req.user.id,
    };
    if (condition) updatePayload.condition = condition;
    if (status) updatePayload.status = status;
    if (location_verified !== undefined) {
      updatePayload.location_verified = location_verified;
      updatePayload.last_location_verification_date = new Date().toISOString();
    }
    if (notes) updatePayload.notes = notes;

    const { data: updatedAsset, error: updateError } = await supabase
      .from("assets")
      .update(updatePayload)
      .eq("id", asset.id)
      .select(
        `
        *,
        assigned_user:users!assets_assigned_user_fkey(id, name, email, department),
        last_audited_by:users!assets_last_audited_by_fkey(id, name, email)
      `,
      )
      .maybeSingle();

    if (updateError) {
      logger.error(
        "Asset update error in quickAuditScan:",
        updateError.message,
      );
      return res.status(500).json({
        success: false,
        message: "Failed to update asset",
        error: updateError.message,
      });
    }

    logger.info(
      "\u2705 Quick audit completed for asset: " + asset.unique_asset_id,
    );

    const finalAsset = updatedAsset || asset;

    // Log audit with detailed information
    const { data: auditLog } = await supabase
      .from("audit_logs")
      .insert([
        {
          user_id: req.user.id,
          performed_by: req.user.id,
          action: "quick_audit_completed",
          entity_type: "Asset",
          entity_id: asset.id,
          asset_id: asset.id,
          description:
            "Quick audit completed for " +
            asset.unique_asset_id +
            ": Condition=" +
            (condition || "unchanged") +
            ", Status=" +
            (status || "unchanged"),
          severity: "info",
          ip_address: req.ip || req.connection.remoteAddress,
          user_agent: req.get("user-agent"),
          old_values: oldValues,
          new_values: {
            condition: finalAsset.condition,
            status: finalAsset.status,
            location_verified: finalAsset.location_verified,
            last_audit_date: finalAsset.last_audit_date,
            last_location_verification_date:
              finalAsset.last_location_verification_date,
          },
          details: {
            notes: notes || "",
            photos_count: photos.length,
            location_verified: location_verified || false,
          },
        },
      ])
      .select()
      .maybeSingle();

    res.json({
      success: true,
      message: "Quick audit completed successfully",
      asset: finalAsset,
      audit_log: auditLog,
      updated_at: new Date(),
    });
  } catch (error) {
    logger.error("Error in quick audit scan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete quick audit",
      error: error.message,
    });
  }
};

module.exports = exports;
