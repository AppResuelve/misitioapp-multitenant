const campaignsController = require("../../controllers/admin/campaigns.controller");
const router = require("express").Router();

router.get("/", campaignsController.list);
router.get("/:id", campaignsController.getById);
router.post("/", campaignsController.create);
router.put("/:id", campaignsController.update);
router.patch("/:id/status", campaignsController.toggleStatus);
router.delete("/:id", campaignsController.remove);

module.exports = router;
