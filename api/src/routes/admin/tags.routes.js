const tagsController = require("../../controllers/admin/tags.controller");
const invalidateCache = require("../../middleware/invalidateCache");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");
const router = require("express").Router();

router.get("/", tagsController.list);
router.get("/active", tagsController.getActiveTags);
// A partir de acá, TODO lo que esté abajo pasa automáticamente por la invalidación
router.use(invalidateCache(invalidateBootstrapCache));
router.post("/", tagsController.create);
router.put("/:id", tagsController.update);
router.delete("/:id", tagsController.remove);

module.exports = router;
