const AssetIssue = require('../models/assetIssue');
const Asset = require('../models/asset');
const User = require('../models/user');
const Notification = require('../models/notification');
const logger = require('../utils/logger');
const AuditLog = require('../models/auditLog');

/**
 * @desc    Create a new asset issue
 * @route   POST /api/assets/:id/issues
 * @access  Private (All authenticated users)
 */
const createAssetIssue = async (req, res) => {
  try {
    const { id: assetId } = req.params;
    const { issue_description, issue_type, severity, scan_location } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!issue_description || issue_description.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Issue description is required'
      });
    }

    // Find the asset to get unique_asset_id
    const asset = await Asset.findById(assetId);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Create the issue
    const newIssue = await AssetIssue.create({
      asset_id: assetId,
      unique_asset_id: asset.unique_asset_id,
      issue_description: issue_description.trim(),
      issue_type: issue_type || 'Other',
      severity: severity || 'Medium',
      reported_by: userId,
      scan_location: scan_location || 'QR Scanner'
    });

    // Populate reporter information
    await newIssue.populate('reported_by', 'name email');

    // Create audit log
    await AuditLog.create({
      user_id: userId,
      action: 'Asset Issue Reported',
      entity_type: 'AssetIssue',
      entity_id: newIssue._id,
      details: {
        asset_id: assetId,
        unique_asset_id: asset.unique_asset_id,
        issue_type: newIssue.issue_type,
        severity: newIssue.severity,
        description: issue_description.substring(0, 100) + (issue_description.length > 100 ? '...' : '')
      }
    });

    res.status(201).json({
      success: true,
      message: 'Asset issue reported successfully',
      data: newIssue
    });
  } catch (error) {
    logger.error('Error creating asset issue', { error: error.message, assetId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to create asset issue',
      error: error.message
    });
  }
};

/**
 * @desc    Get all issues for a specific asset
 * @route   GET /api/assets/:id/issues
 * @access  Private
 */
const getAssetIssues = async (req, res) => {
  try {
    const { id: assetId } = req.params;
    const { status, limit = 50 } = req.query;

    // Build query
    const query = { asset_id: assetId };
    if (status) {
      query.status = status;
    }

    // Get issues
    const issues = await AssetIssue.find(query)
      .populate('reported_by', 'name email')
      .populate('resolved_by', 'name email')
      .sort({ reported_at: -1 })
      .limit(parseInt(limit));

    // Get open issues count
    const openIssuesCount = await AssetIssue.countDocuments({
      asset_id: assetId,
      status: { $in: ['Open', 'In Progress'] }
    });

    res.json({
      success: true,
      data: {
        issues,
        total: issues.length,
        openCount: openIssuesCount
      }
    });
  } catch (error) {
    logger.error('Error fetching asset issues', { error: error.message, assetId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch asset issues',
      error: error.message
    });
  }
};

/**
 * @desc    Get latest open issue for an asset
 * @route   GET /api/assets/:id/issues/latest
 * @access  Private
 */
const getLatestAssetIssue = async (req, res) => {
  try {
    const { id: assetId } = req.params;

    const latestIssue = await AssetIssue.findOne({
      asset_id: assetId,
      status: { $in: ['Open', 'In Progress'] }
    })
      .populate('reported_by', 'name email')
      .sort({ reported_at: -1 });

    if (!latestIssue) {
      return res.json({
        success: true,
        data: null,
        message: 'No open issues found for this asset'
      });
    }

    res.json({
      success: true,
      data: latestIssue
    });
  } catch (error) {
    logger.error('Error fetching latest asset issue', { error: error.message, assetId: req.params.id });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest asset issue',
      error: error.message
    });
  }
};

/**
 * @desc    Update an asset issue
 * @route   PUT /api/assets/:id/issues/:issueId
 * @access  Private (Reporter or Admin/Inventory Manager)
 */
