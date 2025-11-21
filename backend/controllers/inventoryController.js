const Asset = require('../models/asset');
const DisposalRecord = require('../models/disposalRecord');
const AssetCategory = require('../models/assetCategory');
const logger = require('../utils/logger');

// ========================================
// DEAD STOCK CONTROLLERS
// ========================================

/**
 * @desc    Get all dead stock items
 * @route   GET /api/v1/inventory/dead-stock
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getDeadStockItems = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      search = '',
      category = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build query for dead stock items (using 'Ready for Scrap' status)
    // Exclude assets that have been disposed
    const query = {
      $or: [
        { status: 'Ready for Scrap' },
        { condition: 'Obsolete' },
        { condition: 'Beyond Repair' }
      ],
      status: { $ne: 'Disposed' } // Exclude disposed assets from dead stock list
    };

    // Add search filter
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { unique_asset_id: { $regex: search, $options: 'i' } },
          { asset_type: { $regex: search, $options: 'i' } },
          { manufacturer: { $regex: search, $options: 'i' } },
          { model: { $regex: search, $options: 'i' } },
          { serial_number: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Add category filter
    if (category) {
      query.asset_type = category;
    }

    // Add status filter if provided (overrides default)
    if (status) {
      delete query.$or;
      query.status = status;
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with pagination
    const [assets, totalCount] = await Promise.all([
      Asset.find(query)
        .sort(sortObj)
        .limit(parseInt(limit))
        .skip(skip)
        .select('-__v')
        .lean(),
      Asset.countDocuments(query)
    ]);

    // Transform data for frontend
    const transformedAssets = assets.map(asset => ({
      id: asset._id,
      unique_asset_id: asset.unique_asset_id,
      category: asset.asset_type,
      model: asset.model,
      manufacturer: asset.manufacturer,
      serial_number: asset.serial_number,
      purchase_date: asset.purchase_date,
      purchase_value: asset.purchase_cost,
      reason_for_dead_stock: asset.condition || 'Not specified',
      status: asset.status,
      location: asset.location,
      department: asset.department,
      warranty_expiry: asset.warranty_expiry
    }));

    logger.info('Dead stock items retrieved', {
      userId: req.user.id,
      count: assets.length,
      page,
      limit
    });

    res.status(200).json({
      success: true,
      data: transformedAssets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        hasNextPage: skip + assets.length < totalCount,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching dead stock items:', error);
    next(error);
  }
};

/**
 * @desc    Get dead stock statistics
 * @route   GET /api/v1/inventory/dead-stock/stats
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getDeadStockStats = async (req, res, next) => {
  try {
    // Build query for dead stock items - MUST match the main query
    // Exclude assets that have been disposed
    const query = {
      $or: [
        { status: 'Ready for Scrap' },
        { condition: 'Obsolete' },
        { condition: 'Beyond Repair' }
      ],
      status: { $ne: 'Disposed' } // Exclude disposed assets from stats
    };

    const [deadStockAssets, totalValue] = await Promise.all([
      Asset.countDocuments(query),
      Asset.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            totalValue: { $sum: '$purchase_cost' }
          }
        }
      ])
    ]);

    const pendingDisposal = await Asset.countDocuments({
      status: 'Disposed' // Count disposed assets as pending disposal
    });

    logger.info('Dead stock stats retrieved', { userId: req.user.id });

    res.status(200).json({
      success: true,
      data: {
        totalDeadStock: deadStockAssets,
        totalValue: totalValue[0]?.totalValue || 0,
        pendingDisposal: pendingDisposal
      }
    });
  } catch (error) {
    logger.error('Error fetching dead stock stats:', error);
    next(error);
  }
};

/**
 * @desc    Mark asset as dead stock
 * @route   POST /api/v1/inventory/dead-stock
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.markAsDeadStock = async (req, res, next) => {
  try {
    const { assetId, reason, notes } = req.body;

    if (!assetId) {
      return res.status(400).json({
        success: false,
        message: 'Asset ID is required'
      });
    }

    const asset = await Asset.findById(assetId);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Update asset status to Ready for Scrap (dead stock)
    asset.status = 'Ready for Scrap';
    asset.condition = reason || 'Marked as Dead Stock';
    asset.notes = notes || '';
    await asset.save();

    logger.info('Asset marked as dead stock', {
      userId: req.user.id,
      assetId: asset._id,
      reason
    });

    res.status(200).json({
      success: true,
      message: 'Asset marked as dead stock successfully',
      data: asset
    });
  } catch (error) {
    logger.error('Error marking asset as dead stock:', error);
    next(error);
  }
};

/**
 * @desc    Update dead stock item
 * @route   PUT /api/v1/inventory/dead-stock/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.updateDeadStockItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const asset = await Asset.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Dead stock item not found'
      });
    }

    logger.info('Dead stock item updated', {
      userId: req.user.id,
      assetId: id
    });

    res.status(200).json({
      success: true,
      message: 'Dead stock item updated successfully',
      data: asset
    });
  } catch (error) {
    logger.error('Error updating dead stock item:', error);
    next(error);
  }
};

/**
 * @desc    Remove from dead stock
 * @route   DELETE /api/v1/inventory/dead-stock/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.removeFromDeadStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newStatus = 'Available' } = req.body;

    const asset = await Asset.findByIdAndUpdate(
      id,
      { 
        $set: { 
          status: newStatus,
          condition: 'Good'
        } 
      },
      { new: true }
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    logger.info('Asset removed from dead stock', {
      userId: req.user.id,
      assetId: id,
      newStatus
    });

    res.status(200).json({
      success: true,
      message: 'Asset removed from dead stock successfully',
      data: asset
    });
  } catch (error) {
    logger.error('Error removing from dead stock:', error);
    next(error);
  }
};

// ========================================
// DISPOSAL RECORDS CONTROLLERS
// ========================================

/**
 * @desc    Get all disposal records
 * @route   GET /api/v1/inventory/disposal-records
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getDisposalRecords = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      search = '',
      status = '',
      method = '',
      startDate = '',
      endDate = '',
      sortBy = 'disposal_date',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};

    // Add search filter
    if (search) {
      query.$or = [
        { asset_id: { $regex: search, $options: 'i' } },
        { asset_name: { $regex: search, $options: 'i' } },
        { document_reference: { $regex: search, $options: 'i' } },
        { approved_by: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status) {
      query.status = status;
    }

    // Add disposal method filter
    if (method) {
      query.disposal_method = method;
    }

    // Add date range filter
    if (startDate || endDate) {
      query.disposal_date = {};
      if (startDate) query.disposal_date.$gte = new Date(startDate);
      if (endDate) query.disposal_date.$lte = new Date(endDate);
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [records, totalCount] = await Promise.all([
      DisposalRecord.find(query)
        .sort(sortObj)
        .limit(parseInt(limit))
        .skip(skip)
        .select('-__v')
        .lean(),
      DisposalRecord.countDocuments(query)
    ]);

    // Normalize data shape for frontend (add id, format date, ensure numbers)
    const transformedRecords = records.map((r) => ({
      id: r._id?.toString?.() || r.id || '',
      asset_id: r.asset_id,
      asset_name: r.asset_name,
      category: r.category,
      // Keep raw date for potential client-side formatting, but provide a readable fallback
      disposal_date: r.disposal_date instanceof Date
        ? r.disposal_date.toISOString()
        : (r.disposal_date || ''),
      disposal_method: r.disposal_method,
      disposal_value: typeof r.disposal_value === 'number' ? r.disposal_value : Number(r.disposal_value || 0),
      approved_by: r.approved_by,
      document_reference: r.document_reference,
      status: r.status || 'pending',
      remarks: r.remarks || ''
    }));

    logger.info('Disposal records retrieved', {
      userId: req.user.id,
      count: records.length
    });

    res.status(200).json({
      success: true,
      data: transformedRecords,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount,
        hasNextPage: skip + records.length < totalCount,
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching disposal records:', error);
    next(error);
  }
};

/**
 * @desc    Get disposal record by ID
 * @route   GET /api/v1/inventory/disposal-records/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getDisposalRecordById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await DisposalRecord.findById(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Disposal record not found'
      });
    }

    logger.info('Disposal record retrieved', { userId: req.user.id, recordId: id });

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    logger.error('Error fetching disposal record:', error);
    next(error);
  }
};

/**
 * @desc    Create disposal record
 * @route   POST /api/v1/inventory/disposal-records
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.createDisposalRecord = async (req, res, next) => {
  try {
    const recordData = {
      ...req.body,
      created_by: req.user.id,
      approved_by: req.user.email
    };

    const record = await DisposalRecord.create(recordData);

    logger.info('Disposal record created', {
      userId: req.user.id,
      recordId: record._id
    });

    res.status(201).json({
      success: true,
      message: 'Disposal record created successfully',
      data: record
    });
  } catch (error) {
    logger.error('Error creating disposal record:', error);
    next(error);
  }
};

/**
 * @desc    Update disposal record
 * @route   PUT /api/v1/inventory/disposal-records/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.updateDisposalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const record = await DisposalRecord.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Disposal record not found'
      });
    }

    logger.info('Disposal record updated', {
      userId: req.user.id,
      recordId: id
    });

    res.status(200).json({
      success: true,
      message: 'Disposal record updated successfully',
      data: record
    });
  } catch (error) {
    logger.error('Error updating disposal record:', error);
    next(error);
  }
};

/**
 * @desc    Delete disposal record
 * @route   DELETE /api/v1/inventory/disposal-records/:id
 * @access  Private (ADMIN only)
 */
