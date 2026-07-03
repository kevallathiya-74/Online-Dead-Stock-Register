/**
 * Supabase Database Utilities
 * Provides helper functions for database operations with Supabase PostgreSQL
 */

const getSupabase = require("../config/db");
const logger = require("../utils/logger");

/**
 * Check if Supabase connection is healthy
 * @returns {Promise<boolean>}
 */
const isConnectionHealthy = async () => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (error) {
      logger.error("Connection health check failed:", error.message);
      return false;
    }

    return true;
  } catch (error) {
    logger.error("Connection health check failed:", error.message);
    return false;
  }
};

/**
 * Get connection state as human-readable string
 * @returns {string}
 */
const getConnectionState = () => {
  try {
    const supabase = getSupabase();
    return supabase ? "connected" : "disconnected";
  } catch (error) {
    return "error";
  }
};

/**
 * Get detailed connection info
 * @returns {object}
 */
const getConnectionInfo = () => {
  try {
    const supabase = getSupabase();
    return {
      state: "connected",
      database: "PostgreSQL (Supabase)",
      url: process.env.SUPABASE_URL
        ? process.env.SUPABASE_URL.substring(0, 30) + "..."
        : "Not configured",
    };
  } catch (error) {
    return {
      state: "error",
      error: error.message,
    };
  }
};

/**
 * Ensure connection is active
 * @returns {Promise<boolean>}
 */
const ensureConnection = async () => {
  return await isConnectionHealthy();
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
      // Execute the operation
      return await operation();
    } catch (error) {
      lastError = error;
      logger.error(
        `Operation failed (attempt ${attempt}/${maxRetries}):`,
        error.message,
      );

      // Check if it's a network/connection error
      if (
        error.code === "PGRST301" ||
        error.message?.includes("network") ||
        error.message?.includes("timeout")
      ) {
        if (attempt < maxRetries) {
          logger.warn(`Retrying after connection error...`);
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
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
  return {
    status: "Supabase manages connection pooling automatically",
    type: "PostgreSQL via Supabase",
    pooler: "PgBouncer (managed by Supabase)",
  };
};

/**
 * Convert MongoDB-style filter to PostgreSQL where clause
 * @param {object} filter - MongoDB-style filter
 * @returns {object} - PostgreSQL filter for Supabase
 */
const normalizeFilter = (filter) => {
  // Convert common MongoDB operators to PostgreSQL equivalents
  const normalized = {};

  for (const [key, value] of Object.entries(filter)) {
    if (typeof value === "object" && value !== null) {
      // Handle MongoDB operators
      if (value.$eq) normalized[key] = { eq: value.$eq };
      else if (value.$ne) normalized[key] = { neq: value.$ne };
      else if (value.$gt) normalized[key] = { gt: value.$gt };
      else if (value.$gte) normalized[key] = { gte: value.$gte };
      else if (value.$lt) normalized[key] = { lt: value.$lt };
      else if (value.$lte) normalized[key] = { lte: value.$lte };
      else if (value.$in) normalized[key] = { in: value.$in };
      else if (value.$nin) normalized[key] = { not: { in: value.$nin } };
      else normalized[key] = value;
    } else {
      normalized[key] = value;
    }
  }

  return normalized;
};

module.exports = {
  isConnectionHealthy,
  getConnectionState,
  getConnectionInfo,
  ensureConnection,
  withRetry,
  getPoolStats,
  normalizeFilter,
};
