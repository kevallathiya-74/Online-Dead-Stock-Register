const Asset = require('../models/asset');
const AuditLog = require('../models/auditLog');
const User = require('../models/user');

/**
 * Enhanced QR Scanning Controller
 * Handles QR code scanning, batch scanning, and scan history tracking
 */

// Scan single asset by QR code
exports.scanAsset = async (req, res) => {
  try {
    const { qrCode } = req.params;
    const { mode = 'lookup', include_history = false } = req.query;

    // Find asset by unique ID or serial number
    const asset = await Asset.findOne({
      $or: [
        { unique_asset_id: qrCode },
        { serial_number: qrCode },
        { qr_code: qrCode }
      ]
    }).populate('assigned_user', 'name email department')
      .populate('vendor', 'vendor_name email phone');

    if (!asset) {
      // Log failed scan attempt
      await AuditLog.create({
        action: 'qr_scan_failed',
        performed_by: req.user.id,
        details: {
          qr_code: qrCode,
          mode,
          reason: 'Asset not found'
        },
        timestamp: new Date()
      });

      return res.status(404).json({
        success: false,
        message: 'Asset not found',
        qr_code: qrCode
      });
    }

    // Get scan history if requested
    let scanHistory = [];
    if (include_history === 'true') {
      scanHistory = await AuditLog.find({
        asset_id: asset._id,
        action: { $in: ['qr_scan_success', 'audit_scanned', 'checkout_scanned'] }
      })
      .sort({ timestamp: -1 })
      .limit(10)
      .populate('performed_by', 'name email')
      .select('action performed_by timestamp details');
    }

    // Log successful scan
    await AuditLog.create({
      asset_id: asset._id,
      action: mode === 'audit' ? 'audit_scanned' : 
              mode === 'checkout' ? 'checkout_scanned' : 'qr_scan_success',
      performed_by: req.user.id,
      details: {
        qr_code: qrCode,
        mode,
        location: req.body.location || 'Not specified',
        device_info: req.body.device_info || null
      },
      timestamp: new Date()
    });

    // Prepare response based on mode
    const response = {
      success: true,
      asset: {
        id: asset._id,
        unique_asset_id: asset.unique_asset_id,
        name: asset.name,
        manufacturer: asset.manufacturer,
        model: asset.model,
        serial_number: asset.serial_number,
        category: asset.asset_type || asset.category,
        status: asset.status,
        condition: asset.condition,
        location: asset.location,
        department: asset.department,
        purchase_date: asset.purchase_date,
        purchase_cost: asset.purchase_cost,
        warranty_expiry: asset.warranty_expiry,
        assigned_user: asset.assigned_user ? {
          id: asset.assigned_user._id,
          name: asset.assigned_user.name,
          email: asset.assigned_user.email,
          department: asset.assigned_user.department
        } : null,
        vendor: asset.vendor ? {
          id: asset.vendor._id,
          name: asset.vendor.vendor_name,
          email: asset.vendor.email,
          phone: asset.vendor.phone
        } : null,
        last_audit_date: asset.last_audit_date,
        last_maintenance_date: asset.last_maintenance_date,
        images: asset.images || [],
        notes: asset.notes
      },
      scan_history: scanHistory,
      scanned_at: new Date(),
      scanned_by: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error scanning asset:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to scan asset',
      error: error.message
    });
  }
};

// Batch scan multiple assets
exports.batchScan = async (req, res) => {
  try {
    const { qr_codes, mode = 'lookup' } = req.body;

    if (!Array.isArray(qr_codes) || qr_codes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'qr_codes array is required and must not be empty'
      });
    }

    if (qr_codes.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 QR codes can be scanned at once'
      });
    }

    const results = {
      success: true,
      total: qr_codes.length,
      found: 0,
      not_found: 0,
      assets: [],
      errors: []
    };

    for (const qrCode of qr_codes) {
      try {
        const asset = await Asset.findOne({
          $or: [
            { unique_asset_id: qrCode },
            { serial_number: qrCode },
            { qr_code: qrCode }
          ]
        }).populate('assigned_user', 'name email department');

        if (asset) {
          results.found++;
          results.assets.push({
            qr_code: qrCode,
            asset_id: asset._id,
            unique_asset_id: asset.unique_asset_id,
            name: asset.name,
            manufacturer: asset.manufacturer,
            model: asset.model,
            status: asset.status,
            condition: asset.condition,
            location: asset.location,
            assigned_user: asset.assigned_user?.name || null
          });

          // Log scan
          await AuditLog.create({
            asset_id: asset._id,
            action: 'batch_scan',
            performed_by: req.user.id,
            details: {
              qr_code: qrCode,
              mode,
              batch_size: qr_codes.length
            },
            timestamp: new Date()
          });
        } else {
          results.not_found++;
          results.errors.push({
            qr_code: qrCode,
            error: 'Asset not found'
          });
        }
      } catch (err) {
        results.errors.push({
          qr_code: qrCode,
          error: err.message
        });
      }
    }

    // Log batch scan completion
    await AuditLog.create({
      action: 'batch_scan_completed',
      performed_by: req.user.id,
      details: {
        total_scanned: qr_codes.length,
        found: results.found,
        not_found: results.not_found,
        mode
      },
      timestamp: new Date()
    });

    res.json(results);
  } catch (error) {
    console.error('Error in batch scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process batch scan',
      error: error.message
    });
  }
};

