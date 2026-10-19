const router = require("express").Router();
const billingController = require("../../controllers/admin/billing.controller");

// GET /api/admin/billing
router.get("/", billingController.getTenantBilling);

module.exports = router;
