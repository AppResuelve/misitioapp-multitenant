const productsController = require("../../controllers/admin/products.controller");
const invalidateCache = require("../../middleware/invalidateCache");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");

const router = require("express").Router();

router.get("/", productsController.list);
router.get("/export", productsController.exportProducts);
router.get("/:id", productsController.getById);
// A partir de acá, TODO lo que esté abajo pasa automáticamente por la invalidación
router.use(invalidateCache(invalidateBootstrapCache));
router.post("/", productsController.create);
router.patch("/:id/status", productsController.toggleStatus);
router.put("/:id", productsController.update);
router.delete("/:id", productsController.remove);
router.post("/bulk", productsController.bulkCreate);
router.post("/bulk-update/preview", productsController.previewDiff);
router.post("/bulk-update", productsController.bulkUpdate);
router.post("/bulk-update/system", productsController.systemUpdate);

module.exports = router;
