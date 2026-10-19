const { createMemoryCache } = require("./cache");

// Caché para 500 tenants con TTL de 5 minutos
const cache = createMemoryCache({ max: 500, ttlMs: 1000 * 60 * 5 });

const getCachedTenant = (key) => cache.get(key);

const setCachedTenant = (tenant) => {
  if (!tenant) return;
  const data = tenant.toJSON ? tenant.toJSON() : tenant;

  if (data.slug) cache.set(data.slug, data);
  if (data.domain) cache.set(data.domain, data);
  if (data.adminDomain) cache.set(data.adminDomain, data);
  if (data.id) cache.set(data.id, data);
};

const invalidateTenantCache = (tenant) => {
  if (!tenant) return;
  const data = tenant.toJSON ? tenant.toJSON() : tenant;

  if (data.slug) cache.del(data.slug);
  if (data.domain) cache.del(data.domain);
  if (data.adminDomain) cache.del(data.adminDomain);
  if (data.id) cache.del(data.id);
};

module.exports = {
  getCachedTenant,
  setCachedTenant,
  invalidateTenantCache,
};