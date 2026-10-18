const siteContentController = require("../../controllers/admin/siteContent.controller");
const router = require("express").Router();

router.get("/", siteContentController.list);
router.get("/:id", siteContentController.getById);
router.post("/", siteContentController.create);
router.put("/:id", siteContentController.update);
router.patch("/:id/status", siteContentController.toggleStatus);
router.delete("/:id", siteContentController.remove);

module.exports = router;
