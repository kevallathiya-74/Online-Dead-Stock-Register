const getSupabase = require('../config/db');
const { hashPassword, comparePassword } = require('../utils/passwordHelper');
const logger = require('../utils/logger');
const { validate: isValidUUID } = require('uuid');

// GET current user profile
exports.getProfile = async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    
    if (error || !user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    res.json({ 
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        employee_id: user.employee_id,
        vendor_id: user.vendor_id || null,
        phone: user.phone,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (err) {
    logger.error('Error fetching user profile', { error: err.message });
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user profile',
      error: err.message 
    });
  }
};

// PUT update current user profile
exports.updateProfile = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { name, phone, department, employee_id } = req.body;
    
    // Find the current user
    const { data: user, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
    
    if (fetchError || !user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Build update object with allowed fields for all users
    const updateData = { updated_at: new Date().toISOString() };
    
    if (name) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    
    // Only ADMIN can update department and employee_id
    const isAdmin = req.user.role === 'ADMIN';
    
    if (department !== undefined) {
      if (!isAdmin) {
        return res.status(403).json({ 
          success: false,
          message: 'Only administrators can update department' 
        });
      }
      updateData.department = department;
    }
    
    if (employee_id !== undefined) {
      if (!isAdmin) {
        return res.status(403).json({ 
          success: false,
          message: 'Only administrators can update employee ID' 
        });
      }
      updateData.employee_id = employee_id;
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating user profile', { error: error.message });
      return res.status(500).json({ 
        success: false,
        message: 'Error updating user profile',
        error: error.message 
      });
    }

    logger.info('User profile updated', { userId: updatedUser.id, email: updatedUser.email });

    res.json({ 
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        role: updatedUser.role,
        department: updatedUser.department,
        employee_id: updatedUser.employee_id,
        phone: updatedUser.phone,
        is_active: updatedUser.is_active,
        created_at: updatedUser.created_at,
        last_login: updatedUser.last_login
      }
    });
  } catch (err) {
    logger.error('Error updating user profile', { error: err.message });
    res.status(500).json({ 
      success: false,
      message: 'Error updating user profile',
      error: err.message 
    });
  }
};

// GET users
exports.getUsers = async (req, res) => {
  try {
    const supabase = getSupabase();
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      logger.error('Error fetching users', { error: error.message });
      return res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
    
    // Remove password field from all users
    const sanitizedUsers = users.map(user => {
      const { password, reset_password_token, reset_password_expires, ...userWithoutSensitive } = user;
      return userWithoutSensitive;
    });
    
    // Add cache control headers to prevent stale data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      data: sanitizedUsers,
      count: sanitizedUsers.length
    });
  } catch (err) {
    logger.error('Error fetching users', { error: err.message });
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET user by id
exports.getUserById = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format' 
      });
    }
    
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
    logger.error('Error fetching user', { error: err.message });
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// CREATE user
exports.createUser = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { name, email, password, role, department, employee_id, phone, location, manager, is_active } = req.body;

    // Validate required fields
    if (!name || !email || !role || !department) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, role, and department are required' 
      });
    }

    // Check if email already exists
    const { data: existingUserByEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
      
    if (existingUserByEmail) {
      return res.status(400).json({ 
        success: false,
        message: 'User with this email already exists' 
      });
    }

    // Auto-generate Employee ID if not provided (Format: EMP-YYYY-XXXX)
    let finalEmployeeId = employee_id;
    
    if (!finalEmployeeId || finalEmployeeId.trim() === '') {
      const year = new Date().getFullYear();
      
      // Get user count for sequential number
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
        
      const sequentialNumber = (count + 1).toString().padStart(4, '0');
      finalEmployeeId = `EMP-${year}-${sequentialNumber}`;
    }

    // Check if employee_id already exists
    const { data: existingUserById } = await supabase
      .from('users')
      .select('id')
      .eq('employee_id', finalEmployeeId)
      .single();
      
    if (existingUserById) {
      return res.status(400).json({ 
        success: false,
        message: `Employee ID ${finalEmployeeId} already exists. Please provide a different ID.` 
      });
    }

    // Normalize role to uppercase with underscores
    const normalizedRole = role.toUpperCase().replace(/\s+/g, '_');
    
    // Normalize department to uppercase (only allow: INVENTORY, IT, ADMIN, VENDOR)
    const allowedDepartments = ['INVENTORY', 'IT', 'ADMIN', 'VENDOR'];
    const normalizedDepartment = department.toUpperCase();
    
    if (!allowedDepartments.includes(normalizedDepartment)) {
      return res.status(400).json({ 
        success: false,
        message: `Invalid department. Allowed: ${allowedDepartments.join(', ')}` 
      });
    }

    // Hash password (use provided password or generate default)
    const plainPassword = password || 'Password@123';
    const hashedPassword = await hashPassword(plainPassword);

    // Create user data
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      department: normalizedDepartment,
      employee_id: finalEmployeeId,
      phone,
      is_active: is_active !== undefined ? is_active : true,
      created_at: new Date().toISOString()
    };

    const { data: user, error } = await supabase
      .from('users')
      .insert([userData])
      .select()
      .single();

    if (error) {
      logger.error('Error creating user', { error: error.message });
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }

    // Return user without password
    const { password: _, ...userResponse } = user;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        ...userResponse,
        generated_employee_id: !employee_id // Flag to indicate if ID was auto-generated
      }
    });
  } catch (err) {
    logger.error('Error creating user', { error: err.message });
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// CHANGE PASSWORD (for current user)
exports.changePassword = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { currentPassword, newPassword } = req.body;
    
    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }
    
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long'
      });
    }
    
    // Get user with password
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', req.user.id)
      .single();
      
    if (error || !user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update password
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', req.user.id);
      
    if (updateError) {
      logger.error('Error updating password', { error: updateError.message });
      return res.status(500).json({
        success: false,
        message: 'Error changing password',
        error: updateError.message
      });
    }
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    logger.error('Error changing password', { error: err.message });
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: err.message
    });
  }
};

// UPDATE user
exports.updateUser = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    const { name, email, role, department, employee_id, phone, is_active, password } = req.body;
    
    logger.debug('Updating user', { userId: id, updateData: req.body });
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format' 
      });
    }
    
    const updateData = { updated_at: new Date().toISOString() };
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role.toUpperCase().replace(/\s+/g, '_');
    if (department) updateData.department = department.toUpperCase();
    if (employee_id) updateData.employee_id = employee_id;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    // If password is being updated, hash it
    if (password) {
      updateData.password = await hashPassword(password);
    }
    
    const { data: updated, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error updating user', { error: error.message });
      return res.status(400).json({ 
        success: false,
        message: error.message 
      });
    }
    
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    // Remove sensitive fields
    const { password: _, reset_password_token: __, reset_password_expires: ___, ...userResponse } = updated;
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: userResponse
    });
  } catch (err) {
    logger.error('Error updating user', { error: err.message });
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const supabase = getSupabase();
    const { id } = req.params;
    
    if (!isValidUUID(id)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid user ID format' 
      });
    }
    
    const { data: deleted, error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      logger.error('Error deleting user', { error: error.message });
      return res.status(500).json({ 
        success: false,
        message: error.message 
      });
    }
    
    if (!deleted) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true,
      message: 'User deleted successfully',
      data: {
        id: deleted.id,
        email: deleted.email,
        name: deleted.name
      }
    });
  } catch (err) {
    logger.error('Error deleting user', { error: err.message });
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};
