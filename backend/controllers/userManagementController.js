const logger = require("../utils/logger");
const { hashPassword } = require("../utils/passwordHelper");
const getSupabase = require("../config/db");

// Get all users with pagination and filtering
exports.getAllUsers = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { page = 1, limit = 10, role, status, search } = req.query;

    const pageInt = parseInt(page);
    const limitInt = parseInt(limit);
    const skip = (pageInt - 1) * limitInt;

    let query = supabase
      .from("users")
      .select(
        "id, name, email, role, department, employee_id, phone, status, created_at, last_login",
        { count: "exact" },
      )
      .order("created_at", { ascending: false })
      .range(skip, skip + limitInt - 1);

    if (role) {
      query = query.eq("role", role);
    }

    if (status) {
      query = query.eq("status", status);
    }

    if (search) {
      const term = `%${search}%`;
      query = query.or(
        `name.ilike.${term},email.ilike.${term},employee_id.ilike.${term}`,
      );
    }

    const { data: users, error, count: total } = await query;

    if (error) {
      throw error;
    }

    return res.json({
      users: users || [],
      pagination: {
        current_page: pageInt,
        total_pages: Math.ceil((total || 0) / limitInt),
        total_users: total || 0,
        has_next: pageInt * limitInt < (total || 0),
        has_prev: pageInt > 1,
      },
    });
  } catch (error) {
    logger.error("Error fetching users:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Get specific user by ID
exports.getUserById = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: user, error } = await supabase
      .from("users")
      .select(
        "id, name, email, role, department, employee_id, phone, status, created_at, updated_at, last_login",
      )
      .eq("id", id)
      .single();

    if (error || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json(user);
  } catch (error) {
    logger.error("Error fetching user:", error);
    return res.status(500).json({ message: "Failed to fetch user" });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const supabase = getSupabase();
    const {
      full_name,
      name,
      email,
      employee_id,
      role,
      department,
      phone,
      password,
    } = req.body;

    const finalName = full_name || name;

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .or(`email.eq.${email},employee_id.eq.${employee_id}`)
      .limit(1);

    if (existingUser && existingUser.length > 0) {
      return res.status(400).json({
        message: "User with this email or employee ID already exists",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert({
        name: finalName,
        email,
        employee_id,
        role: role || "USER",
        department,
        phone,
        password_hash: hashedPassword,
        status: "active",
        is_active: true,
        created_at: new Date().toISOString(),
      })
      .select(
        "id, name, email, role, department, employee_id, phone, status, created_at",
      )
      .single();

    if (insertError) {
      throw insertError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      action: "user_created",
      performed_by: req.user.id,
      details: {
        created_user_id: newUser.id,
        created_user_email: email,
        created_user_role: role,
      },
      timestamp: new Date().toISOString(),
    });

    return res.status(201).json({
      message: "User created successfully",
      user: newUser,
    });
  } catch (error) {
    logger.error("Error creating user:", error);
    return res.status(500).json({ message: "Failed to create user" });
  }
};

// Update user details
exports.updateUser = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { full_name, name, email, employee_id, department, phone } = req.body;

    const finalName = full_name || name;

    // Check if user exists
    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id")
      .eq("id", id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check for duplicate email or employee_id (excluding current user)
    if (email || employee_id) {
      let duplicateQuery = supabase.from("users").select("id").neq("id", id);

      if (email && employee_id) {
        duplicateQuery = duplicateQuery.or(
          `email.eq.${email},employee_id.eq.${employee_id}`,
        );
      } else if (email) {
        duplicateQuery = duplicateQuery.eq("email", email);
      } else if (employee_id) {
        duplicateQuery = duplicateQuery.eq("employee_id", employee_id);
      }

      const { data: existingUser } = await duplicateQuery.limit(1);

      if (existingUser && existingUser.length > 0) {
        return res.status(400).json({
          message: "Email or Employee ID already exists",
        });
      }
    }

    // Update user
    const updateData = { updated_at: new Date().toISOString() };
    if (finalName) updateData.name = finalName;
    if (email) updateData.email = email;
    if (employee_id) updateData.employee_id = employee_id;
    if (department) updateData.department = department;
    if (phone) updateData.phone = phone;

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update(updateData)
      .eq("id", id)
      .select(
        "id, name, email, role, department, employee_id, phone, status, updated_at",
      )
      .single();

    if (updateError) {
      throw updateError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      action: "user_updated",
      performed_by: req.user.id,
      details: {
        updated_user_id: id,
        updated_fields: Object.keys(updateData),
      },
      timestamp: new Date().toISOString(),
    });

    return res.json({
      message: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating user:", error);
    return res.status(500).json({ message: "Failed to update user" });
  }
};

// Change user role
exports.changeUserRole = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["ADMIN", "INVENTORY_MANAGER", "AUDITOR", "USER"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role specified" });
    }

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, role")
      .eq("id", id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldRole = user.role;

    const { error: updateError } = await supabase
      .from("users")
      .update({ role: role, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      action: "user_role_changed",
      performed_by: req.user.id,
      details: {
        user_id: id,
        old_role: oldRole,
        new_role: role,
      },
      timestamp: new Date().toISOString(),
    });

    return res.json({
      message: "User role changed successfully",
      user: { id: id, role: role },
    });
  } catch (error) {
    logger.error("Error changing user role:", error);
    return res.status(500).json({ message: "Failed to change user role" });
  }
};

// Change user status (activate/deactivate)
exports.changeUserStatus = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["active", "inactive", "suspended"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status specified" });
    }

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldStatus = user.status;
    const isActive = status === "active";

    const { error: updateError } = await supabase
      .from("users")
      .update({
        status: status,
        is_active: isActive,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      action: "user_status_changed",
      performed_by: req.user.id,
      details: {
        user_id: id,
        old_status: oldStatus,
        new_status: status,
      },
      timestamp: new Date().toISOString(),
    });

    return res.json({
      message: "User status changed successfully",
      user: { id: id, status: status },
    });
  } catch (error) {
    logger.error("Error changing user status:", error);
    return res.status(500).json({ message: "Failed to change user status" });
  }
};

