require('dotenv').config();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../utils/emailService');



// Password validation
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};

exports.signup = async (req, res) => {
  try {
    console.log('=== SIGNUP REQUEST START ===');
    console.log('Request body:', JSON.stringify({...req.body, password: '[REDACTED]'}, null, 2));
    
    const { full_name, username, email, password, department, role = 'employee' } = req.body;
    
    // Use full_name if available, otherwise fall back to username
    const name = full_name || username;
    
    console.log('Processing registration for:', { name, email, department, role });
    
    // Map frontend role values to backend enum values
    const roleMap = {
      'ADMIN': 'ADMIN',
      'INVENTORY_MANAGER': 'INVENTORY_MANAGER',
      'EMPLOYEE': 'EMPLOYEE'
    };
    
    const mappedRole = roleMap[role.toUpperCase()] || 'EMPLOYEE';
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
    if (!validatePassword(password)) {
      console.log('ERROR: Password does not meet strength requirements');
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers and special characters' 
      });
    }
    if (!department || !['INVENTORY', 'IT', 'ADMIN'].includes(department.toUpperCase())) {
      console.log('ERROR: Invalid department');
      return res.status(400).json({ message: 'Department must be one of: INVENTORY, IT, ADMIN' });
    }
    
    // Convert department to uppercase to match enum
    const normalizedDepartment = department.toUpperCase();
    
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
      department: normalizedDepartment,
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
    
    // Send welcome email
    await emailService.sendWelcomeEmail(saved.email, saved.name);
    
    // Generate JWT token
    const token = jwt.sign(
      { id: saved._id, email: saved.email, role: saved.role }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    res.status(201).json({ 
      user: {
        id: saved._id,
        email: saved.email,
        role: saved.role, // Send role in uppercase format: ADMIN, INVENTORY_MANAGER, EMPLOYEE
        name: saved.name,
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
        role: user.role, // Send role in uppercase format: ADMIN, INVENTORY_MANAGER, EMPLOYEE
        name: user.name,
        full_name: user.name,
        department: user.department
      },
      token 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    // Generate reset token (unhashed for email)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    // Hash token before storing in database - CRITICAL SECURITY FIX
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Save HASHED token to database
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // Send UNHASHED token via email (user needs this)
    await emailService.sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'If an account exists with this email, password reset instructions have been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Error processing password reset' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }

    // Hash the incoming token to compare with stored hash
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    // Find user with hashed token and unexpired token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    }).select('+password +resetPasswordToken +resetPasswordExpires');

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    // Validate new password
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters and contain uppercase, lowercase, numbers and special characters'
      });
    }

    // Ensure new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        message: 'New password must be different from current password'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Send confirmation email
    await emailService.sendPasswordChangeConfirmationEmail(user.email);

    res.json({ message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Error resetting password' });
  }
};

exports.verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;
    
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    res.json({ valid: Boolean(user) });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ message: 'Error verifying reset token' });
  }
};
