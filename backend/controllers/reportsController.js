const logger = require("../utils/logger");
const getSupabase = require("../config/db");

// ========================================
// REPORT TEMPLATES
// ========================================

/**
 * @desc    Get all report templates
 * @route   GET /api/v1/reports/templates
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getReportTemplates = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { category, status = "active" } = req.query;

    let query = supabase
      .from("report_templates")
      .select("*, users:created_by(name, email)")
      .order("category", { ascending: true })
      .order("name", { ascending: true });

    if (category) query = query.eq("category", category);
    if (status) query = query.eq("status", status);

    const { data: templates, error } = await query;

    if (error) throw error;

    const formattedTemplates = (templates || []).map((template) => ({
      id: template.template_id,
      name: template.name,
      description: template.description,
      category: template.category,
      frequency: template.frequency
        ? template.frequency.charAt(0).toUpperCase() +
          template.frequency.slice(1)
        : "",
      type: template.type
        ? template.type.charAt(0).toUpperCase() + template.type.slice(1)
        : "",
      parameters: Array.isArray(template.parameters)
        ? template.parameters
        : typeof template.parameters === "object" && template.parameters
          ? Object.keys(template.parameters)
          : [],
      lastGenerated: template.last_generated,
      status: template.status,
      format: Array.isArray(template.format)
        ? template.format[0]
        : template.format,
      generationCount: template.generation_count || 0,
    }));

    logger.info("Report templates retrieved", {
      userId: req.user.id,
      count: formattedTemplates.length,
    });

    return res.status(200).json({
      success: true,
      count: formattedTemplates.length,
      data: formattedTemplates,
    });
  } catch (error) {
    logger.error("Error fetching report templates:", error);
    return next(error);
  }
};

/**
 * @desc    Get report generation history
 * @route   GET /api/v1/reports/history
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getReportHistory = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { page = 1, limit = 15, status = "", category = "" } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    let countQuery = supabase
      .from("generated_reports")
      .select("id", { count: "exact", head: true });
    let dataQuery = supabase
      .from("generated_reports")
      .select(
        "*, users:generated_by(name, email), report_templates:template(name, template_id)",
      )
      .order("generated_at", { ascending: false })
      .range(from, to);

    if (status) {
      countQuery = countQuery.eq("status", status);
      dataQuery = dataQuery.eq("status", status);
    }
    if (category) {
      countQuery = countQuery.eq("category", category);
      dataQuery = dataQuery.eq("category", category);
    }

    const [
      { count: totalReports, error: countError },
      { data: reports, error: dataError },
    ] = await Promise.all([countQuery, dataQuery]);

    if (countError) throw countError;
    if (dataError) throw dataError;

    const history = (reports || []).map((report) => ({
      id: report.report_id,
      reportName: report.report_name,
      category: report.category,
      generatedBy: report.users?.email || "Unknown",
      generatedAt: report.generated_at,
      status: report.status,
      format: report.format,
      fileSize: report.file_size
        ? report.file_size < 1024 * 1024
          ? `${(report.file_size / 1024).toFixed(2)} KB`
          : `${(report.file_size / (1024 * 1024)).toFixed(2)} MB`
        : "N/A",
      downloadCount: report.download_count || 0,
    }));

    logger.info("Report history retrieved", {
      userId: req.user.id,
      count: history.length,
      page,
      limit,
    });

    return res.status(200).json({
      success: true,
      count: history.length,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil((totalReports || 0) / limitNum),
        totalItems: totalReports || 0,
      },
      data: history,
    });
  } catch (error) {
    logger.error("Error fetching report history:", error);
    return next(error);
  }
};

/**
 * @desc    Get report statistics
 * @route   GET /api/v1/reports/stats
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getReportStats = async (req, res, next) => {
  try {
    const supabase = getSupabase();

    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [
      { count: totalTemplates, error: tmplErr },
      { count: scheduledReports, error: schedErr },
      { count: generatedThisMonth, error: monthErr },
      { data: allReports, error: allErr },
    ] = await Promise.all([
      supabase
        .from("report_templates")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("report_templates")
        .select("id", { count: "exact", head: true })
        .eq("status", "active")
        .eq("is_scheduled", true),
      supabase
        .from("generated_reports")
        .select("id", { count: "exact", head: true })
        .gte("generated_at", startOfMonth.toISOString()),
      supabase
        .from("generated_reports")
        .select("category, status, download_count"),
    ]);

    if (tmplErr) throw tmplErr;
    if (schedErr) throw schedErr;
    if (monthErr) throw monthErr;
    if (allErr) throw allErr;

    let totalDownloads = 0;
    const byCategoryObj = {};
    const byStatusObj = {};

    (allReports || []).forEach((r) => {
      totalDownloads += r.download_count || 0;
      if (r.category)
        byCategoryObj[r.category] = (byCategoryObj[r.category] || 0) + 1;
      if (r.status) byStatusObj[r.status] = (byStatusObj[r.status] || 0) + 1;
    });

    const stats = {
      totalTemplates: totalTemplates || 0,
      generatedThisMonth: generatedThisMonth || 0,
      scheduledReports: scheduledReports || 0,
      totalDownloads,
      byCategory: byCategoryObj,
      byStatus: byStatusObj,
    };

    logger.info("Report stats retrieved", { userId: req.user.id });

    return res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error("Error fetching report stats:", error);
    return next(error);
  }
};

/**
 * @desc    Generate a report
 * @route   POST /api/v1/reports/generate
 * @access  Private (ADMIN, INVENTORY_MANAGER, IT_MANAGER, AUDITOR)
 */
