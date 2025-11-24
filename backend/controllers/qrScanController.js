const Asset = require('../models/asset');
const logger = require('../utils/logger');
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

    // Validate QR code parameter
    if (!qrCode || qrCode.trim().length === 0) {
      logger.warn('\u26a0\ufe0f Invalid QR code parameter - empty or null');
      return res.status(400).json({
        success: false,
        message: 'QR code parameter is required',
        suggestions: [
          'Ensure QR code is not empty',
          'Check if the QR code was scanned correctly'
        ]
      });
    }

    // Decode URI component to handle special characters
    const decodedQrCode = decodeURIComponent(qrCode).trim();

    logger.debug('📱 QR Scan Request:');
    logger.debug('  - Original QR Code:', qrCode);
    logger.debug('  - Decoded QR Code:', decodedQrCode);
    logger.debug('  - Mode:', mode);
    logger.debug('  - User:', req.user?.id, req.user?.name);
    logger.debug('  - Include History:', include_history);
    logger.debug('  - IP:', req.ip || req.connection.remoteAddress);

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
      logger.debug('  - Parsed QR JSON, using:', searchValue);
    } catch (parseError) {
      // Not JSON, use decoded value as-is
      logger.debug('  - Not JSON format, using raw value');
    }

    // Find asset by multiple possible fields
    const asset = await Asset.findOne({
      $or: [
        { qr_code: searchValue },
        { unique_asset_id: searchValue },
        { serial_number: searchValue },
        { qr_code: decodedQrCode },
        { unique_asset_id: decodedQrCode },
        { serial_number: decodedQrCode }
      ]
    }).populate('assigned_user', 'name email department')
      .populate('vendor', 'vendor_name email phone')
      .populate('last_audited_by', 'name email')
      .lean(); // Use lean for better performance

    logger.debug('  - Asset found:', !!asset);
    if (asset) {
      logger.debug('  - Asset ID:', asset._id);
      logger.debug('  - Asset Name:', asset.name || `${asset.manufacturer} ${asset.model}`);
      logger.debug('  - Unique Asset ID:', asset.unique_asset_id);
      logger.debug('  - QR Code:', asset.qr_code);
    }

    if (!asset) {
      logger.debug('❌ Asset not found for QR code:', decodedQrCode);
      
      // Log failed scan attempt
      await AuditLog.create({
        user_id: req.user.id,
        performed_by: req.user.id,
        action: 'qr_scan_failed',
        entity_type: 'Unknown',
        description: `Failed QR scan attempt: Asset not found for code ${decodedQrCode}`,
        severity: 'warning',
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        details: {
          attempted_qr_code: decodedQrCode,
          mode: mode
        }
      });

      return res.status(404).json({
        success: false,
        message: 'Asset not found. Please verify the QR code is correct.',
        qr_code: decodedQrCode,
        suggestions: [
          'Ensure the QR code is not damaged or obscured',
          'Try scanning the asset\'s serial number instead',
          'Check if the asset exists in the system'
        ]
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

    // UPDATE: Always update last_audit_date and last_audited_by when scanning
    const oldAuditDate = asset.last_audit_date;
    const oldAuditedBy = asset.last_audited_by;
    
    // Update asset document
    const updatedAsset = await Asset.findByIdAndUpdate(
      asset._id,
      {
        last_audit_date: new Date(),
        last_audited_by: req.user.id
      },
      { new: true }
    ).populate('assigned_user', 'name email department')
     .populate('vendor', 'vendor_name email phone')
     .populate('last_audited_by', 'name email');

    // Log successful scan
    await AuditLog.create({
      user_id: req.user.id,
      performed_by: req.user.id,
      action: mode === 'audit' ? 'audit_scanned' : 
              mode === 'checkout' ? 'checkout_scanned' : 'qr_scan_success',
      entity_type: 'Asset',
      entity_id: asset._id,
      asset_id: asset._id,
      description: `QR code scanned for asset ${asset.unique_asset_id} (${asset.name || asset.manufacturer + ' ' + asset.model})`,
      severity: 'info',
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      old_values: {
        last_audit_date: oldAuditDate,
        last_audited_by: oldAuditedBy
      },
      new_values: {
        last_audit_date: asset.last_audit_date,
        last_audited_by: asset.last_audited_by
      },
      timestamp: new Date()
    });

    // Prepare response based on mode
    const responseAsset = updatedAsset || asset;
    const response = {
      success: true,
      asset: {
        id: responseAsset._id,
        unique_asset_id: responseAsset.unique_asset_id,
        qr_code: responseAsset.qr_code,
        name: responseAsset.name,
        manufacturer: responseAsset.manufacturer,
        model: responseAsset.model,
        serial_number: responseAsset.serial_number,
        category: responseAsset.asset_type,
        status: responseAsset.status,
        condition: responseAsset.condition,
        location: responseAsset.location,
        location_verified: responseAsset.location_verified,
        last_location_verification_date: responseAsset.last_location_verification_date,
        department: responseAsset.department,
        purchase_date: responseAsset.purchase_date,
        purchase_cost: responseAsset.purchase_cost,
        warranty_expiry: responseAsset.warranty_expiry,
        assigned_user: responseAsset.assigned_user ? {
          id: responseAsset.assigned_user._id,
          name: responseAsset.assigned_user.name,
          email: responseAsset.assigned_user.email,
          department: responseAsset.assigned_user.department
        } : null,
        vendor: responseAsset.vendor ? {
          id: responseAsset.vendor._id,
          name: responseAsset.vendor.vendor_name,
          email: responseAsset.vendor.email,
          phone: responseAsset.vendor.phone
        } : null,
        last_audit_date: responseAsset.last_audit_date,
        last_audited_by: responseAsset.last_audited_by ? {
          id: responseAsset.last_audited_by._id,
          name: responseAsset.last_audited_by.name,
          email: responseAsset.last_audited_by.email
        } : null,
        last_maintenance_date: responseAsset.last_maintenance_date,
        images: responseAsset.images || [],
        notes: responseAsset.notes,
        quantity: responseAsset.quantity
      },
      scan_history: scanHistory,
      scanned_at: new Date(),
      scanned_by: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      mode: mode
    };

    logger.debug('✅ QR Scan successful, returning asset data');
    res.json(response);
  } catch (error) {
    logger.error('❌ Error scanning asset:', error);
    logger.error('  - Error name:', error.name);
    logger.error('  - Error message:', error.message);
    logger.error('  - Stack:', error.stack);
    
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

    // Validate input
    if (!Array.isArray(qr_codes) || qr_codes.length === 0) {
      logger.warn('\u26a0\ufe0f Invalid batch scan request - qr_codes not an array or empty');
      return res.status(400).json({
        success: false,
        message: 'qr_codes array is required and must not be empty',
        suggestions: [
          'Provide an array of QR codes',
          'Ensure at least one QR code is in the array'
        ]
      });
    }

    if (qr_codes.length > 100) {
      logger.warn(`\u26a0\ufe0f Too many QR codes in batch scan: ${qr_codes.length}`);
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 QR codes can be scanned at once',
        actual_count: qr_codes.length,
        suggestions: [
          'Split your batch into multiple requests',
          'Each batch should have 100 or fewer codes'
        ]
      });
    }

    logger.info(`\ud83d\udcc4 Batch scan started: ${qr_codes.length} codes`);

    const results = {
      success: true,
      total: qr_codes.length,
      found: 0,
      not_found: 0,
      invalid: 0,
      assets: [],
      errors: []
    };

    for (const qrCode of qr_codes) {
      try {
        // Validate individual QR code
        if (!qrCode || (typeof qrCode === 'string' && qrCode.trim().length === 0)) {
          results.invalid++;
          results.errors.push({
            qr_code: qrCode || '(empty)',
            error: 'Invalid or empty QR code'
          });
          continue;
        }

        const decodedQrCode = typeof qrCode === 'string' ? qrCode.trim() : String(qrCode).trim();
        
        // Parse QR code if it's JSON format
        let searchValue = decodedQrCode;
        try {
          const parsed = JSON.parse(decodedQrCode);
          searchValue = parsed.asset_id || parsed.unique_asset_id || parsed.serial_number || parsed.qr_code || decodedQrCode;
        } catch (parseError) {
          // Not JSON, use as-is
        }

        const asset = await Asset.findOne({
          $or: [
            { qr_code: searchValue },
            { unique_asset_id: searchValue },
            { serial_number: searchValue }
          ]
        }).populate('assigned_user', 'name email department');

        if (asset) {
          results.found++;
          results.assets.push({
            qr_code: decodedQrCode,
            asset_id: asset._id,
            unique_asset_id: asset.unique_asset_id,
            name: asset.name,
            manufacturer: asset.manufacturer,
            model: asset.model,
            status: asset.status,
            condition: asset.condition,
            location: asset.location,
            assigned_user: asset.assigned_user?.name || null,
            last_audit_date: asset.last_audit_date
          });

          // Update last_audit_date for batch scans
          asset.last_audit_date = new Date();
          asset.last_audited_by = req.user.id;
          await asset.save();

          // Log scan
          await AuditLog.create({
            user_id: req.user.id,
            performed_by: req.user.id,
            action: 'batch_scan',
            entity_type: 'Asset',
            entity_id: asset._id,
            asset_id: asset._id,
            description: `Batch scan: ${asset.unique_asset_id}`,
            severity: 'info',
            ip_address: req.ip || req.connection.remoteAddress,
            user_agent: req.get('user-agent')
          });
        } else {
          results.not_found++;
          results.errors.push({
            qr_code: decodedQrCode,
            error: 'Asset not found in database'
          });
        }
      } catch (err) {
        results.errors.push({
          qr_code: qrCode,
          error: err.message
        });
      }
    }

    // Log batch scan completion with detailed results
    logger.info(`\u2705 Batch scan completed: Found=${results.found}, Not Found=${results.not_found}, Invalid=${results.invalid}`);
    
    await AuditLog.create({
      user_id: req.user.id,
      performed_by: req.user.id,
      action: 'batch_scan_completed',
      entity_type: 'System',
      description: `Batch scan completed: ${results.found} found, ${results.not_found} not found, ${results.invalid} invalid`,
      severity: results.not_found > results.found ? 'warning' : 'info',
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      details: {
        total_scanned: qr_codes.length,
        found: results.found,
        not_found: results.not_found,
        invalid: results.invalid,
        success_rate: ((results.found / qr_codes.length) * 100).toFixed(2) + '%',
        mode
      },
      timestamp: new Date()
    });

    res.json(results);
  } catch (error) {
    logger.error('\u274c Error in batch scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process batch scan',
      error: error.message,
      suggestions: [
        'Check if backend server is running',
        'Verify database connection',
        'Try again with fewer QR codes'
      ]
    });
  }
};

