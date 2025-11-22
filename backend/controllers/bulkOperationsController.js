const Asset = require('../models/asset');
const logger = require('../utils/logger');
const User = require('../models/user');
const Maintenance = require('../models/maintenance');
const AuditLog = require('../models/auditLog');
const Notification = require('../models/notification');

/**
 * Bulk Operations Controller
 * Handles batch operations on multiple assets with validation and rollback support
 */

// Helper function to validate asset IDs
const validateAssetIds = async (assetIds) => {
  if (!Array.isArray(assetIds) || assetIds.length === 0) {
    throw new Error('Asset IDs array is required and must not be empty');
  }

  if (assetIds.length > 500) {
    throw new Error('Maximum 500 assets can be processed at once');
  }

  const assets = await Asset.find({ _id: { $in: assetIds } });
  const foundIds = assets.map(a => a._id.toString());
  const missingIds = assetIds.filter(id => !foundIds.includes(id.toString()));

  return { assets, missingIds };
};

// Bulk update asset status
exports.bulkUpdateStatus = async (req, res) => {
  try {
    const { asset_ids, status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['Active', 'Inactive', 'Under Maintenance', 'Damaged', 'Disposed', 'Lost'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid assets found'
      });
    }

    // Update assets
    const updateResult = await Asset.updateMany(
      { _id: { $in: assets.map(a => a._id) } },
      { 
        $set: { 
          status,
          updated_at: new Date()
        }
      }
    );

    // Create audit logs for each asset
    const auditLogs = assets.map(asset => ({
      asset_id: asset._id,
      action: 'bulk_status_update',
      performed_by: req.user.id,
      details: {
        old_status: asset.status,
        new_status: status,
        notes,
        batch_size: assets.length
      },
      timestamp: new Date()
    }));

    await AuditLog.insertMany(auditLogs);

    // Create notifications for assigned users
    const notificationsToCreate = [];
    for (const asset of assets) {
      if (asset.assigned_user) {
        notificationsToCreate.push({
          user_id: asset.assigned_user,
          type: 'asset_update',
          title: 'Asset Status Updated',
          message: `Status of ${asset.name || asset.unique_asset_id} changed to ${status}`,
          related_asset: asset._id,
          created_at: new Date(),
          is_read: false
        });
      }
    }

    if (notificationsToCreate.length > 0) {
      await Notification.insertMany(notificationsToCreate);
    }

    res.json({
      success: true,
      message: `Successfully updated ${updateResult.modifiedCount} asset(s)`,
      updated_count: updateResult.modifiedCount,
      missing_ids: missingIds,
      notifications_sent: notificationsToCreate.length
    });
  } catch (error) {
    logger.error('Error in bulk status update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset statuses',
      error: error.message
    });
  }
};

// Bulk assign assets to user
exports.bulkAssign = async (req, res) => {
  try {
    const { asset_ids, user_id, department, notes } = req.body;

    if (!user_id) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Verify user exists
    const user = await User.findById(user_id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid assets found'
      });
    }

    // Check if any assets are already assigned
    const alreadyAssigned = assets.filter(a => a.assigned_user && a.assigned_user.toString() !== user_id);
    
    if (alreadyAssigned.length > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        message: `${alreadyAssigned.length} asset(s) are already assigned to other users`,
        already_assigned: alreadyAssigned.map(a => ({
          id: a._id,
          unique_asset_id: a.unique_asset_id,
          assigned_to: a.assigned_user
        })),
        hint: 'Use ?force=true to reassign these assets'
      });
    }

    // Update assets
    const updateData = {
      assigned_user: user_id,
      assigned_date: new Date(),
      status: 'Active',
      updated_at: new Date()
    };

    if (department) {
      updateData.department = department;
    }

    const updateResult = await Asset.updateMany(
      { _id: { $in: assets.map(a => a._id) } },
      { $set: updateData }
    );

    // Create audit logs
    const auditLogs = assets.map(asset => ({
      asset_id: asset._id,
      action: 'bulk_assign',
      performed_by: req.user.id,
      details: {
        old_user: asset.assigned_user || null,
        new_user: user_id,
        user_name: user.name,
        department: department || asset.department,
        notes,
        batch_size: assets.length
      },
      timestamp: new Date()
    }));

    await AuditLog.insertMany(auditLogs);

    // Notify newly assigned user
    await Notification.create({
      user_id,
      type: 'asset_assigned',
      title: 'Assets Assigned to You',
      message: `${assets.length} asset(s) have been assigned to you`,
      created_at: new Date(),
      is_read: false
    });

    res.json({
      success: true,
      message: `Successfully assigned ${updateResult.modifiedCount} asset(s) to ${user.name}`,
      assigned_count: updateResult.modifiedCount,
      assigned_to: {
        id: user._id,
        name: user.name,
        email: user.email,
        department: user.department
      },
      missing_ids: missingIds,
      reassigned_count: alreadyAssigned.length
    });
  } catch (error) {
    logger.error('Error in bulk assign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign assets',
      error: error.message
    });
  }
};