exports.generateReport = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { template_id, templateId, format, parameters } = req.body;
    const actualTemplateId = template_id || templateId;

    if (!actualTemplateId) {
      return res.status(400).json({
        success: false,
        message: "Template ID is required",
      });
    }

    logger.info("Report generation requested", {
      userId: req.user.id,
      templateId: actualTemplateId,
      format,
    });

    // Find the template
    const { data: templateRows, error: tmplErr } = await supabase
      .from("report_templates")
      .select("*")
      .eq("template_id", actualTemplateId)
      .limit(1);

    if (tmplErr) throw tmplErr;

    if (!templateRows || templateRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Report template not found",
      });
    }

    const template = templateRows[0];
    const reportId = `REP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    let reportData = {};
    let totalRecords = 0;

    // Build date filter
    let assetQuery = supabase.from("assets").select("*");
    if (parameters?.startDate && parameters?.endDate) {
      assetQuery = assetQuery
        .gte("purchase_date", new Date(parameters.startDate).toISOString())
        .lte("purchase_date", new Date(parameters.endDate).toISOString());
    }

    switch (template.category) {
      case "Inventory": {
        const { data: assets, error } = await assetQuery;
        if (error) throw error;
        totalRecords = (assets || []).length;
        reportData = {
          assets,
          summary: {
            total: totalRecords,
            active: (assets || []).filter((a) => a.status === "Active").length,
            available: (assets || []).filter((a) => a.status === "Available")
              .length,
            underMaintenance: (assets || []).filter(
              (a) => a.status === "Under Maintenance",
            ).length,
          },
        };
        break;
      }

      case "Analytics": {
        const { data: assets, error } = await assetQuery;
        if (error) throw error;
        totalRecords = (assets || []).length;
        const utilizationData = (assets || []).reduce((acc, asset) => {
          const s = asset.status || "Unknown";
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {});
        reportData = {
          utilizationByStatus: utilizationData,
          totalAssets: totalRecords,
          averageCost:
            totalRecords > 0
              ? (assets || []).reduce(
                  (sum, a) => sum + (a.purchase_cost || 0),
                  0,
                ) / totalRecords
              : 0,
        };
        break;
      }

      case "Financial": {
        const { data: assets, error } = await assetQuery;
        if (error) throw error;
        totalRecords = (assets || []).length;
        reportData = {
          totalValue: (assets || []).reduce(
            (sum, a) => sum + (a.purchase_cost || 0),
            0,
          ),
          depreciatedValue: (assets || []).reduce(
            (sum, a) => sum + (a.purchase_cost || 0),
            0,
          ),
          byCategory: (assets || []).reduce((acc, asset) => {
            const category = asset.asset_type || "Uncategorized";
            if (!acc[category]) acc[category] = { count: 0, value: 0 };
            acc[category].count++;
            acc[category].value += asset.purchase_cost || 0;
            return acc;
          }, {}),
          totalRecords,
        };
        break;
      }

      case "Compliance": {
        const { data: assets, error: assetErr } = await assetQuery;
        if (assetErr) throw assetErr;
        const { data: maintenanceRecords, error: maintErr } = await supabase
          .from("maintenances")
          .select("id");
        if (maintErr) throw maintErr;
        totalRecords = (assets || []).length;
        reportData = {
          assets,
          maintenanceCompliance: {
            totalAssets: totalRecords,
            withMaintenance: (maintenanceRecords || []).length,
            complianceRate:
              totalRecords > 0
                ? (
                    ((maintenanceRecords || []).length / totalRecords) *
                    100
                  ).toFixed(2)
                : "0.00",
          },
        };
        break;
      }

      case "Tracking": {
        let transferQuery = supabase.from("asset_transfers").select("*");
        if (parameters?.startDate && parameters?.endDate) {
          transferQuery = transferQuery
            .gte("created_at", new Date(parameters.startDate).toISOString())
            .lte("created_at", new Date(parameters.endDate).toISOString());
        }
        const { data: transfers, error } = await transferQuery;
        if (error) throw error;
        totalRecords = (transfers || []).length;
        reportData = {
          transfers,
          summary: {
            total: totalRecords,
            byStatus: (transfers || []).reduce((acc, t) => {
              acc[t.status] = (acc[t.status] || 0) + 1;
              return acc;
            }, {}),
          },
        };
        break;
      }

      case "Vendor": {
        const { data: vendors, error: vendErr } = await supabase
          .from("vendors")
          .select("*");
        if (vendErr) throw vendErr;
        let ordersQuery = supabase.from("purchase_orders").select("*");
        if (parameters?.startDate && parameters?.endDate) {
          ordersQuery = ordersQuery
            .gte("created_at", new Date(parameters.startDate).toISOString())
            .lte("created_at", new Date(parameters.endDate).toISOString());
        }
        const { data: orders, error: ordErr } = await ordersQuery;
        if (ordErr) throw ordErr;
        totalRecords = (orders || []).length;
        reportData = {
          vendors,
          purchaseOrders: orders,
          summary: {
            totalVendors: (vendors || []).length,
            totalOrders: totalRecords,
            totalValue: (orders || []).reduce(
              (sum, o) => sum + (o.total_amount || 0),
              0,
            ),
          },
        };
        break;
      }

      default: {
        const { data: assets, error } = await assetQuery;
        if (error) throw error;
        totalRecords = (assets || []).length;
        reportData = { assets, totalRecords };
      }
    }

    // Create report record
    const { error: insertErr } = await supabase
      .from("generated_reports")
      .insert({
        report_id: reportId,
        template: template.id,
        report_name: template.name,
        category: template.category,
        generated_by: req.user.id,
        generated_at: new Date().toISOString(),
        status: "completed",
        format: format || "PDF",
        parameters: parameters || {},
        download_count: 0,
      });
    if (insertErr) throw insertErr;

    // Update template's last generated time and count
    await supabase
      .from("report_templates")
      .update({
        last_generated: new Date().toISOString(),
        generation_count: (template.generation_count || 0) + 1,
      })
      .eq("id", template.id);

    logger.info("Report generated successfully", {
      userId: req.user.id,
      reportId,
      templateId: actualTemplateId,
      totalRecords,
    });

    return res.status(201).json({
      success: true,
      message: "Report generated successfully",
      data: {
        id: reportId,
        report_id: reportId,
        templateId: actualTemplateId,
        name: template.name,
        format: format || "PDF",
        status: "completed",
        generatedBy: req.user.email,
        generatedAt: new Date(),
        parameters: parameters || {},
        downloadUrl: `/api/v1/reports/${reportId}/download`,
        totalRecords,
        reportData,
      },
    });
  } catch (error) {
    logger.error("Error generating report:", error);
    return next(error);
  }
};

/**
 * @desc    Download a generated report
 * @route   GET /api/v1/reports/:id/download
 * @access  Private (ADMIN, INVENTORY_MANAGER, IT_MANAGER, AUDITOR)
 */
exports.downloadReport = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    logger.info("Report download requested", {
      userId: req.user.id,
      reportId: id,
    });

    // Find the generated report
    const { data: reportRows, error: reportErr } = await supabase
      .from("generated_reports")
      .select(
        "*, users:generated_by(name, email), report_templates:template(name, description)",
      )
      .eq("report_id", id)
      .limit(1);

    if (reportErr) throw reportErr;

    if (!reportRows || reportRows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const report = reportRows[0];

    // Update download statistics
    await supabase
      .from("generated_reports")
      .update({
        download_count: (report.download_count || 0) + 1,
        last_downloaded: new Date().toISOString(),
      })
      .eq("report_id", id);

    const dateRange =
      report.parameters?.startDate && report.parameters?.endDate
        ? `${new Date(report.parameters.startDate).toLocaleDateString()} - ${new Date(
            report.parameters.endDate,
          ).toLocaleDateString()}`
        : "All Time";

    let reportContent = `
