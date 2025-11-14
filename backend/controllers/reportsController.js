const logger = require('../utils/logger');
const ReportTemplate = require('../models/reportTemplate');
const GeneratedReport = require('../models/generatedReport');
const User = require('../models/user');

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
    const { category, status = 'active' } = req.query;
    
    // Build query
    const query = {};
    if (category) query.category = category;
    if (status) query.status = status;

    // Get templates from database
    const templates = await ReportTemplate.find(query)
      .populate('created_by', 'name email')
      .sort({ category: 1, name: 1 })
      .lean();

    // If no templates exist, seed initial templates
    if (templates.length === 0) {
      logger.warn('No report templates found. Please seed database.');
    }

    // Format for frontend compatibility
    const formattedTemplates = templates.map(template => ({
      _id: template.template_id,
      name: template.name,
      description: template.description,
      category: template.category,
      frequency: template.frequency.charAt(0).toUpperCase() + template.frequency.slice(1),
      type: template.type.charAt(0).toUpperCase() + template.type.slice(1),
      parameters: Array.isArray(template.parameters) ? template.parameters : 
                  typeof template.parameters === 'object' ? Object.keys(template.parameters) : [],
      lastGenerated: template.last_generated,
      status: template.status,
      format: Array.isArray(template.format) ? template.format[0] : template.format,
      generationCount: template.generation_count || 0
    }));

    logger.info('Report templates retrieved', {
      userId: req.user.id,
      count: formattedTemplates.length
    });

    res.status(200).json({
      success: true,
      count: formattedTemplates.length,
      data: formattedTemplates
    });
  } catch (error) {
    logger.error('Error fetching report templates:', error);
    next(error);
  }
};

/**
 * @desc    Get report generation history
 * @route   GET /api/v1/reports/history
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getReportHistory = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 15,
      status = '',
      category = ''
    } = req.query;

    // Build query
    const query = {};
    if (status) query.status = status;
    if (category) query.category = category;

    // Get total count
    const totalReports = await GeneratedReport.countDocuments(query);

    // Get paginated reports
    const reports = await GeneratedReport.find(query)
      .populate('generated_by', 'name email')
      .populate('template', 'name template_id')
      .sort({ generated_at: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .lean();

    // Format for frontend
    const history = reports.map(report => ({
      _id: report.report_id,
      reportName: report.report_name,
      category: report.category,
      generatedBy: report.generated_by?.email || 'Unknown',
      generatedAt: report.generated_at,
      status: report.status,
      format: report.format,
      fileSize: report.file_size ? 
        (report.file_size < 1024 * 1024 ? 
          `${(report.file_size / 1024).toFixed(2)} KB` : 
          `${(report.file_size / (1024 * 1024)).toFixed(2)} MB`) 
        : 'N/A',
      downloadCount: report.download_count || 0
    }));

    logger.info('Report history retrieved', {
      userId: req.user.id,
      count: history.length,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      count: history.length,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalReports / parseInt(limit)),
        totalItems: totalReports
      },
      data: history
    });
  } catch (error) {
    logger.error('Error fetching report history:', error);
    next(error);
  }
};

/**
 * @desc    Get report statistics
 * @route   GET /api/v1/reports/stats
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getReportStats = async (req, res, next) => {
  try {
    // Get real statistics from database
    const totalTemplates = await ReportTemplate.countDocuments({ status: 'active' });
    const scheduledReports = await ReportTemplate.countDocuments({ 
      status: 'active', 
      is_scheduled: true 
    });

    // Reports generated this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const generatedThisMonth = await GeneratedReport.countDocuments({
      generated_at: { $gte: startOfMonth }
    });

    // Total downloads
    const totalDownloadsResult = await GeneratedReport.aggregate([
      { $group: { _id: null, total: { $sum: '$download_count' } } }
    ]);
    const totalDownloads = totalDownloadsResult[0]?.total || 0;

    // Reports by category
    const byCategory = await GeneratedReport.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const byCategoryObj = {};
    byCategory.forEach(item => {
      byCategoryObj[item._id] = item.count;
    });

    // Reports by status
    const byStatus = await GeneratedReport.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    const byStatusObj = {};
    byStatus.forEach(item => {
      byStatusObj[item._id] = item.count;
    });

    const stats = {
      totalTemplates,
      generatedThisMonth,
      scheduledReports,
      totalDownloads,
      byCategory: byCategoryObj,
      byStatus: byStatusObj
    };

    logger.info('Report stats retrieved', { userId: req.user.id });

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching report stats:', error);
    next(error);
  }
};

/**
 * @desc    Generate a report
 * @route   POST /api/v1/reports/generate
 * @access  Private (ADMIN, INVENTORY_MANAGER, IT_MANAGER, AUDITOR)
 */
