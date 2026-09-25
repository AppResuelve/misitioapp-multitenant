const discountsService = require('../../services/store/discounts.service')

const getCartDiscounts = async (req, res, next) => {
  try {
    const discounts = await discountsService.getActiveDiscounts(req.tenant.id)
    const cartTotals = discounts
      .filter((d) => d.type === 'cart_total')
      .map((d) => ({
        id: d.id,
        name: d.name,
        percentage: d.percentage,
        minAmount: d.config?.minAmount ?? 0,
        countDiscounted: d.config?.countDiscounted ?? false,
      }))
    res.json({ cartTotals })
  } catch (err) {
    next(err)
  }
}

module.exports = { getCartDiscounts }