// Bulk delete assets (soft delete)
exports.bulkDelete = async (req, res) => {
  try {
    const { asset_ids, reason, permanent = false } = req.body;

    // Only admins can permanently delete
    if (permanent && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Only administrators can permanently delete assets'
      });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid assets found'
      });
    }

    // Check for active assignments or maintenance
    const activeAssets = assets.filter(a => 
      a.status === 'Active' || 
      a.status === 'Under Maintenance' ||
      a.assigned_user
    );

    if (activeAssets.length > 0 && req.query.force !== 'true') {
      return res.status(400).json({
        success: false,
        message: `${activeAssets.length} asset(s) are active or assigned`,
        active_assets: activeAssets.map(a => ({
          id: a._id,
          unique_asset_id: a.unique_asset_id,
          status: a.status,
          assigned_user: a.assigned_user
        })),
        hint: 'Use ?force=true to delete these assets anyway'
      });
    }

    let deleteResult;

    if (permanent) {
      // Permanent delete (hard delete)
      deleteResult = await Asset.deleteMany({ _id: { $in: assets.map(a => a._id) } });
    } else {
      // Soft delete (mark as deleted)
      deleteResult = await Asset.updateMany(
        { _id: { $in: assets.map(a => a._id) } },
        { 
          $set: { 
            status: 'Disposed',
            deleted_at: new Date(),
            deleted_by: req.user.id,
            is_deleted: true,
            deletion_reason: reason || 'Bulk deletion'
          }
        }
      );
    }

    // Create audit logs
    const auditLogs = assets.map(asset => ({
      asset_id: asset._id,
      action: permanent ? 'bulk_delete_permanent' : 'bulk_delete_soft',
      performed_by: req.user.id,
      details: {
        unique_asset_id: asset.unique_asset_id,
        name: asset.name,
        reason,
        permanent,
        batch_size: assets.length
      },
      timestamp: new Date()
    }));

    await AuditLog.insertMany(auditLogs);

    // Notify affected users
    const affectedUsers = [...new Set(assets.filter(a => a.assigned_user).map(a => a.assigned_user.toString()))];
    
    if (affectedUsers.length > 0) {
      const notifications = affectedUsers.map(userId => ({
        user_id: userId,
        type: 'asset_deleted',
        title: 'Asset Deleted',
        message: `One or more assets assigned to you have been deleted`,
        created_at: new Date(),
        is_read: false
      }));

      await Notification.insertMany(notifications);
    }

    res.json({
      success: true,
      message: `Successfully ${permanent ? 'permanently deleted' : 'deleted'} ${permanent ? deleteResult.deletedCount : deleteResult.modifiedCount} asset(s)`,
      deleted_count: permanent ? deleteResult.deletedCount : deleteResult.modifiedCount,
      missing_ids: missingIds,
      permanent,
      notifications_sent: affectedUsers.length
    });
  } catch (error) {
    logger.error('Error in bulk delete:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete assets',
      error: error.message
    });
  }
};

