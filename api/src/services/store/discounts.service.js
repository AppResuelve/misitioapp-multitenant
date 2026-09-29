const { Discount } = require('../../models')
const { Op } = require('sequelize')
const { appliesToProduct, computeProductDiscount, resolveProductPricing } = require('../../utils/discountApplication')

// Devuelve los descuentos activos (status active + dentro de la ventana temporal).
const getActiveDiscounts = async (tenantId) => {
  console.log('[DISCOUNTS SVC getActiveDiscounts] tenantId:', tenantId)
  try {
    const now = new Date()
    const discounts = await Discount.findAll({
      where: {
        tenantId,
        status: 'active',
        startAt: { [Op.lte]: now },
        [Op.or]: [
          { endAt: null },
          { endAt: { [Op.gte]: now } },
        ],
      },
      order: [['created_at', 'ASC']],
    })
    console.log('[DISCOUNTS SVC getActiveDiscounts] found:', discounts.length, 'discounts')
    return discounts
  } catch (err) {
    console.error('[DISCOUNTS SVC getActiveDiscounts] ERROR:', err.message, err.stack)
    throw err
  }
}

module.exports = { getActiveDiscounts, appliesToProduct, computeProductDiscount, resolveProductPricing }
