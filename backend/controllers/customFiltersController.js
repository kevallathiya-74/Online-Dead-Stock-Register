const Asset = require('../models/asset');
const User = require('../models/user');
const SavedFilter = require('../models/savedFilter');
const AuditLog = require('../models/auditLog');

/**
 * Custom Filters Controller
 * Handles advanced filtering with dynamic query building, saved filters, and presets
 */

// Build MongoDB query from filter configuration
const buildQuery = (filterConfig) => {
  const query = {};

  // Status filters
  if (filterConfig.status && filterConfig.status.length > 0) {
    query.status = { $in: filterConfig.status };
  }

  // Condition filters
  if (filterConfig.condition && filterConfig.condition.length > 0) {
    query.condition = { $in: filterConfig.condition };
  }

  // Location filters
  if (filterConfig.location) {
    if (typeof filterConfig.location === 'string') {
      query.location = new RegExp(filterConfig.location, 'i');
    } else if (Array.isArray(filterConfig.location)) {
      query.location = { $in: filterConfig.location };
    }
  }

  // Department filters
  if (filterConfig.department && filterConfig.department.length > 0) {
    query.department = { $in: filterConfig.department };
  }

  // Category filters
  if (filterConfig.category && filterConfig.category.length > 0) {
    query.category = { $in: filterConfig.category };
  }

  // Date range filters
  if (filterConfig.purchase_date_from || filterConfig.purchase_date_to) {
    query.purchase_date = {};
    if (filterConfig.purchase_date_from) {
      query.purchase_date.$gte = new Date(filterConfig.purchase_date_from);
    }
    if (filterConfig.purchase_date_to) {
      query.purchase_date.$lte = new Date(filterConfig.purchase_date_to);
    }
  }

  // Warranty expiry filters
  if (filterConfig.warranty_expiry_from || filterConfig.warranty_expiry_to) {
    query.warranty_expiry = {};
    if (filterConfig.warranty_expiry_from) {
      query.warranty_expiry.$gte = new Date(filterConfig.warranty_expiry_from);
    }
    if (filterConfig.warranty_expiry_to) {
      query.warranty_expiry.$lte = new Date(filterConfig.warranty_expiry_to);
    }
  }

  // Last audit date filters
  if (filterConfig.last_audit_date_from || filterConfig.last_audit_date_to) {
    query.last_audit_date = {};
    if (filterConfig.last_audit_date_from) {
      query.last_audit_date.$gte = new Date(filterConfig.last_audit_date_from);
    }
    if (filterConfig.last_audit_date_to) {
      query.last_audit_date.$lte = new Date(filterConfig.last_audit_date_to);
    }
  }

  // Price range filters
  if (filterConfig.purchase_cost_min !== undefined || filterConfig.purchase_cost_max !== undefined) {
    query.purchase_cost = {};
    if (filterConfig.purchase_cost_min !== undefined) {
      query.purchase_cost.$gte = parseFloat(filterConfig.purchase_cost_min);
    }
    if (filterConfig.purchase_cost_max !== undefined) {
      query.purchase_cost.$lte = parseFloat(filterConfig.purchase_cost_max);
    }
  }

  // Assigned user filters
  if (filterConfig.assigned_user) {
    if (filterConfig.assigned_user === 'unassigned') {
      query.assigned_user = null;
    } else if (filterConfig.assigned_user === 'assigned') {
      query.assigned_user = { $ne: null };
    } else {
      query.assigned_user = filterConfig.assigned_user;
    }
  }

  // Vendor filters
  if (filterConfig.vendor) {
    query.vendor = filterConfig.vendor;
  }

  // Manufacturer filters
  if (filterConfig.manufacturer) {
    query.manufacturer = new RegExp(filterConfig.manufacturer, 'i');
  }

  // Model filters
  if (filterConfig.model) {
    query.model = new RegExp(filterConfig.model, 'i');
  }

  // Serial number filters
  if (filterConfig.serial_number) {
    query.serial_number = new RegExp(filterConfig.serial_number, 'i');
  }

  // Text search filters (searches multiple fields)
  if (filterConfig.search_text) {
    const searchRegex = new RegExp(filterConfig.search_text, 'i');
    query.$or = [
      { name: searchRegex },
      { unique_asset_id: searchRegex },
      { serial_number: searchRegex },
      { manufacturer: searchRegex },
      { model: searchRegex },
      { description: searchRegex }
    ];
  }

  // Maintenance status filters
  if (filterConfig.maintenance_status) {
    query.maintenance_status = filterConfig.maintenance_status;
  }

  // Has images filter
  if (filterConfig.has_images !== undefined) {
    if (filterConfig.has_images) {
      query['images.0'] = { $exists: true };
    } else {
      query.$or = [
        { images: { $exists: false } },
        { images: { $size: 0 } }
      ];
    }
  }

  // Expired warranty filter
  if (filterConfig.warranty_expired !== undefined) {
    if (filterConfig.warranty_expired) {
      query.warranty_expiry = { $lt: new Date() };
    } else {
      query.warranty_expiry = { $gte: new Date() };
    }
  }

  // Audit overdue filter (not audited in X days)
  if (filterConfig.audit_overdue_days) {
    const overdueDate = new Date();
    overdueDate.setDate(overdueDate.getDate() - parseInt(filterConfig.audit_overdue_days));
    query.$or = [
      { last_audit_date: { $lt: overdueDate } },
      { last_audit_date: null }
    ];
  }

  // Custom field filters (flexible key-value pairs)
  if (filterConfig.custom_fields && typeof filterConfig.custom_fields === 'object') {
    Object.keys(filterConfig.custom_fields).forEach(key => {
      query[key] = filterConfig.custom_fields[key];
    });
  }

  return query;
};

