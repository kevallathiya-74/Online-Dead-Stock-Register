require('dotenv').config();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
  try {
    console.log('Signup request body:', req.body);
    const { username, email, password, department, role = 'employee' } = req.body;
    
    // Map frontend role values to backend enum values
    const roleMap = {
      'admin': 'Admin',
      'inventory_manager': 'Inventory_Manager',
      'auditor': 'Auditor',
      'employee': 'Employee'
    };
    
    const mappedRole = roleMap[role] || 'Employee';
    
    // Validate required fields
    if (!username || !email || !password || !department) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    console.log('Creating user with data:', {
      name: username,
      email,
      department,
      role: mappedRole,
      employee_id: `EMP-${Date.now()}`
    });
    
    // Create user
    const user = new User({ 
      name: username,
      email, 
      password: hashed,
      department,
      role: mappedRole,
      employee_id: `EMP-${Date.now()}` // Generate unique employee ID
    });
    
    const saved = await user.save();
    console.log('User saved successfully:', saved._id);
    
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
