/**
 * Asset Service Layer
 * Handles all business logic related to assets
 * Separates business logic from controllers for better maintainability
 * ✅ MIGRATED TO SUPABASE
 */

const getSupabase = require('../config/db');
const logger = require('../utils/logger');

class AssetService {
  /**
   * Create a new asset with audit logging
   * @param {Object} assetData - Asset data
   * @param {String} userId - User ID creating the asset
   * @returns {Promise<Object>} Created asset
   */
  async createAsset(assetData, userId) {
    const supabase = getSupabase();
    
    try {
      // Auto-generate unique_asset_id if not provided
      if (!assetData.unique_asset_id) {
        const prefix = 'AST';
        const timestamp = Date.now().toString().slice(-8);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        assetData.unique_asset_id = `${prefix}-${timestamp}${random}`;
      }
      
      // Ensure timestamps are set
      const now = new Date().toISOString();
      assetData.created_at = now;
      assetData.updated_at = now;
      
      // Create asset
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .insert([assetData])
        .select()
        .single();
      
      if (assetError) {
        logger.error('Error creating asset', { error: assetError, assetData });
        throw assetError;
      }
      
      // Create audit log
      await supabase.from('audit_logs').insert([{
        entity_type: 'Asset',
        entity_id: asset.id,
        action: 'asset_created',
        user_id: userId,
        changes: {
          new_values: assetData
        },
        created_at: now
      }]);
      
      logger.info('Asset created successfully', {
        assetId: asset._id,
        userId,
        uniqueAssetId: asset.unique_asset_id
      });
      
      return asset;
    } catch (error) {
      logger.error('Error creating asset', { error: error.message, userId });
      throw error;
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
    const supabase = getSupabase();
    
    try {
      const { page = 1, limit = 50, sortBy = 'created_at', sortOrder = 'desc' } = pagination;
      const offset = (page - 1) * limit;
      
      // Validate limits
      if (limit > 100) {
        throw new Error('Limit cannot exceed 100 items per page');
      }
      
      // Start building query
      let query = supabase.from('assets').select(`
        *,
        assigned_user:users!assigned_user(id, name, email, department),
        last_audited_by:users!last_audited_by(id, name, email),
        vendor:vendors(id, name, contact_person, email)
      `, { count: 'exact' });
      
      // Filter by department if not admin
      if (user.role !== 'ADMIN') {
        query = query.eq('department', user.department);
      }
      
      // Apply additional filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.department && user.role === 'ADMIN') {
        query = query.eq('department', filters.department);
      }
      
      if (filters.asset_type) {
        query = query.eq('asset_type', filters.asset_type);
      }
      
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }
      
      // Text search across multiple fields
      if (filters.search) {
        query = query.or(`unique_asset_id.ilike.%${filters.search}%,manufacturer.ilike.%${filters.search}%,model.ilike.%${filters.search}%,serial_number.ilike.%${filters.search}%`);
      }
      
      // Date range filters
      if (filters.purchaseStartDate) {
        query = query.gte('purchase_date', filters.purchaseStartDate);
      }
      if (filters.purchaseEndDate) {
        query = query.lte('purchase_date', filters.purchaseEndDate);
      }
      
      // Cost range filters
      if (filters.minCost) {
        query = query.gte('purchase_cost', filters.minCost);
      }
      if (filters.maxCost) {
        query = query.lte('purchase_cost', filters.maxCost);
      }
      
      // Sorting
      const ascending = sortOrder === 'asc';
      query = query.order(sortBy, { ascending });
      
      // Apply pagination
      query = query.range(offset, offset + limit - 1);
      
      // Execute query
      const { data: assets, error, count } = await query;
      
      if (error) {
        logger.error('Error fetching assets', { error, filters });
        throw new Error(error.message || 'Failed to fetch assets');
      }
      
      return {
        data: assets || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit),
          hasNext: page < Math.ceil((count || 0) / limit),
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
    const supabase = getSupabase();
    
    try {
      // Fetch asset with related data
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select(`
          *,
          assigned_user:users!assigned_user(id, name, email, department, phone),
          last_audited_by:users!last_audited_by(id, name, email, department),
          vendor:vendors(id, name, contact_person, email, phone)
        `)
        .eq('id', assetId)
        .single();
      
      if (assetError) {
        if (assetError.code === 'PGRST116') {
          return null; // Asset not found
        }
        logger.error('Error fetching asset', { error: assetError, assetId });
        throw new Error(assetError.message || 'Failed to fetch asset');
      }
      
      // Fetch audit history
      const { data: auditHistory, error: auditError } = await supabase
        .from('audit_logs')
        .select(`
          id,
          action,
          changes,
          created_at,
          user:users(id, name, email)
        `)
        .eq('entity_id', assetId)
        .eq('entity_type', 'Asset')
        .in('action', ['quick_audit_completed', 'audit_scanned', 'asset_updated', 'audit_completed', 'asset_created'])
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (auditError) {
        logger.warn('Failed to fetch audit history', { error: auditError, assetId });
      }
      
      // Attach audit history to asset
      asset.audit_history = auditHistory || [];
      
      return asset;
    } catch (error) {
      logger.error('Error fetching asset by ID', { error: error.message, assetId });
      throw error;
    }
  }
  
