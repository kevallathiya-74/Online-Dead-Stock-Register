/**
 * MongoDB Connection Troubleshooter
 * 
 * This script helps diagnose MongoDB Atlas connection issues
 * Run with: node backend/scripts/testMongoConnection.js
 */

require('dotenv').config();
const mongoose = require('mongoose');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  title: (msg) => console.log(`\n${colors.bright}${colors.blue}━━━ ${msg} ━━━${colors.reset}\n`)
};

async function testMongoConnection() {
  log.title('MongoDB Connection Troubleshooter');

  // Step 1: Check environment variables
  log.info('Step 1: Checking environment variables...');
  
  const requiredVars = ['MONGODB_URI', 'JWT_SECRET', 'PORT'];
  let envValid = true;

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      log.error(`Missing environment variable: ${varName}`);
      envValid = false;
    } else {
      log.success(`${varName}: ${varName === 'MONGODB_URI' ? '***' + process.env[varName].slice(-20) : '✓'}`);
    }
  });

  if (!envValid) {
    log.error('Please check your .env file');
    process.exit(1);
  }

  // Step 2: Parse MongoDB URI
  log.title('Step 2: Parsing MongoDB URI');
  
  const uri = process.env.MONGODB_URI;
  
  try {
    const urlPattern = /mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)/;
    const match = uri.match(urlPattern);
    
    if (match) {
      const [, username, password, cluster, database] = match;
      log.success(`Username: ${username}`);
      log.success(`Password: ${'*'.repeat(password.length)}`);
      log.success(`Cluster: ${cluster}`);
      log.success(`Database: ${database}`);
    } else {
      log.warn('Could not parse MongoDB URI - might use different format');
    }
  } catch (error) {
    log.error(`URI parsing failed: ${error.message}`);
  }

  // Step 3: Check internet connectivity
  log.title('Step 3: Checking Internet Connectivity');
  
  const dns = require('dns').promises;
  
  try {
    await dns.lookup('mongodb.net');
    log.success('Can resolve mongodb.net DNS');
  } catch (error) {
    log.error(`DNS resolution failed: ${error.message}`);
    log.warn('Check your internet connection');
  }

  // Step 4: Attempt MongoDB connection
  log.title('Step 4: Attempting MongoDB Connection');
  
  const connectionOptions = {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  };

  log.info('Connecting to MongoDB Atlas...');
  log.info('Timeout: 10 seconds');
  
  const startTime = Date.now();
  
  try {
    await mongoose.connect(uri, connectionOptions);
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log.success(`✨ Connected successfully in ${duration}s!`);
    log.success(`Host: ${mongoose.connection.host}`);
    log.success(`Database: ${mongoose.connection.name}`);
    log.success(`Ready State: ${mongoose.connection.readyState}`);

    // Step 5: Test database operations
    log.title('Step 5: Testing Database Operations');

    // List collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    log.success(`Found ${collections.length} collections:`);
    collections.forEach(col => {
      console.log(`   - ${col.name}`);
    });

    // Count users
    const User = require('../models/user');
    const userCount = await User.countDocuments();
    log.success(`User count: ${userCount}`);

    if (userCount === 0) {
      log.warn('No users found in database!');
      log.info('Run: node backend/scripts/createUser.js');
    }

    // Count assets
    const Asset = require('../models/asset');
    const assetCount = await Asset.countDocuments();
    log.success(`Asset count: ${assetCount}`);

    // Step 6: Connection health check
    log.title('Step 6: Connection Health Check');

    const adminUtil = mongoose.connection.db.admin();
    const serverStatus = await adminUtil.serverStatus();
    
    log.success(`MongoDB Version: ${serverStatus.version}`);
    log.success(`Uptime: ${Math.floor(serverStatus.uptime / 3600)} hours`);
    log.success(`Connections: ${serverStatus.connections.current} current`);

    // Close connection
    await mongoose.connection.close();
    log.success('Connection closed cleanly');

    log.title('✨ All Tests Passed!');
    log.success('MongoDB connection is working correctly');
    log.info('You can now run: node server.js');
    
    process.exit(0);

  } catch (error) {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    log.error(`Connection failed after ${duration}s`);
    log.error(`Error: ${error.message}`);

    log.title('🔧 Troubleshooting Steps');

    if (error.message.includes('IP') || error.message.includes('whitelist')) {
      log.warn('IP WHITELIST ISSUE DETECTED');
      console.log('\n📋 Solution Steps:');
      console.log('1. Go to: https://cloud.mongodb.com/');
      console.log('2. Select your project');
      console.log('3. Navigate to: Network Access → IP Access List');
      console.log('4. Click: "Add IP Address"');
      console.log('5. Choose:');
      console.log('   - "Add Current IP Address" (recommended for testing)');
      console.log('   - OR "Allow Access from Anywhere" (0.0.0.0/0) - ⚠️ NOT for production!');
      console.log('6. Click "Confirm"');
      console.log('7. Wait 2-3 minutes for changes to propagate');
      console.log('8. Re-run this script\n');
    }

    if (error.message.includes('authentication')) {
      log.warn('AUTHENTICATION ISSUE DETECTED');
      console.log('\n📋 Solution Steps:');
      console.log('1. Check username/password in MONGODB_URI');
      console.log('2. Verify database user exists in MongoDB Atlas');
      console.log('3. Check user has correct permissions (readWrite)');
      console.log('4. Password should be URL-encoded if contains special characters\n');
    }

    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      log.warn('DNS/NETWORK ISSUE DETECTED');
      console.log('\n📋 Solution Steps:');
      console.log('1. Check your internet connection');
      console.log('2. Verify cluster hostname in MONGODB_URI');
      console.log('3. Try: ping cluster-name.mongodb.net');
      console.log('4. Check firewall/antivirus settings\n');
    }

    if (error.message.includes('timeout')) {
      log.warn('TIMEOUT ISSUE DETECTED');
      console.log('\n📋 Solution Steps:');
      console.log('1. Check internet connection speed');
      console.log('2. Verify MongoDB Atlas cluster is not paused');
      console.log('3. Try again in a few minutes');
      console.log('4. Check MongoDB Atlas status: https://status.mongodb.com/\n');
    }

    log.title('📊 Connection Details');
    console.log(`Attempt started: ${new Date(startTime).toISOString()}`);
    console.log(`Duration: ${duration}s`);
    console.log(`Error Type: ${error.name}`);
    console.log(`Error Code: ${error.code || 'N/A'}`);
    
    if (error.reason) {
      console.log(`\nDetailed Reason:`);
      console.log(error.reason);
    }

    process.exit(1);
  }
}

// Run the test
console.log(`${colors.bright}MongoDB Connection Troubleshooter${colors.reset}`);
console.log(`${colors.cyan}Starting diagnostic tests...${colors.reset}\n`);

testMongoConnection().catch(error => {
  log.error('Unexpected error:');
  console.error(error);
  process.exit(1);
});
