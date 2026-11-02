const router = require("express").Router();
const cartController = require("../../controllers/store/cart.controller");

router.post("/sync", cartController.sync);

module.exports = router;