// Get scan history for user
exports.getScanHistory = async (req, res) => {
  try {
    const { limit = 50, page = 1, mode, asset_id } = req.query;
    
    // Validate pagination parameters
    const parsedLimit = parseInt(limit);
    const parsedPage = parseInt(page);
    
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      logger.warn(`\u26a0\ufe0f Invalid limit parameter: ${limit}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid limit parameter. Must be between 1 and 100.'
      });
    }
    
    if (isNaN(parsedPage) || parsedPage < 1) {
      logger.warn(`\u26a0\ufe0f Invalid page parameter: ${page}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid page parameter. Must be 1 or greater.'
      });
    }
    
    const skip = (parsedPage - 1) * parsedLimit;
    
    logger.debug(`\ud83d\udccb Fetching scan history: user=${req.user.id}, limit=${parsedLimit}, page=${parsedPage}`);

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
      .limit(parsedLimit)
      .populate('asset_id', 'unique_asset_id name manufacturer model location status')
      .select('action asset_id details timestamp');
      
    logger.debug(`\u2705 Found ${scans.length} scan history items (total: ${total})`);

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
    logger.error('Error fetching scan history:', error);
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
    logger.error('Error fetching scan stats:', error);
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
    
    // Validate QR code parameter
    if (!qrCode || typeof qrCode !== 'string') {
      logger.warn(`⚠️ Quick audit scan missing qrCode parameter`);
      return res.status(400).json({
        success: false,
        message: 'QR code is required',
        suggestions: ['Provide a valid QR code in the URL parameter']
      });
    }

    const decodedQrCode = decodeURIComponent(qrCode).trim();
    
    if (decodedQrCode === '') {
      logger.warn(`⚠️ Quick audit scan received empty qrCode after decode`);
      return res.status(400).json({
        success: false,
        message: 'QR code cannot be empty',
        suggestions: ['Ensure the QR code is readable and not blank']
      });
    }
    
    // Validate optional fields
    if (condition && !['Excellent', 'Good', 'Fair', 'Poor', 'Non-Functional'].includes(condition)) {
      logger.warn(`⚠️ Invalid condition value: ${condition}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid condition value',
        suggestions: ['Valid conditions: Excellent, Good, Fair, Poor, Non-Functional']
      });
    }
    
    if (status && !['Active', 'Inactive', 'Under Maintenance', 'Disposed', 'Reserved'].includes(status)) {
      logger.warn(`⚠️ Invalid status value: ${status}`);
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
        suggestions: ['Valid statuses: Active, Inactive, Under Maintenance, Disposed, Reserved']
      });
    }
    
    logger.info(`📱 Quick audit scan initiated: ${decodedQrCode.substring(0, 50)}...`);

    // Parse QR code if JSON
    let searchValue = decodedQrCode;
    try {
      const parsed = JSON.parse(decodedQrCode);
      searchValue = parsed.asset_id || parsed.unique_asset_id || parsed.serial_number || parsed.qr_code || decodedQrCode;
      logger.debug(`📝 Parsed JSON QR code, search value: ${searchValue}`);
    } catch (parseError) {
      // Not JSON, use as-is
      logger.debug(`🔍 Using plain text QR code: ${searchValue}`);
    }

    // Find asset
    const asset = await Asset.findOne({
      $or: [
        { qr_code: searchValue },
        { unique_asset_id: searchValue },
        { serial_number: searchValue }
      ]
    });

    if (!asset) {
      logger.warn(`❌ Quick audit: Asset not found for QR: ${decodedQrCode.substring(0, 30)}...`);
      
      // Log failed audit
      await AuditLog.create({
        user_id: req.user.id,
        performed_by: req.user.id,
        action: 'quick_audit_failed',
        entity_type: 'Asset',
        entity_id: null,
        description: `Quick audit failed: Asset not found`,
        severity: 'warning',
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get('user-agent'),
        details: {
          qr_code: decodedQrCode,
          reason: 'Asset not found'
        }
      });
      
      return res.status(404).json({
        success: false,
        message: 'Asset not found for quick audit',
        qr_code: decodedQrCode,
        suggestions: [
          'Verify the QR code is correct',
          'Check if the asset exists in the database',
          'Try scanning again'
        ]
      });
    }

    // Store old values for audit trail
    const oldValues = {
      condition: asset.condition,
      status: asset.status,
      location_verified: asset.location_verified,
      last_audit_date: asset.last_audit_date
    };

    // Update asset
    if (condition) asset.condition = condition;
    if (status) asset.status = status;
    if (location_verified !== undefined) {
      asset.location_verified = location_verified;
      asset.last_location_verification_date = new Date();
    }
    if (notes) asset.notes = notes;
    
    asset.last_audit_date = new Date();
    asset.last_audited_by = req.user.id;

    await asset.save();
    
    logger.info(`✅ Quick audit completed for asset: ${asset.unique_asset_id}`);

    // Log audit with detailed information
    const auditLog = await AuditLog.create({
      user_id: req.user.id,
      performed_by: req.user.id,
      action: 'quick_audit_completed',
      entity_type: 'Asset',
      entity_id: asset._id,
      asset_id: asset._id,
      description: `Quick audit completed for ${asset.unique_asset_id}: Condition=${condition || 'unchanged'}, Status=${status || 'unchanged'}`,
      severity: 'info',
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent'),
      old_values: oldValues,
      new_values: {
        condition: asset.condition,
        status: asset.status,
        location_verified: asset.location_verified,
        last_audit_date: asset.last_audit_date,
        last_location_verification_date: asset.last_location_verification_date
      },
      details: {
        notes: notes || '',
        photos_count: photos.length,
        location_verified: location_verified || false
      }
    });

    // Populate asset with related data
    await asset.populate('assigned_user', 'name email department');
    await asset.populate('last_audited_by', 'name email');

    res.json({
      success: true,
      message: 'Quick audit completed successfully',
      asset: asset.toObject(),
      audit_log: auditLog,
      updated_at: new Date()
    });
  } catch (error) {
    logger.error('Error in quick audit scan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete quick audit',
      error: error.message
    });
  }
};

module.exports = exports;
