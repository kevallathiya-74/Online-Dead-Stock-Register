const Vendor = require('../models/vendor');
const AuditLog = require('../models/auditLog');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

/**
 * Get all vendors with filters and pagination
 */
exports.getVendors = async (filters = {}, pagination = {}) => {
  try {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { is_deleted: false };
    
    // Search filter
    if (filters.search) {
      query.$or = [
        { vendor_name: { $regex: filters.search, $options: 'i' } },
        { contact_person: { $regex: filters.search, $options: 'i' } },
        { email: { $regex: filters.search, $options: 'i' } },
        { phone: { $regex: filters.search, $options: 'i' } }
      ];
    }
    
    // Status filter
    if (filters.status) {
      query.status = filters.status;
    }
    
    // Category filter
    if (filters.category) {
      query['category.name'] = filters.category;
    }
    
    // Execute query with pagination
    const [vendors, total] = await Promise.all([
      Vendor.find(query)
        .select('-__v')
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Vendor.countDocuments(query)
    ]);
    
    return {
      vendors,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    };
  } catch (error) {
    logger.error('Error in getVendors service:', error);
    throw error;
  }
};

/**
 * Get vendor by ID with performance metrics
 */
exports.getVendorById = async (vendorId) => {
  try {
    const vendor = await Vendor.findOne({ 
      _id: vendorId, 
      is_deleted: false 
    })
      .select('-__v')
      .lean();
    
    if (!vendor) {
      return null;
    }
    
    // Get asset count for this vendor
    const Asset = require('../models/asset');
    const assetCount = await Asset.countDocuments({ 
      vendor_id: vendorId,
      is_deleted: false 
    });
    
    return {
      ...vendor,
      assetCount
    };
  } catch (error) {
    logger.error('Error in getVendorById service:', error);
    throw error;
  }
};

/**
 * Create new vendor with audit trail
 */
