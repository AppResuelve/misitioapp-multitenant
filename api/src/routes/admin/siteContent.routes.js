const router = require("express").Router();
const siteContentController = require("../../controllers/admin/siteContent.controller");
const invalidateCache = require("../../middleware/invalidateCache");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");

router.get("/", siteContentController.list);
router.get("/:id", siteContentController.getById);
router.use(invalidateCache(invalidateBootstrapCache));
router.post("/", siteContentController.create);
router.put("/:id", siteContentController.update);
router.patch("/:id/status", siteContentController.toggleStatus);
router.delete("/:id", siteContentController.remove);

module.exports = router;
