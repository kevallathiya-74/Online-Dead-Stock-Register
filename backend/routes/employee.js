const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Asset = require('../models/asset');
const Maintenance = require('../models/maintenance');
const AuditLog = require('../models/auditLog');

// Apply auth middleware to all employee routes
router.use(authMiddleware);

// Get employee's assigned assets
router.get('/my-assets', async (req, res) => {
  try {
    const userId = req.user.id;
    
    const assets = await Asset.find({ assigned_user: userId })
      .populate('vendor', 'name')
      .sort({ assigned_date: -1 });

    const formattedAssets = assets.map(asset => ({
      id: asset._id,
      unique_asset_id: asset.unique_asset_id,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial_number: asset.serial_number,
      status: asset.status,
      location: asset.location,
      assigned_user: 'Current User',
      last_audit_date: asset.last_audit_date,
      condition: asset.condition,
      category: asset.category,
      assigned_date: asset.assigned_date,
      warranty_expiry: asset.warranty_end_date
    }));

    res.json(formattedAssets);
  } catch (error) {
    console.error('Error fetching user assets:', error);
    res.status(500).json({ 
      message: 'Failed to fetch your assets',
      error: error.message 
    });
  }
});

// Get employee statistics
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get assets assigned to current user
    const userAssets = await Asset.find({ assigned_user: userId });
    const activeAssets = userAssets.filter(asset => asset.status === 'Active');
    
    // Get pending maintenance requests for user's assets
    const pendingMaintenance = await Maintenance.countDocuments({
      asset: { $in: userAssets.map(a => a._id) },
      status: 'Pending'
    });
    
    // Get warranties expiring within 3 months
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    
    const warrantiesExpiring = userAssets.filter(asset => {
      return asset.warranty_end_date && 
             new Date(asset.warranty_end_date) <= threeMonthsFromNow &&
             new Date(asset.warranty_end_date) > new Date();
    }).length;
    
    res.json({
      total_assets: userAssets.length,
      active_assets: activeAssets.length,
      pending_maintenance: pendingMaintenance,
      warranties_expiring: warrantiesExpiring
    });
  } catch (error) {
    console.error('Error getting employee stats:', error);
    res.status(500).json({ 
      message: 'Failed to get employee statistics',
      error: error.message 
    });
  }
});

// Get employee's maintenance requests
router.get('/maintenance-requests', async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Get user's assets
    const userAssets = await Asset.find({ assigned_user: userId });
    const assetIds = userAssets.map(a => a._id);
    
    // Get maintenance requests for user's assets
    const maintenanceRequests = await Maintenance.find({ 
      asset: { $in: assetIds }
    })
    .populate('asset', 'manufacturer model unique_asset_id')
    .sort({ created_at: -1 });

    const formattedRequests = maintenanceRequests.map(request => ({
      id: request._id,
      asset_id: request.asset.unique_asset_id,
      asset_name: `${request.asset.manufacturer} ${request.asset.model}`,
      issue_description: request.description || 'Maintenance required',
      priority: request.priority || 'medium',
      status: request.status.toLowerCase(),
      created_date: request.created_at
    }));

    res.json(formattedRequests);
  } catch (error) {
    console.error('Error fetching maintenance requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch maintenance requests',
      error: error.message 
    });
  }
});

// Submit maintenance request
router.post('/maintenance-requests', async (req, res) => {
  try {
    const { asset_id, issue_description, priority } = req.body;
    const userId = req.user.id;

    // Find the asset and verify ownership
    const asset = await Asset.findOne({ 
      unique_asset_id: asset_id,
      assigned_user: userId 
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found or not assigned to you' });
    }

    // Create maintenance request
    const maintenanceRequest = new Maintenance({
      asset: asset._id,
      maintenance_type: 'Repair',
      description: issue_description,
      priority: priority,
      status: 'Pending',
      requested_by: userId,
      created_at: new Date()
    });

    await maintenanceRequest.save();

    // Create audit log
    const auditLog = new AuditLog({
      asset_id: asset._id,
      action: 'maintenance_requested',
      performed_by: userId,
      details: {
        description: issue_description,
        priority: priority
      },
      timestamp: new Date()
    });

    await auditLog.save();

    res.json({
      id: maintenanceRequest._id,
      asset_id: asset.unique_asset_id,
      asset_name: `${asset.manufacturer} ${asset.model}`,
      issue_description: issue_description,
      priority: priority,
      status: 'pending',
      created_date: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error submitting maintenance request:', error);
    res.status(500).json({ 
      message: 'Failed to submit maintenance request',
      error: error.message 
    });
  }
});

// Check-in asset (return to inventory)
router.post('/checkin-asset/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const { notes } = req.body;
    const userId = req.user.id;

    // Find and verify asset ownership
    const asset = await Asset.findOne({ 
      unique_asset_id: assetId,
      assigned_user: userId 
    });

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found or not assigned to you' });
    }

    // Update asset status
    asset.assigned_user = null;
    asset.status = 'Available';
    asset.location = 'Inventory';
    await asset.save();

    // Create audit log
    const auditLog = new AuditLog({
      asset_id: asset._id,
      action: 'asset_returned',
      performed_by: userId,
      details: {
        notes: notes || 'Asset returned by employee',
        return_date: new Date()
      },
      timestamp: new Date()
    });

    await auditLog.save();

    res.json({ message: 'Asset checked-in successfully' });
  } catch (error) {
    console.error('Error checking in asset:', error);
    res.status(500).json({ 
      message: 'Failed to check-in asset',
      error: error.message 
    });
  }
});