// Bulk schedule maintenance
exports.bulkScheduleMaintenance = async (req, res) => {
  try {
    const { 
      asset_ids, 
      maintenance_type, 
      scheduled_date, 
      description,
      priority = 'Medium',
      assigned_technician
    } = req.body;

    if (!maintenance_type || !scheduled_date) {
      return res.status(400).json({
        success: false,
        message: 'Maintenance type and scheduled date are required'
      });
    }

    const validTypes = ['Preventive', 'Corrective', 'Inspection', 'Calibration', 'Cleaning'];
    if (!validTypes.includes(maintenance_type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid maintenance type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid assets found'
      });
    }

    // Verify technician exists if provided
    let technician = null;
    if (assigned_technician) {
      technician = await User.findById(assigned_technician);
      if (!technician) {
        return res.status(404).json({
          success: false,
          message: 'Assigned technician not found'
        });
      }
    }

    // Create maintenance records
    const maintenanceRecords = assets.map(asset => ({
      asset_id: asset._id,
      maintenance_type,
      scheduled_date: new Date(scheduled_date),
      description: description || `Bulk ${maintenance_type} maintenance`,
      status: 'Scheduled',
      priority,
      assigned_technician: assigned_technician || null,
      created_by: req.user.id,
      created_at: new Date()
    }));

    const insertedRecords = await Maintenance.insertMany(maintenanceRecords);

    // Update asset status if scheduled for soon (within 7 days)
    const scheduledDateObj = new Date(scheduled_date);
    const daysUntilMaintenance = Math.ceil((scheduledDateObj - new Date()) / (1000 * 60 * 60 * 24));

    if (daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0) {
      await Asset.updateMany(
        { _id: { $in: assets.map(a => a._id) } },
        { 
          $set: { 
            next_maintenance_date: scheduledDateObj,
            maintenance_status: 'Scheduled'
          }
        }
      );
    }

    // Create audit logs
    const auditLogs = assets.map(asset => ({
      asset_id: asset._id,
      action: 'bulk_maintenance_scheduled',
      performed_by: req.user.id,
      details: {
        maintenance_type,
        scheduled_date,
        priority,
        assigned_technician: technician?.name || 'Unassigned',
        batch_size: assets.length
      },
      timestamp: new Date()
    }));

    await AuditLog.insertMany(auditLogs);

    // Notify technician if assigned
    if (technician) {
      await Notification.create({
        user_id: technician._id,
        type: 'maintenance_assigned',
        title: 'Maintenance Tasks Assigned',
        message: `${assets.length} ${maintenance_type} maintenance task(s) scheduled for ${scheduledDateObj.toLocaleDateString()}`,
        created_at: new Date(),
        is_read: false
      });
    }

    // Notify asset owners
    const assetOwners = [...new Set(assets.filter(a => a.assigned_user).map(a => a.assigned_user.toString()))];
    
    if (assetOwners.length > 0) {
      const notifications = assetOwners.map(userId => ({
        user_id: userId,
        type: 'maintenance_scheduled',
        title: 'Maintenance Scheduled',
        message: `${maintenance_type} maintenance scheduled for your asset(s) on ${scheduledDateObj.toLocaleDateString()}`,
        created_at: new Date(),
        is_read: false
      }));

      await Notification.insertMany(notifications);
    }

    res.json({
      success: true,
      message: `Successfully scheduled ${insertedRecords.length} maintenance task(s)`,
      scheduled_count: insertedRecords.length,
      maintenance_type,
      scheduled_date: scheduledDateObj,
      assigned_to: technician ? {
        id: technician._id,
        name: technician.name,
        email: technician.email
      } : null,
      missing_ids: missingIds,
      notifications_sent: (technician ? 1 : 0) + assetOwners.length
    });
  } catch (error) {
    logger.error('Error in bulk schedule maintenance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule maintenance',
      error: error.message
    });
  }
};

// Bulk update asset location
exports.bulkUpdateLocation = async (req, res) => {
  try {
    const { asset_ids, location, notes } = req.body;

    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required'
      });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid assets found'
      });
    }

    // Update assets
    const updateResult = await Asset.updateMany(
      { _id: { $in: assets.map(a => a._id) } },
      { 
        $set: { 
          location,
          updated_at: new Date()
        }
      }
    );

    // Create audit logs
    const auditLogs = assets.map(asset => ({
      asset_id: asset._id,
      action: 'bulk_location_update',
      performed_by: req.user.id,
      details: {
        old_location: asset.location,
        new_location: location,
        notes,
        batch_size: assets.length
      },
      timestamp: new Date()
    }));

    await AuditLog.insertMany(auditLogs);

    res.json({
      success: true,
      message: `Successfully updated location for ${updateResult.modifiedCount} asset(s)`,
      updated_count: updateResult.modifiedCount,
      new_location: location,
      missing_ids: missingIds
    });
  } catch (error) {
    logger.error('Error in bulk location update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset locations',
      error: error.message
    });
  }
};

