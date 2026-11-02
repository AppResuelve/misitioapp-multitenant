const discountsController = require("../../controllers/admin/discounts.controller");
const invalidateCache = require("../../middleware/invalidateCache");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");
const { invalidateTenantProducts } = require("../../utils/cache/productsCache");

const router = require("express").Router();

router.get("/", discountsController.list);
// A partir de acá, TODO lo que esté abajo pasa automáticamente por la invalidación
router.use(invalidateCache(invalidateBootstrapCache, invalidateTenantProducts));
router.post("/", discountsController.create);
router.patch("/:id/status", discountsController.setStatus);
router.put("/:id", discountsController.update);
router.delete("/:id", discountsController.remove);

module.exports = router;
