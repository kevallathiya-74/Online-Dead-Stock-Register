/**
 * MongoDB Connection Utilities
 * Provides helper functions to maintain stable database connections
 */

const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Check if MongoDB connection is healthy
 * @returns {Promise<boolean>}
 */
const isConnectionHealthy = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }
    
    // Perform actual ping to verify connection
    await mongoose.connection.db.admin().ping();
    return true;
  } catch (error) {
    logger.error('Connection health check failed:', error.message);
    return false;
  }
};

/**
 * Get connection state as human-readable string
 * @returns {string}
 */
const getConnectionState = () => {
  const states = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
    99: 'uninitialized'
  };
  
  return states[mongoose.connection.readyState] || 'unknown';
};

/**
 * Get detailed connection info
 * @returns {object}
 */
const getConnectionInfo = () => {
  return {
    state: getConnectionState(),
    readyState: mongoose.connection.readyState,
    host: mongoose.connection.host || 'N/A',
    name: mongoose.connection.name || 'N/A',
    models: Object.keys(mongoose.connection.models).length,
    collections: Object.keys(mongoose.connection.collections).length
  };
};

/**
 * Ensure connection is active, reconnect if needed
 * @returns {Promise<boolean>}
 */
const ensureConnection = async () => {
  try {
    const healthy = await isConnectionHealthy();
    
    if (!healthy) {
      logger.warn('Connection not healthy, attempting reconnection...');
      // Mongoose will handle reconnection automatically with the configured options
      // Just wait a bit for reconnection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check again
      return await isConnectionHealthy();
    }
    
    return true;
  } catch (error) {
    logger.error('Error ensuring connection:', error.message);
    return false;
  }
};

/**
 * Execute database operation with automatic retry on connection failure
 * @param {Function} operation - Async function to execute
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise<any>}
 */
const withRetry = async (operation, maxRetries = 3) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure connection is healthy before operation
      const connected = await ensureConnection();
      
      if (!connected && attempt < maxRetries) {
        logger.warn(`Connection not ready, retry ${attempt}/${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      
      // Execute the operation
      return await operation();
      
    } catch (error) {
      lastError = error;
      logger.error(`Operation failed (attempt ${attempt}/${maxRetries}):`, error.message);
      
      // Check if it's a connection error
      if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
        if (attempt < maxRetries) {
          logger.warn(`Retrying after connection error...`);
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
      }
      
      // If not a connection error or last attempt, throw
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }
  
  throw lastError;
};

/**
 * Get connection pool statistics
 * @returns {object}
 */
const getPoolStats = () => {
  try {
    const client = mongoose.connection.getClient();
    const topology = client?.topology;
    
    if (!topology) {
      return { available: 'N/A', message: 'Connection not established' };
    }
    
    return {
      state: getConnectionState(),
      poolSize: topology.s?.poolOptions?.maxPoolSize || 'N/A',
      availableConnections: topology.s?.pool?.availableConnectionCount || 'N/A',
      currentConnections: topology.s?.pool?.currentConnectionCount || 'N/A',
    };
  } catch (error) {
    return { error: error.message };
  }
};

module.exports = {
  isConnectionHealthy,
  getConnectionState,
  getConnectionInfo,
  ensureConnection,
  withRetry,
  getPoolStats
};