const updateAssetIssue = async (req, res) => {
  try {
    const { id: assetId, issueId } = req.params;
    const { issue_description, issue_type, severity, status, resolution_notes } = req.body;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the issue
    const issue = await AssetIssue.findOne({ _id: issueId, asset_id: assetId });
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Check permissions: Only reporter, admin, or inventory manager can update
    const isReporter = issue.reported_by.toString() === userId.toString();
    const isAuthorized = isReporter || ['ADMIN', 'INVENTORY_MANAGER'].includes(userRole);

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this issue'
      });
    }

    // Update fields
    if (issue_description) issue.issue_description = issue_description.trim();
    if (issue_type) issue.issue_type = issue_type;
    if (severity) issue.severity = severity;
    
    // Status update with resolution handling
    if (status) {
      issue.status = status;
      if (status === 'Resolved' || status === 'Closed') {
        issue.resolved_at = new Date();
        issue.resolved_by = userId;
        if (resolution_notes) {
          issue.resolution_notes = resolution_notes;
        }
      }
    }

    await issue.save();
    await issue.populate('reported_by', 'name email');
    await issue.populate('resolved_by', 'name email');

    // Create audit log
    await AuditLog.create({
      user_id: userId,
      action: 'Asset Issue Updated',
      entity_type: 'AssetIssue',
      entity_id: issue._id,
      details: {
        asset_id: assetId,
        unique_asset_id: issue.unique_asset_id,
        changes: { status, issue_type, severity }
      }
    });

    res.json({
      success: true,
      message: 'Asset issue updated successfully',
      data: issue
    });
  } catch (error) {
    logger.error('Error updating asset issue', { error: error.message, issueId: req.params.issueId });
    res.status(500).json({
      success: false,
      message: 'Failed to update asset issue',
      error: error.message
    });
  }
};

/**
 * @desc    Delete an asset issue
 * @route   DELETE /api/assets/:id/issues/:issueId
 * @access  Private (Admin/Inventory Manager only)
 */
const deleteAssetIssue = async (req, res) => {
  try {
    const { id: assetId, issueId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Only admin or inventory manager can delete
    if (!['ADMIN', 'INVENTORY_MANAGER'].includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete issues'
      });
    }

    const issue = await AssetIssue.findOneAndDelete({ _id: issueId, asset_id: assetId });
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }

    // Create audit log
    await AuditLog.create({
      user_id: userId,
      action: 'Asset Issue Deleted',
      entity_type: 'AssetIssue',
      entity_id: issueId,
      details: {
        asset_id: assetId,
        unique_asset_id: issue.unique_asset_id,
        deleted_issue_type: issue.issue_type
      }
    });

    res.json({
      success: true,
      message: 'Asset issue deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting asset issue', { error: error.message, issueId: req.params.issueId });
    res.status(500).json({
      success: false,
      message: 'Failed to delete asset issue',
      error: error.message
    });
  }
};

/**
 * @desc    Get all open issues (for dashboard/overview)
 * @route   GET /api/asset-issues/open
 * @access  Private (Admin/Inventory Manager/Auditor)
 */
const getAllOpenIssues = async (req, res) => {
  try {
    const { limit = 100, severity, issue_type } = req.query;

    const query = {
      status: { $in: ['Open', 'In Progress'] }
    };

    if (severity) query.severity = severity;
    if (issue_type) query.issue_type = issue_type;

    const issues = await AssetIssue.find(query)
      .populate('asset_id', 'unique_asset_id manufacturer model location')
      .populate('reported_by', 'name email')
      .sort({ severity: -1, reported_at: -1 })
      .limit(parseInt(limit));

    const criticalCount = await AssetIssue.countDocuments({ ...query, severity: 'Critical' });
    const highCount = await AssetIssue.countDocuments({ ...query, severity: 'High' });

    res.json({
      success: true,
      data: {
        issues,
        total: issues.length,
        criticalCount,
        highCount
      }
    });
  } catch (error) {
    logger.error('Error fetching open issues', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Failed to fetch open issues',
      error: error.message
    });
  }
};

module.exports = {
  createAssetIssue,
  getAssetIssues,
  getLatestAssetIssue,
  updateAssetIssue,
  deleteAssetIssue,
  getAllOpenIssues
};
