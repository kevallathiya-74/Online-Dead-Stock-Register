const mongoose = require('mongoose');
require('dotenv').config();

// Use native promises
mongoose.Promise = global.Promise;

const connectDB = async (retries = 5) => {
  try {
    console.log('Connecting to MongoDB...');
    // Try a simpler connection config first
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    // Set up connection error handlers
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Log more details about the error
    if (error.name === 'MongoServerSelectionError') {
      console.error('Server Selection Error Details:', {
        message: error.message,
        reason: error.reason,
        topology: error.topology
      });
    }
    
    if (retries > 0) {
      console.log(`Retrying connection... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      return connectDB(retries - 1);
    } else {
      console.error('All connection attempts failed');
      process.exit(1);
    }
  }
};

module.exports = connectDB;
