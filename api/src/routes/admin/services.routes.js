const servicesController = require("../../controllers/admin/services.controller");
const invalidateCache = require("../../middleware/invalidateCache");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");

const router = require("express").Router();

router.get("/", servicesController.list);
router.get("/:id", servicesController.getById);
// A partir de acá, TODO lo que esté abajo pasa automáticamente por la invalidación
router.use(invalidateCache(invalidateBootstrapCache));
router.post("/", servicesController.create);
router.put("/:id", servicesController.update);
router.delete("/:id", servicesController.remove);

module.exports = router;
