const productsService = require("../../services/store/products.service");

const list = async (req, res, next) => {
  try {
    const result = await productsService.list(req.tenant.id, req.query);
    res.json(result);
  } catch (err) {
    console.error("[PRODUCTS CTRL list] ERROR:", err.message, err.stack);
    next(err);
  }
};

const getBySlug = async (req, res, next) => {
  try {
    const product = await productsService.getBySlug(
      req.tenant.id,
      req.params.slug,
    );
    res.json(product);
  } catch (err) {
    console.error(
      "[PRODUCTS CTRL getBySlug] ERROR:",
      err.message,
      "| status:",
      err.status,
      "| stack:",
      err.stack,
    );
    next(err);
  }
};

module.exports = { list, getBySlug };