exports.generateReport = async (req, res, next) => {
  try {
    const { template_id, templateId, format, parameters } = req.body;
    const actualTemplateId = template_id || templateId;

    if (!actualTemplateId) {
      return res.status(400).json({
        success: false,
        message: 'Template ID is required'
      });
    }

    logger.info('Report generation requested', { 
      userId: req.user.id, 
      templateId: actualTemplateId,
      format 
    });

    // Find the template
    const template = await ReportTemplate.findOne({ template_id: actualTemplateId });
    
    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Report template not found'
      });
    }

    // Generate unique report ID
    const reportId = `REP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Fetch real data from Asset model based on template category
    const Asset = require('../models/asset');
    let reportData = {};
    let totalRecords = 0;

    // Build query based on parameters
    const query = {};
    if (parameters?.startDate && parameters?.endDate) {
      query.created_at = {
        $gte: new Date(parameters.startDate),
        $lte: new Date(parameters.endDate)
      };
    }

    // Get data based on template category
    switch (template.category) {
      case 'Inventory':
        const assets = await Asset.find(query).populate('assigned_to', 'name email').lean();
        totalRecords = assets.length;
        reportData = {
          assets,
          summary: {
            total: totalRecords,
            active: assets.filter(a => a.status === 'Active').length,
            inactive: assets.filter(a => a.status === 'Inactive').length,
            underMaintenance: assets.filter(a => a.status === 'Under Maintenance').length
          }
        };
        break;

      case 'Analytics':
        const analyticsAssets = await Asset.find(query).lean();
        totalRecords = analyticsAssets.length;
        
        // Calculate analytics data
        const utilizationData = analyticsAssets.reduce((acc, asset) => {
          const status = asset.status || 'Unknown';
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        reportData = {
          utilizationByStatus: utilizationData,
          totalAssets: totalRecords,
          averageCost: analyticsAssets.reduce((sum, a) => sum + (a.cost || 0), 0) / totalRecords || 0
        };
        break;

      case 'Financial':
        const financialAssets = await Asset.find(query).lean();
        totalRecords = financialAssets.length;
        
        reportData = {
          totalValue: financialAssets.reduce((sum, a) => sum + (a.cost || 0), 0),
          depreciatedValue: financialAssets.reduce((sum, a) => sum + (a.current_value || a.cost || 0), 0),
          byCategory: financialAssets.reduce((acc, asset) => {
            const category = asset.category || 'Uncategorized';
            if (!acc[category]) {
              acc[category] = { count: 0, value: 0 };
            }
            acc[category].count++;
            acc[category].value += asset.cost || 0;
            return acc;
          }, {}),
          totalRecords
        };
        break;

      case 'Compliance':
        const complianceAssets = await Asset.find(query).populate('assigned_to').lean();
        const Maintenance = require('../models/maintenance');
        const maintenanceRecords = await Maintenance.find(query).lean();
        
        totalRecords = complianceAssets.length;
        reportData = {
          assets: complianceAssets,
          maintenanceCompliance: {
            totalAssets: totalRecords,
            withMaintenance: maintenanceRecords.length,
            complianceRate: ((maintenanceRecords.length / totalRecords) * 100).toFixed(2)
          }
        };
        break;

      case 'Tracking':
        const AssetTransfer = require('../models/assetTransfer');
        const transfers = await AssetTransfer.find(query)
          .populate('asset_id', 'asset_id name')
          .populate('transferred_by', 'name email')
          .lean();
        
        totalRecords = transfers.length;
        reportData = {
          transfers,
          summary: {
            total: totalRecords,
            byStatus: transfers.reduce((acc, t) => {
              acc[t.status] = (acc[t.status] || 0) + 1;
              return acc;
            }, {})
          }
        };
        break;

      case 'Vendor':
        const Vendor = require('../models/vendor');
        const vendors = await Vendor.find().lean();
        const PurchaseOrder = require('../models/purchaseOrder');
        const orders = await PurchaseOrder.find(query).populate('vendor_id').lean();
        
        totalRecords = orders.length;
        reportData = {
          vendors,
          purchaseOrders: orders,
          summary: {
            totalVendors: vendors.length,
            totalOrders: totalRecords,
            totalValue: orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
          }
        };
        break;

      default:
        const defaultAssets = await Asset.find(query).lean();
        totalRecords = defaultAssets.length;
        reportData = { assets: defaultAssets, totalRecords };
    }

    // Create report record in database
    const generatedReport = new GeneratedReport({
      report_id: reportId,
      template: template._id,
      report_name: template.name,
      category: template.category,
      generated_by: req.user.id,
      generated_at: new Date(),
      status: 'completed',
      format: format || 'PDF',
      parameters: parameters || {},
      data_summary: {
        total_records: totalRecords,
        date_range: parameters?.startDate && parameters?.endDate ? {
          start: new Date(parameters.startDate),
          end: new Date(parameters.endDate)
        } : null
      }
    });

    await generatedReport.save();

    // Update template's last generated time and count
    template.last_generated = new Date();
    template.generation_count = (template.generation_count || 0) + 1;
    await template.save();

    logger.info('Report generated successfully', {
      userId: req.user.id,
      reportId,
      templateId: actualTemplateId,
      totalRecords
    });

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: {
        _id: reportId,
        report_id: reportId,
        templateId: actualTemplateId,
        name: template.name,
        format: format || 'PDF',
        status: 'completed',
        generatedBy: req.user.email,
        generatedAt: new Date(),
        parameters: parameters || {},
        downloadUrl: `/api/v1/reports/${reportId}/download`,
        totalRecords,
        reportData // Include actual data for immediate use
      }
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    next(error);
  }
};


/**
 * @desc    Download a generated report
 * @route   GET /api/v1/reports/:id/download
 * @access  Private (ADMIN, INVENTORY_MANAGER, IT_MANAGER, AUDITOR)
 */
exports.downloadReport = async (req, res, next) => {
  try {
    const { id } = req.params;

    logger.info('Report download requested', { 
      userId: req.user.id, 
      reportId: id 
    });

    // Find the generated report
    const report = await GeneratedReport.findOne({ report_id: id })
      .populate('template', 'name description')
      .populate('generated_by', 'name email')
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found'
      });
    }

    // Update download statistics
    await GeneratedReport.findOneAndUpdate(
      { report_id: id },
      { 
        $inc: { download_count: 1 },
        last_downloaded: new Date()
      }
    );

    // Fetch the actual data for the report
    const Asset = require('../models/asset');
    let reportContent = '';

    // Build the report content based on category
    const template = report.template;
    const dateRange = report.parameters?.startDate && report.parameters?.endDate ? 
      `${new Date(report.parameters.startDate).toLocaleDateString()} - ${new Date(report.parameters.endDate).toLocaleDateString()}` :
      'All Time';

    // Create PDF-like text content
    reportContent = `