ASSET MANAGEMENT REPORT
=======================

Report Name: ${report.report_name}
Category: ${report.category}
Generated By: ${report.users?.name || "System"} (${report.users?.email || ""})
Generated At: ${new Date(report.generated_at).toLocaleString()}
Date Range: ${dateRange}

DESCRIPTION
-----------
${report.report_templates?.description || "No description available"}

REPORT DATA
-----------
`;

    let assetQuery = supabase.from("assets").select("*");
    if (report.parameters?.startDate && report.parameters?.endDate) {
      assetQuery = assetQuery
        .gte("created_at", new Date(report.parameters.startDate).toISOString())
        .lte("created_at", new Date(report.parameters.endDate).toISOString());
    }

    switch (report.category) {
      case "Inventory": {
        const { data: assets } = await assetQuery;
        reportContent += `\nINVENTORY SUMMARY\n`;
        reportContent += `Total Assets: ${(assets || []).length}\n`;
        reportContent += `Active: ${(assets || []).filter((a) => a.status === "Active").length}\n`;
        reportContent += `Available: ${(assets || []).filter((a) => a.status === "Available").length}\n\n`;
        reportContent += `ASSET LIST:\n`;
        (assets || []).forEach((asset, idx) => {
          reportContent += `${idx + 1}. ${asset.unique_asset_id} - ${asset.name}\n`;
          reportContent += `   Status: ${asset.status}\n`;
          reportContent += `   Type: ${asset.asset_type}\n`;
          reportContent += `   Location: ${asset.location}\n`;
          reportContent += `   Value: ₹${asset.purchase_cost || 0}\n\n`;
        });
        break;
      }
      case "Analytics": {
        const { data: assets } = await assetQuery;
        const statusCounts = (assets || []).reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {});
        reportContent += `\nASSET UTILIZATION ANALYTICS\n`;
        reportContent += `Total Assets: ${(assets || []).length}\n\nBY STATUS:\n`;
        Object.entries(statusCounts).forEach(([status, count]) => {
          reportContent += `  ${status}: ${count} (${(
            (count / (assets || []).length) *
            100
          ).toFixed(2)}%)\n`;
        });
        break;
      }
      case "Financial": {
        const { data: assets } = await assetQuery;
        const totalValue = (assets || []).reduce(
          (sum, a) => sum + (a.purchase_cost || 0),
          0,
        );
        const byCategory = (assets || []).reduce((acc, a) => {
          const cat = a.asset_type || "Uncategorized";
          if (!acc[cat]) acc[cat] = { count: 0, value: 0 };
          acc[cat].count++;
          acc[cat].value += a.purchase_cost || 0;
          return acc;
        }, {});
        reportContent += `\nFINANCIAL SUMMARY\n`;
        reportContent += `Total Assets Value: ₹${totalValue.toLocaleString()}\n\nBY CATEGORY:\n`;
        Object.entries(byCategory).forEach(([cat, data]) => {
          reportContent += `  ${cat}: ${data.count} assets, ₹${data.value.toLocaleString()}\n`;
        });
        break;
      }
      case "Compliance": {
        const { data: assets } = await assetQuery;
        reportContent += `\nCOMPLIANCE AUDIT\n`;
        reportContent += `Total Assets: ${(assets || []).length}\n`;
        reportContent += `Assets with Complete Information: ${
          (assets || []).filter((a) => a.name && a.asset_type && a.location)
            .length
        }\n`;
        reportContent += `Compliance Rate: ${(
          ((assets || []).filter((a) => a.name && a.asset_type && a.location)
            .length /
            ((assets || []).length || 1)) *
          100
        ).toFixed(2)}%\n`;
        break;
      }
      default: {
        const { data: assets } = await assetQuery;
        reportContent += `\nGENERAL REPORT\nTotal Records: ${(assets || []).length}\n`;
      }
    }

    reportContent += `\n\n---\nReport ID: ${report.report_id}\nGenerated by Dead Stock Register System\n`;

    const pdfContent = Buffer.from(reportContent, "utf-8");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=report-${report.report_name.replace(/\s+/g, "-")}-${id}.txt`,
    );
    res.setHeader("Content-Length", pdfContent.length);
    return res.send(pdfContent);
  } catch (error) {
    logger.error("Error downloading report:", error);
    return next(error);
  }
};

