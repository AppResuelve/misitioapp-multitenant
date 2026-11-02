const { createMemoryCache } = require("./memoryCache");

// TTL de 15 minutos para el payload de inicio de tienda
const cache = createMemoryCache({ max: 1000, ttlMs: 1000 * 60 * 15 });

const getCachedBootstrap = (tenantId) => cache.get(tenantId);

const setCachedBootstrap = (tenantId, data) => {
  cache.set(tenantId, data);
};

const invalidateBootstrapCache = (tenantId) => {
  cache.del(tenantId);
};

module.exports = {
  getCachedBootstrap,
  setCachedBootstrap,
  invalidateBootstrapCache,
};