ASSET MANAGEMENT REPORT
=======================

Report Name: ${report.report_name}
Category: ${report.category}
Generated By: ${report.generated_by?.name || 'System'} (${report.generated_by?.email || ''})
Generated At: ${new Date(report.generated_at).toLocaleString()}
Date Range: ${dateRange}
Total Records: ${report.data_summary?.total_records || 0}

DESCRIPTION
-----------
${template?.description || 'No description available'}

REPORT DATA
-----------
`;

    // Add category-specific data
    const query = {};
    if (report.parameters?.startDate && report.parameters?.endDate) {
      query.created_at = {
        $gte: new Date(report.parameters.startDate),
        $lte: new Date(report.parameters.endDate)
      };
    }

    switch (report.category) {
      case 'Inventory':
        const assets = await Asset.find(query).populate('assigned_to', 'name email').lean();
        reportContent += `\nINVENTORY SUMMARY\n`;
        reportContent += `Total Assets: ${assets.length}\n`;
        reportContent += `Active: ${assets.filter(a => a.status === 'Active').length}\n`;
        reportContent += `Inactive: ${assets.filter(a => a.status === 'Inactive').length}\n\n`;
        reportContent += `ASSET LIST:\n`;
        assets.forEach((asset, idx) => {
          reportContent += `${idx + 1}. ${asset.asset_id} - ${asset.name}\n`;
          reportContent += `   Status: ${asset.status}\n`;
          reportContent += `   Category: ${asset.category}\n`;
          reportContent += `   Location: ${asset.location}\n`;
          reportContent += `   Value: ₹${asset.cost || 0}\n\n`;
        });
        break;

      case 'Analytics':
        const analyticsAssets = await Asset.find(query).lean();
        const statusCounts = analyticsAssets.reduce((acc, a) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {});
        reportContent += `\nASSET UTILIZATION ANALYTICS\n`;
        reportContent += `Total Assets: ${analyticsAssets.length}\n\n`;
        reportContent += `BY STATUS:\n`;
        Object.entries(statusCounts).forEach(([status, count]) => {
          reportContent += `  ${status}: ${count} (${((count / analyticsAssets.length) * 100).toFixed(2)}%)\n`;
        });
        break;

      case 'Financial':
        const financialAssets = await Asset.find(query).lean();
        const totalValue = financialAssets.reduce((sum, a) => sum + (a.cost || 0), 0);
        const byCategory = financialAssets.reduce((acc, a) => {
          const cat = a.category || 'Uncategorized';
          if (!acc[cat]) acc[cat] = { count: 0, value: 0 };
          acc[cat].count++;
          acc[cat].value += a.cost || 0;
          return acc;
        }, {});
        
        reportContent += `\nFINANCIAL SUMMARY\n`;
        reportContent += `Total Assets Value: ₹${totalValue.toLocaleString()}\n\n`;
        reportContent += `BY CATEGORY:\n`;
        Object.entries(byCategory).forEach(([cat, data]) => {
          reportContent += `  ${cat}: ${data.count} assets, ₹${data.value.toLocaleString()}\n`;
        });
        break;

      case 'Compliance':
        const complianceAssets = await Asset.find(query).lean();
        reportContent += `\nCOMPLIANCE AUDIT\n`;
        reportContent += `Total Assets: ${complianceAssets.length}\n`;
        reportContent += `Assets with Complete Information: ${complianceAssets.filter(a => a.name && a.category && a.location).length}\n`;
        reportContent += `Compliance Rate: ${((complianceAssets.filter(a => a.name && a.category && a.location).length / complianceAssets.length) * 100).toFixed(2)}%\n`;
        break;

      default:
        const defaultAssets = await Asset.find(query).lean();
        reportContent += `\nGENERAL REPORT\n`;
        reportContent += `Total Records: ${defaultAssets.length}\n`;
    }

    reportContent += `\n\n---\nReport ID: ${report.report_id}\nGenerated by Dead Stock Register System\n`;

    // Create a simple PDF structure or send as text
    const pdfContent = Buffer.from(reportContent, 'utf-8');

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${report.report_name.replace(/\s+/g, '-')}-${id}.txt`);
    res.setHeader('Content-Length', pdfContent.length);
    res.send(pdfContent);

  } catch (error) {
    logger.error('Error downloading report:', error);
    next(error);
  }
};

