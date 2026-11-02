const categoriesController = require("../../controllers/admin/categories.controller");
const invalidateCache = require("../../middleware/invalidateCache");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");

const router = require("express").Router();

router.get("/", categoriesController.list);
router.get("/:id", categoriesController.getById);
// A partir de acá, TODO lo que esté abajo pasa automáticamente por la invalidación
router.use(invalidateCache(invalidateBootstrapCache));
router.put("/reorder", categoriesController.reorder);
router.post("/", categoriesController.create);
router.patch("/:id/status", categoriesController.toggleStatus);
router.put("/:id", categoriesController.update);
router.delete("/:id", categoriesController.remove);

module.exports = router;
