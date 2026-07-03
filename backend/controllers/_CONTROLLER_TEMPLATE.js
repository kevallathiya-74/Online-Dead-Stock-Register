/**
 * 📋 CONTROLLER IMPLEMENTATION RULES (MANDATORY)
 * ========================================
 * ✅ ALL CONTROLLERS MUST FOLLOW THESE RULES
 * ❌ NO EXCEPTIONS ALLOWED
 *
 * 1. IMPORT REQUIRED UTILITIES:
 *    const { ApiResponse, asyncHandler, AppError } = require('../utils/responseHandler');
 *
 * 2. WRAP ALL ASYNC FUNCTIONS WITH asyncHandler:
 *    exports.myFunction = asyncHandler(async (req, res) => { ... });
 *
 * 3. USE ApiResponse FOR ALL RESPONSES:
 *    - ApiResponse.success(res, data, 'Optional message')
 *    - ApiResponse.created(res, data, 'Optional message')
 *    - ApiResponse.deleted(res, 'Optional message')
 *    - ApiResponse.badRequest(res, 'Error message')
 *    - ApiResponse.unauthorized(res, 'Error message')
 *    - ApiResponse.forbidden(res, 'Error message')
 *    - ApiResponse.notFound(res, 'Error message')
 *    - ApiResponse.conflict(res, 'Error message')
 *
 * 4. THROW AppError FOR ERRORS (DON'T RETURN res.status):
 *    throw new AppError('User-friendly message', statusCode);
 *
 * 5. NO TRY-CATCH BLOCKS NEEDED:
 *    asyncHandler automatically catches errors
 *
 * 6. NEVER USE THESE (FORBIDDEN):
 *    ❌ try { ... } catch (error) { res.status(500).json(...) }
 *    ❌ res.status(500).json({ success: false, ... })
 *    ❌ Manual error handling in controllers
 *
 * 7. ERROR MESSAGES MUST BE:
 *    ✅ User-friendly
 *    ✅ Clear and actionable
 *    ❌ Never expose internal details
 *    ❌ Never show stack traces to users
 *
 * 8. VALIDATION:
 *    - Use validation middleware in routes
 *    - Throw AppError for business logic validation
 *
 * ========================================
 * BEFORE (❌ WRONG):
 * ========================================
 * exports.getUser = async (req, res) => {
 *   try {
 *     const user = await User.findById(req.params.id);
 *     if (!user) {
 *       return res.status(404).json({ success: false, message: 'User not found' });
 *     }
 *     res.status(200).json({ success: true, data: user });
 *   } catch (error) {
 *     res.status(500).json({ success: false, message: error.message });
 *   }
 * };
 *
 * ========================================
 * AFTER (✅ CORRECT):
 * ========================================
 * const { ApiResponse, asyncHandler, AppError } = require('../utils/responseHandler');
 *
 * exports.getUser = asyncHandler(async (req, res) => {
 *   const user = await User.findById(req.params.id);
 *
 *   if (!user) {
 *     throw new AppError('User not found', 404);
 *   }
 *
 *   ApiResponse.success(res, user);
 * });
 *
 * ========================================
 * EXAMPLE: Complete REST Controller
 * ========================================
 */

const {
  ApiResponse,
  asyncHandler,
  AppError,
} = require("../utils/responseHandler");
const ExampleModel = require("../models/exampleModel");

// ✅ GET ALL (with pagination & filtering)
exports.getAll = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;

  // Build query
  const query = {};
  if (status) query.status = status;
  if (search) query.name = { $regex: search, $options: "i" };

  // Execute query with pagination
  const items = await ExampleModel.find(query)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))
    .sort({ createdAt: -1 });

  const total = await ExampleModel.countDocuments(query);

  ApiResponse.success(res, {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ✅ GET ONE
exports.getOne = asyncHandler(async (req, res) => {
  const item = await ExampleModel.findById(req.params.id);

  if (!item) {
    throw new AppError("Resource not found", 404);
  }

  ApiResponse.success(res, item);
});

// ✅ CREATE
exports.create = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  // Business logic validation
  const existing = await ExampleModel.findOne({ name });
  if (existing) {
    throw new AppError("Resource with this name already exists", 409);
  }

  // Create resource
  const item = await ExampleModel.create({
    name,
    description,
    created_by: req.user.id,
  });

  ApiResponse.created(res, item, "Resource created successfully");
});

// ✅ UPDATE
exports.update = asyncHandler(async (req, res) => {
  const { name, description, status } = req.body;

  const item = await ExampleModel.findById(req.params.id);

  if (!item) {
    throw new AppError("Resource not found", 404);
  }

  // Check permissions
  if (item.created_by.toString() !== req.user.id && req.user.role !== "ADMIN") {
    throw new AppError(
      "You do not have permission to update this resource",
      403,
    );
  }

  // Update fields
  if (name) item.name = name;
  if (description) item.description = description;
  if (status) item.status = status;
  item.updated_by = req.user.id;

  await item.save();

  ApiResponse.success(res, item, "Resource updated successfully");
});

// ✅ DELETE
exports.delete = asyncHandler(async (req, res) => {
  const item = await ExampleModel.findById(req.params.id);

  if (!item) {
    throw new AppError("Resource not found", 404);
  }

  // Check permissions
  if (req.user.role !== "ADMIN") {
    throw new AppError("Only administrators can delete resources", 403);
  }

  await item.deleteOne();

  ApiResponse.deleted(res, "Resource deleted successfully");
});

// ✅ CUSTOM ACTION
exports.customAction = asyncHandler(async (req, res) => {
  const { action } = req.body;

  // Validate input
  if (!["approve", "reject"].includes(action)) {
    throw new AppError('Invalid action. Must be "approve" or "reject"', 400);
  }

  const item = await ExampleModel.findById(req.params.id);

  if (!item) {
    throw new AppError("Resource not found", 404);
  }

  // Business logic
  if (item.status === "completed") {
    throw new AppError("Cannot modify completed resources", 400);
  }

  item.status = action === "approve" ? "approved" : "rejected";
  item.processed_by = req.user.id;
  item.processed_at = new Date();

  await item.save();

  ApiResponse.success(res, item, `Resource ${action}d successfully`);
});

/**
 * ========================================
 * SUMMARY OF BENEFITS:
 * ========================================
 * ✅ No duplicate try-catch blocks
 * ✅ Consistent error handling across all controllers
 * ✅ User-friendly error messages
 * ✅ Proper HTTP status codes
 * ✅ Centralized logging
 * ✅ Cleaner, more readable code
 * ✅ Easier to maintain and test
 * ✅ Follows rules.md perfectly
 * ========================================
 */

module.exports = {
  getAll: exports.getAll,
  getOne: exports.getOne,
  create: exports.create,
  update: exports.update,
  delete: exports.delete,
  customAction: exports.customAction,
};
