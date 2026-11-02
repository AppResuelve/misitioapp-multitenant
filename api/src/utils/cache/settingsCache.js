const { createMemoryCache } = require("./memoryCache");

// Caché para 1000 tiendas con TTL de 12 horas
const cache = createMemoryCache({ max: 1000, ttlMs: 1000 * 60 * 60 * 12 });

const getCachedSettings = (tenantId) => cache.get(tenantId);

const setCachedSettings = (tenantId, settingsData) => {
  cache.set(tenantId, settingsData);
};

const invalidateSettingsCache = (tenantId) => {
  cache.del(tenantId);
};

module.exports = {
  getCachedSettings,
  setCachedSettings,
  invalidateSettingsCache,
};