// Bulk update asset condition
exports.bulkUpdateCondition = async (req, res) => {
  try {
    const { asset_ids, condition, notes } = req.body;

    if (!condition) {
      return res.status(400).json({
        success: false,
        message: 'Condition is required'
      });
    }

    const validConditions = ['Excellent', 'Good', 'Fair', 'Poor', 'Non-functional'];
    if (!validConditions.includes(condition)) {
      return res.status(400).json({
        success: false,
        message: `Invalid condition. Must be one of: ${validConditions.join(', ')}`
      });
    }

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    if (assets.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No valid assets found'
      });
    }

    // Update assets
    const updateResult = await Asset.updateMany(
      { _id: { $in: assets.map(a => a._id) } },
      { 
        $set: { 
          condition,
          last_audit_date: new Date(),
          last_audited_by: req.user.id,
          updated_at: new Date()
        }
      }
    );

    // Create audit logs
    const auditLogs = assets.map(asset => ({
      asset_id: asset._id,
      action: 'bulk_condition_update',
      performed_by: req.user.id,
      details: {
        old_condition: asset.condition,
        new_condition: condition,
        notes,
        batch_size: assets.length
      },
      timestamp: new Date()
    }));

    await AuditLog.insertMany(auditLogs);

    res.json({
      success: true,
      message: `Successfully updated condition for ${updateResult.modifiedCount} asset(s)`,
      updated_count: updateResult.modifiedCount,
      new_condition: condition,
      missing_ids: missingIds
    });
  } catch (error) {
    logger.error('Error in bulk condition update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update asset conditions',
      error: error.message
    });
  }
};

// Get bulk operation history
exports.getBulkOperationHistory = async (req, res) => {
  try {
    const { limit = 50, page = 1, action_type } = req.query;
    const skip = (page - 1) * limit;

    let query = {
      action: { 
        $in: [
          'bulk_status_update',
          'bulk_assign',
          'bulk_delete_soft',
          'bulk_delete_permanent',
          'bulk_maintenance_scheduled',
          'bulk_location_update',
          'bulk_condition_update'
        ]
      }
    };

    if (action_type) {
      query.action = action_type;
    }

    // Admin sees all, others see only their operations
    if (req.user.role !== 'ADMIN') {
      query.performed_by = req.user.id;
    }

    const total = await AuditLog.countDocuments(query);
    const operations = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('performed_by', 'name email role')
      .populate('asset_id', 'unique_asset_id name')
      .select('action performed_by asset_id details timestamp');

    // Group by timestamp and action to show as single operations
    const groupedOperations = {};
    
    operations.forEach(op => {
      const key = `${op.timestamp.getTime()}-${op.action}`;
      if (!groupedOperations[key]) {
        groupedOperations[key] = {
          id: op._id,
          action: op.action,
          performed_by: op.performed_by,
          timestamp: op.timestamp,
          batch_size: op.details.batch_size || 1,
          assets: [],
          details: op.details
        };
      }
      if (op.asset_id) {
        groupedOperations[key].assets.push(op.asset_id);
      }
    });

    const result = Object.values(groupedOperations);

    res.json({
      success: true,
      operations: result,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    logger.error('Error fetching bulk operation history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch operation history',
      error: error.message
    });
  }
};

// Validate bulk operation (dry run)
exports.validateBulkOperation = async (req, res) => {
  try {
    const { asset_ids, operation, ...params } = req.body;

    const { assets, missingIds } = await validateAssetIds(asset_ids);

    const validation = {
      success: true,
      valid_count: assets.length,
      invalid_count: missingIds.length,
      missing_ids: missingIds,
      warnings: [],
      can_proceed: true
    };

    // Operation-specific validations
    switch (operation) {
      case 'update_status':
        const activeCount = assets.filter(a => a.status === 'Active').length;
        if (activeCount > 0) {
          validation.warnings.push(`${activeCount} asset(s) are currently active`);
        }
        break;

      case 'assign':
        const alreadyAssigned = assets.filter(a => a.assigned_user).length;
        if (alreadyAssigned > 0) {
          validation.warnings.push(`${alreadyAssigned} asset(s) are already assigned`);
        }
        break;

      case 'delete':
        const inUse = assets.filter(a => 
          a.status === 'Active' || a.status === 'Under Maintenance'
        ).length;
        if (inUse > 0) {
          validation.warnings.push(`${inUse} asset(s) are currently in use`);
          validation.can_proceed = false;
        }
        break;

      case 'schedule_maintenance':
        const underMaintenance = assets.filter(a => 
          a.status === 'Under Maintenance'
        ).length;
        if (underMaintenance > 0) {
          validation.warnings.push(`${underMaintenance} asset(s) already under maintenance`);
        }
        break;
    }

    res.json(validation);
  } catch (error) {
    logger.error('Error validating bulk operation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate operation',
      error: error.message
    });
  }
};

