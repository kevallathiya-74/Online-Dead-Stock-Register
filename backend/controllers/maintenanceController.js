const Maintenance = require('../models/maintenance');
const logger = require('../utils/logger');

exports.getMaintenanceRecords = async (req, res) => {
  try {
    const records = await Maintenance.find().populate('asset_id vendor_id created_by').lean();
    
    // Transform data to match frontend expectations
    const transformedRecords = records.map(record => {
      const asset = record.asset_id;
      
      return {
        id: record._id.toString(),
        asset_id: asset?._id?.toString() || '',
        asset_name: asset?.name || asset?.unique_asset_id || 'Unknown Asset',
        type: record.maintenance_type || 'Corrective',
        description: record.description || 'No description provided',
        scheduled_date: record.maintenance_date || new Date().toISOString(),
        completed_date: record.status === 'Completed' && record.updatedAt ? record.updatedAt.toISOString() : null,
        status: record.status || 'Scheduled',
        priority: record.priority || 'Medium',
        assigned_technician: record.performed_by || 'Unassigned',
        estimated_cost: record.cost || 0,
        actual_cost: record.status === 'Completed' ? record.cost : null,
        estimated_duration: record.estimated_duration || 2,
        actual_duration: record.status === 'Completed' ? record.estimated_duration : null,
        next_maintenance_date: record.next_maintenance_date ? record.next_maintenance_date.toISOString() : null,
        notes: record.notes || record.description || '',
        downtime_impact: record.downtime_impact || 'Low'
      };
    });
    
    logger.info('Maintenance records retrieved', {
      userId: req.user?.id,
      count: transformedRecords.length
    });
    
    res.json({ 
      success: true,
      data: transformedRecords 
    });
  } catch (err) {
    logger.error('Error fetching maintenance records:', err);
    res.status(500).json({ 
      success: false,
      message: err.message || 'Failed to fetch maintenance records'
    });
  }
};

exports.createMaintenanceRecord = async (req, res) => {
  try {
    const { asset_id, maintenance_type, maintenance_date, description, cost, performed_by, priority, status, estimated_duration, downtime_impact } = req.body;

    // Validate required fields
    if (!asset_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Asset ID is required' 
      });
    }

    if (!maintenance_type) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maintenance type is required' 
      });
    }

    if (!maintenance_date) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maintenance date is required' 
      });
    }

    // Verify asset exists
    const Asset = require('../models/asset');
    const asset = await Asset.findById(asset_id);
    if (!asset) {
      return res.status(404).json({ 
        success: false, 
        message: 'Asset not found' 
      });
    }

    // Create maintenance record
    const maintenanceData = {
      asset_id,
      maintenance_type,
      maintenance_date: new Date(maintenance_date),
      description: description || `${maintenance_type} maintenance for ${asset.name || asset.unique_asset_id}`,
      cost: cost || 0,
      performed_by: performed_by || 'Unassigned',
      priority: priority || 'Medium',
      status: status || 'Scheduled',
      estimated_duration: estimated_duration || 2,
      downtime_impact: downtime_impact || 'Low',
      created_by: req.user?.id || req.user?._id
    };

    const rec = new Maintenance(maintenanceData);
    const saved = await rec.save();

    // Populate asset details for response
    await saved.populate('asset_id', 'name unique_asset_id asset_type');

    logger.info('Maintenance record created', {
      userId: req.user?.id,
      maintenanceId: saved._id,
      assetId: asset_id
    });

    res.status(201).json({ 
      success: true,
      message: 'Maintenance scheduled successfully',
      data: saved 
    });
  } catch (err) {
    logger.error('Error creating maintenance record:', err);
    res.status(400).json({ 
      success: false,
      message: err.message || 'Failed to create maintenance record'
    });
  }
};

exports.getMaintenanceById = async (req, res) => {
  try {
    const rec = await Maintenance.findById(req.params.id).populate('asset_id', 'name unique_asset_id asset_type').lean();
    if (!rec) {
      return res.status(404).json({ 
        success: false,
        message: 'Maintenance record not found' 
      });
    }

    res.json({ 
      success: true,
      data: rec 
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message || 'Failed to fetch maintenance record'
    });
  }
};

