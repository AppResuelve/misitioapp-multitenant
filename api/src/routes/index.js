const authMiddleware = require('../middleware/auth')
const storeStatusMiddleware = require('../middleware/storeStatus')
const resolveTenant = require('../middleware/resolveTenant')
const billingGuard = require('../middleware/billingGuard')
const { authLimiter, generalLimiter, globalIpLimiter } = require('../middleware/rateLimiter')

const mountRoutes = (app) => {
  // Aplicar rate limiting a toda la API
  app.use('/api', globalIpLimiter)
  app.use('/api', generalLimiter)

  // Auth (pública) — resuelve tenant por X-Tenant-Slug
  app.use('/api/auth', authLimiter, resolveTenant, require('./auth.routes'))

  // Admin (resuelve tenant + JWT + tienda no suspendida)
  app.use('/api/admin', resolveTenant, authMiddleware, billingGuard)
  app.use('/api/admin/dashboard', require('./admin/dashboard.routes'))
  app.use('/api/admin/products', require('./admin/products.routes'))
  app.use('/api/admin/categories', require('./admin/categories.routes'))
  app.use('/api/admin/orders', require('./admin/orders.routes'))
  app.use('/api/admin/settings', require('./admin/settings.routes'))
  app.use('/api/admin/upload', require('./admin/upload.routes'))
  app.use('/api/admin/change-requests', require('./admin/changeRequests.routes'))
  app.use('/api/admin/services', require('./admin/services.routes'))
  app.use('/api/admin/attributes', require('./admin/attributes.routes'))
  app.use('/api/admin/tags', require('./admin/tags.routes'))
  app.use('/api/admin/discounts', require('./admin/discounts.routes'))

  // Internal (requiere APPRESUELVE_SECRET — tenant explícito en cada endpoint)
  app.use('/api/internal', require('./internal.routes'))

  // Store (pública — resuelve tenant por X-Tenant-Slug)
  app.use('/api/store/products', resolveTenant, storeStatusMiddleware, require('./store/products.routes'))
  app.use('/api/store/categories', resolveTenant, storeStatusMiddleware, require('./store/categories.routes'))
  app.use('/api/store/settings', resolveTenant, require('./store/settings.routes'))
  app.use('/api/store/orders', resolveTenant, storeStatusMiddleware, require('./store/orders.routes'))
  app.use('/api/store/services', resolveTenant, storeStatusMiddleware, require('./store/services.routes'))
  app.use('/api/store/tags', resolveTenant, storeStatusMiddleware, require('./store/tags.routes'))
  app.use('/api/store/discounts', resolveTenant, require('./store/discounts.routes'))
}

module.exports = mountRoutes
