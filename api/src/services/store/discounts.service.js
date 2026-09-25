const { Discount } = require('../../models')
const { Op } = require('sequelize')
const { appliesToProduct, computeProductDiscount, resolveProductPricing } = require('../../utils/discountApplication')

// Devuelve los descuentos activos (status active + dentro de la ventana temporal).
const getActiveDiscounts = async (tenantId) => {
  const now = new Date()
  return Discount.findAll({
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
}

module.exports = { getActiveDiscounts, appliesToProduct, computeProductDiscount, resolveProductPricing }