exports.updateMaintenanceRecord = async (req, res) => {
  try {
    const rec = await Maintenance.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true, runValidators: true }
    ).populate('asset_id', 'name unique_asset_id asset_type');
    
    if (!rec) {
      return res.status(404).json({ 
        success: false,
        message: 'Maintenance record not found' 
      });
    }

    logger.info('Maintenance record updated', {
      userId: req.user?.id,
      maintenanceId: rec._id
    });

    res.json({ 
      success: true,
      message: 'Maintenance record updated successfully', 
      data: rec 
    });
  } catch (err) {
    logger.error('Error updating maintenance record:', err);
    res.status(400).json({ 
      success: false,
      message: err.message || 'Failed to update maintenance record'
    });
  }
};

exports.deleteMaintenanceRecord = async (req, res) => {
  try {
    const rec = await Maintenance.findByIdAndDelete(req.params.id);
    if (!rec) {
      return res.status(404).json({ 
        success: false,
        message: 'Maintenance record not found' 
      });
    }

    logger.info('Maintenance record deleted', {
      userId: req.user?.id,
      maintenanceId: req.params.id
    });

    res.json({ 
      success: true,
      message: 'Maintenance record deleted successfully' 
    });
  } catch (err) {
    logger.error('Error deleting maintenance record:', err);
    res.status(500).json({ 
      success: false,
      message: err.message || 'Failed to delete maintenance record'
    });
  }
};

// Get technicians (users with maintenance capabilities and their workload)
exports.getTechnicians = async (req, res) => {
  try {
    // Get users who have maintenance-related roles or activities
    const User = require('../models/user');
    const users = await User.find({ 
      $or: [
        { role: 'ADMIN' },
        { role: 'INVENTORY_MANAGER' },
        { 'permissions': { $in: ['schedule_maintenance', 'approve_maintenance'] } }
      ]
    }).select('name email role full_name').lean();

    if (!users || users.length === 0) {
      return res.json({ 
        success: true,
        data: [] 
      });
    }

    // Get current workload for each technician
    const techniciansWithWorkload = await Promise.all(
      users.map(async (user) => {
        const userName = user.name || user.full_name || user.email.split('@')[0];
        
        const currentWorkload = await Maintenance.countDocuments({
          performed_by: userName,
          status: { $in: ['Scheduled', 'In Progress'] }
        });
        
        const totalCompleted = await Maintenance.countDocuments({
          performed_by: userName,
          status: 'Completed'
        });

        return {
          id: user._id.toString(),
          name: userName,
          email: user.email,
          specialization: ['General Maintenance', 'Equipment Repair'],
          current_workload: currentWorkload,
          rating: totalCompleted > 0 ? Math.min(5.0, 3.5 + (totalCompleted / 20)) : 4.0,
          total_completed: totalCompleted
        };
      })
    );

    logger.info('Technicians retrieved', {
      userId: req.user?.id,
      count: techniciansWithWorkload.length
    });

    res.json({ 
      success: true,
      data: techniciansWithWorkload 
    });
  } catch (err) {
    logger.error('Error fetching technicians:', err);
    res.status(500).json({ 
      success: false,
      message: err.message || 'Failed to fetch technicians'
    });
  }
};

