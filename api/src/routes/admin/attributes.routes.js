const attributesController = require("../../controllers/admin/attributes.controller");
const invalidateCache = require("../../middleware/invalidateCache");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");

const router = require("express").Router();

router.get("/", attributesController.list);
// A partir de acá, TODO lo que esté abajo pasa automáticamente por la invalidación
router.use(invalidateCache(invalidateBootstrapCache));
router.post("/", attributesController.create);
router.put("/:id", attributesController.update);
router.put("/:attrId/values/:valueId", attributesController.updateValue);
router.delete("/:id", attributesController.remove);

module.exports = router;