// Delete user (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if user is trying to delete themselves
    if (id === req.user.id) {
      return res
        .status(400)
        .json({ message: "Cannot delete your own account" });
    }

    // Instead of hard delete, mark as deleted
    const { error: updateError } = await supabase
      .from("users")
      .update({
        status: "deleted",
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      action: "user_deleted",
      performed_by: req.user.id,
      details: {
        deleted_user_id: id,
        deleted_user_email: user.email,
      },
      timestamp: new Date().toISOString(),
    });

    return res.json({ message: "User deleted successfully" });
  } catch (error) {
    logger.error("Error deleting user:", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};

// Get user statistics for admin dashboard
exports.getUserStats = async (req, res) => {
  try {
    const supabase = getSupabase();

    // Total Users
    const { count: totalUsers, error: tError } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .neq("status", "deleted");

    // Active Users
    const { count: activeUsers, error: aError } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("status", "active");

    // Inactive Users
    const { count: inactiveUsers, error: iError } = await supabase
      .from("users")
      .select("id", { count: "exact" })
      .eq("status", "inactive");

    // We fetch all non-deleted users and calculate stats manually for role and department
    const { data: allUsers, error: fetchError } = await supabase
      .from("users")
      .select("role, department")
      .neq("status", "deleted");

    if (tError || aError || iError || fetchError) {
      throw new Error("Database query failed");
    }

    const roleStatsMap = {};
    const deptStatsMap = {};

    allUsers.forEach((u) => {
      const role = u.role || "USER";
      const dept = u.department || "Unknown";

      roleStatsMap[role] = (roleStatsMap[role] || 0) + 1;
      deptStatsMap[dept] = (deptStatsMap[dept] || 0) + 1;
    });

    const roleStats = Object.keys(roleStatsMap).map((k) => ({
      id: k,
      count: roleStatsMap[k],
    }));
    const departmentStats = Object.keys(deptStatsMap).map((k) => ({
      id: k,
      count: deptStatsMap[k],
    }));

    return res.json({
      total_users: totalUsers || 0,
      active_users: activeUsers || 0,
      inactive_users: inactiveUsers || 0,
      role_distribution: roleStats,
      department_distribution: departmentStats,
    });
  } catch (error) {
    logger.error("Error fetching user stats:", error);
    return res.status(500).json({ message: "Failed to fetch user statistics" });
  }
};

// Reset user password (admin function)
exports.resetUserPassword = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { new_password } = req.body;

    const { data: user, error: fetchError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", id)
      .single();

    if (fetchError || !user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashedPassword = await hashPassword(new_password);

    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: hashedPassword,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      throw updateError;
    }

    // Create audit log
    await supabase.from("audit_logs").insert({
      action: "password_reset_by_admin",
      performed_by: req.user.id,
      details: {
        target_user_id: id,
        target_user_email: user.email,
      },
      timestamp: new Date().toISOString(),
    });

    return res.json({ message: "Password reset successfully" });
  } catch (error) {
    logger.error("Error resetting password:", error);
    return res.status(500).json({ message: "Failed to reset password" });
  }
};
