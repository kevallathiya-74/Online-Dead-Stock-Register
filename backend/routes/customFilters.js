const express = require('express');
const router = express.Router();
const filterController = require('../controllers/customFiltersController');
const { authMiddleware, requireRole } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   POST /api/filters/apply
 * @desc    Apply custom filter to assets
 * @access  All authenticated users
 */
router.post('/apply', filterController.filterAssets);

/**
 * @route   POST /api/filters/save
 * @desc    Save filter configuration
 * @access  All authenticated users
 */
router.post('/save', filterController.saveFilter);

/**
 * @route   GET /api/filters/my-filters
 * @desc    Get user's saved filters
 * @access  All authenticated users
 */
router.get('/my-filters', filterController.getSavedFilters);

/**
 * @route   GET /api/filters/presets
 * @desc    Get predefined filter presets
 * @access  All authenticated users
 */
router.get('/presets', filterController.getFilterPresets);

/**
 * @route   GET /api/filters/fields
 * @desc    Get available filter fields and their types
 * @access  All authenticated users
 */
router.get('/fields', filterController.getFilterFields);

/**
 * @route   GET /api/filters/:filter_id
 * @desc    Get filter by ID
 * @access  All authenticated users (own filters or public)
 */
router.get('/:filter_id', filterController.getFilterById);

/**
 * @route   PUT /api/filters/:filter_id
 * @desc    Update saved filter
 * @access  Filter owner only
 */
router.put('/:filter_id', filterController.updateFilter);

/**
 * @route   DELETE /api/filters/:filter_id
 * @desc    Delete saved filter
 * @access  Filter owner or ADMIN
 */
router.delete('/:filter_id', filterController.deleteFilter);

module.exports = router;
