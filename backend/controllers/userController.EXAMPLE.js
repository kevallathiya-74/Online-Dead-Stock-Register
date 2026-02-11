/**
 * User Controller - Supabase PostgreSQL Implementation
 * Example of complete MongoDB → Supabase migration
 */

const getSupabase = require('../config/db');
const { hashPassword } = require('../utils/passwordHelper');
const logger = require('../utils/logger');

// GET all users with pagination and filtering
exports.getUsers = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const offset = (page - 1) * limit;
    
    // Build query
    let query = supabase.from('users').select('*', { count: 'exact' });
    
    // Filters
    if (req.query.role) {
      query = query.eq('role', req.query.role);
    }
    
    if (req.query.department) {
      query = query.eq('department', req.query.department);
    }
    
    if (req.query.is_active !== undefined) {
      query = query.eq('is_active', req.query.is_active === 'true');
    }
    
    if (req.query.search) {
      query = query.or(`name.ilike.%${req.query.search}%,email.ilike.%${req.query.search}%,employee_id.ilike.%${req.query.search}%`);
    }
    
    // Sorting
    const sortBy = req.query.sortBy || 'created_at';
    const sortOrder = req.query.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(sortBy, sortOrder);
    
    // Execute with pagination
    query = query.range(offset, offset + limit - 1);
    
    const { data: users, error, count } = await query;
    
    if (error) {
      logger.error('Error fetching users:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
    
    // Remove password field from all users
    const sanitizedUsers = users.map(user => {
      const { password, reset_password_token, reset_password_expires, ...userWithoutSensitive } = user;
      return userWithoutSensitive;
    });
    
    res.json({
      success: true,
      data: sanitizedUsers,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit),
        hasNext: offset + limit < count,
        hasPrev: page > 1
      }
    });
  } catch (err) {
    logger.error('Get users error:', err);
    next(err);
  }
};

// GET user by ID
exports.getUserById = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Remove sensitive fields
    const { password, reset_password_token, reset_password_expires, ...userWithoutSensitive } = user;
    
    res.json({
      success: true,
      data: userWithoutSensitive
    });
  } catch (err) {
    logger.error('Get user by ID error:', err);
    next(err);
  }
};

// CREATE user
exports.createUser = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { email, password, name, role, department, phone, employee_id } = req.body;
    
    // Check if user exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const userData = {
      email,
      password: hashedPassword,
      name,
      role: role || 'AUDITOR',
      department,
      phone,
      employee_id: employee_id || `EMP-${Date.now()}`,
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    const { data: user, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();
    
    if (error) {
      logger.error('Error creating user:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
    
    // Log audit action
    await supabase.from('audit_logs').insert([{
      action: 'user_created',
      entity_type: 'User',
      entity_id: user.id,
      user_id: req.user.id,
      changes: { new_values: userData },
      ip_address: req.ip,
      created_at: new Date().toISOString()
    }]);
    
    // Remove sensitive fields
    const { password: _, ...userResponse } = user;
    
    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully'
    });
  } catch (err) {
    logger.error('Create user error:', err);
    next(err);
  }
};

// UPDATE user
exports.updateUser = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const updates = req.body;
    
    // Get current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (fetchError || !currentUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Check permissions
    if (req.user.role !== 'ADMIN' && req.user.id !== id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Unauthorized to update this user' 
      });
    }
    
    // Don't allow direct password update through this endpoint
    if (updates.password) {
      delete updates.password;
    }
    
    // Prevent role escalation for non-admins
    if (req.user.role !== 'ADMIN' && updates.role) {
      delete updates.role;
    }
    
    // Update user
    updates.updated_at = new Date().toISOString();
    
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating user:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
    
    // Log audit action
    await supabase.from('audit_logs').insert([{
      action: 'user_updated',
      entity_type: 'User',
      entity_id: id,
      user_id: req.user.id,
      changes: {
        old_values: currentUser,
        new_values: updates
      },
      ip_address: req.ip,
      created_at: new Date().toISOString()
    }]);
    
    // Remove sensitive fields
    const { password: _, reset_password_token: __, reset_password_expires: ___, ...userResponse } = updatedUser;
    
    res.json({
      success: true,
      data: userResponse,
      message: 'User updated successfully'
    });
  } catch (err) {
    logger.error('Update user error:', err);
    next(err);
  }
};

// DELETE user (soft delete - set is_active to false)
exports.deleteUser = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    
    // Only admin can delete users
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        success: false, 
        message: 'Only admins can delete users' 
      });
    }
    
    // Cannot delete yourself
    if (req.user.id === id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }
    
    // Soft delete - set is_active to false
    const { data, error } = await supabase
      .from('users')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error deleting user:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
    
    if (!data) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Log audit action
    await supabase.from('audit_logs').insert([{
      action: 'user_deleted',
      entity_type: 'User',
      entity_id: id,
      user_id: req.user.id,
      ip_address: req.ip,
      created_at: new Date().toISOString()
    }]);
    
    res.json({
      success: true,
      message: 'User deactivated successfully'
    });
  } catch (err) {
    logger.error('Delete user error:', err);
    next(err);
  }
};

// Get users by role
exports.getUsersByRole = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const { role } = req.params;
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, name, email, role, department, is_active')
      .eq('role', role.toUpperCase())
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      logger.error('Error fetching users by role:', error);
      return res.status(500).json({ success: false, message: error.message });
    }
    
    res.json({
      success: true,
      data: users,
      total: users.length
    });
  } catch (err) {
    logger.error('Get users by role error:', err);
    next(err);
  }
};

// Get user statistics
exports.getUserStats = async (req, res, next) => {
  try {
    const supabase = getSupabase();
    
    // Get total users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    // Get active users
    const { count: activeUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    // Get users by role
    const { data: roleStats } = await supabase
      .from('users')
      .select('role')
      .eq('is_active', true);
    
    const byRole = roleStats.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});
    
    // Get users by department
    const { data: deptStats } = await supabase
      .from('users')
      .select('department')
      .eq('is_active', true);
    
    const byDepartment = deptStats.reduce((acc, user) => {
      acc[user.department] = (acc[user.department] || 0) + 1;
      return acc;
    }, {});
    
    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
        byRole,
        byDepartment
      }
    });
  } catch (err) {
    logger.error('Get user stats error:', err);
    next(err);
  }
};

module.exports = exports;
