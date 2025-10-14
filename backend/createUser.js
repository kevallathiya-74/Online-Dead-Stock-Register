const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function createUser() {
  try {
    // Get user details from environment variables or command line arguments
    const email = process.env.CREATE_USER_EMAIL || process.argv[2];
    const password = process.env.CREATE_USER_PASSWORD || process.argv[3];
    const name = process.env.CREATE_USER_NAME || process.argv[4];
    const role = process.env.CREATE_USER_ROLE || process.argv[5] || 'employee';
    
    if (!email || !password || !name) {
      console.error('Usage: node createUser.js <email> <password> <name> [role]');
      console.error('Or set environment variables: CREATE_USER_EMAIL, CREATE_USER_PASSWORD, CREATE_USER_NAME, CREATE_USER_ROLE');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dead-stock-register');
    console.log('Connected to MongoDB');
    
    const User = require('./models/user');
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log('User already exists:', existingUser.email);
      console.log('Role:', existingUser.role);
      process.exit(0);
    }
    
    // Create new user
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department: 'General',
      employee_id: `EMP${Date.now().toString().slice(-6)}`,
      is_active: true
    });
    
    await user.save();
    console.log('User created successfully:', user.email);
    console.log('Role:', user.role);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createUser();