// Verify asset assignment (for QR scanning)
router.get('/verify-asset/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const userId = req.user.id;

    const asset = await Asset.findOne({ 
      unique_asset_id: assetId,
      assigned_user: userId 
    });

    res.json({ 
      isAssigned: !!asset,
      asset: asset ? {
        id: asset._id,
        unique_asset_id: asset.unique_asset_id,
        manufacturer: asset.manufacturer,
        model: asset.model,
        status: asset.status,
        location: asset.location
      } : null
    });
  } catch (error) {
    console.error('Error verifying asset assignment:', error);
    res.status(500).json({ 
      message: 'Failed to verify asset assignment',
      error: error.message 
    });
  }
});

// Get warranties expiring soon
router.get('/expiring-warranties', async (req, res) => {
  try {
    const userId = req.user.id;
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

    const assets = await Asset.find({
      assigned_user: userId,
      warranty_end_date: { 
        $lte: threeMonthsFromNow,
        $gt: new Date()
      }
    });

    const formattedAssets = assets.map(asset => ({
      id: asset._id,
      unique_asset_id: asset.unique_asset_id,
      manufacturer: asset.manufacturer,
      model: asset.model,
      warranty_expiry: asset.warranty_end_date,
      location: asset.location,
      condition: asset.condition
    }));

    res.json(formattedAssets);
  } catch (error) {
    console.error('Error fetching expiring warranties:', error);
    res.status(500).json({ 
      message: 'Failed to fetch expiring warranties',
      error: error.message 
    });
  }
});

// Submit feedback
router.post('/feedback', async (req, res) => {
  try {
    const { category, subject, message, priority } = req.body;
    const userId = req.user.id;

    // Create audit log for feedback (using audit log as feedback storage)
    const auditLog = new AuditLog({
      asset_id: null, // No specific asset
      action: 'feedback_submitted',
      performed_by: userId,
      details: {
        category,
        subject,
        message,
        priority
      },
      timestamp: new Date()
    });

    await auditLog.save();

    res.json({ message: 'Feedback submitted successfully' });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      message: 'Failed to submit feedback',
      error: error.message 
    });
  }
});

// Get employee activity history
router.get('/activity-history', async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20 } = req.query;

    const activities = await AuditLog.find({ performed_by: userId })
      .populate('asset_id', 'unique_asset_id manufacturer model')
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    const formattedActivities = activities.map(activity => ({
      id: activity._id,
      type: activity.action,
      title: getActivityTitle(activity.action),
      description: activity.details ? 
        JSON.stringify(activity.details) : 
        `${activity.action} performed`,
      timestamp: activity.timestamp,
      asset_id: activity.asset_id ? activity.asset_id.unique_asset_id : null,
      status: 'completed'
    }));

    res.json(formattedActivities);
  } catch (error) {
    console.error('Error fetching activity history:', error);
    res.status(500).json({ 
      message: 'Failed to fetch activity history',
      error: error.message 
    });
  }
});

// Get detailed asset information
router.get('/assets/:assetId', async (req, res) => {
  try {
    const { assetId } = req.params;
    const userId = req.user.id;

    const asset = await Asset.findOne({
      unique_asset_id: assetId,
      assigned_user: userId
    }).populate('vendor', 'name');

    if (!asset) {
      return res.status(404).json({ message: 'Asset not found or not assigned to you' });
    }

    res.json({
      id: asset._id,
      unique_asset_id: asset.unique_asset_id,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial_number: asset.serial_number,
      status: asset.status,
      location: asset.location,
      condition: asset.condition,
      category: asset.category,
      assigned_date: asset.assigned_date,
      warranty_expiry: asset.warranty_end_date,
      vendor: asset.vendor ? asset.vendor.name : null
    });
  } catch (error) {
    console.error('Error fetching asset details:', error);
    res.status(500).json({ 
      message: 'Failed to fetch asset details',
      error: error.message 
    });
  }
});

// Helper function for activity titles
function getActivityTitle(action) {
  const titles = {
    'maintenance_requested': 'Maintenance Request Submitted',
    'asset_returned': 'Asset Returned',
    'feedback_submitted': 'Feedback Submitted',
    'asset_assigned': 'Asset Assigned',
    'audit_completed': 'Asset Audit Completed'
  };
  return titles[action] || action.replace('_', ' ').toUpperCase();
}

module.exports = router;