exports.deleteDisposalRecord = async (req, res, next) => {
  try {
    const { id } = req.params;

    const record = await DisposalRecord.findByIdAndDelete(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Disposal record not found'
      });
    }

    logger.info('Disposal record deleted', {
      userId: req.user.id,
      recordId: id
    });

    res.status(200).json({
      success: true,
      message: 'Disposal record deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting disposal record:', error);
    next(error);
  }
};

/**
 * @desc    Get scrap items (combines disposal records with assets ready for scrap)
 * @route   GET /api/v1/inventory/scrap
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getScrapItems = async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 50,
      search = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get assets marked as 'Ready for Scrap'
    const assetsQuery = {
      status: 'Ready for Scrap'
    };

    if (search) {
      assetsQuery.$or = [
        { unique_asset_id: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { serial_number: { $regex: search, $options: 'i' } }
      ];
    }

    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [assets, disposalRecords] = await Promise.all([
      Asset.find(assetsQuery)
        .populate('vendor', 'company_name')
        .sort(sortObj)
        .limit(parseInt(limit))
        .skip(skip)
        .lean(),
      DisposalRecord.find().lean()
    ]);

    // Create a map of disposal records by asset_id
    const disposalMap = {};
    disposalRecords.forEach(record => {
      disposalMap[record.asset_id] = record;
    });

    // Transform assets to scrap item format
    const scrapItems = assets.map(asset => {
      const disposal = disposalMap[asset.unique_asset_id] || disposalMap[asset._id.toString()];
      
      // Determine scrap reason based on condition
      let scrapReason = 'End of Life';
      if (asset.condition === 'Damaged' || asset.condition === 'Beyond Repair') {
        scrapReason = 'Beyond Repair';
      } else if (asset.condition === 'Obsolete') {
        scrapReason = 'Obsolete';
      }

      // Determine status based on disposal record
      let itemStatus = 'Pending Approval';
      let approvalDate = null;
      let disposalDate = null;
      
      if (disposal) {
        if (disposal.status === 'completed') {
          if (disposal.disposal_method === 'Scrap') {
            itemStatus = 'Recycled';
          } else if (disposal.disposal_method === 'Sale') {
            itemStatus = 'Sold';
          } else {
            itemStatus = 'Disposed';
          }
          disposalDate = disposal.disposal_date;
          approvalDate = disposal.createdAt;
        } else if (disposal.status === 'in_progress') {
          itemStatus = 'In Disposal Process';
          approvalDate = disposal.createdAt;
        } else if (disposal.status === 'pending') {
          itemStatus = 'Approved for Scrap';
          approvalDate = disposal.createdAt;
        }
      }

      return {
        id: asset._id.toString(),
        assetId: asset.unique_asset_id,
        assetName: asset.name || asset.model || 'Unknown Asset',
        category: asset.asset_type || 'General',
        manufacturer: asset.manufacturer || 'Unknown',
        model: asset.model || 'Unknown',
        serialNumber: asset.serial_number || 'N/A',
        currentLocation: asset.location || 'Unknown',
        scrapReason: scrapReason,
        scrapDate: asset.updatedAt ? asset.updatedAt.toISOString() : new Date().toISOString(),
        approvalDate: approvalDate ? approvalDate.toISOString() : null,
        disposalDate: disposalDate ? disposalDate.toISOString() : null,
        status: itemStatus,
        originalValue: asset.purchase_cost || 0,
        scrapValue: disposal?.disposal_value || Math.round((asset.purchase_cost || 0) * 0.1), // 10% of original
        disposalMethod: disposal?.disposal_method || 'Recycle',
        approvedBy: disposal?.approved_by || null,
        vendorName: asset.vendor?.company_name || null,
        documentReference: disposal?.document_reference || null,
        environmentalCompliance: true // Default to true, should be tracked in future
      };
    });

    // Filter by status if provided
    const filteredItems = status 
      ? scrapItems.filter(item => item.status === status)
      : scrapItems;

    const totalCount = await Asset.countDocuments(assetsQuery);

    logger.info('Scrap items retrieved', {
      userId: req.user.id,
      count: filteredItems.length
    });

    res.status(200).json({
      success: true,
      data: filteredItems,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalItems: totalCount
      }
    });
  } catch (error) {
    logger.error('Error fetching scrap items:', error);
    next(error);
  }
};

/**
 * @desc    Approve scrap item
 * @route   POST /api/v1/inventory/scrap/:id/approve
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.approveScrapItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const asset = await Asset.findById(id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Create disposal record if it doesn't exist
    let disposal = await DisposalRecord.findOne({ 
      $or: [
        { asset_id: asset.unique_asset_id },
        { asset_id: id }
      ]
    });

    if (!disposal) {
      disposal = await DisposalRecord.create({
        asset_id: asset.unique_asset_id,
        asset_name: asset.name || asset.model,
        category: asset.asset_type,
        disposal_method: 'Scrap',
        disposal_value: Math.round((asset.purchase_cost || 0) * 0.1),
        approved_by: req.user.email || req.user.full_name,
        status: 'pending',
        created_by: req.user.id
      });
    } else {
      disposal.status = 'pending';
      disposal.approved_by = req.user.email || req.user.full_name;
      await disposal.save();
    }

    logger.info('Scrap item approved', {
      userId: req.user.id,
      assetId: id
    });

    res.status(200).json({
      success: true,
      message: 'Scrap item approved successfully',
      data: disposal
    });
  } catch (error) {
    logger.error('Error approving scrap item:', error);
    next(error);
  }
};

/**
 * @desc    Create new scrap request
 * @route   POST /api/v1/inventory/scrap
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.createScrapRequest = async (req, res, next) => {
  try {
    const { assetId, scrapReason, estimatedValue, disposalMethod, notes } = req.body;

    if (!assetId || !scrapReason) {
      return res.status(400).json({
        success: false,
        message: 'Asset ID and scrap reason are required'
      });
    }

    // Find the asset
    const asset = await Asset.findOne({
      $or: [
        { unique_asset_id: assetId },
        { _id: assetId }
      ]
    });

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check if asset is already marked for scrap
    if (asset.status === 'Ready for Scrap') {
      return res.status(400).json({
        success: false,
        message: 'Asset is already marked for scrap'
      });
    }

    // Update asset status to Ready for Scrap
    asset.status = 'Ready for Scrap';
    asset.condition = scrapReason === 'Beyond Repair' ? 'Beyond Repair' : 
                      scrapReason === 'Obsolete' ? 'Obsolete' : asset.condition;
    await asset.save();

    // Create disposal record
    const disposal = await DisposalRecord.create({
      asset_id: asset.unique_asset_id,
      asset_name: asset.name || asset.model,
      category: asset.asset_type,
      disposal_method: disposalMethod || 'Scrap',
      disposal_value: estimatedValue || Math.round((asset.purchase_cost || 0) * 0.1),
      reason: scrapReason,
      notes: notes,
      status: 'pending',
      created_by: req.user.id
    });

    logger.info('Scrap request created', {
      userId: req.user.id,
      assetId: asset._id,
      disposalId: disposal._id
    });

    res.status(201).json({
      success: true,
      message: 'Scrap request created successfully',
      data: disposal
    });
  } catch (error) {
    logger.error('Error creating scrap request:', error);
    next(error);
  }
};

/**
 * @desc    Get scrap item by ID
 * @route   GET /api/v1/inventory/scrap/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getScrapItemById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const asset = await Asset.findById(id)
      .populate('vendor', 'company_name')
      .lean();

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Scrap item not found'
      });
    }

    // Get disposal record
    const disposal = await DisposalRecord.findOne({
      $or: [
        { asset_id: asset.unique_asset_id },
        { asset_id: id }
      ]
    }).lean();

    // Determine scrap reason and status
    let scrapReason = 'End of Life';
    if (asset.condition === 'Damaged' || asset.condition === 'Beyond Repair') {
      scrapReason = 'Beyond Repair';
    } else if (asset.condition === 'Obsolete') {
      scrapReason = 'Obsolete';
    }

    let itemStatus = 'Pending Approval';
    let approvalDate = null;
    let disposalDate = null;
    
    if (disposal) {
      if (disposal.status === 'completed') {
        itemStatus = disposal.disposal_method === 'Sale' ? 'Sold' : 'Recycled';
        disposalDate = disposal.disposal_date;
        approvalDate = disposal.createdAt;
      } else if (disposal.status === 'in_progress') {
        itemStatus = 'In Disposal Process';
        approvalDate = disposal.createdAt;
      } else if (disposal.status === 'pending') {
        itemStatus = 'Approved for Scrap';
        approvalDate = disposal.createdAt;
      }
    }

    const scrapItem = {
      _id: asset._id.toString(),
      assetId: asset.unique_asset_id,
      assetName: asset.name || asset.model || 'Unknown Asset',
      category: asset.asset_type || 'General',
      manufacturer: asset.manufacturer || 'Unknown',
      model: asset.model || 'Unknown',
      serialNumber: asset.serial_number || 'N/A',
      currentLocation: asset.location || 'Unknown',
      scrapReason: scrapReason,
      scrapDate: asset.updatedAt ? asset.updatedAt.toISOString() : new Date().toISOString(),
      approvalDate: approvalDate ? approvalDate.toISOString() : null,
      disposalDate: disposalDate ? disposalDate.toISOString() : null,
      status: itemStatus,
      originalValue: asset.purchase_cost || 0,
      scrapValue: disposal?.disposal_value || Math.round((asset.purchase_cost || 0) * 0.1),
      disposalMethod: disposal?.disposal_method || 'Recycle',
      approvedBy: disposal?.approved_by || null,
      vendorName: asset.vendor?.company_name || null,
      documentReference: disposal?.document_reference || null,
      environmentalCompliance: true
    };

    res.status(200).json({
      success: true,
      data: scrapItem
    });
  } catch (error) {
    logger.error('Error fetching scrap item:', error);
    next(error);
  }
};

/**
 * @desc    Update scrap item
 * @route   PATCH /api/v1/inventory/scrap/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.updateScrapItem = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, disposalDate, vendorName, documentReference } = req.body;

    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Update disposal record
    const disposal = await DisposalRecord.findOne({
      $or: [
        { asset_id: asset.unique_asset_id },
        { asset_id: id }
      ]
    });

    if (!disposal) {
      return res.status(404).json({
        success: false,
        message: 'Disposal record not found'
      });
    }

    // Map status to disposal status
    if (status === 'In Disposal Process') {
      disposal.status = 'in_progress';
    } else if (status === 'Disposed' || status === 'Sold' || status === 'Recycled') {
      disposal.status = 'completed';
      disposal.disposal_date = disposalDate || new Date();
    }

    if (vendorName) disposal.vendor_name = vendorName;
    if (documentReference) disposal.document_reference = documentReference;

    await disposal.save();

    logger.info('Scrap item updated', {
      userId: req.user.id,
      assetId: id
    });

    res.status(200).json({
      success: true,
      message: 'Scrap item updated successfully',
      data: disposal
    });
  } catch (error) {
    logger.error('Error updating scrap item:', error);
    next(error);
  }
};

/**
 * @desc    Delete scrap item
 * @route   DELETE /api/v1/inventory/scrap/:id
 * @access  Private (ADMIN only)
 */
