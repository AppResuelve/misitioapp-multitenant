// src/utils/cache/productsCache.js
const { createMemoryCache } = require("./memoryCache");

// Caché para hasta 2.000 listados de productos en memoria con TTL de 3 minutos
const cache = createMemoryCache({ max: 2000, ttlMs: 1000 * 60 * 3 });

/**
 * Genera una clave determinista a partir de los filtros recibidos
 */
const buildProductQueryKey = (tenantId, query = {}) => {
  const {
    page = 1,
    limit = 24,
    categoryId = "",
    categorySlug = "",
    tagIds = "",
  } = query;

  const normalizedTags = Array.isArray(tagIds)
    ? tagIds.slice().sort().join(",")
    : String(tagIds);

  return `p:${tenantId}:cat=${categoryId || categorySlug}:tags=${normalizedTags}:p=${page}:l=${limit}`;
};

const getCachedProducts = (tenantId, query = {}) => {
  // Las búsquedas libres por texto (search) no se cachean en memoria
  if (query.search) return null;
  const key = buildProductQueryKey(tenantId, query);
  return cache.get(key);
};

const setCachedProducts = (tenantId, query = {}, data) => {
  if (query.search) return;
  const key = buildProductQueryKey(tenantId, query);
  cache.set(key, data);
};

/**
 * Invalida todas las páginas, filtros y listados de productos de un tenant puntual
 */
const invalidateTenantProducts = (tenantId) => {
  if (!tenantId) return;
  cache.delPrefix(`p:${tenantId}:`);
};

module.exports = {
  getCachedProducts,
  setCachedProducts,
  invalidateTenantProducts,
};