  /**
   * Update asset with audit logging
   * @param {String} assetId - Asset ID
   * @param {Object} updateData - Update data
   * @param {String} userId - User ID making the update
   * @returns {Promise<Object>} Updated asset
   */
  async updateAsset(assetId, updateData, userId) {
    const supabase = getSupabase();
    
    try {
      // Get old asset data for audit log
      const { data: oldAsset, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();
      
      if (fetchError || !oldAsset) {
        throw new Error('Asset not found');
      }
      
      // Ensure updated_at is set
      updateData.updated_at = new Date().toISOString();
      
      // Update asset
      const { data: updatedAsset, error: updateError } = await supabase
        .from('assets')
        .update(updateData)
        .eq('id', assetId)
        .select()
        .single();
      
      if (updateError) {
        logger.error('Error updating asset', { error: updateError, assetId });
        throw new Error(updateError.message || 'Failed to update asset');
      }
      
      // Create audit log
      const { error: auditError } = await supabase.from('audit_logs').insert([{
        entity_type: 'Asset',
        entity_id: assetId,
        action: 'asset_updated',
        user_id: userId,
        changes: {
          old_values: oldAsset,
          new_values: updateData
        },
        created_at: new Date().toISOString()
      }]);
      
      if (auditError) {
        logger.warn('Failed to create audit log for asset update', { error: auditError });
      }
      
      logger.info('Asset updated successfully', {
        assetId,
        userId,
        changes: Object.keys(updateData)
      });
      
      return updatedAsset;
    } catch (error) {
      logger.error('Error updating asset', { error: error.message, assetId, userId });
      throw error;
    }
  }
  
  /**
   * Delete asset with audit logging
   * @param {String} assetId - Asset ID
   * @param {String} userId - User ID deleting the asset
   * @returns {Promise<void>}
   */
  async deleteAsset(assetId, userId) {
    const supabase = getSupabase();
    
    try {
      // Get asset data before deletion for audit log
      const { data: asset, error: fetchError } = await supabase
        .from('assets')
        .select('*')
        .eq('id', assetId)
        .single();
      
      if (fetchError || !asset) {
        throw new Error('Asset not found');
      }
      
      // Create audit log before deletion
      const { error: auditError } = await supabase.from('audit_logs').insert([{
        entity_type: 'Asset',
        entity_id: assetId,
        action: 'asset_deleted',
        user_id: userId,
        changes: {
          old_values: asset
        },
        created_at: new Date().toISOString()
      }]);
      
      if (auditError) {
        logger.warn('Failed to create audit log for asset deletion', { error: auditError });
      }
      
      // Delete asset
      const { error: deleteError } = await supabase
        .from('assets')
        .delete()
        .eq('id', assetId);
      
      if (deleteError) {
        logger.error('Error deleting asset', { error: deleteError, assetId });
        throw new Error(deleteError.message || 'Failed to delete asset');
      }
      
      logger.info('Asset deleted successfully', { assetId, userId });
    } catch (error) {
      logger.error('Error deleting asset', { error: error.message, assetId, userId });
      throw error;
    }
  }
  
  /**
   * Get assets assigned to a specific user
   * @param {String} userId - User ID
   * @returns {Promise<Array>} User's assets
   */
  async getUserAssets(userId) {
    const supabase = getSupabase();
    
    try {
      const { data: assets, error } = await supabase
        .from('assets')
        .select(`
          *,
          assigned_user:users!assigned_user(id, name, email, department),
          last_audited_by:users!last_audited_by(id, name, email)
        `)
        .eq('assigned_user', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        logger.error('Error fetching user assets', { error, userId });
        throw new Error(error.message || 'Failed to fetch user assets');
      }
      
      return assets || [];
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
    const supabase = getSupabase();
    
    try {
      // Build base query based on user role
      let baseQuery = supabase.from('assets').select('*', { count: 'exact', head: true });
      
      if (user.role !== 'ADMIN') {
        baseQuery = baseQuery.eq('department', user.department);
      }
      
      // Get total assets count
      const { count: totalAssets } = await baseQuery;
      
      // Get status counts
      const statusCounts = {};
      const statuses = ['Active', 'Under Maintenance', 'Available', 'Damaged', 'Ready for Scrap', 'Disposed'];
      
      for (const status of statuses) {
        let statusQuery = supabase.from('assets').select('*', { count: 'exact', head: true }).eq('status', status);
        if (user.role !== 'ADMIN') {
          statusQuery = statusQuery.eq('department', user.department);
        }
        const { count } = await statusQuery;
        statusCounts[status] = count || 0;
      }
      
      // Get total value (this requires fetching data, not just count)
      let valueQuery = supabase.from('assets').select('purchase_cost');
      if (user.role !== 'ADMIN') {
        valueQuery = valueQuery.eq('department', user.department);
      }
      const { data: assetsWithCost } = await valueQuery;
      const totalValue = (assetsWithCost || []).reduce((sum, asset) => sum + (asset.purchase_cost || 0), 0);
      
      // Get department distribution
      const { data: departmentData } = await supabase
        .from('assets')
        .select('department')
        .eq('department', user.role === 'ADMIN' ? undefined : user.department);
      
      const byDepartment = (departmentData || []).reduce((acc, item) => {
        acc[item.department] = (acc[item.department] || 0) + 1;
        return acc;
      }, {});
      
      // Get asset type distribution
      let typeQuery = supabase.from('assets').select('asset_type');
      if (user.role !== 'ADMIN') {
        typeQuery = typeQuery.eq('department', user.department);
      }
      const { data: typeData } = await typeQuery;
      
      const byType = (typeData || []).reduce((acc, item) => {
        acc[item.asset_type] = (acc[item.asset_type] || 0) + 1;
        return acc;
      }, {});
      
      return {
        totalAssets: totalAssets || 0,
        activeAssets: statusCounts['Active'] || 0,
        underMaintenance: statusCounts['Under Maintenance'] || 0,
        totalValue: totalValue,
        byStatus: Object.entries(statusCounts).map(([_id, count]) => ({ _id, count })),
        byDepartment: Object.entries(byDepartment).map(([_id, count]) => ({ _id, count })),
        byType: Object.entries(byType).map(([_id, count]) => ({ _id, count }))
      };
    } catch (error) {
      logger.error('Error fetching asset stats', { error: error.message });
      throw error;
    }
  }
}

module.exports = new AssetService();
