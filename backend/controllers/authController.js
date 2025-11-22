require('dotenv').config();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../utils/emailService');
const logger = require('../utils/logger');



// Password validation - matches express-validator pattern
const validatePassword = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password); // Match validationMiddleware allowed chars
  
  return password.length >= minLength && 
         hasUpperCase && 
         hasLowerCase && 
         hasNumbers && 
         hasSpecialChar;
};

exports.signup = async (req, res) => {
  try {
    const { full_name, username, email, password, department, role = 'AUDITOR' } = req.body;
    
    // Use full_name if available, otherwise fall back to username
    const name = full_name || username;
    
    // Map frontend role values to backend enum values
    const roleMap = {
      'ADMIN': 'ADMIN',
      'INVENTORY_MANAGER': 'INVENTORY_MANAGER',
      'AUDITOR': 'AUDITOR',
      'VENDOR': 'VENDOR'
    };
    
    const mappedRole = roleMap[role.toUpperCase()] || 'AUDITOR';
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    if (!password) {
      return res.status(400).json({ message: 'Password is required' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ 
        message: 'Password must be at least 8 characters long and contain uppercase, lowercase, numbers and special characters' 
      });
    }
    if (!department || !['INVENTORY', 'IT', 'ADMIN'].includes(department.toUpperCase())) {
      return res.status(400).json({ message: 'Department must be one of: INVENTORY, IT, ADMIN' });
    }
    
    // Convert department to uppercase to match enum
    const normalizedDepartment = department.toUpperCase();
    
    // Check if user already exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    const userData = {
      name: name,
      email,
      password: hashed,
      department: normalizedDepartment,
      role: mappedRole,
      employee_id: `EMP-${Date.now()}` // Generate unique employee ID
    };
    
    // Create user
    const user = new User(userData);
    
    const saved = await user.save();
    
    // Send welcome email (non-blocking - don't wait for it)
    emailService.sendWelcomeEmail(saved.email, saved.name).catch(err => {
      logger.error('❌ Error sending welcome email:', err);
    });
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        id: saved._id, 
        email: saved.email, 
        role: saved.role,
        vendor_id: saved.vendor_id || null
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '8h' }
    );
    
    res.status(201).json({ 
      user: {
        id: saved._id,
        email: saved.email,
        role: saved.role, // Send role in uppercase format: ADMIN, INVENTORY_MANAGER, AUDITOR, VENDOR
        name: saved.name,
        full_name: saved.name,
        department: saved.department
      },
      token 
    });
  } catch (err) {
    logger.error('Signup error', { error: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    logger.info('Login attempt', { email: req.body.email });
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      logger.warn('Login failed: Missing credentials');
      return res.status(400).json({ message: 'Email and password are required' });
    }
    
    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      logger.warn('Login failed: User not found', { email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    logger.debug('User found', { id: user._id, email: user.email, role: user.role });
    
    // Verify password
    const valid = await bcrypt.compare(password, user.password);
    
    if (!valid) {
      logger.warn('Login failed: Invalid password', { email });
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    logger.debug('Password verified for user', { email });

    // Update last login
    user.last_login = new Date();
    await user.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: user.role,
        vendor_id: user.vendor_id || null
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );

    logger.info('User logged in successfully', { userId: user._id, email: user.email });

    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role, // Send role in uppercase format: ADMIN, INVENTORY_MANAGER, AUDITOR, VENDOR
        name: user.name,
        full_name: user.name,
        department: user.department
      },
      token 
    });
  } catch (err) {
    logger.error('❌ Login error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    res.status(500).json({ message: 'Server error during login. Please try again.' });
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
    logger.error('Forgot password error', { error: error.message });
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
    logger.error('Reset password error', { error: error.message });
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
    logger.error('Verify token error', { error: error.message });
    res.status(500).json({ message: 'Error verifying reset token' });
  }
};