exports.createVendor = async (vendorData, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    // Check for duplicate vendor name
    const existing = await Vendor.findOne({
      vendor_name: { $regex: new RegExp(`^${vendorData.vendor_name}$`, 'i') },
      is_deleted: false
    });
    
    if (existing) {
      throw new Error('Vendor with this name already exists');
    }
    
    // Create vendor
    const vendor = new Vendor({
      ...vendorData,
      created_by: userId,
      updated_by: userId
    });
    
    await vendor.save({ session });
    
    // Create audit log
    await AuditLog.create([{
      user_id: userId,
      action: 'CREATE',
      entity_type: 'Vendor',
      entity_id: vendor._id,
      changes: {
        new: vendor.toObject()
      },
      ip_address: 'system',
      user_agent: 'backend-service'
    }], { session });
    
    await session.commitTransaction();
    
    logger.info('Vendor created successfully', {
      vendorId: vendor._id,
      vendorName: vendor.vendor_name,
      userId
    });
    
    return vendor.toObject();
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error in createVendor service:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Update vendor with audit trail
 */
exports.updateVendor = async (vendorId, updateData, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const vendor = await Vendor.findOne({ 
      _id: vendorId, 
      is_deleted: false 
    }).session(session);
    
    if (!vendor) {
      await session.abortTransaction();
      return null;
    }
    
    // Store old values for audit
    const oldValues = vendor.toObject();
    
    // Update vendor
    Object.assign(vendor, updateData);
    vendor.updated_by = userId;
    vendor.updated_at = new Date();
    
    await vendor.save({ session });
    
    // Create audit log
    await AuditLog.create([{
      user_id: userId,
      action: 'UPDATE',
      entity_type: 'Vendor',
      entity_id: vendor._id,
      changes: {
        old: oldValues,
        new: vendor.toObject()
      },
      ip_address: 'system',
      user_agent: 'backend-service'
    }], { session });
    
    await session.commitTransaction();
    
    logger.info('Vendor updated successfully', {
      vendorId: vendor._id,
      userId
    });
    
    return vendor.toObject();
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error in updateVendor service:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Soft delete vendor
 */
exports.deleteVendor = async (vendorId, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  
  try {
    const vendor = await Vendor.findOne({ 
      _id: vendorId, 
      is_deleted: false 
    }).session(session);
    
    if (!vendor) {
      await session.abortTransaction();
      return null;
    }
    
    // Check if vendor has active assets
    const Asset = require('../models/asset');
    const activeAssets = await Asset.countDocuments({
      vendor_id: vendorId,
      is_deleted: false,
      status: { $in: ['Active', 'In Use', 'Available'] }
    });
    
    if (activeAssets > 0) {
      throw new Error(`Cannot delete vendor with ${activeAssets} active assets`);
    }
    
    // Soft delete
    vendor.is_deleted = true;
    vendor.deleted_at = new Date();
    vendor.deleted_by = userId;
    
    await vendor.save({ session });
    
    // Create audit log
    await AuditLog.create([{
      user_id: userId,
      action: 'DELETE',
      entity_type: 'Vendor',
      entity_id: vendor._id,
      changes: {
        old: vendor.toObject()
      },
      ip_address: 'system',
      user_agent: 'backend-service'
    }], { session });
    
    await session.commitTransaction();
    
    logger.info('Vendor deleted successfully', {
      vendorId: vendor._id,
      userId
    });
    
    return vendor.toObject();
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error in deleteVendor service:', error);
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Get vendor statistics
 */
exports.getVendorStats = async () => {
  try {
    const stats = await Vendor.aggregate([
      { $match: { is_deleted: false } },
      {
        $facet: {
          byStatus: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          byRating: [
            {
              $bucket: {
                groupBy: '$rating',
                boundaries: [0, 2, 3, 4, 5],
                default: 'No Rating',
                output: {
                  count: { $sum: 1 }
                }
              }
            }
          ],
          total: [
            {
              $count: 'total'
            }
          ],
          avgRating: [
            {
              $group: {
                _id: null,
                avgRating: { $avg: '$rating' }
              }
            }
          ]
        }
      }
    ]);
    
    return {
      byStatus: stats[0].byStatus,
      byRating: stats[0].byRating,
      total: stats[0].total[0]?.total || 0,
      avgRating: stats[0].avgRating[0]?.avgRating || 0
    };
  } catch (error) {
    logger.error('Error in getVendorStats service:', error);
    throw error;
  }
};

/**
 * Get vendor performance metrics
 */
exports.getVendorPerformance = async (vendorId) => {
  try {
    const vendor = await Vendor.findOne({ 
      _id: vendorId, 
      is_deleted: false 
    });
    
    if (!vendor) {
      return null;
    }
    
    // Get assets from this vendor
    const Asset = require('../models/asset');
    const assets = await Asset.find({ 
      vendor_id: vendorId,
      is_deleted: false 
    }).select('status purchase_date warranty_end_date current_value');
    
    // Calculate metrics
    const totalAssets = assets.length;
    const activeAssets = assets.filter(a => ['Active', 'In Use', 'Available'].includes(a.status)).length;
    const totalValue = assets.reduce((sum, a) => sum + (a.current_value || 0), 0);
    
    // Warranty coverage
    const now = new Date();
    const underWarranty = assets.filter(a => 
      a.warranty_end_date && new Date(a.warranty_end_date) > now
    ).length;
    
    return {
      vendor: {
        _id: vendor._id,
        vendor_name: vendor.vendor_name,
        rating: vendor.rating,
        status: vendor.status
      },
      metrics: {
        totalAssets,
        activeAssets,
        totalValue,
        underWarranty,
        warrantyPercentage: totalAssets > 0 ? (underWarranty / totalAssets * 100).toFixed(2) : 0
      }
    };
  } catch (error) {
    logger.error('Error in getVendorPerformance service:', error);
    throw error;
  }
};
