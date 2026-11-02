const express = require("express");
const router = express.Router();
const paymentController = require("../../controllers/admin/payment.controller");
const invalidateCache = require("../../middleware/invalidateCache");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");

// GET /api/payment-methods
router.get("/", paymentController.list);
// A partir de acá, TODO lo que esté abajo pasa automáticamente por la invalidación
router.use(invalidateCache(invalidateBootstrapCache));
router.post("/", paymentController.create);
router.put("/reorder", paymentController.reorder);
router.put("/:id", paymentController.update);
router.delete("/:id", paymentController.remove);

module.exports = router;