/**
 * @desc    Get asset summary for reports
 * @route   GET /api/v1/reports/asset-summary
 * @access  Private (ADMIN, INVENTORY_MANAGER, IT_MANAGER, AUDITOR)
 */
exports.getAssetSummary = async (req, res, next) => {
  try {
    const supabase = getSupabase();

    const { data: assets, error } = await supabase
      .from("assets")
      .select("status, asset_type, location, purchase_cost");

    if (error) throw error;

    const allAssets = assets || [];
    const totalAssets = allAssets.length;
    const activeAssets = allAssets.filter((a) => a.status === "Active").length;
    const underMaintenance = allAssets.filter(
      (a) => a.status === "Under Maintenance",
    ).length;
    const inactiveAssets = totalAssets - activeAssets - underMaintenance;
    const totalValue = allAssets.reduce(
      (sum, a) => sum + (a.purchase_cost || 0),
      0,
    );

    // By category (asset_type)
    const categoryMap = {};
    allAssets.forEach((a) => {
      const cat = a.asset_type || "Unknown";
      if (!categoryMap[cat]) categoryMap[cat] = { count: 0, value: 0 };
      categoryMap[cat].count++;
      categoryMap[cat].value += a.purchase_cost || 0;
    });
    const byCategory = Object.entries(categoryMap)
      .map(([category, d]) => ({ category, count: d.count, value: d.value }))
      .sort((a, b) => b.count - a.count);

    // By location
    const locationMap = {};
    allAssets.forEach((a) => {
      const loc = a.location || "Unknown";
      locationMap[loc] = (locationMap[loc] || 0) + 1;
    });
    const byLocation = Object.entries(locationMap)
      .map(([location, count]) => ({
        location,
        count,
        percentage:
          totalAssets > 0 ? ((count / totalAssets) * 100).toFixed(1) : "0.0",
      }))
      .sort((a, b) => b.count - a.count);

    // By status
    const statusMap = {};
    allAssets.forEach((a) => {
      const s = a.status || "Unknown";
      statusMap[s] = (statusMap[s] || 0) + 1;
    });
    const byStatus = Object.entries(statusMap)
      .map(([status, count]) => ({
        status,
        count,
        percentage:
          totalAssets > 0 ? ((count / totalAssets) * 100).toFixed(1) : "0.0",
      }))
      .sort((a, b) => b.count - a.count);

    const summary = {
      totalAssets,
      activeAssets,
      inactiveAssets,
      underMaintenance,
      totalValue,
      depreciatedValue: totalValue,
      byCategory,
      byLocation,
      byStatus,
    };

    logger.info("Asset summary retrieved", { userId: req.user.id });

    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error("Error fetching asset summary:", error);
    return next(error);
  }
};
