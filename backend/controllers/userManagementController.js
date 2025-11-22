const User = require('../models/user');
const logger = require('../utils/logger');
const AuditLog = require('../models/auditLog');
const bcrypt = require('bcryptjs');

// Get all users with pagination and filtering
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Build filter object
    let filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { full_name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { employee_id: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ created_at: -1 });

    const total = await User.countDocuments(filter);

    res.json({
      users,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_users: total,
        has_next: page * limit < total,
        has_prev: page > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
};

// Get specific user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    logger.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { full_name, email, employee_id, role, department, phone, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { employee_id }] 
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email or employee ID already exists' 
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = new User({
      full_name,
      email,
      employee_id,
      role,
      department,
      phone,
      password: hashedPassword,
      status: 'active',
      created_at: new Date()
    });

    await newUser.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'user_created',
      performed_by: req.user.id,
      details: {
        created_user_id: newUser._id,
        created_user_email: email,
        created_user_role: role
      },
      timestamp: new Date()
    });
    await auditLog.save();

    // Return user without password
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      message: 'User created successfully',
      user: userResponse
    });
  } catch (error) {
    logger.error('Error creating user:', error);
    res.status(500).json({ message: 'Failed to create user' });
  }
};

// Update user details
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, email, employee_id, department, phone } = req.body;

    // Check if user exists
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check for duplicate email or employee_id (excluding current user)
    if (email || employee_id) {
      const duplicateCheck = {};
      if (email) duplicateCheck.email = email;
      if (employee_id) duplicateCheck.employee_id = employee_id;

      const existingUser = await User.findOne({
        $and: [
          { _id: { $ne: id } },
          { $or: Object.keys(duplicateCheck).map(key => ({ [key]: duplicateCheck[key] })) }
        ]
      });

      if (existingUser) {
        return res.status(400).json({ 
          message: 'Email or Employee ID already exists' 
        });
      }
    }

    // Update user
    const updateData = {};
    if (full_name) updateData.full_name = full_name;
    if (email) updateData.email = email;
    if (employee_id) updateData.employee_id = employee_id;
    if (department) updateData.department = department;
    if (phone) updateData.phone = phone;
    updateData.updated_at = new Date();

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, select: '-password' }
    );

    // Create audit log
    const auditLog = new AuditLog({
      action: 'user_updated',
      performed_by: req.user.id,
      details: {
        updated_user_id: id,
        updated_fields: Object.keys(updateData)
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    logger.error('Error updating user:', error);
    res.status(500).json({ message: 'Failed to update user' });
  }
};

// Change user role
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ['ADMIN', 'INVENTORY_MANAGER', 'AUDITOR'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role specified' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldRole = user.role;
    user.role = role;
    user.updated_at = new Date();
    await user.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'user_role_changed',
      performed_by: req.user.id,
      details: {
        user_id: id,
        old_role: oldRole,
        new_role: role
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({
      message: 'User role changed successfully',
      user: { id: id, role: role }
    });
  } catch (error) {
    logger.error('Error changing user role:', error);
    res.status(500).json({ message: 'Failed to change user role' });
  }
};

// Change user status (activate/deactivate)
exports.changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status specified' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const oldStatus = user.status;
    user.status = status;
    user.updated_at = new Date();
    await user.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'user_status_changed',
      performed_by: req.user.id,
      details: {
        user_id: id,
        old_status: oldStatus,
        new_status: status
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({
      message: 'User status changed successfully',
      user: { id: id, status: status }
    });
  } catch (error) {
    logger.error('Error changing user status:', error);
    res.status(500).json({ message: 'Failed to change user status' });
  }
};

// Delete user (soft delete)
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if user is trying to delete themselves
    if (id === req.user.id) {
      return res.status(400).json({ message: 'Cannot delete your own account' });
    }

    // Instead of hard delete, mark as deleted
    user.status = 'deleted';
    user.deleted_at = new Date();
    await user.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'user_deleted',
      performed_by: req.user.id,
      details: {
        deleted_user_id: id,
        deleted_user_email: user.email
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    logger.error('Error deleting user:', error);
    res.status(500).json({ message: 'Failed to delete user' });
  }
};

// Get user statistics for admin dashboard
exports.getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ status: { $ne: 'deleted' } });
    const activeUsers = await User.countDocuments({ status: 'active' });
    const inactiveUsers = await User.countDocuments({ status: 'inactive' });
    
    const roleStats = await User.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]);

    const departmentStats = await User.aggregate([
      { $match: { status: { $ne: 'deleted' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } }
    ]);

    res.json({
      total_users: totalUsers,
      active_users: activeUsers,
      inactive_users: inactiveUsers,
      role_distribution: roleStats,
      department_distribution: departmentStats
    });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({ message: 'Failed to fetch user statistics' });
  }
};

// Reset user password (admin function)
exports.resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_password } = req.body;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(new_password, saltRounds);

    user.password = hashedPassword;
    user.updated_at = new Date();
    await user.save();

    // Create audit log
    const auditLog = new AuditLog({
      action: 'password_reset_by_admin',
      performed_by: req.user.id,
      details: {
        target_user_id: id,
        target_user_email: user.email
      },
      timestamp: new Date()
    });
    await auditLog.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    logger.error('Error resetting password:', error);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};