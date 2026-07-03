const logger = require("./logger");

/**
 * Generic CRUD handler utility to reduce code duplication across controllers
 * Provides common patterns for pagination, filtering, sorting, and error handling
 */

/**
 * Create a generic paginated list handler
 * @param {Object} Model - Mongoose model to query
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
exports.createPaginatedListHandler = (Model, options = {}) => {
  return async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sort_by = options.defaultSortBy || "createdAt",
        sort_order = "asc",
      } = req.query;

      const skip = (page - 1) * limit;

      // Build filter object
      let filter = {};

      // Apply custom filter builder if provided
      if (options.buildFilter) {
        filter = options.buildFilter(req.query);
      } else {
        // Default filter logic
        Object.keys(req.query).forEach((key) => {
          if (
            !["page", "limit", "search", "sort_by", "sort_order"].includes(key)
          ) {
            if (options.filterFields && options.filterFields.includes(key)) {
              filter[key] = req.query[key];
            }
          }
        });
      }

      // Apply search if search fields are configured
      if (search && options.searchFields && options.searchFields.length > 0) {
        filter.$or = options.searchFields.map((field) => ({
          [field]: { $regex: search, $options: "i" },
        }));
      }

      // Build sort object
      const sortOrder = sort_order === "desc" ? -1 : 1;
      const sortObj = { [sort_by]: sortOrder };

      // Execute query with population if specified
      let query = Model.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit));

      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach((pop) => {
            query = query.populate(pop);
          });
        } else {
          query = query.populate(options.populate);
        }
      }

      if (options.select) {
        query = query.select(options.select);
      }

      const items = await query;
      const total = await Model.countDocuments(filter);

      const response = {
        success: true,
        data: items,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_items: total,
          items_per_page: parseInt(limit),
          has_next: page * limit < total,
          has_prev: page > 1,
        },
      };

      // Use custom response formatter if provided
      if (options.formatResponse) {
        return res.json(options.formatResponse(response));
      }

      res.json(response);
    } catch (error) {
      logger.error(
        `Error in paginated list handler for ${Model.modelName}:`,
        error,
      );
      if (next) {
        next(error);
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to fetch ${Model.modelName.toLowerCase()}s`,
        });
      }
    }
  };
};

/**
 * Create a generic get-by-id handler
 * @param {Object} Model - Mongoose model to query
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
exports.createGetByIdHandler = (Model, options = {}) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;

      let query = Model.findById(id);

      if (options.populate) {
        if (Array.isArray(options.populate)) {
          options.populate.forEach((pop) => {
            query = query.populate(pop);
          });
        } else {
          query = query.populate(options.populate);
        }
      }

      if (options.select) {
        query = query.select(options.select);
      }

      const item = await query;

      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${Model.modelName} not found`,
        });
      }

      // Apply custom data transformer if provided
      const data = options.transformData ? options.transformData(item) : item;

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      logger.error(`Error fetching ${Model.modelName} by id:`, error);
      if (next) {
        next(error);
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to fetch ${Model.modelName.toLowerCase()}`,
        });
      }
    }
  };
};

/**
 * Create a generic create handler
 * @param {Object} Model - Mongoose model to create
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
exports.createCreateHandler = (Model, options = {}) => {
  return async (req, res, next) => {
    try {
      const data = options.transformInput
        ? options.transformInput(req.body, req)
        : req.body;

      // Check for duplicates if configured
      if (options.checkDuplicate) {
        const exists = await options.checkDuplicate(data, Model);
        if (exists) {
          return res.status(400).json({
            success: false,
            message:
              options.duplicateMessage || `${Model.modelName} already exists`,
          });
        }
      }

      const item = new Model(data);
      await item.save();

      // Run post-create hook if provided
      if (options.afterCreate) {
        await options.afterCreate(item, req);
      }

      res.status(201).json({
        success: true,
        message:
          options.successMessage || `${Model.modelName} created successfully`,
        data: item,
      });
    } catch (error) {
      logger.error(`Error creating ${Model.modelName}:`, error);

      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: options.duplicateKeyMessage || "Duplicate entry detected",
        });
      }

      if (next) {
        next(error);
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to create ${Model.modelName.toLowerCase()}`,
        });
      }
    }
  };
};

/**
 * Create a generic update handler
 * @param {Object} Model - Mongoose model to update
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
exports.createUpdateHandler = (Model, options = {}) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = options.transformInput
        ? options.transformInput(req.body, req)
        : req.body;

      // Check if item exists
      const item = await Model.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${Model.modelName} not found`,
        });
      }

      // Run pre-update validation if provided
      if (options.beforeUpdate) {
        const validation = await options.beforeUpdate(item, updateData, req);
        if (validation && !validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.message,
          });
        }
      }

      const updatedItem = await Model.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      // Run post-update hook if provided
      if (options.afterUpdate) {
        await options.afterUpdate(updatedItem, item, req);
      }

      res.json({
        success: true,
        message:
          options.successMessage || `${Model.modelName} updated successfully`,
        data: updatedItem,
      });
    } catch (error) {
      logger.error(`Error updating ${Model.modelName}:`, error);
      if (next) {
        next(error);
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to update ${Model.modelName.toLowerCase()}`,
        });
      }
    }
  };
};

/**
 * Create a generic delete handler (supports soft delete)
 * @param {Object} Model - Mongoose model to delete
 * @param {Object} options - Configuration options
 * @returns {Function} Express middleware function
 */
exports.createDeleteHandler = (Model, options = {}) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;

      const item = await Model.findById(id);
      if (!item) {
        return res.status(404).json({
          success: false,
          message: `${Model.modelName} not found`,
        });
      }

      // Run pre-delete validation if provided
      if (options.beforeDelete) {
        const validation = await options.beforeDelete(item, req);
        if (validation && !validation.valid) {
          return res.status(400).json({
            success: false,
            message: validation.message,
          });
        }
      }

      let deletedItem;
      if (options.softDelete) {
        // Soft delete: set is_active to false
        item[options.softDeleteField || "is_active"] = false;
        if (options.softDeleteTimestampField) {
          item[options.softDeleteTimestampField] = new Date();
        }
        deletedItem = await item.save();
      } else {
        // Hard delete
        deletedItem = await Model.findByIdAndDelete(id);
      }

      // Run post-delete hook if provided
      if (options.afterDelete) {
        await options.afterDelete(deletedItem, req);
      }

      res.json({
        success: true,
        message:
          options.successMessage || `${Model.modelName} deleted successfully`,
        data: deletedItem,
      });
    } catch (error) {
      logger.error(`Error deleting ${Model.modelName}:`, error);
      if (next) {
        next(error);
      } else {
        res.status(500).json({
          success: false,
          message: `Failed to delete ${Model.modelName.toLowerCase()}`,
        });
      }
    }
  };
};

/**
 * Wrapper to create audit log (commonly used across controllers)
 * @param {Object} AuditLog - AuditLog model
 * @param {Object} data - Audit log data
 */
exports.createAuditLog = async (AuditLog, data) => {
  try {
    const auditLog = new AuditLog({
      action: data.action,
      performed_by: data.performed_by,
      details: data.details,
      timestamp: new Date(),
    });
    await auditLog.save();
    return auditLog;
  } catch (error) {
    logger.error("Error creating audit log:", error);
    // Don't throw error - audit log failure shouldn't break main operation
  }
};
