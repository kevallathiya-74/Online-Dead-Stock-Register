/**
 * User Service Layer
 * Handles all business logic related to users
 */

const User = require('../models/user');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const AuditLog = require('../models/auditLog');

class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {String} createdBy - ID of user creating this user
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, createdBy) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email }).session(session);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }
      
      // Hash password
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      }
      
      // Generate employee_id if not provided
      if (!userData.employee_id) {
        userData.employee_id = `EMP-${Date.now()}`;
      }
      
      // Create user
      const user = new User(userData);
      await user.save({ session });
      
      // Create audit log
      await AuditLog.create([{
        entity_type: 'User',
        entity_id: user._id,
        action: 'user_created',
        user_id: createdBy,
        changes: {
          new_values: {
            email: userData.email,
            name: userData.name,
            role: userData.role,
            department: userData.department
          }
        },
        timestamp: new Date()
      }], { session });
      
      await session.commitTransaction();
      
      logger.info('User created successfully', {
        userId: user._id,
        email: user.email,
        createdBy
      });
      
      // Return user without password
      const userObj = user.toObject();
      delete userObj.password;
      return userObj;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error creating user', { error: error.message, createdBy });
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Get users with filters and pagination
   * @param {Object} filters - Filter criteria
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Users and pagination info
   */
  async getUsers(filters = {}, pagination = {}) {
    try {
      const { page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;
      
      let query = {};
      
      // Apply filters
      if (filters.role) {
        query.role = filters.role;
      }
      
      if (filters.department) {
        query.department = filters.department;
      }
      
      if (filters.is_active !== undefined) {
        query.is_active = filters.is_active;
      }
      
      // Text search
      if (filters.search) {
        const searchRegex = { $regex: filters.search, $options: 'i' };
        query.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { employee_id: searchRegex }
        ];
      }
      
      // Sorting
      const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
      
      // Execute query
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password')
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        User.countDocuments(query)
      ]);
      
      return {
        data: users,
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
      logger.error('Error fetching users', { error: error.message });
      throw error;
    }
  }
  
  /**
   * Get user by ID
   * @param {String} userId - User ID
   * @returns {Promise<Object>} User
   */
  async getUserById(userId) {
    try {
      const user = await User.findById(userId).select('-password').lean();
      
      if (!user) {
        throw new Error('User not found');
      }
      
      return user;
    } catch (error) {
      logger.error('Error fetching user by ID', { error: error.message, userId });
      throw error;
    }
  }
  
  /**
   * Update user
   * @param {String} userId - User ID
   * @param {Object} updateData - Update data
   * @param {String} updatedBy - ID of user making the update
   * @returns {Promise<Object>} Updated user
   */
  async updateUser(userId, updateData, updatedBy) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Get old user data
      const oldUser = await User.findById(userId).select('-password').session(session);
      
      if (!oldUser) {
        throw new Error('User not found');
      }
      
      // Hash password if being updated
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, session }
      ).select('-password');
      
      // Create audit log
      await AuditLog.create([{
        entity_type: 'User',
        entity_id: userId,
        action: 'user_updated',
        user_id: updatedBy,
        changes: {
          old_values: oldUser.toObject(),
          new_values: updateData
        },
        timestamp: new Date()
      }], { session });
      
      await session.commitTransaction();
      
      logger.info('User updated successfully', {
        userId,
        updatedBy,
        changes: Object.keys(updateData)
      });
      
      return updatedUser;
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error updating user', { error: error.message, userId, updatedBy });
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Delete user
   * @param {String} userId - User ID
   * @param {String} deletedBy - ID of user deleting
   * @returns {Promise<void>}
   */
  async deleteUser(userId, deletedBy) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      const user = await User.findById(userId).select('-password').session(session);
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Instead of hard delete, mark as inactive
      await User.findByIdAndUpdate(
        userId,
        { is_active: false },
        { session }
      );
      
      // Create audit log
      await AuditLog.create([{
        entity_type: 'User',
        entity_id: userId,
        action: 'user_deactivated',
        user_id: deletedBy,
        changes: {
          old_values: user.toObject()
        },
        timestamp: new Date()
      }], { session });
      
      await session.commitTransaction();
      
      logger.info('User deactivated successfully', { userId, deletedBy });
    } catch (error) {
      await session.abortTransaction();
      logger.error('Error deleting user', { error: error.message, userId, deletedBy });
      throw error;
    } finally {
      session.endSession();
    }
  }
  
  /**
   * Change user password
   * @param {String} userId - User ID
   * @param {String} oldPassword - Current password
   * @param {String} newPassword - New password
   * @returns {Promise<void>}
   */
  async changePassword(userId, oldPassword, newPassword) {
    try {
      // Get user with password
      const user = await User.findById(userId).select('+password');
      
      if (!user) {
        throw new Error('User not found');
      }
      
      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) {
        throw new Error('Current password is incorrect');
      }
      
      // Hash and update new password
      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      
      logger.info('Password changed successfully', { userId });
    } catch (error) {
      logger.error('Error changing password', { error: error.message, userId });
      throw error;
    }
  }
  
  /**
   * Update last login time
   * @param {String} userId - User ID
   * @returns {Promise<void>}
   */
  async updateLastLogin(userId) {
    try {
      await User.findByIdAndUpdate(userId, { last_login: new Date() });
      logger.info('Last login updated', { userId });
    } catch (error) {
      logger.error('Error updating last login', { error: error.message, userId });
      // Don't throw - this is not critical
    }
  }
  
  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      const stats = await User.aggregate([
        {
          $facet: {
            totalUsers: [{ $count: 'count' }],
            activeUsers: [
              { $match: { is_active: true } },
              { $count: 'count' }
            ],
            byRole: [
              { $group: { _id: '$role', count: { $sum: 1 } } }
            ],
            byDepartment: [
              { $group: { _id: '$department', count: { $sum: 1 } } }
            ],
            recentLogins: [
              { $match: { last_login: { $exists: true } } },
              { $sort: { last_login: -1 } },
              { $limit: 10 },
              { $project: { name: 1, email: 1, last_login: 1, role: 1 } }
            ]
          }
        }
      ]);
      
      const result = stats[0];
      
      return {
        totalUsers: result.totalUsers[0]?.count || 0,
        activeUsers: result.activeUsers[0]?.count || 0,
        byRole: result.byRole,
        byDepartment: result.byDepartment,
        recentLogins: result.recentLogins
      };
    } catch (error) {
      logger.error('Error fetching user stats', { error: error.message });
      throw error;
    }
  }
}

module.exports = new UserService();