// Apply filters to assets
exports.filterAssets = async (req, res) => {
  try {
    const filterConfig = req.body;
    const { 
      page = 1, 
      limit = 50, 
      sort_by = 'created_at', 
      sort_order = 'desc',
      include_count = true
    } = req.query;

    const skip = (page - 1) * limit;

    // Build query from filter configuration
    const query = buildQuery(filterConfig);

    // Count total (if requested)
    let total = 0;
    if (include_count === 'true') {
      total = await Asset.countDocuments(query);
    }

    // Build sort object
    const sort = {};
    sort[sort_by] = sort_order === 'asc' ? 1 : -1;

    // Execute query
    const assets = await Asset.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('assigned_user', 'name email department')
      .populate('vendor', 'vendor_name email');

    res.json({
      success: true,
      assets,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: include_count === 'true' ? Math.ceil(total / limit) : null
      },
      filter_applied: Object.keys(query).length > 0,
      query_summary: {
        filters_count: Object.keys(query).length,
        results_count: assets.length
      }
    });
  } catch (error) {
    console.error('Error filtering assets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to filter assets',
      error: error.message
    });
  }
};

// Save filter configuration
exports.saveFilter = async (req, res) => {
  try {
    const { name, description, filter_config, is_public = false, category = 'custom' } = req.body;

    if (!name || !filter_config) {
      return res.status(400).json({
        success: false,
        message: 'Name and filter configuration are required'
      });
    }

    // Check if filter name already exists for this user
    const existingFilter = await SavedFilter.findOne({
      name,
      created_by: req.user.id
    });

    if (existingFilter) {
      return res.status(400).json({
        success: false,
        message: 'A filter with this name already exists'
      });
    }

    const savedFilter = new SavedFilter({
      name,
      description,
      filter_config,
      is_public,
      category,
      created_by: req.user.id,
      created_at: new Date(),
      updated_at: new Date()
    });

    await savedFilter.save();

    // Log filter creation
    await AuditLog.create({
      action: 'filter_created',
      performed_by: req.user.id,
      details: {
        filter_id: savedFilter._id,
        filter_name: name,
        is_public,
        category
      },
      timestamp: new Date()
    });

    res.status(201).json({
      success: true,
      message: 'Filter saved successfully',
      filter: {
        id: savedFilter._id,
        name: savedFilter.name,
        description: savedFilter.description,
        category: savedFilter.category,
        is_public: savedFilter.is_public,
        created_at: savedFilter.created_at
      }
    });
  } catch (error) {
    console.error('Error saving filter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save filter',
      error: error.message
    });
  }
};

