const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const Asset = require('../models/asset');
const AuditLog = require('../models/auditLog');

// Apply auth middleware to all auditor routes
router.use(authMiddleware);

// Submit audit result
router.post('/submit-audit', async (req, res) => {
  try {
    const { asset_id, condition, status, notes, location_verified, user_verified } = req.body;
    const auditorId = req.user.id;

    // Find the asset
    const asset = await Asset.findOne({ unique_asset_id: asset_id });
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Update asset with audit results
    asset.condition = condition;
    asset.last_audit_date = new Date();
    asset.last_audited_by = auditorId;
    
    if (status === 'missing') {
      asset.status = 'Missing';
    } else if (status === 'discrepancy') {
      asset.status = 'Under Review';
    }
    
    if (notes) {
      asset.notes = notes;
    }

    await asset.save();

    // Create audit log entry
    const auditLog = new AuditLog({
      asset_id: asset._id,
      action: 'audit_completed',
      performed_by: auditorId,
      details: {
        condition,
        status,
        notes,
        location_verified,
        user_verified
      },
      timestamp: new Date()
    });

    await auditLog.save();

    res.json({ 
      message: 'Audit submitted successfully',
      asset_id: asset.unique_asset_id,
      audit_id: auditLog._id
    });
  } catch (error) {
    console.error('Error submitting audit:', error);
    res.status(500).json({ 
      message: 'Failed to submit audit',
      error: error.message 
    });
  }
});

// Get assets pending audit
router.get('/pending-audits', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    
    const assets = await Asset.find({
      $or: [
        { last_audit_date: { $exists: false } },
        { last_audit_date: null },
        { last_audit_date: { $lt: new Date(Date.now() - 365*24*60*60*1000) } }
      ]
    })
    .populate('assigned_user', 'name email')
    .populate('vendor', 'name')
    .sort({ created_at: 1 })
    .limit(parseInt(limit))
    .skip(parseInt(offset));

    const formattedAssets = assets.map(asset => ({
      id: asset._id,
      unique_asset_id: asset.unique_asset_id,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial_number: asset.serial_number,
      status: asset.status,
      location: asset.location,
      assigned_user: asset.assigned_user ? asset.assigned_user.name : 'Unassigned',
      condition: asset.condition || 'Unknown',
      last_audit_date: asset.last_audit_date,
      vendor: asset.vendor ? asset.vendor.name : 'Unknown'
    }));

    res.json(formattedAssets);
  } catch (error) {
    console.error('Error getting pending audits:', error);
    res.status(500).json({ 
      message: 'Failed to get pending audits',
      error: error.message 
    });
  }
});

// Search assets for audit
router.get('/search-assets', async (req, res) => {
  try {
    const { q, location, status, condition, limit = 20 } = req.query;
    
    const query = {};
    
    if (q) {
      query.$or = [
        { unique_asset_id: { $regex: q, $options: 'i' } },
        { manufacturer: { $regex: q, $options: 'i' } },
        { model: { $regex: q, $options: 'i' } },
        { serial_number: { $regex: q, $options: 'i' } }
      ];
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (status) {
      query.status = status;
    }
    
    if (condition) {
      query.condition = condition;
    }

    const assets = await Asset.find(query)
      .populate('assigned_user', 'name email')
      .populate('vendor', 'name')
      .sort({ created_at: -1 })
      .limit(parseInt(limit));

    const formattedAssets = assets.map(asset => ({
      id: asset._id,
      unique_asset_id: asset.unique_asset_id,
      manufacturer: asset.manufacturer,
      model: asset.model,
      serial_number: asset.serial_number,
      status: asset.status,
      location: asset.location,
      assigned_user: asset.assigned_user ? asset.assigned_user.name : 'Unassigned',
      condition: asset.condition || 'Unknown',
      last_audit_date: asset.last_audit_date
    }));

    res.json(formattedAssets);
  } catch (error) {
    console.error('Error searching assets:', error);
    res.status(500).json({ 
      message: 'Failed to search assets',
      error: error.message 
    });
  }
});

// Generate audit report
router.post('/generate-report', async (req, res) => {
  try {
    const { startDate, endDate, location, status } = req.body;
    const auditorId = req.user.id;
    
    const query = {};
    
    if (startDate && endDate) {
      query.last_audit_date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (status) {
      query.status = status;
    }

    const assets = await Asset.find(query)
      .populate('assigned_user', 'name email')
      .populate('last_audited_by', 'name email')
      .sort({ last_audit_date: -1 });

    // In a real application, you would generate a PDF or Excel file here
    // For now, we'll just return a report ID and summary
    const reportId = `AUDIT_${Date.now()}_${auditorId}`;
    
    const summary = {
      totalAssets: assets.length,
      auditedAssets: assets.filter(a => a.last_audit_date).length,
      conditionBreakdown: {
        excellent: assets.filter(a => a.condition === 'Excellent').length,
        good: assets.filter(a => a.condition === 'Good').length,
        fair: assets.filter(a => a.condition === 'Fair').length,
        poor: assets.filter(a => a.condition === 'Poor').length,
        damaged: assets.filter(a => a.condition === 'Damaged').length
      },
      statusBreakdown: {
        active: assets.filter(a => a.status === 'Active').length,
        inactive: assets.filter(a => a.status === 'Inactive').length,
        missing: assets.filter(a => a.status === 'Missing').length,
        underReview: assets.filter(a => a.status === 'Under Review').length
      }
    };

    res.json({
      reportId,
      downloadUrl: `/api/auditor/reports/${reportId}`,
      summary,
      generatedAt: new Date(),
      generatedBy: req.user.name || req.user.email
    });
  } catch (error) {
    console.error('Error generating audit report:', error);
    res.status(500).json({ 
      message: 'Failed to generate audit report',
      error: error.message 
    });
  }
});

// Update audit item
router.put('/audit-items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const auditorId = req.user.id;

    // Find and update the asset
    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({ message: 'Asset not found' });
    }

    // Update allowed fields
    if (updateData.condition) asset.condition = updateData.condition;
    if (updateData.notes) asset.notes = updateData.notes;
    if (updateData.status) {
      if (updateData.status === 'verified') {
        asset.status = 'Active';
      } else if (updateData.status === 'discrepancy') {
        asset.status = 'Under Review';
      } else if (updateData.status === 'missing') {
        asset.status = 'Missing';
      }
    }

    asset.last_audit_date = new Date();
    asset.last_audited_by = auditorId;
    
    await asset.save();

    // Create audit log
    const auditLog = new AuditLog({
      asset_id: asset._id,
      action: 'audit_updated',
      performed_by: auditorId,
      details: updateData,
      timestamp: new Date()
    });

    await auditLog.save();

    res.json({
      id: asset._id,
      asset_id: asset.unique_asset_id,
      asset_name: `${asset.manufacturer} ${asset.model}`,
      location: asset.location,
      assigned_user: 'Updated', // Would need to populate this
      last_audit_date: asset.last_audit_date,
      status: updateData.status || 'verified',
      condition: asset.condition,
      notes: asset.notes
    });
  } catch (error) {
    console.error('Error updating audit item:', error);
    res.status(500).json({ 
      message: 'Failed to update audit item',
      error: error.message 
    });
  }
});

module.exports = router;