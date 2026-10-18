const express = require("express");
const router = express.Router();
const {
  adminFastSearch,
} = require("../../controllers/admin/search.controller");

// GET /api/admin/search?q=torta&scope=products
router.get("/", adminFastSearch);

module.exports = router;
