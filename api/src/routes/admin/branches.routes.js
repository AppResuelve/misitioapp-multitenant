const router = require("express").Router();
const branchesController = require("../../controllers/admin/branches.controller");
const invalidateCache = require("../../middleware/invalidateCache");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");

router.get("/", branchesController.list);
router.get("/:id", branchesController.getById);
// A partir de acá, TODO lo que esté abajo pasa automáticamente por la invalidación
router.use(invalidateCache(invalidateBootstrapCache));
router.put("/reorder", branchesController.reorder);
router.post("/", branchesController.create);
router.patch("/:id/toggle-status", branchesController.toggleStatus);
router.put("/:id", branchesController.update);
router.delete("/:id", branchesController.remove);

module.exports = router;
