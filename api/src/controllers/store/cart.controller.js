const cartService = require("../../services/store/cart.service");

const sync = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const { items } = req.body;
    const settings = req.storeSettings || {};
    const result = await cartService.syncCart(tenantId, items, settings);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { sync };