exports.deleteScrapItem = async (req, res, next) => {
  try {
    const { id } = req.params;

    const asset = await Asset.findById(id);
    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Remove from Ready for Scrap status
    asset.status = 'Available';
    await asset.save();

    // Delete disposal record
    await DisposalRecord.deleteOne({
      $or: [
        { asset_id: asset.unique_asset_id },
        { asset_id: id }
      ]
    });

    logger.info('Scrap item deleted', {
      userId: req.user.id,
      assetId: id
    });

    res.status(200).json({
      success: true,
      message: 'Scrap item deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting scrap item:', error);
    next(error);
  }
};

/**
 * @desc    Get scrap statistics
 * @route   GET /api/v1/inventory/scrap/stats
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.getScrapStats = async (req, res, next) => {
  try {
    const [assets, disposalRecords] = await Promise.all([
      Asset.find({ status: 'Ready for Scrap' }).lean(),
      DisposalRecord.find().lean()
    ]);

    const disposalMap = {};
    disposalRecords.forEach(record => {
      disposalMap[record.asset_id] = record;
    });

    let pendingCount = 0;
    let approvedCount = 0;
    let inProcessCount = 0;
    let completedCount = 0;
    let totalScrapValue = 0;
    let totalOriginalValue = 0;

    assets.forEach(asset => {
      const disposal = disposalMap[asset.unique_asset_id] || disposalMap[asset._id.toString()];
      
      if (disposal) {
        if (disposal.status === 'completed') {
          completedCount++;
          totalScrapValue += disposal.disposal_value || 0;
          totalOriginalValue += asset.purchase_cost || 0;
        } else if (disposal.status === 'in_progress') {
          inProcessCount++;
        } else if (disposal.status === 'pending') {
          approvedCount++;
        }
      } else {
        pendingCount++;
      }
    });

    const stats = {
      pendingCount,
      approvedCount,
      inProcessCount,
      completedCount,
      totalScrapValue,
      totalLossValue: totalOriginalValue - totalScrapValue
    };

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching scrap stats:', error);
    next(error);
  }
};

/**
 * @desc    Export scrap report
 * @route   GET /api/v1/inventory/scrap/export
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.exportScrapReport = async (req, res, next) => {
  try {
    const { format = 'csv', search = '', status = '' } = req.query;

    // Get scrap items
    const assetsQuery = { status: 'Ready for Scrap' };
    
    if (search) {
      assetsQuery.$or = [
        { unique_asset_id: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
        { serial_number: { $regex: search, $options: 'i' } }
      ];
    }

    const [assets, disposalRecords] = await Promise.all([
      Asset.find(assetsQuery).populate('vendor', 'company_name').lean(),
      DisposalRecord.find().lean()
    ]);

    const disposalMap = {};
    disposalRecords.forEach(record => {
      disposalMap[record.asset_id] = record;
    });

    // Transform to scrap items
    const scrapItems = assets.map(asset => {
      const disposal = disposalMap[asset.unique_asset_id] || disposalMap[asset._id.toString()];
      
      let scrapReason = 'End of Life';
      if (asset.condition === 'Damaged' || asset.condition === 'Beyond Repair') {
        scrapReason = 'Beyond Repair';
      } else if (asset.condition === 'Obsolete') {
        scrapReason = 'Obsolete';
      }

      let itemStatus = 'Pending Approval';
      if (disposal) {
        if (disposal.status === 'completed') {
          itemStatus = disposal.disposal_method === 'Sale' ? 'Sold' : 'Recycled';
        } else if (disposal.status === 'in_progress') {
          itemStatus = 'In Disposal Process';
        } else if (disposal.status === 'pending') {
          itemStatus = 'Approved for Scrap';
        }
      }

      return {
        assetId: asset.unique_asset_id,
        assetName: asset.name || asset.model || 'Unknown Asset',
        category: asset.asset_type || 'General',
        manufacturer: asset.manufacturer || 'Unknown',
        model: asset.model || 'Unknown',
        serialNumber: asset.serial_number || 'N/A',
        location: asset.location || 'Unknown',
        scrapReason: scrapReason,
        status: itemStatus,
        originalValue: asset.purchase_cost || 0,
        scrapValue: disposal?.disposal_value || Math.round((asset.purchase_cost || 0) * 0.1),
        disposalMethod: disposal?.disposal_method || 'Recycle',
        approvedBy: disposal?.approved_by || 'N/A',
        scrapDate: asset.updatedAt ? asset.updatedAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
      };
    });

    // Filter by status if provided
    const filteredItems = status && status !== 'All'
      ? scrapItems.filter(item => item.status === status)
      : scrapItems;

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

      // Generate CSV
      const csvHeaders = [
        'Asset ID', 'Asset Name', 'Category', 'Manufacturer', 'Model', 
        'Serial Number', 'Location', 'Scrap Reason', 'Status', 
        'Original Value (₹)', 'Scrap Value (₹)', 'Disposal Method', 'Approved By', 'Scrap Date'
      ];

      const csvRows = filteredItems.map(item => [
        escapeCsvValue(item.assetId),
        escapeCsvValue(item.assetName),
        escapeCsvValue(item.category),
        escapeCsvValue(item.manufacturer),
        escapeCsvValue(item.model),
        escapeCsvValue(item.serialNumber),
        escapeCsvValue(item.location),
        escapeCsvValue(item.scrapReason),
        escapeCsvValue(item.status),
        escapeCsvValue(item.originalValue ? item.originalValue.toLocaleString('en-IN') : '0'),
        escapeCsvValue(item.scrapValue ? item.scrapValue.toLocaleString('en-IN') : '0'),
        escapeCsvValue(item.disposalMethod),
        escapeCsvValue(item.approvedBy),
        escapeCsvValue(item.scrapDate)
      ]);

      // Add BOM for proper Excel UTF-8 support
      const BOM = '\uFEFF';
      const csvContent = BOM + [
        csvHeaders.map(h => escapeCsvValue(h)).join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\r\n'); // Use Windows line endings for Excel compatibility

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=scrap-report-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Unsupported export format. Only CSV is supported.'
      });
    }

    logger.info('Scrap report exported', {
      userId: req.user.id,
      format,
      count: filteredItems.length
    });
  } catch (error) {
    logger.error('Error exporting scrap report:', error);
    next(error);
  }
};

// ========================================
// ASSET CATEGORIES CONTROLLERS
// ========================================

/**
 * @desc    Get all asset categories
 * @route   GET /api/v1/inventory/categories
 * @access  Public (All authenticated users)
 */
exports.getCategories = async (req, res, next) => {
  try {
    const categories = await AssetCategory.find({ active: true })
      .select('-__v')
      .lean();

    // Aggregate asset counts by asset_type in a single query (optimized from N+1)
    const counts = await Asset.aggregate([
      { $group: { _id: '$asset_type', count: { $sum: 1 } } }
    ]);
    
    // Create a map for O(1) lookups
    const countMap = new Map(counts.map(c => [c._id, c.count]));
    
    // Merge counts with categories
    const categoriesWithCounts = categories.map(category => ({
      ...category,
      count: countMap.get(category.name) || 0
    }));

    logger.info('Asset categories retrieved', { userId: req.user?.id });

    res.status(200).json({
      success: true,
      data: categoriesWithCounts
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    next(error);
  }
};

/**
 * @desc    Create asset category
 * @route   POST /api/v1/inventory/categories
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if category already exists
    const existingCategory = await AssetCategory.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Category already exists'
      });
    }

    const category = await AssetCategory.create({
      name,
      description,
      color,
      created_by: req.user.id
    });

    logger.info('Asset category created', {
      userId: req.user.id,
      categoryId: category._id,
      name
    });

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    logger.error('Error creating category:', error);
    next(error);
  }
};

/**
 * @desc    Update asset category
 * @route   PUT /api/v1/inventory/categories/:id
 * @access  Private (ADMIN, INVENTORY_MANAGER)
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const category = await AssetCategory.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    logger.info('Asset category updated', {
      userId: req.user.id,
      categoryId: id
    });

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    logger.error('Error updating category:', error);
    next(error);
  }
};

/**
 * @desc    Delete asset category
 * @route   DELETE /api/v1/inventory/categories/:id
 * @access  Private (ADMIN only)
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category is in use
    const assetsUsingCategory = await Asset.countDocuments({
      asset_type: (await AssetCategory.findById(id))?.name
    });

    if (assetsUsingCategory > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category. ${assetsUsingCategory} assets are using this category.`
      });
    }

    const category = await AssetCategory.findByIdAndDelete(id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    logger.info('Asset category deleted', {
      userId: req.user.id,
      categoryId: id
    });

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting category:', error);
    next(error);
  }
};
