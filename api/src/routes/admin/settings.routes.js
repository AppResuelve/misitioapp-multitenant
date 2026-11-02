const router = require("express").Router();
const settingsController = require("../../controllers/admin/settings.controller");
const invalidateCache = require("../../middleware/invalidateCache");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");

router.get("/", settingsController.getAll);
// A partir de acá, TODO lo que esté abajo pasa automáticamente por la invalidación
router.use(invalidateCache(invalidateBootstrapCache));
router.put("/", settingsController.setBulk);

module.exports = router;