// Get saved filters
exports.getSavedFilters = async (req, res) => {
  try {
    const { category, include_public = true } = req.query;

    let query = {
      $or: [
        { created_by: req.user.id }
      ]
    };

    // Include public filters if requested
    if (include_public === 'true') {
      query.$or.push({ is_public: true });
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    const filters = await SavedFilter.find(query)
      .populate('created_by', 'name email')
      .sort({ usage_count: -1, updated_at: -1 });

    res.json({
      success: true,
      filters: filters.map(f => ({
        id: f._id,
        name: f.name,
        description: f.description,
        category: f.category,
        filter_config: f.filter_config,
        is_public: f.is_public,
        is_preset: f.is_preset,
        created_by: {
          id: f.created_by._id,
          name: f.created_by.name
        },
        created_at: f.created_at,
        updated_at: f.updated_at,
        usage_count: f.usage_count,
        last_used_at: f.last_used_at,
        is_owner: f.created_by._id.toString() === req.user.id
      }))
    });
  } catch (error) {
    console.error('Error fetching saved filters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filters',
      error: error.message
    });
  }
};

// Get filter by ID
exports.getFilterById = async (req, res) => {
  try {
    const { filter_id } = req.params;

    const filter = await SavedFilter.findById(filter_id)
      .populate('created_by', 'name email');

    if (!filter) {
      return res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
    }

    // Check access (owner or public filter)
    if (filter.created_by._id.toString() !== req.user.id && !filter.is_public) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this filter'
      });
    }

    // Update usage stats
    filter.usage_count += 1;
    filter.last_used_at = new Date();
    await filter.save();

    res.json({
      success: true,
      filter: {
        id: filter._id,
        name: filter.name,
        description: filter.description,
        category: filter.category,
        filter_config: filter.filter_config,
        is_public: filter.is_public,
        is_preset: filter.is_preset,
        created_by: {
          id: filter.created_by._id,
          name: filter.created_by.name
        },
        created_at: filter.created_at,
        updated_at: filter.updated_at,
        usage_count: filter.usage_count,
        last_used_at: filter.last_used_at,
        is_owner: filter.created_by._id.toString() === req.user.id
      }
    });
  } catch (error) {
    console.error('Error fetching filter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter',
      error: error.message
    });
  }
};

// Update saved filter
exports.updateFilter = async (req, res) => {
  try {
    const { filter_id } = req.params;
    const { name, description, filter_config, is_public, category } = req.body;

    const filter = await SavedFilter.findById(filter_id);

    if (!filter) {
      return res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
    }

    // Check ownership
    if (filter.created_by.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own filters'
      });
    }

    // Update fields
    if (name) filter.name = name;
    if (description !== undefined) filter.description = description;
    if (filter_config) filter.filter_config = filter_config;
    if (is_public !== undefined) filter.is_public = is_public;
    if (category) filter.category = category;
    filter.updated_at = new Date();

    await filter.save();

    // Log update
    await AuditLog.create({
      action: 'filter_updated',
      performed_by: req.user.id,
      details: {
        filter_id: filter._id,
        filter_name: name
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Filter updated successfully',
      filter: {
        id: filter._id,
        name: filter.name,
        description: filter.description,
        category: filter.category,
        is_public: filter.is_public,
        updated_at: filter.updated_at
      }
    });
  } catch (error) {
    console.error('Error updating filter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update filter',
      error: error.message
    });
  }
};

// Delete saved filter
exports.deleteFilter = async (req, res) => {
  try {
    const { filter_id } = req.params;

    const filter = await SavedFilter.findById(filter_id);

    if (!filter) {
      return res.status(404).json({
        success: false,
        message: 'Filter not found'
      });
    }

    // Check ownership (admin can delete any filter)
    if (filter.created_by.toString() !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own filters'
      });
    }

    // Prevent deletion of preset filters
    if (filter.is_preset && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Preset filters cannot be deleted'
      });
    }

    await SavedFilter.findByIdAndDelete(filter_id);

    // Log deletion
    await AuditLog.create({
      action: 'filter_deleted',
      performed_by: req.user.id,
      details: {
        filter_id,
        filter_name: filter.name
      },
      timestamp: new Date()
    });

    res.json({
      success: true,
      message: 'Filter deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting filter:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete filter',
      error: error.message
    });
  }
};

