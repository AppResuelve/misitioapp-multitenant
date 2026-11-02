// src/middlewares/invalidateCache.js

const invalidateCache = (...invalidators) => {
  return (req, res, next) => {
    // 🛡️ Blindaje: Si es una lectura (GET, HEAD, OPTIONS), ni siquiera registramos el evento finish
    const method = req.method.toUpperCase();
    if (["GET", "HEAD", "OPTIONS"].includes(method)) {
      return next();
    }

    res.on("finish", () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const tenantId = req.tenant?.id || req.user?.tenantId || req.tenantId;

        if (!tenantId || invalidators.length === 0) return;

        if (invalidators.length === 1) {
          try {
            const invalidator = invalidators[0];
            if (typeof invalidator === "function") {
              invalidator(tenantId);
            }
          } catch (err) {
            console.error(
              `[CACHE_INVALIDATION] ❌ Error invalidando caché para tenant ${tenantId}:`,
              err.message,
            );
          }
          return;
        }

        for (const invalidator of invalidators) {
          try {
            if (typeof invalidator === "function") {
              invalidator(tenantId);
            }
          } catch (err) {
            console.error(
              `[CACHE_INVALIDATION] ❌ Error invalidando caché para tenant ${tenantId}:`,
              err.message,
            );
          }
        }
      }
    });

    next();
  };
};

module.exports = invalidateCache;
