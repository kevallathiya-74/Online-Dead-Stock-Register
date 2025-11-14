/**
 * Asset Service Layer
 * Handles all business logic related to assets
 * Separates business logic from controllers for better maintainability
 */

const Asset = require('../models/asset');
const AuditLog = require('../models/auditLog');
const mongoose = require('mongoose');
const logger = require('../utils/logger');

class AssetService {
  /**
   * Create a new asset with transaction support
   * @param {Object} assetData - Asset data
   * @param {String} userId - User ID creating the asset
   * @returns {Promise<Object>} Created asset
   */
  async createAsset(assetData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Auto-generate unique_asset_id if not provided
      if (!assetData.unique_asset_id) {
        const prefix = 'AST';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        assetData.unique_asset_id = `${prefix}-${timestamp}${random}`;
      }
      
      // Create asset
      const asset = new Asset(assetData);
      await asset.save({ session });
      
      // Create audit log
      await AuditLog.create([{
        entity_type: 'Asset',
        entity_id: asset._id,
        action: 'asset_created',
        user_id: userId,
        changes: {
          new_values: assetData
        },
        timestamp: new Date()
      }], { session });
      
      await session.commitTransaction();
      
      logger.info('Asset created successfully', {
        assetId: asset._id,
        userId,
        uniqueAssetId: asset.unique_asset_id
      });
      
      return asset;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error creating asset', { error: error.message, userId });
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Get assets with filters and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @param {Object} user - Current user
   * @returns {Promise<Object>} Assets and pagination info
   */
  async getAssets(filters = {}, pagination = {}, user) {
    try {
      const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;
      
      // Validate limits
      if (limit > 100) {
        throw new Error('Limit cannot exceed 100 items per page');
      }
      
      let query = {};
      
      // Filter by department if not admin
      if (user.role !== 'ADMIN') {
        query.department = user.department;
      }
      
      // Apply additional filters
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.department && user.role === 'ADMIN') {
        query.department = filters.department;
      }
      
      if (filters.asset_type) {
        query.asset_type = filters.asset_type;
      }
      
      if (filters.location) {
        query.location = { $regex: filters.location, $options: 'i' };
      }
      
      // Text search
      if (filters.search) {
        const searchRegex = { $regex: filters.search, $options: 'i' };
        query.$or = [
          { unique_asset_id: searchRegex },
          { manufacturer: searchRegex },
          { model: searchRegex },
          { serial_number: searchRegex }
        ];
      }
      
      // Date range filters
      if (filters.purchaseStartDate || filters.purchaseEndDate) {
        query.purchase_date = {};
        if (filters.purchaseStartDate) {
          query.purchase_date.$gte = new Date(filters.purchaseStartDate);
        }
        if (filters.purchaseEndDate) {
          query.purchase_date.$lte = new Date(filters.purchaseEndDate);
        }
      }
      
      // Sorting
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
      
      // Execute query with pagination
      const [assets, total] = await Promise.all([
        Asset.find(query)
          .populate('assigned_user', 'name email department')
          .populate('last_audited_by', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        Asset.countDocuments(query)
      ]);
      
      return {
        data: assets,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error fetching assets', { error: error.message, filters });
      throw error;
    }
  }
  
  /**
   * Get asset by ID with audit history
   * @param {String} assetId - Asset ID
   * @returns {Promise<Object>} Asset with audit history
   */
  async getAssetById(assetId) {
    try {
      // Use aggregation for better performance
      const result = await Asset.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(assetId) } },
        {
          $lookup: {
            from: 'users',
            localField: 'assigned_user',
            foreignField: '_id',
            as: 'assigned_user'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'last_audited_by',
            foreignField: '_id',
            as: 'last_audited_by'
          }
        },
        {
          $lookup: {
            from: 'vendors',
            localField: 'vendor',
            foreignField: '_id',
            as: 'vendor'
          }
        },
        {
          $lookup: {
            from: 'auditlogs',
            let: { assetId: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: { $eq: ['$entity_id', '$$assetId'] },
                  entity_type: 'Asset',
                  action: { $in: ['quick_audit_completed', 'audit_scanned', 'asset_updated', 'audit_completed'] }
                }
              },
              { $sort: { timestamp: -1 } },
              { $limit: 10 },
              {
                $lookup: {
                  from: 'users',
                  localField: 'user_id',
                  foreignField: '_id',
                  as: 'user'
                }
              },
              { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
            ],
            as: 'audit_history'
          }
        },
        { $unwind: { path: '$assigned_user', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$last_audited_by', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } }
      ]);
      
      if (!result || result.length === 0) {
        return null;
      }
      
      return result[0];
    } catch (error) {
      logger.error('Error fetching asset by ID', { error: error.message, assetId });
      throw error;
    }
  }
  
  /**
   * Update asset with transaction support
   * @param {String} assetId - Asset ID
   * @param {Object} updateData - Update data
   * @param {String} userId - User ID making the update
   * @returns {Promise<Object>} Updated asset
   */
  async updateAsset(assetId, updateData, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get old asset data for audit log
      const oldAsset = await Asset.findById(assetId).session(session);
      
      if (!oldAsset) {
        throw new Error('Asset not found');
      }
      
      // Update asset
      const updatedAsset = await Asset.findByIdAndUpdate(
        assetId,
        updateData,
        { new: true, session }
      );
      
      // Create audit log
      await AuditLog.create([{
        entity_type: 'Asset',
        entity_id: assetId,
        action: 'asset_updated',
        user_id: userId,
        changes: {
          old_values: oldAsset.toObject(),
          new_values: updateData
        },
        timestamp: new Date()
      }], { session });
      
      await session.commitTransaction();
      
      logger.info('Asset updated successfully', {
        assetId,
        userId,
        changes: Object.keys(updateData)
      });
      
      return updatedAsset;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error updating asset', { error: error.message, assetId, userId });
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Delete asset with transaction support
   * @param {String} assetId - Asset ID
   * @param {String} userId - User ID deleting the asset
   * @returns {Promise<void>}
   */
  async deleteAsset(assetId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const asset = await Asset.findById(assetId).session(session);
      
      if (!asset) {
        throw new Error('Asset not found');
      }
      
      // Delete asset
      await Asset.findByIdAndDelete(assetId).session(session);
      
      // Create audit log
      await AuditLog.create([{
        entity_type: 'Asset',
        entity_id: assetId,
        action: 'asset_deleted',
        user_id: userId,
        changes: {
          old_values: asset.toObject()
        },
        timestamp: new Date()
      }], { session });
      
      await session.commitTransaction();
      
      logger.info('Asset deleted successfully', { assetId, userId });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error deleting asset', { error: error.message, assetId, userId });
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Get assets assigned to a specific user
   * @param {String} userId - User ID
   * @returns {Promise<Array>} User's assets
   */
  async getUserAssets(userId) {
    try {
      const assets = await Asset.find({ assigned_user: userId })
        .populate('assigned_user', 'name email department')
        .populate('last_audited_by', 'name email')
        .sort({ createdAt: -1 })
        .lean();
      
      return assets;
    } catch (error) {
      logger.error('Error fetching user assets', { error: error.message, userId });
      throw error;
    }
  }
  
  /**
   * Get asset statistics
   * @param {Object} user - Current user
   * @returns {Promise<Object>} Asset statistics
   */
  async getAssetStats(user) {
    try {
      let matchQuery = {};
      
      // Filter by department if not admin
      if (user.role !== 'ADMIN') {
        matchQuery.department = user.department;
      }
      
      const stats = await Asset.aggregate([
        { $match: matchQuery },
        {
          $facet: {
            totalAssets: [{ $count: 'count' }],
            activeAssets: [
              { $match: { status: 'Active' } },
              { $count: 'count' }
            ],
            underMaintenance: [
              { $match: { status: 'Under Maintenance' } },
              { $count: 'count' }
            ],
            totalValue: [
              { $group: { _id: null, total: { $sum: '$purchase_cost' } } }
            ],
            byStatus: [
              { $group: { _id: '$status', count: { $sum: 1 } } }
            ],
            byDepartment: [
              { $group: { _id: '$department', count: { $sum: 1 } } }
            ],
            byType: [
              { $group: { _id: '$asset_type', count: { $sum: 1 } } }
            ]
          }
        }
      ]);
      
      const result = stats[0];
      
      return {
        totalAssets: result.totalAssets[0]?.count || 0,
        activeAssets: result.activeAssets[0]?.count || 0,
        underMaintenance: result.underMaintenance[0]?.count || 0,
        totalValue: result.totalValue[0]?.total || 0,
        byStatus: result.byStatus,
        byDepartment: result.byDepartment,
        byType: result.byType
      };
    } catch (error) {
      logger.error('Error fetching asset stats', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AssetService();
