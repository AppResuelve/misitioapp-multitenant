const { AsyncLocalStorage } = require('async_hooks')

const storage = new AsyncLocalStorage()

// Ejecuta `fn` con el tenant_id en el contexto de la request actual.
const run = (tenantId, fn) => storage.run({ tenantId }, fn)

// Devuelve el tenant_id del contexto actual (o null si no hay).
const getTenantId = () => storage.getStore()?.tenantId ?? null

module.exports = { run, getTenantId }
