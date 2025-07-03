const { createClient } = require("redis");

let redisClient = null;

/**
 * Initialize Redis client
 * @returns {Promise<Object>} - Redis client instance
 */
const initRedis = async () => {
  try {
    if (redisClient) return redisClient;

    // Default values for Redis connection
    const redisHost = process.env.REDIS_HOST || "localhost";
    const redisPort = process.env.REDIS_PORT || "6379";
    const redisPassword = process.env.REDIS_PASSWORD || "";

    // Check if Redis is disabled (for development/testing)
    if (process.env.DISABLE_REDIS === "true") {
      console.log("Redis is disabled. Using in-memory cache.");
      // Return a mock Redis client with the same interface
      return {
        set: async () => true,
        get: async () => null,
        del: async () => true,
        keys: async () => [],
        connect: async () => {},
      };
    }

    redisClient = createClient({
      url: `redis://${redisHost}:${redisPort}`,
      password: redisPassword || undefined,
    });

    redisClient.on("error", (err) => {
      console.error("Redis error:", err);
    });

    await redisClient.connect();
    console.log("Redis connected successfully");

    return redisClient;
  } catch (error) {
    console.error("Redis connection error:", error);
    console.log("Falling back to in-memory cache");

    // Return a mock Redis client with the same interface
    return {
      set: async () => true,
      get: async () => null,
      del: async () => true,
      keys: async () => [],
      connect: async () => {},
    };
  }
};

/**
 * Set cache with expiry
 * @param {String} key - Cache key
 * @param {any} value - Value to cache
 * @param {Number} expiry - Expiry time in seconds
 * @returns {Promise<Boolean>} - Success status
 */
const setCache = async (key, value, expiry = 3600) => {
  try {
    const client = await initRedis();
    await client.set(key, JSON.stringify(value), { EX: expiry });
    return true;
  } catch (error) {
    console.error("Redis set error:", error);
    return false;
  }
};

/**
 * Get cached value
 * @param {String} key - Cache key
 * @returns {Promise<any>} - Cached value or null
 */
const getCache = async (key) => {
  try {
    const client = await initRedis();
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error("Redis get error:", error);
    return null;
  }
};

/**
 * Delete cache
 * @param {String} key - Cache key
 * @returns {Promise<Boolean>} - Success status
 */
const deleteCache = async (key) => {
  try {
    const client = await initRedis();
    await client.del(key);
    return true;
  } catch (error) {
    console.error("Redis delete error:", error);
    return false;
  }
};

/**
 * Clear cache by pattern
 * @param {String} pattern - Key pattern to match
 * @returns {Promise<Boolean>} - Success status
 */
const clearCacheByPattern = async (pattern) => {
  try {
    const client = await initRedis();
    const keys = await client.keys(pattern);

    if (keys.length > 0) {
      await client.del(keys);
    }

    return true;
  } catch (error) {
    console.error("Redis clear pattern error:", error);
    return false;
  }
};

module.exports = {
  initRedis,
  setCache,
  getCache,
  deleteCache,
  clearCacheByPattern,
};