// Bulk import assets from CSV/Excel file
exports.importAssets = async (req, res) => {
  const fs = require('fs');
  const csv = require('csv-parser');
  const XLSX = require('xlsx');
  const path = require('path');

  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase();
    const results = [];
    const errors = [];

    // Parse file based on extension
    if (fileExtension === '.csv') {
      // Parse CSV file
      await new Promise((resolve, reject) => {
        let rowNumber = 0;
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', (data) => {
            rowNumber++;
            results.push({ row: rowNumber, data });
          })
          .on('end', resolve)
          .on('error', reject);
      });
    } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
      // Parse Excel file
      const workbook = XLSX.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);
      
      data.forEach((row, index) => {
        results.push({ row: index + 2, data: row }); // +2 because Excel rows start at 1 and row 1 is headers
      });
    } else {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        success: false,
        message: 'Unsupported file format. Please upload CSV or Excel file.'
      });
    }

    let successCount = 0;
    let failedCount = 0;

    // Process each row
    for (const item of results) {
      try {
        const { row, data } = item;

        // Normalize field names (handle different column naming conventions)
        const normalizedData = {};
        for (const [key, value] of Object.entries(data)) {
          const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
          normalizedData[normalizedKey] = value;
        }

        // Map common field variations
        const name = normalizedData.name || normalizedData.asset_name;
        const unique_asset_id = normalizedData.unique_asset_id || normalizedData.asset_id || normalizedData.id;
        const asset_type = normalizedData.asset_type || normalizedData.type || normalizedData.category;

        // Validate required fields
        if (!name || !unique_asset_id || !asset_type) {
          errors.push({
            row,
            error: 'Missing required fields (name, unique_asset_id, asset_type)',
            data
          });
          failedCount++;
          continue;
        }

        // Check if asset ID already exists
        const existingAsset = await Asset.findOne({ unique_asset_id });
        if (existingAsset) {
          errors.push({
            row,
            error: `Asset ID ${unique_asset_id} already exists`,
            data
          });
          failedCount++;
          continue;
        }

        // Create asset object
        const assetData = {
          unique_asset_id,
          name,
          asset_type,
          manufacturer: normalizedData.manufacturer || '',
          model: normalizedData.model || '',
          serial_number: normalizedData.serial_number || normalizedData.serial || '',
          location: normalizedData.location || 'Unknown',
          assigned_user: normalizedData.assigned_user || normalizedData.assigned_to || null,
          status: normalizedData.status || 'Available',
          department: normalizedData.department || 'INVENTORY',
          purchase_date: normalizedData.purchase_date ? new Date(normalizedData.purchase_date) : new Date(),
          purchase_cost: parseFloat(normalizedData.purchase_cost || normalizedData.purchase_value || normalizedData.value || 0),
          warranty_expiry: normalizedData.warranty_expiry ? new Date(normalizedData.warranty_expiry) : null,
          last_audit_date: normalizedData.last_audit_date ? new Date(normalizedData.last_audit_date) : new Date(),
          condition: normalizedData.condition || 'Good',
          configuration: normalizedData.configuration ? (typeof normalizedData.configuration === 'string' ? JSON.parse(normalizedData.configuration) : normalizedData.configuration) : {},
          expected_lifespan: parseInt(normalizedData.expected_lifespan || normalizedData.lifespan || 5),
          created_by: req.user.id
        };

        // Create asset
        const asset = new Asset(assetData);
        await asset.save();

        // Create audit log
        await AuditLog.create({
          user: req.user.id,
          action: 'BULK_IMPORT_ASSET',
          resource_type: 'Asset',
          resource_id: asset._id,
          description: `Asset ${asset.unique_asset_id} imported from ${fileExtension} file`,
          ip_address: req.ip,
          user_agent: req.get('user-agent')
        });

        successCount++;
      } catch (err) {
        errors.push({
          row: item.row,
          error: err.message,
          data: item.data
        });
        failedCount++;
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(filePath);

    // Send notification
    await Notification.create({
      user: req.user.id,
      title: 'Bulk Import Completed',
      message: `Imported ${successCount} assets successfully. ${failedCount} failed.`,
      type: successCount > 0 ? 'success' : 'error',
      category: 'asset_management',
      priority: 'medium'
    });

    res.json({
      success: true,
      message: `Import completed: ${successCount} successful, ${failedCount} failed`,
      success: successCount,
      failed: failedCount,
      total: results.length,
      errors: errors
    });

  } catch (error) {
    logger.error('Error importing assets:', error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: 'Failed to import assets',
      error: error.message
    });
  }
};

