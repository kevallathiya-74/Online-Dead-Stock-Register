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
    const { templateId, format, parameters } = req.body;

    logger.info('Report generation requested', { 
      userId: req.user.id, 
      templateId,
      format 
    });

    // Simulate report generation (replace with actual implementation)
    const report = {
      _id: `REP-${Date.now()}`,
      templateId: templateId || 'RPT-001',
      name: 'Generated Report',
      format: format || 'PDF',
      status: 'completed',
      generatedBy: req.user.email,
      generatedAt: new Date(),
      parameters: parameters || {},
      downloadUrl: `/api/v1/reports/download/${Date.now()}`,
      fileSize: '2.4 MB'
    };

    res.status(201).json({
      success: true,
      message: 'Report generated successfully',
      data: report
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

    // Simulate PDF file generation (replace with actual file retrieval)
    // In production, you would:
    // 1. Fetch report metadata from database
    // 2. Read the actual file from storage
    // 3. Stream the file to the client
    
    const samplePdfContent = Buffer.from(
      '%PDF-1.4\n1 0 obj\n<<\n/Type /Catalog\n/Pages 2 0 R\n>>\nendobj\n' +
      '2 0 obj\n<<\n/Type /Pages\n/Kids [3 0 R]\n/Count 1\n>>\nendobj\n' +
      '3 0 obj\n<<\n/Type /Page\n/Parent 2 0 R\n/Resources <<\n/Font <<\n/F1 4 0 R\n>>\n>>\n' +
      '/MediaBox [0 0 612 792]\n/Contents 5 0 R\n>>\nendobj\n' +
      '4 0 obj\n<<\n/Type /Font\n/Subtype /Type1\n/BaseFont /Helvetica\n>>\nendobj\n' +
      '5 0 obj\n<<\n/Length 44\n>>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Report Generated) Tj\nET\nendstream\nendobj\n' +
      'xref\n0 6\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n' +
      '0000000115 00000 n\n0000000262 00000 n\n0000000341 00000 n\n' +
      'trailer\n<<\n/Size 6\n/Root 1 0 R\n>>\nstartxref\n435\n%%EOF'
    );

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report-${id}.pdf`);
    res.setHeader('Content-Length', samplePdfContent.length);
    res.send(samplePdfContent);

  } catch (error) {
    logger.error('Error downloading report:', error);
    next(error);
  }
};

// Note: Functions are already exported using exports.functionName above
// No need for module.exports = {} at the end
