const User = require('../models/user');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

// GET current user profile
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('vendor_id', 'company_name vendor_name email phone address');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    res.json({ 
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        department: user.department,
        employee_id: user.employee_id,
        vendor_id: user.vendor_id?._id || user.vendor_id || null,
        phone: user.phone,
        is_active: user.is_active,
        created_at: user.created_at,
        last_login: user.last_login
      }
    });
  } catch (err) {
    console.error('Error fetching user profile:', err);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user profile',
      error: err.message 
    });
  }
};

// GET users
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ created_at: -1 });
    
    const mappedUsers = users.map(user => ({
      ...user.toObject(),
      id: user._id
    }));
    
    // Add cache control headers to prevent stale data
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      data: mappedUsers,
      count: mappedUsers.length
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// GET user by id
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        ...user.toObject(),
        id: user._id
      }
    });
  } catch (err) {
    console.error('Error fetching user:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

// CREATE user
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role, department, employee_id, phone, location, manager, is_active } = req.body;

    // Validate required fields
    if (!name || !email || !role || !department) {
      return res.status(400).json({ 
        success: false,
        message: 'Name, email, role, and department are required' 
      });
    }

    // Check if email already exists
    const existingUserByEmail = await User.findOne({ email });
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
      const userCount = await User.countDocuments();
      const sequentialNumber = (userCount + 1).toString().padStart(4, '0');
      finalEmployeeId = `EMP-${year}-${sequentialNumber}`;
    }

    // Check if employee_id already exists
    const existingUserById = await User.findOne({ employee_id: finalEmployeeId });
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
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);

    // Create new user
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      department: normalizedDepartment,
      employee_id: finalEmployeeId,
      phone,
      is_active: is_active !== undefined ? is_active : true
    });

    const saved = await user.save();
    
    // Return user without password
    const userResponse = saved.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: {
        ...userResponse,
        id: userResponse._id,
        generated_employee_id: !employee_id // Flag to indicate if ID was auto-generated
      }
    });
  } catch (err) {
    console.error('❌ Error creating user:', err);
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// CHANGE PASSWORD (for current user)
exports.changePassword = async (req, res) => {
  try {
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
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    // Update password
    user.password = hashedPassword;
    await user.save();
    
    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (err) {
    console.error('Error changing password:', err);
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
    console.log('=== Updating user ===');
    console.log('User ID:', req.params.id);
    console.log('Update data:', JSON.stringify(req.body, null, 2));
    
    const { name, email, role, department, employee_id, phone, is_active, password } = req.body;
    
    const updateData = {};
    
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role.toUpperCase().replace(/\s+/g, '_');
    if (department) updateData.department = department.toUpperCase();
    if (employee_id) updateData.employee_id = employee_id;
    if (phone !== undefined) updateData.phone = phone;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    // If password is being updated, hash it
    if (password) {
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }
    
    const updated = await User.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updated) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        ...updated.toObject(),
        id: updated._id
      }
    });
  } catch (err) {
    console.error('❌ Error updating user:', err);
    res.status(400).json({ 
      success: false,
      message: err.message 
    });
  }
};

// DELETE user
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    
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
        id: deleted._id,
        email: deleted.email,
        name: deleted.name
      }
    });
  } catch (err) {
    console.error('❌ Error deleting user:', err);
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};
