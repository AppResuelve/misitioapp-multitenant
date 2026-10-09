const discountsController = require("../../controllers/store/discounts.controller");

const router = require("express").Router();

router.get("/", discountsController.getCartDiscounts);
router.get("/", discountsController.getStoreDiscounts);

module.exports = router;
