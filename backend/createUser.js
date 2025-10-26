const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Valid roles and departments based on your User model
const VALID_ROLES = ['ADMIN', 'INVENTORY_MANAGER', 'EMPLOYEE', 'AUDITOR', 'VENDOR'];
const VALID_DEPARTMENTS = ['INVENTORY', 'IT', 'ADMIN', 'VENDOR'];

async function createUser() {
  try {
    // Get user details from environment variables or command line arguments
    const email = process.env.CREATE_USER_EMAIL || process.argv[2];
    const password = process.env.CREATE_USER_PASSWORD || process.argv[3];
    const name = process.env.CREATE_USER_NAME || process.argv[4];
    const role = (process.env.CREATE_USER_ROLE || process.argv[5] || 'EMPLOYEE').toUpperCase();
    const department = (process.env.CREATE_USER_DEPARTMENT || process.argv[6] || 'INVENTORY').toUpperCase();
    
    if (!email || !password || !name) {
      console.error('Usage: node createUser.js <email> <password> <name> [role] [department]');
      console.error('Or set environment variables: CREATE_USER_EMAIL, CREATE_USER_PASSWORD, CREATE_USER_NAME, CREATE_USER_ROLE, CREATE_USER_DEPARTMENT');
      console.error(`Valid roles: ${VALID_ROLES.join(', ')}`);
      console.error(`Valid departments: ${VALID_DEPARTMENTS.join(', ')}`);
      process.exit(1);
    }

    // Validate role
    if (!VALID_ROLES.includes(role)) {
      console.error(`Invalid role: ${role}`);
      console.error(`Valid roles: ${VALID_ROLES.join(', ')}`);
      process.exit(1);
    }

    // Validate department
    if (!VALID_DEPARTMENTS.includes(department)) {
      console.error(`Invalid department: ${department}`);
      console.error(`Valid departments: ${VALID_DEPARTMENTS.join(', ')}`);
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    const User = require('./models/user');
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('⚠️  User already exists:', existingUser.email);
      console.log('Role:', existingUser.role);
      console.log('Department:', existingUser.department);
      await mongoose.disconnect();
      process.exit(0);
    }
    
    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      employee_id: `EMP-${Date.now()}`,
      is_active: true
    });
    
    await user.save();
    console.log('✅ User created successfully!');
    console.log('Email:', user.email);
    console.log('Name:', user.name);
    console.log('Role:', user.role);
    console.log('Department:', user.department);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createUser();