/**
 * User Service Layer
 * Handles all business logic related to users using Supabase (PostgreSQL)
 */

const getSupabase = require("../config/db");
const bcrypt = require("bcryptjs");
const logger = require("../utils/logger");

class UserService {
  /**
   * Create a new user
   * @param {Object} userData - User data
   * @param {String} createdBy - ID of user creating this user
   * @returns {Promise<Object>} Created user
   */
  async createUser(userData, createdBy) {
    try {
      const supabase = getSupabase();

      // Check if user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from("users")
        .select("id")
        .eq("email", userData.email)
        .maybeSingle();

      if (checkError) {
        throw checkError;
      }
      if (existingUser) {
        throw new Error("User with this email already exists");
      }

      // Hash password
      let hashedPassword = userData.password;
      if (hashedPassword) {
        hashedPassword = await bcrypt.hash(hashedPassword, 10);
      }

      // Generate employee_id if not provided
      const employeeId =
        userData.employee_id || userData.employeeId || `EMP-${Date.now()}`;

      const insertData = {
        email: userData.email,
        password: hashedPassword,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        employee_id: employeeId,
        vendor_id: userData.vendor_id || userData.vendorId || null,
        phone: userData.phone || null,
        is_active:
          userData.is_active !== undefined
            ? userData.is_active
            : userData.isActive !== undefined
              ? userData.isActive
              : true,
      };

      // Create user
      const { data: user, error: insertError } = await supabase
        .from("users")
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Create audit log
      const { error: logError } = await supabase.from("audit_logs").insert([
        {
          entity_type: "User",
          entity_id: user.id,
          action: "user_created",
          user_id: createdBy,
          changes: {
            new_values: {
              email: userData.email,
              name: userData.name,
              role: userData.role,
              department: userData.department,
            },
          },
        },
      ]);

      if (logError) {
        logger.error("Error creating audit log for user creation", {
          error: logError.message,
        });
      }

      logger.info("User created successfully", {
        userId: user.id,
        email: user.email,
        createdBy,
      });

      // Return user without password
      const { password, ...userObj } = user;
      return userObj;
    } catch (error) {
      logger.error("Error creating user", { error: error.message, createdBy });
      throw error;
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
      const supabase = getSupabase();
      const {
        page = 1,
        limit = 50,
        sortBy = "created_at",
        sortOrder = "desc",
      } = pagination;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase.from("users").select("*", { count: "exact" });

      // Apply filters
      if (filters.role) {
        query = query.eq("role", filters.role);
      }

      if (filters.department) {
        query = query.eq("department", filters.department);
      }

      if (filters.is_active !== undefined) {
        query = query.eq("is_active", filters.is_active);
      } else if (filters.isActive !== undefined) {
        query = query.eq("is_active", filters.isActive);
      }

      // Text search
      if (filters.search) {
        query = query.or(
          `name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,employee_id.ilike.%${filters.search}%`,
        );
      }

      // Sorting conversion to match DB snake_case
      let sortByColumn = sortBy;
      if (sortBy === "createdAt") sortByColumn = "created_at";
      if (sortBy === "updatedAt") sortByColumn = "updated_at";
      if (sortBy === "lastLogin") sortByColumn = "last_login";
      if (sortBy === "employeeId") sortByColumn = "employee_id";
      if (sortBy === "vendorId") sortByColumn = "vendor_id";
      if (sortBy === "isActive") sortByColumn = "is_active";

      query = query.order(sortByColumn, { ascending: sortOrder === "asc" });

      // Execute query
      const { data, count, error } = await query.range(from, to);

      if (error) {
        throw error;
      }

      const users = (data || []).map((u) => {
        const { password, ...userWithoutPassword } = u;
        return userWithoutPassword;
      });

      const total = count || 0;

      return {
        data: users,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      logger.error("Error fetching users", { error: error.message });
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
      const supabase = getSupabase();
      const { data: user, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error || !user) {
        throw new Error("User not found");
      }

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      logger.error("Error fetching user by ID", {
        error: error.message,
        userId,
      });
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
    try {
      const supabase = getSupabase();

      // Get old user data
      const { data: oldUser, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (fetchError || !oldUser) {
        throw new Error("User not found");
      }

      // Hash password if being updated
      const dataToUpdate = { ...updateData };
      if (dataToUpdate.password) {
        dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
      }

      // Map update fields to database column names
      const mappedUpdateData = {};
      const allowedFields = [
        "email",
        "password",
        "name",
        "role",
        "department",
        "employee_id",
        "employeeId",
        "vendor_id",
        "vendorId",
        "phone",
        "is_active",
        "isActive",
        "resetPasswordToken",
        "resetPasswordExpires",
      ];

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (field === "employeeId")
            mappedUpdateData.employee_id = updateData[field];
          else if (field === "vendorId")
            mappedUpdateData.vendor_id = updateData[field];
          else if (field === "isActive")
            mappedUpdateData.is_active = updateData[field];
          else mappedUpdateData[field] = updateData[field];
        }
      }

      // Update user
      const { data: updatedUser, error: updateError } = await supabase
        .from("users")
        .update(mappedUpdateData)
        .eq("id", userId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Create audit log
      const { password: _, ...oldUserWithoutPassword } = oldUser;
      const { password: __, ...updateDataWithoutPassword } = updateData;

      const { error: logError } = await supabase.from("audit_logs").insert([
        {
          entity_type: "User",
          entity_id: userId,
          action: "user_updated",
          user_id: updatedBy,
          changes: {
            old_values: oldUserWithoutPassword,
            new_values: updateDataWithoutPassword,
          },
        },
      ]);

      if (logError) {
        logger.error("Error creating audit log for user update", {
          error: logError.message,
        });
      }

      logger.info("User updated successfully", {
        userId,
        updatedBy,
        changes: Object.keys(updateData),
      });

      const { password: ___, ...userWithoutPassword } = updatedUser;
      return userWithoutPassword;
    } catch (error) {
      logger.error("Error updating user", {
        error: error.message,
        userId,
        updatedBy,
      });
      throw error;
    }
  }

  /**
   * Delete user
   * @param {String} userId - User ID
   * @param {String} deletedBy - ID of user deleting
   * @returns {Promise<void>}
   */
  async deleteUser(userId, deletedBy) {
    try {
      const supabase = getSupabase();
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (fetchError || !user) {
        throw new Error("User not found");
      }

      // Instead of hard delete, mark as inactive
      const { error: updateError } = await supabase
        .from("users")
        .update({ is_active: false })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      const { password, ...userWithoutPassword } = user;

      // Create audit log
      const { error: logError } = await supabase.from("audit_logs").insert([
        {
          entity_type: "User",
          entity_id: userId,
          action: "user_deactivated",
          user_id: deletedBy,
          changes: {
            old_values: userWithoutPassword,
          },
        },
      ]);

      if (logError) {
        logger.error("Error creating audit log for user deletion", {
          error: logError.message,
        });
      }

      logger.info("User deactivated successfully", { userId, deletedBy });
    } catch (error) {
      logger.error("Error deleting user", {
        error: error.message,
        userId,
        deletedBy,
      });
      throw error;
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
      const supabase = getSupabase();

      // Get user with password
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (fetchError || !user) {
        throw new Error("User not found");
      }

      // Verify old password
      const isValid = await bcrypt.compare(oldPassword, user.password);
      if (!isValid) {
        throw new Error("Current password is incorrect");
      }

      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      const { error: updateError } = await supabase
        .from("users")
        .update({ password: hashedPassword })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      logger.info("Password changed successfully", { userId });
    } catch (error) {
      logger.error("Error changing password", { error: error.message, userId });
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
      const supabase = getSupabase();
      const { error } = await supabase
        .from("users")
        .update({ last_login: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        throw error;
      }
      logger.info("Last login updated", { userId });
    } catch (error) {
      logger.error("Error updating last login", {
        error: error.message,
        userId,
      });
      // Don't throw - this is not critical
    }
  }

  /**
   * Get user statistics
   * @returns {Promise<Object>} User statistics
   */
  async getUserStats() {
    try {
      const supabase = getSupabase();

      const { data: allUsers, error } = await supabase
        .from("users")
        .select("role, department, name, email, last_login, is_active");

      if (error) {
        throw error;
      }

      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter((u) => u.is_active).length;

      const roleMap = {};
      const deptMap = {};
      allUsers.forEach((u) => {
        if (u.role) {
          roleMap[u.role] = (roleMap[u.role] || 0) + 1;
        }
        if (u.department) {
          deptMap[u.department] = (deptMap[u.department] || 0) + 1;
        }
      });

      const byRole = Object.entries(roleMap).map(([_id, count]) => ({
        _id,
        count,
      }));
      const byDepartment = Object.entries(deptMap).map(([_id, count]) => ({
        _id,
        count,
      }));

      const recentLogins = allUsers
        .filter((u) => u.last_login)
        .sort((a, b) => new Date(b.last_login) - new Date(a.last_login))
        .slice(0, 10)
        .map((u) => ({
          name: u.name,
          email: u.email,
          last_login: u.last_login,
          role: u.role,
        }));

      return {
        totalUsers,
        activeUsers,
        byRole,
        byDepartment,
        recentLogins,
      };
    } catch (error) {
      logger.error("Error fetching user stats", { error: error.message });
      throw error;
    }
  }
}

module.exports = new UserService();
