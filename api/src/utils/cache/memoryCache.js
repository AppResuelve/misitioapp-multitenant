// src/utils/cache/memoryCache.js
const { LRUCache } = require("lru-cache");

const createMemoryCache = ({ max = 500, ttlMs = 1000 * 60 * 15 } = {}) => {
  const cache = new LRUCache({
    max,
    ttl: ttlMs,
  });

  return {
    get: (key) => {
      if (!key) return null;
      return cache.get(String(key).toLowerCase().trim());
    },
    set: (key, value) => {
      if (!key || value === undefined) return;
      cache.set(String(key).toLowerCase().trim(), value);
    },
    del: (key) => {
      if (!key) return;
      cache.delete(String(key).toLowerCase().trim());
    },
    delPrefix: (prefix) => {
      if (!prefix) return;
      const cleanPrefix = String(prefix).toLowerCase().trim();
      for (const key of cache.keys()) {
        if (key.startsWith(cleanPrefix)) {
          cache.delete(key);
        }
      }
    },
    clear: () => cache.clear(),
  };
};

module.exports = { createMemoryCache };