// Generate CSV template for bulk import
exports.generateImportTemplate = async (req, res) => {
  try {
    const format = req.query.format || 'csv'; // csv or xlsx
    
    // Template headers
    const headers = [
      'name',
      'unique_asset_id',
      'asset_type',
      'category',
      'manufacturer',
      'model',
      'serial_number',
      'purchase_date',
      'purchase_cost',
      'warranty_expiry',
      'status',
      'condition',
      'location',
      'department',
      'description'
    ];

    // Sample data
    const sampleData = [
      {
        name: 'Dell XPS 15 Laptop',
        unique_asset_id: 'AST-001',
        asset_type: 'IT Equipment',
        category: 'Laptop',
        manufacturer: 'Dell',
        model: 'XPS 15',
        serial_number: 'DL123456789',
        purchase_date: '2024-01-15',
        purchase_cost: '85000',
        warranty_expiry: '2026-01-15',
        status: 'Available',
        condition: 'Excellent',
        location: 'IT Department',
        department: 'IT',
        description: 'High-performance laptop for development work'
      },
      {
        name: 'HP LaserJet Printer',
        unique_asset_id: 'AST-002',
        asset_type: 'Office Equipment',
        category: 'Printer',
        manufacturer: 'HP',
        model: 'LaserJet Pro M404n',
        serial_number: 'HP987654321',
        purchase_date: '2024-02-20',
        purchase_cost: '25000',
        warranty_expiry: '2025-02-20',
        status: 'Available',
        condition: 'Good',
        location: 'Admin Office',
        department: 'ADMIN',
        description: 'Network printer for office use'
      }
    ];

    if (format === 'xlsx' || format === 'excel') {
      // Generate Excel file
      const XLSX = require('xlsx');
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Assets');
      
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=asset-import-template.xlsx');
      res.send(buffer);
    } else {
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

      // Generate CSV file
      const csvRows = [];
      csvRows.push(headers.map(h => escapeCsvValue(h)).join(','));
      
      sampleData.forEach(row => {
        const values = headers.map(header => escapeCsvValue(row[header] || ''));
        csvRows.push(values.join(','));
      });
      
      // Add BOM for proper Excel UTF-8 support
      const BOM = '\uFEFF';
      const csvContent = BOM + csvRows.join('\r\n'); // Use Windows line endings for Excel compatibility
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename=asset-import-template.csv');
      res.send(csvContent);
    }
  } catch (error) {
    logger.error('Error generating template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate template',
      error: error.message
    });
  }
};

module.exports = exports;
