const round2 = (n) => Math.round(n * 100) / 100

// Devuelve true si el descuento aplica al producto según su tipo.
const appliesToProduct = (discount, product) => {
  const config = discount.config || {}
  switch (discount.type) {
    case 'global':
      return true
    case 'category': {
      const ids = config.categoryIds || []
      return ids.includes(Number(product.categoryId))
    }
    case 'price_range': {
      const price = Number(product.retailPrice) || 0
      const min = Number(config.min)
      const max = Number(config.max)
      return price >= min && price <= max
    }
    case 'products': {
      const ids = config.productIds || []
      return ids.includes(Number(product.id))
    }
    default:
      return false
  }
}

// Devuelve los descuentos que aplican al producto y el % total (suma).
const computeProductDiscount = (discounts, product) => {
  const applied = discounts.filter((d) => appliesToProduct(d, product))
  const totalPercentage = applied.reduce((sum, d) => sum + Number(d.percentage), 0)
  return { applied, totalPercentage }
}

// Aplica los descuentos por tipo sobre el precio base del producto (que ya trae
// el descuento individual). Recalcula retailPrice final, comparePrice y el % efectivo.
const resolveProductPricing = (product, discounts) => {
  const { applied, totalPercentage } = computeProductDiscount(discounts, product)

  if (totalPercentage <= 0) {
    product.setDataValue('hasActiveDiscount', (Number(product.discountPercentage) || 0) > 0)
    product.setDataValue('appliedDiscounts', [])
    return product
  }

  const retailPriceBase = Number(product.retailPrice) || 0
  const finalPrice = round2(retailPriceBase * (1 - totalPercentage / 100))

  const individualPct = Number(product.discountPercentage) || 0
  let original = product.comparePrice != null ? Number(product.comparePrice) : null
  if (!original && individualPct > 0 && retailPriceBase > 0) {
    original = retailPriceBase / (1 - individualPct / 100)
  }
  if (!original) original = retailPriceBase

  const effectivePct = original > finalPrice
    ? Math.round(100 * (1 - finalPrice / original))
    : Math.round(totalPercentage)

  product.retailPrice = finalPrice
  product.comparePrice = original > finalPrice ? round2(original) : null
  product.discountPercentage = effectivePct > 0 ? effectivePct : null
  product.setDataValue('hasActiveDiscount', effectivePct > 0)
  product.setDataValue('appliedDiscounts', applied.map((d) => ({ id: d.id, name: d.name, percentage: d.percentage })))

  return product
}

module.exports = { appliesToProduct, computeProductDiscount, resolveProductPricing }
