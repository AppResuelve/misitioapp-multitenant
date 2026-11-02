const router = require("express").Router();
const bootstrapController = require("../../controllers/store/bootstrap.controller");

router.get("/", bootstrapController.getBootstrap);

module.exports = router;
