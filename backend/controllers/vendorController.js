const vendorService = require('../services/vendorService');
const logger = require('../utils/logger');

/**
 * Get all vendors with filters and pagination
 */
exports.getVendors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, status, category } = req.query;
    
    const filters = {};
    if (search) {
      filters.search = search;
    }
    if (status) {
      filters.status = status;
    }
    if (category) {
      filters.category = category;
    }
    
    const result = await vendorService.getVendors(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.status(200).json({
      success: true,
      data: result.vendors,
      pagination: result.pagination
    });
  } catch (error) {
    logger.error('Error fetching vendors:', error);
    next(error);
  }
};

/**
 * Get single vendor by ID
 */
exports.getVendorById = async (req, res, next) => {
  try {
    const vendor = await vendorService.getVendorById(req.params.id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    logger.error('Error fetching vendor:', error);
    next(error);
  }
};

/**
 * Create new vendor
 */
exports.createVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.createVendor(req.body, req.user._id);
    
    res.status(201).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    logger.error('Error creating vendor:', error);
    next(error);
  }
};

/**
 * Update vendor
 */
exports.updateVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.updateVendor(
      req.params.id,
      req.body,
      req.user._id
    );
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vendor
    });
  } catch (error) {
    logger.error('Error updating vendor:', error);
    next(error);
  }
};

/**
 * Delete vendor (soft delete)
 */
exports.deleteVendor = async (req, res, next) => {
  try {
    const vendor = await vendorService.deleteVendor(req.params.id, req.user._id);
    
    if (!vendor) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully',
      data: vendor
    });
  } catch (error) {
    logger.error('Error deleting vendor:', error);
    next(error);
  }
};

/**
 * Get vendor statistics
 */
exports.getVendorStats = async (req, res, next) => {
  try {
    const stats = await vendorService.getVendorStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error fetching vendor stats:', error);
    next(error);
  }
};

/**
 * Get vendor performance metrics
 */
exports.getVendorPerformance = async (req, res, next) => {
  try {
    const performance = await vendorService.getVendorPerformance(req.params.id);
    
    if (!performance) {
      return res.status(404).json({
        success: false,
        error: 'Vendor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: performance
    });
  } catch (error) {
    logger.error('Error fetching vendor performance:', error);
    next(error);
  }
};