// Get warranties (assets with warranty information)
exports.getWarranties = async (req, res) => {
  try {
    const Asset = require('../models/asset');
    const Vendor = require('../models/vendor');
    
    // Fetch all assets with warranty information
    const assets = await Asset.find({
      warranty_expiry: { $exists: true, $ne: null }
    })
    .populate('vendor', 'company_name contact_person email phone')
    .lean();

    // Transform to warranty format
    const warranties = assets.map(asset => {
      const today = new Date();
      const warrantyExpiry = new Date(asset.warranty_expiry);
      const warrantyStart = asset.purchase_date ? new Date(asset.purchase_date) : new Date(warrantyExpiry.getFullYear() - 1, warrantyExpiry.getMonth(), warrantyExpiry.getDate());
      const daysUntilExpiry = Math.ceil((warrantyExpiry - today) / (1000 * 60 * 60 * 24));
      
      // Determine status
      let status = 'Active';
      if (daysUntilExpiry < 0) {
        status = 'Expired';
      } else if (daysUntilExpiry <= 30) {
        status = 'Expiring Soon';
      }
      
      // Determine warranty type based on duration or default
      let warrantyType = 'Standard';
      if (warrantyExpiry && warrantyStart) {
        const warrantyDuration = Math.ceil((warrantyExpiry - warrantyStart) / (1000 * 60 * 60 * 24));
        if (warrantyDuration > 730) { // More than 2 years
          warrantyType = 'Extended';
        } else if (warrantyDuration > 365) { // More than 1 year
          warrantyType = 'Comprehensive';
        }
      }

      return {
        id: asset._id.toString(),
        assetId: asset.unique_asset_id || asset._id.toString(),
        assetName: asset.name || asset.model || 'Unknown Asset',
        manufacturer: asset.manufacturer || 'Unknown',
        model: asset.model || 'Unknown',
        serialNumber: asset.serial_number || 'N/A',
        warrantyType: warrantyType,
        startDate: warrantyStart.toISOString(),
        endDate: warrantyExpiry.toISOString(),
        status: status,
        vendor: asset.vendor?.company_name || 'Unknown Vendor',
        claimHistory: 0,
        coverageDetails: `${warrantyType} warranty coverage for ${asset.asset_type || 'asset'}. Includes parts and labor.`,
        coverageValue: asset.purchase_cost || 0,
        lastClaimDate: null
      };
    });

    res.json({ 
      success: true,
      data: warranties,
      total: warranties.length
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// File warranty claim
exports.fileWarrantyClaim = async (req, res) => {
  try {
    const { warrantyId, assetId, description, issueType, contactPerson, contactEmail } = req.body;
    
    if (!assetId) {
      return res.status(400).json({
        success: false,
        message: 'Asset ID is required'
      });
    }

    // Verify the asset exists
    const Asset = require('../models/asset');
    const asset = await Asset.findOne({
      $or: [
        { _id: assetId },
        { unique_asset_id: assetId }
      ]
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Create a maintenance record for the warranty claim
    const maintenanceRecord = new Maintenance({
      asset_id: asset._id, // Use MongoDB ObjectId
      maintenance_type: 'Corrective',
      description: `Warranty Claim: ${description || 'Warranty service request'}`,
      status: 'Scheduled',
      priority: 'High',
      created_by: req.user.id,
      maintenance_date: new Date(),
      notes: issueType ? `Issue Type: ${issueType}` : undefined,
      technician_name: contactPerson || 'Vendor Support',
      cost: 0 // Warranty covered
    });

    await maintenanceRecord.save();

    // Log the warranty claim
    logger.info('Warranty claim filed', {
      userId: req.user.id,
      assetId: asset._id,
      maintenanceId: maintenanceRecord._id
    });

    res.json({
      success: true,
      message: 'Warranty claim filed successfully',
      data: maintenanceRecord
    });
  } catch (err) {
    logger.error('Error filing warranty claim:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Failed to file warranty claim'
    });
  }
};

// Get warranty by ID
exports.getWarrantyById = async (req, res) => {
  try {
    const { id } = req.params;
    const Asset = require('../models/asset');
    const Vendor = require('../models/vendor');
    
    const asset = await Asset.findById(id).populate('vendor', 'company_name contact_person email phone').lean();
    
    if (!asset || !asset.warranty_expiry) {
      return res.status(404).json({
        success: false,
        message: 'Warranty not found'
      });
    }

    const today = new Date();
    const warrantyExpiry = new Date(asset.warranty_expiry);
    const warrantyStart = asset.purchase_date ? new Date(asset.purchase_date) : new Date(warrantyExpiry.getFullYear() - 1, warrantyExpiry.getMonth(), warrantyExpiry.getDate());
    const daysUntilExpiry = Math.ceil((warrantyExpiry - today) / (1000 * 60 * 60 * 24));
    
    let status = 'Active';
    if (daysUntilExpiry < 0) {
      status = 'Expired';
    } else if (daysUntilExpiry <= 30) {
      status = 'Expiring Soon';
    }
    
    let warrantyType = 'Standard';
    if (warrantyExpiry && warrantyStart) {
      const warrantyDuration = Math.ceil((warrantyExpiry - warrantyStart) / (1000 * 60 * 60 * 24));
      if (warrantyDuration > 730) {
        warrantyType = 'Extended';
      } else if (warrantyDuration > 365) {
        warrantyType = 'Comprehensive';
      }
    }

    const warranty = {
      _id: asset._id.toString(),
      id: asset._id.toString(),
      assetId: asset.unique_asset_id || asset._id.toString(),
      assetName: asset.name || asset.model || 'Unknown Asset',
      manufacturer: asset.manufacturer || 'Unknown',
      model: asset.model || 'Unknown',
      serialNumber: asset.serial_number || 'N/A',
      warrantyType: warrantyType,
      startDate: warrantyStart.toISOString(),
      endDate: warrantyExpiry.toISOString(),
      status: status,
      vendor: asset.vendor?.company_name || 'Unknown Vendor',
      claimHistory: 0,
      coverageDetails: `${warrantyType} warranty coverage for ${asset.asset_type || 'asset'}. Includes parts and labor.`,
      coverageValue: asset.purchase_cost || 0,
      lastClaimDate: null
    };

    res.json({
      success: true,
      data: warranty
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Update warranty
exports.updateWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const { endDate, warrantyType, coverageDetails } = req.body;
    const Asset = require('../models/asset');
    
    const asset = await Asset.findById(id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    if (endDate) asset.warranty_expiry = new Date(endDate);
    
    await asset.save();

    res.json({
      success: true,
      message: 'Warranty updated successfully',
      data: asset
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Extend warranty
exports.extendWarranty = async (req, res) => {
  try {
    const { id } = req.params;
    const { newEndDate, cost } = req.body;
    const Asset = require('../models/asset');
    
    const asset = await Asset.findById(id);
    
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    asset.warranty_expiry = new Date(newEndDate);
    await asset.save();

    // Log the extension
    logger.info('Warranty extended', {
      userId: req.user.id,
      assetId: id,
      newEndDate
    });

    res.json({
      success: true,
      message: 'Warranty extended successfully',
      data: asset
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get warranty claim history
exports.getWarrantyClaimHistory = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find all maintenance records for warranty claims on this asset
    const claims = await Maintenance.find({
      asset_id: id,
      description: { $regex: 'Warranty Claim', $options: 'i' }
    })
    .sort({ createdAt: -1 })
    .lean();

    res.json({
      success: true,
      data: claims
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Get warranty statistics
exports.getWarrantyStats = async (req, res) => {
  try {
    const Asset = require('../models/asset');
    
    const today = new Date();
    const thirtyDaysFromNow = new Date(today);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const [activeAssets, expiringAssets, expiredAssets, allWarrantyAssets] = await Promise.all([
      Asset.countDocuments({
        warranty_expiry: { $exists: true, $ne: null, $gte: thirtyDaysFromNow }
      }),
      Asset.countDocuments({
        warranty_expiry: { $gte: today, $lte: thirtyDaysFromNow }
      }),
      Asset.countDocuments({
        warranty_expiry: { $lt: today }
      }),
      Asset.find({
        warranty_expiry: { $exists: true, $ne: null }
      }).select('purchase_cost').lean()
    ]);

    const totalCoverageValue = allWarrantyAssets.reduce((sum, asset) => sum + (asset.purchase_cost || 0), 0);
    
    // Get warranty claims
    const claims = await Maintenance.countDocuments({
      description: { $regex: 'Warranty Claim', $options: 'i' }
    });

    const totalWarranties = activeAssets + expiringAssets + expiredAssets;
    const claimRate = totalWarranties > 0 ? (claims / totalWarranties) * 100 : 0;

    res.json({
      success: true,
      data: {
        activeCount: activeAssets,
        expiringCount: expiringAssets,
        expiredCount: expiredAssets,
        totalCoverageValue,
        claimRate: claimRate.toFixed(2)
      }
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

// Export warranty report
exports.exportWarrantyReport = async (req, res) => {
  try {
    const { format = 'csv', search = '', status = '' } = req.query;
    const Asset = require('../models/asset');
    const Vendor = require('../models/vendor');
    
    let query = { warranty_expiry: { $exists: true, $ne: null } };
    
    if (search) {
      query.$or = [
        { unique_asset_id: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { serial_number: { $regex: search, $options: 'i' } }
      ];
    }

    const assets = await Asset.find(query).populate('vendor', 'company_name').lean();

    const warranties = assets.map(asset => {
      const today = new Date();
      const warrantyExpiry = new Date(asset.warranty_expiry);
      const warrantyStart = asset.purchase_date ? new Date(asset.purchase_date) : new Date(warrantyExpiry.getFullYear() - 1, warrantyExpiry.getMonth(), warrantyExpiry.getDate());
      const daysUntilExpiry = Math.ceil((warrantyExpiry - today) / (1000 * 60 * 60 * 24));
      
      let itemStatus = 'Active';
      if (daysUntilExpiry < 0) {
        itemStatus = 'Expired';
      } else if (daysUntilExpiry <= 30) {
        itemStatus = 'Expiring Soon';
      }
      
      let warrantyType = 'Standard';
      if (warrantyExpiry && warrantyStart) {
        const warrantyDuration = Math.ceil((warrantyExpiry - warrantyStart) / (1000 * 60 * 60 * 24));
        if (warrantyDuration > 730) {
          warrantyType = 'Extended';
        } else if (warrantyDuration > 365) {
          warrantyType = 'Comprehensive';
        }
      }

      return {
        assetId: asset.unique_asset_id || asset._id.toString(),
        assetName: asset.name || asset.model || 'Unknown Asset',
        manufacturer: asset.manufacturer || 'Unknown',
        model: asset.model || 'Unknown',
        serialNumber: asset.serial_number || 'N/A',
        warrantyType,
        vendor: asset.vendor?.company_name || 'Unknown Vendor',
        startDate: warrantyStart.toISOString().split('T')[0],
        endDate: warrantyExpiry.toISOString().split('T')[0],
        daysUntilExpiry: daysUntilExpiry > 0 ? daysUntilExpiry : 0,
        status: itemStatus,
        coverageValue: asset.purchase_cost || 0
      };
    });

    // Filter by status if provided
    const filteredWarranties = status && status !== 'All'
      ? warranties.filter(w => w.status === status)
      : warranties;

    if (format === 'csv') {
      // Proper CSV escaping function
      const escapeCsvValue = (value) => {
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        // Escape quotes by doubling them and wrap in quotes if contains comma, quote, or newline
        if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return `"${stringValue}"`;
      };

      const csvHeaders = [
        'Asset ID', 'Asset Name', 'Manufacturer', 'Model', 'Serial Number',
        'Warranty Type', 'Vendor', 'Start Date', 'End Date', 'Days Until Expiry',
        'Status', 'Coverage Value (₹)'
      ];

      const csvRows = filteredWarranties.map(w => [
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
        escapeCsvValue(w.coverageValue ? w.coverageValue.toLocaleString('en-IN') : '0')
      ]);

      // Add BOM for proper Excel UTF-8 support
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        csvHeaders.map(h => escapeCsvValue(h)).join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\r\n'); // Use Windows line endings for Excel compatibility

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=warranty-report-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported export format. Only CSV is supported.'
      });
    }

    logger.info('Warranty report exported', {
      userId: req.user.id,
      format,
      count: filteredWarranties.length
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