// Get filter presets
exports.getFilterPresets = async (req, res) => {
  try {
    const presets = [
      {
        id: 'active-assets',
        name: 'Active Assets',
        description: 'All assets with active status',
        category: 'status',
        filter_config: { status: ['Active'] },
        is_preset: true
      },
      {
        id: 'unassigned-assets',
        name: 'Unassigned Assets',
        description: 'Assets not assigned to any user',
        category: 'user',
        filter_config: { assigned_user: 'unassigned' },
        is_preset: true
      },
      {
        id: 'maintenance-due',
        name: 'Maintenance Due',
        description: 'Assets requiring maintenance',
        category: 'maintenance',
        filter_config: { maintenance_status: 'Scheduled' },
        is_preset: true
      },
      {
        id: 'warranty-expiring',
        name: 'Warranty Expiring Soon',
        description: 'Assets with warranty expiring in 30 days',
        category: 'date',
        filter_config: {
          warranty_expiry_from: new Date().toISOString(),
          warranty_expiry_to: new Date(Date.now() + 30*24*60*60*1000).toISOString()
        },
        is_preset: true
      },
      {
        id: 'poor-condition',
        name: 'Poor Condition Assets',
        description: 'Assets in poor or non-functional condition',
        category: 'condition',
        filter_config: { condition: ['Poor', 'Non-functional'] },
        is_preset: true
      },
      {
        id: 'audit-overdue',
        name: 'Audit Overdue',
        description: 'Assets not audited in 90 days',
        category: 'date',
        filter_config: { audit_overdue_days: 90 },
        is_preset: true
      },
      {
        id: 'high-value',
        name: 'High Value Assets',
        description: 'Assets with purchase cost over ₹10,00,000',
        category: 'financial',
        filter_config: { purchase_cost_min: 1000000 },
        is_preset: true
      },
      {
        id: 'missing-images',
        name: 'Missing Images',
        description: 'Assets without any photos',
        category: 'custom',
        filter_config: { has_images: false },
        is_preset: true
      }
    ];

    res.json({
      success: true,
      presets
    });
  } catch (error) {
    console.error('Error fetching filter presets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter presets',
      error: error.message
    });
  }
};

// Get available filter fields
exports.getFilterFields = async (req, res) => {
  try {
    const fields = {
      basic: [
        { name: 'status', type: 'select', options: ['Active', 'Inactive', 'Under Maintenance', 'Damaged', 'Disposed', 'Lost'] },
        { name: 'condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor', 'Non-functional'] },
        { name: 'category', type: 'select', options: ['Electronics', 'Furniture', 'Vehicles', 'Machinery', 'IT Equipment', 'Office Supplies', 'Other'] },
        { name: 'department', type: 'select', options: ['IT', 'HR', 'Finance', 'Operations', 'Inventory', 'Admin'] }
      ],
      location: [
        { name: 'location', type: 'text' }
      ],
      dates: [
        { name: 'purchase_date', type: 'date_range' },
        { name: 'warranty_expiry', type: 'date_range' },
        { name: 'last_audit_date', type: 'date_range' }
      ],
      financial: [
        { name: 'purchase_cost', type: 'number_range' }
      ],
      assignment: [
        { name: 'assigned_user', type: 'select', special: ['unassigned', 'assigned'] }
      ],
      details: [
        { name: 'manufacturer', type: 'text' },
        { name: 'model', type: 'text' },
        { name: 'serial_number', type: 'text' },
        { name: 'vendor', type: 'reference' }
      ],
      advanced: [
        { name: 'search_text', type: 'text', description: 'Search across multiple fields' },
        { name: 'has_images', type: 'boolean' },
        { name: 'warranty_expired', type: 'boolean' },
        { name: 'audit_overdue_days', type: 'number' },
        { name: 'maintenance_status', type: 'select', options: ['None', 'Scheduled', 'In Progress', 'Completed', 'Overdue'] }
      ]
    };

    res.json({
      success: true,
      fields
    });
  } catch (error) {
    console.error('Error fetching filter fields:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter fields',
      error: error.message
    });
  }
};

module.exports = exports;
