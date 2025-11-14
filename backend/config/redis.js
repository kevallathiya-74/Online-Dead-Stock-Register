/**
 * Redis Configuration
 * Provides caching layer for improved performance
 * Falls back gracefully if Redis is not available
 */

const Redis = require('ioredis');
const logger = require('../utils/logger');

let redisClient = null;
let isRedisAvailable = false;

// Only initialize Redis if configuration is provided
if (process.env.REDIS_HOST || process.env.REDIS_URL) {
  try {
    const redisConfig = process.env.REDIS_URL 
      ? process.env.REDIS_URL 
      : {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT || '6379'),
          password: process.env.REDIS_PASSWORD,
          retryStrategy: (times) => {
            const delay = Math.min(times * 50, 2000);
            return delay;
          },
          maxRetriesPerRequest: 3,
          enableReadyCheck: true,
          connectTimeout: 10000,
        };

    redisClient = new Redis(redisConfig);

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
      isRedisAvailable = true;
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
      isRedisAvailable = false;
    });

    redisClient.on('close', () => {
      logger.warn('Redis connection closed');
      isRedisAvailable = false;
    });

    redisClient.on('reconnecting', () => {
      logger.info('Reconnecting to Redis...');
    });
  } catch (error) {
    logger.error('Failed to initialize Redis client', { error: error.message });
  }
} else {
  logger.info('ℹ️  Redis not configured - caching disabled (using in-memory fallback)');
}

/**
 * Cache helper with fallback to in-memory
 */
const inMemoryCache = new Map();
const MEMORY_CACHE_MAX_SIZE = 100;
const MEMORY_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const cache = {
  /**
   * Get value from cache
   */
  async get(key) {
    try {
      if (isRedisAvailable && redisClient) {
        const value = await redisClient.get(key);
        return value ? JSON.parse(value) : null;
      } else {
        // Fallback to in-memory cache
        const cached = inMemoryCache.get(key);
        if (cached && Date.now() < cached.expiry) {
          return cached.value;
        } else if (cached) {
          inMemoryCache.delete(key);
        }
        return null;
      }
    } catch (error) {
      logger.error('Cache get error', { error: error.message, key });
      return null;
    }
  },

  /**
   * Set value in cache with TTL
   */
  async set(key, value, ttlSeconds = 300) {
    try {
      if (isRedisAvailable && redisClient) {
        await redisClient.setex(key, ttlSeconds, JSON.stringify(value));
      } else {
        // Fallback to in-memory cache
        if (inMemoryCache.size >= MEMORY_CACHE_MAX_SIZE) {
          // Remove oldest entry
          const firstKey = inMemoryCache.keys().next().value;
          inMemoryCache.delete(firstKey);
        }
        inMemoryCache.set(key, {
          value,
          expiry: Date.now() + (ttlSeconds * 1000)
        });
      }
    } catch (error) {
      logger.error('Cache set error', { error: error.message, key });
    }
  },

  /**
   * Delete value from cache
   */
  async del(key) {
    try {
      if (isRedisAvailable && redisClient) {
        await redisClient.del(key);
      } else {
        inMemoryCache.delete(key);
      }
    } catch (error) {
      logger.error('Cache delete error', { error: error.message, key });
    }
  },

  /**
   * Delete multiple keys matching pattern
   */
  async delPattern(pattern) {
    try {
      if (isRedisAvailable && redisClient) {
        const keys = await redisClient.keys(pattern);
        if (keys.length > 0) {
          await redisClient.del(...keys);
        }
      } else {
        // In-memory cache pattern matching
        const keysToDelete = Array.from(inMemoryCache.keys()).filter(key =>
          key.includes(pattern.replace('*', ''))
        );
        keysToDelete.forEach(key => inMemoryCache.delete(key));
      }
    } catch (error) {
      logger.error('Cache delete pattern error', { error: error.message, pattern });
    }
  },

  /**
   * Check if value exists in cache
   */
  async exists(key) {
    try {
      if (isRedisAvailable && redisClient) {
        return await redisClient.exists(key) === 1;
      } else {
        const cached = inMemoryCache.get(key);
        return cached && Date.now() < cached.expiry;
      }
    } catch (error) {
      logger.error('Cache exists error', { error: error.message, key });
      return false;
    }
  },

  /**
   * Get Redis client for advanced operations
   */
  getClient() {
    return isRedisAvailable ? redisClient : null;
  },

  /**
   * Check if Redis is available
   */
  isAvailable() {
    return isRedisAvailable;
  }
};

// Clean up in-memory cache periodically
if (!isRedisAvailable) {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of inMemoryCache.entries()) {
      if (now >= value.expiry) {
        inMemoryCache.delete(key);
      }
    }
  }, 60000); // Clean every minute
}

module.exports = cache;
