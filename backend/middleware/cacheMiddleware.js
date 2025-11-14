/**
 * Cache Middleware
 * Provides caching for GET requests with configurable TTL
 */

const cache = require('../config/redis');
const logger = require('../utils/logger');

/**
 * Cache middleware for GET requests
 * @param {number} duration - Cache duration in seconds (default: 5 minutes)
 * @param {function} keyGenerator - Optional custom key generator
 */
const cacheMiddleware = (duration = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator 
      ? keyGenerator(req)
      : `cache:${req.originalUrl || req.url}:${req.user?.id || 'anonymous'}`;

    try {
      // Try to get from cache
      const cachedData = await cache.get(cacheKey);

      if (cachedData) {
        logger.debug('Cache hit', { key: cacheKey, requestId: req.id });
        
        // Add cache header
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        
        return res.json(cachedData);
      }

      // Cache miss - intercept response
      logger.debug('Cache miss', { key: cacheKey, requestId: req.id });
      res.setHeader('X-Cache', 'MISS');

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = function(body) {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          cache.set(cacheKey, body, duration).catch(err => {
            logger.error('Failed to set cache', { error: err.message, key: cacheKey });
          });
        }

        // Call original json method
        return originalJson(body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error', { error: error.message, requestId: req.id });
      // Continue without caching if error occurs
      next();
    }
  };
};

/**
 * Middleware to invalidate cache patterns
 * Use this after mutations (POST, PUT, DELETE)
 */
const invalidateCache = (patterns) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to invalidate cache after response
    res.json = function(body) {
      // Only invalidate on successful mutations
      if (res.statusCode >= 200 && res.statusCode < 300) {
        Promise.all(
          patterns.map(pattern => cache.delPattern(pattern))
        ).catch(err => {
          logger.error('Failed to invalidate cache', { error: err.message, patterns });
        });
      }

      return originalJson(body);
    };

    next();
  };
};

/**
 * Custom cache key generator for user-specific data
 */
const userCacheKey = (prefix) => {
  return (req) => {
    const userId = req.user?.id || 'anonymous';
    const queryString = new URLSearchParams(req.query).toString();
    return `${prefix}:${userId}:${queryString || 'default'}`;
  };
};

/**
 * Conditional cache middleware
 * Only caches if condition is met
 */
const conditionalCache = (duration, condition) => {
  return async (req, res, next) => {
    if (condition(req)) {
      return cacheMiddleware(duration)(req, res, next);
    }
    next();
  };
};

module.exports = {
  cacheMiddleware,
  invalidateCache,
  userCacheKey,
  conditionalCache,
  cache, // Export cache instance for manual operations
};
