require('dotenv').config();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    console.log('=== SIGNUP REQUEST START ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { full_name, username, email, password, department, role = 'employee' } = req.body;
    
    // Use full_name if available, otherwise fall back to username
    const name = full_name || username;
    
    console.log('Processing registration for:', { name, email, department, role });
    
    // Map frontend role values to backend enum values
    const roleMap = {
      'admin': 'Admin',
      'inventory_manager': 'Inventory_Manager',
      'auditor': 'Auditor',
      'employee': 'Employee'
    };
    
    const mappedRole = roleMap[role.toLowerCase()] || 'Employee';
    console.log('Role mapping:', role, '->', mappedRole);
    
    // Validate required fields
    if (!name) {
      console.log('ERROR: Missing name field');
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email) {
      console.log('ERROR: Missing email field');
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password) {
      console.log('ERROR: Missing password field');
      return res.status(400).json({ message: 'Password is required' });
    }
    if (!department) {
      console.log('ERROR: Missing department field');
      return res.status(400).json({ message: 'Department is required' });
    }
    
    console.log('Checking if user already exists...');
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('ERROR: Email already exists');
      return res.status(400).json({ message: 'Email already exists' });
    }

    console.log('Hashing password...');
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    console.log('Password hashed successfully');
    
    const userData = {
      name: name,
      email,
      password: hashed,
      department,
      role: mappedRole,
      employee_id: `EMP-${Date.now()}` // Generate unique employee ID
    };
    
    console.log('Creating user with data:', {
      ...userData,
      password: '[HASHED]'
    });
    
    // Create user
    const user = new User(userData);
    
    console.log('Saving user to database...');
    const saved = await user.save();
    console.log('User saved successfully with ID:', saved._id);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: saved._id, email: saved.email, role: saved.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    // Map backend role back to frontend format for response
    const reverseRoleMap = {
      'Admin': 'admin',
      'Inventory_Manager': 'inventory_manager',
      'Auditor': 'auditor',
      'Employee': 'employee'
    };
    
    res.status(201).json({ 
      user: {
        id: saved._id,
        email: saved.email,
        role: reverseRoleMap[saved.role] || 'employee',
        full_name: saved.name,
        department: saved.department
      },
      token 
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Invalid credentials' });

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    res.json({ 
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        full_name: user.name,
        department: user.department
      },
      token 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // In production, you would send an email with a reset token
    // For now, just return a success message
    res.json({ message: 'Password reset instructions sent to your email' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    
    // In production, you would verify the reset token
    // For now, just return a success message
    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