// Get scan history for user
exports.getScanHistory = async (req, res) => {
  try {
    const { limit = 50, page = 1, mode, asset_id } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      performed_by: req.user.id,
      action: { $in: ['qr_scan_success', 'audit_scanned', 'checkout_scanned', 'batch_scan'] }
    };

    if (mode) {
      const actionMap = {
        'audit': 'audit_scanned',
        'checkout': 'checkout_scanned',
        'lookup': 'qr_scan_success'
      };
      if (actionMap[mode]) {
        query.action = actionMap[mode];
      }
    }

    if (asset_id) {
      query.asset_id = asset_id;
    }

    const total = await AuditLog.countDocuments(query);
    const scans = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('asset_id', 'unique_asset_id name manufacturer model location status')
      .select('action asset_id details timestamp');

    res.json({
      success: true,
      scans: scans.map(scan => ({
        id: scan._id,
        action: scan.action,
        asset: scan.asset_id ? {
          id: scan.asset_id._id,
          unique_asset_id: scan.asset_id.unique_asset_id,
          name: scan.asset_id.name,
          manufacturer: scan.asset_id.manufacturer,
          model: scan.asset_id.model,
          location: scan.asset_id.location,
          status: scan.asset_id.status
        } : null,
        details: scan.details,
        timestamp: scan.timestamp
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching scan history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan history',
      error: error.message
    });
  }
};

// Get scan statistics
exports.getScanStats = async (req, res) => {
  try {
    const { period = '7d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    switch(period) {
      case '24h':
        startDate = new Date(now - 24*60*60*1000);
        break;
      case '7d':
        startDate = new Date(now - 7*24*60*60*1000);
        break;
      case '30d':
        startDate = new Date(now - 30*24*60*60*1000);
        break;
      case '90d':
        startDate = new Date(now - 90*24*60*60*1000);
        break;
      default:
        startDate = new Date(now - 7*24*60*60*1000);
    }

    const stats = await AuditLog.aggregate([
      {
        $match: {
          performed_by: req.user.id,
          action: { $in: ['qr_scan_success', 'audit_scanned', 'checkout_scanned'] },
          timestamp: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$action',
          count: { $sum: 1 }
        }
      }
    ]);

    const totalScans = stats.reduce((sum, item) => sum + item.count, 0);

    // Get most scanned assets
    const topAssets = await AuditLog.aggregate([
      {
        $match: {
          performed_by: req.user.id,
          action: { $in: ['qr_scan_success', 'audit_scanned', 'checkout_scanned'] },
          timestamp: { $gte: startDate },
          asset_id: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$asset_id',
          scan_count: { $sum: 1 },
          last_scanned: { $max: '$timestamp' }
        }
      },
      { $sort: { scan_count: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'assets',
          localField: '_id',
          foreignField: '_id',
          as: 'asset'
        }
      },
      { $unwind: '$asset' }
    ]);

    res.json({
      success: true,
      period,
      total_scans: totalScans,
      scans_by_type: stats.reduce((obj, item) => {
        obj[item._id] = item.count;
        return obj;
      }, {}),
      top_scanned_assets: topAssets.map(item => ({
        asset_id: item._id,
        unique_asset_id: item.asset.unique_asset_id,
        name: item.asset.name,
        scan_count: item.scan_count,
        last_scanned: item.last_scanned
      }))
    });
  } catch (error) {
    console.error('Error fetching scan stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch scan statistics',
      error: error.message
    });
  }
};

// Quick audit scan (mobile-optimized)
exports.quickAuditScan = async (req, res) => {
  try {
    const { qrCode } = req.params;
    const {
      condition,
      status,
      location_verified,
      notes,
      photos = []
    } = req.body;

    // Find asset
    const asset = await Asset.findOne({
      $or: [
        { unique_asset_id: qrCode },
        { serial_number: qrCode },
        { qr_code: qrCode }
      ]
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Update asset
    if (condition) asset.condition = condition;
    if (status) asset.status = status;
    asset.last_audit_date = new Date();
    asset.last_audited_by = req.user.id;

    await asset.save();

    // Log audit
    await AuditLog.create({
      asset_id: asset._id,
      action: 'quick_audit_completed',
      performed_by: req.user.id,
      details: {
        qr_code: qrCode,
        condition,
        status,
        location_verified,
        notes,
        photo_count: photos.length
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Quick audit completed successfully',
      asset: {
        id: asset._id,
        unique_asset_id: asset.unique_asset_id,
        name: asset.name,
        condition: asset.condition,
        status: asset.status,
        last_audit_date: asset.last_audit_date
      }
    });
  } catch (error) {
    console.error('Error in quick audit scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete quick audit',
      error: error.message
    });
  }
};

module.exports = exports;
