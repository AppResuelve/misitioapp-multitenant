const internalController = require('../controllers/admin/internal.controller')
const internalAuth = require('../middleware/internalAuth')
const resolveTenant = require('../middleware/resolveTenant')

const router = require('express').Router()

// Gestión de tenants (sin resolveTenant: operan sobre la tabla tenants)
router.post('/tenants', internalAuth, internalController.createTenant)
router.get('/tenants', internalAuth, internalController.listTenants)
router.put('/tenants/:slug', internalAuth, internalController.updateTenant)

// Endpoints que operan sobre un tenant específico (requieren X-Tenant-Slug)
router.post('/create-admin', internalAuth, resolveTenant, internalController.createAdmin)
router.get('/admin-status', internalAuth, resolveTenant, internalController.getAdminStatus)
router.post('/resend-activation', internalAuth, resolveTenant, internalController.resendActivation)
router.post('/seed-settings', internalAuth, resolveTenant, internalController.seedSettings)
router.post('/seed-products', internalAuth, resolveTenant, internalController.seedProducts)
router.post('/seed-services', internalAuth, resolveTenant, internalController.seedServices)
router.get('/billing-status', internalAuth, resolveTenant, internalController.getBillingStatus)
router.post('/billing-status', internalAuth, resolveTenant, internalController.setBillingStatus)

module.exports = router
