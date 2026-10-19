const { Router } = require("express");
const internalController = require("../controllers/admin/internal.controller");
const internalAuth = require("../middleware/internalAuth");
const resolveTenant = require("../middleware/resolveTenant");

const router = Router();

// 1. Todas las rutas internas validan el token de la plataforma
router.use(internalAuth);

// 2. Rutas globales del SaaS (no necesitan tenant previo)
router.post("/tenants", internalController.createTenant);
router.get("/tenants", internalController.listTenants);
router.put("/tenants/:slug", internalController.updateTenant);

// 3. A partir de acá, todas las rutas operan sobre un tenant concreto
router.use(resolveTenant);

// Admin del Tenant
router.post("/create-admin", internalController.createAdmin);
router.get("/admin-status", internalController.getAdminStatus);
router.post("/resend-activation", internalController.resendActivation);

// Facturación y Pagos
router.get("/billing-status", internalController.getBillingStatus);
router.post("/billing-status", internalController.setBillingStatus);
router.put("/billing-status", internalController.setBillingStatus);
router.post("/register-payment", internalController.registerTenantPayment);

module.exports = router;
