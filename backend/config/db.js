const mongoose = require('mongoose');
require('dotenv').config();

// Use native promises
mongoose.Promise = global.Promise;

// Configure mongoose settings for better stability
mongoose.set('strictQuery', false);

const connectDB = async (retries = 5) => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set (length: ' + process.env.MONGODB_URI.length + ')' : 'Not Set');
    
    // Optimized connection options for MongoDB Atlas
    const options = {
      // Connection timeout settings
      serverSelectionTimeoutMS: 30000, // 30 seconds for initial connection
      socketTimeoutMS: 45000, // 45 seconds
      connectTimeoutMS: 30000, // 30 seconds for connection establishment
      
      // Connection pool settings
      maxPoolSize: 10, // Maximum concurrent connections
      minPoolSize: 2, // Minimum persistent connections
      maxIdleTimeMS: 60000, // 1 minute idle timeout
      
      // Automatic reconnection
      retryWrites: true,
      retryReads: true,
      
      // Network settings
      family: 4, // Use IPv4, skip trying IPv6
      heartbeatFrequencyMS: 10000, // Check connection health every 10 seconds
      
      // Compression
      compressors: ['zlib'],
    };

    console.log('Attempting MongoDB connection...');
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    console.log('Connection successful!');

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
    // Set up connection event handlers (only once)
    if (!mongoose.connection._hasEventListeners) {
      mongoose.connection.on('error', err => {
        console.error('❌ MongoDB connection error:', err.message);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected - will attempt to reconnect...');
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
      });

      mongoose.connection.on('connected', () => {
        console.log('🔗 MongoDB connection established');
      });

      mongoose.connection._hasEventListeners = true;
    }

    return conn;
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    
    // Provide helpful error messages
    if (error.name === 'MongooseServerSelectionError') {
      console.error('\n🔧 Troubleshooting steps:');
      console.error('1. Check if your IP address is whitelisted in MongoDB Atlas');
      console.error('2. Verify your MONGODB_URI in .env file');
      console.error('3. Ensure your network connection is stable');
      console.error('4. Check if MongoDB Atlas cluster is active\n');
    }
    
    if (retries > 0) {
      console.log(`🔄 Retrying connection... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    } else {
      console.error('💥 All connection attempts failed. Exiting...');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
