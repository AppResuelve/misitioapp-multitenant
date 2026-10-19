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
    clear: () => cache.clear(),
  };
};

// Instancias compartidas para toda la aplicación
const settingsCache = createMemoryCache({ max: 1000, ttlMs: 1000 * 60 * 15 }); // 15 min
const tenantCache = createMemoryCache({ max: 500, ttlMs: 1000 * 60 * 5 }); // 5 min

module.exports = {
  createMemoryCache,
  settingsCache,
  tenantCache,
};