/**
 * @desc    Get asset summary for reports
 * @route   GET /api/v1/reports/asset-summary
 * @access  Private (ADMIN, INVENTORY_MANAGER, IT_MANAGER, AUDITOR)
 */
exports.getAssetSummary = async (req, res, next) => {
  try {
    const Asset = require('../models/asset');
    
    // Get aggregate statistics
    const [totalStats, categoryStats, locationStats, statusStats] = await Promise.all([
      // Total assets and values
      Asset.aggregate([
        {
          $group: {
            _id: null,
            totalAssets: { $sum: 1 },
            totalValue: { $sum: '$cost' },
            depreciatedValue: { $sum: '$current_value' },
            activeAssets: {
              $sum: { $cond: [{ $eq: ['$status', 'Active'] }, 1, 0] }
            },
            underMaintenance: {
              $sum: { $cond: [{ $eq: ['$status', 'Under Maintenance'] }, 1, 0] }
            }
          }
        }
      ]),
      
      // By category
      Asset.aggregate([
        {
          $group: {
            _id: '$asset_type',
            count: { $sum: 1 },
            value: { $sum: '$cost' }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // By location
      Asset.aggregate([
        {
          $group: {
            _id: '$location',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]),
      
      // By status
      Asset.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ])
    ]);

    const totals = totalStats[0] || {
      totalAssets: 0,
      totalValue: 0,
      depreciatedValue: 0,
      activeAssets: 0,
      underMaintenance: 0
    };

    const inactiveAssets = totals.totalAssets - totals.activeAssets - totals.underMaintenance;

    // Calculate percentages for locations and statuses
    const byLocation = locationStats.map(item => ({
      location: item._id || 'Unknown',
      count: item.count,
      percentage: ((item.count / totals.totalAssets) * 100).toFixed(1)
    }));

    const byStatus = statusStats.map(item => ({
      status: item._id || 'Unknown',
      count: item.count,
      percentage: ((item.count / totals.totalAssets) * 100).toFixed(1)
    }));

    const byCategory = categoryStats.map(item => ({
      category: item._id || 'Unknown',
      count: item.count,
      value: item.value || 0
    }));

    const summary = {
      totalAssets: totals.totalAssets,
      activeAssets: totals.activeAssets,
      inactiveAssets,
      underMaintenance: totals.underMaintenance,
      totalValue: totals.totalValue,
      depreciatedValue: totals.depreciatedValue,
      byCategory,
      byLocation,
      byStatus
    };

    logger.info('Asset summary retrieved', { userId: req.user.id });

    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    logger.error('Error fetching asset summary:', error);
    next(error);
  }
};