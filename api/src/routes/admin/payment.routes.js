const express = require("express");
const router = express.Router();
const paymentController = require("../../controllers/admin/payment.controller");

// GET /api/payment-methods
router.get("/", paymentController.list);

// POST /api/payment-methods
router.post("/", paymentController.create);

// PUT /api/payment-methods/reorder
router.put("/reorder", paymentController.reorder);

// PUT /api/payment-methods/:id
router.put("/:id", paymentController.update);

// DELETE /api/payment-methods/:id
router.delete("/:id", paymentController.remove);

module.exports = router;
