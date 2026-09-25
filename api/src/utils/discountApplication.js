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
// el descuento individual). Recalcula retailPrice final, comparePrice y el % efectivo,
// y propaga el resultado a cada variante (SKU) de forma dinámica (sin persistir).
const resolveProductPricing = (product, discounts) => {
  const { applied, totalPercentage } = computeProductDiscount(discounts, product)

  const individualPct = Number(product.discountPercentage) || 0
  const retailPriceBase = Number(product.retailPrice) || 0
  const finalPrice = round2(retailPriceBase * (1 - totalPercentage / 100))

  let original = product.comparePrice != null ? Number(product.comparePrice) : null
  if (!original && individualPct > 0 && retailPriceBase > 0) {
    original = retailPriceBase / (1 - individualPct / 100)
  }
  if (!original && totalPercentage > 0) {
    original = retailPriceBase
  }

  const effectivePct = (original && original > finalPrice)
    ? Math.round(100 * (1 - finalPrice / original))
    : Math.round(totalPercentage)

  product.retailPrice = finalPrice
  product.comparePrice = original > finalPrice ? round2(original) : null
  product.discountPercentage = effectivePct > 0 ? effectivePct : null
  product.setDataValue('hasActiveDiscount', effectivePct > 0)
  product.setDataValue('appliedDiscounts', applied.map((d) => ({ id: d.id, name: d.name, percentage: d.percentage })))

  // Propagar a cada variante
  for (const sku of product.skus || []) {
    const skuBase = Number(sku.retailPrice) || 0
    if (skuBase <= 0) continue

    const skuFinal = round2(skuBase * (1 - totalPercentage / 100))

    let skuOriginal = null
    if (individualPct > 0 && individualPct < 100) {
      skuOriginal = skuBase / (1 - individualPct / 100)
    } else if (totalPercentage > 0) {
      skuOriginal = skuBase
    }

    sku.retailPrice = skuFinal
    sku.setDataValue('comparePrice', (skuOriginal && skuOriginal > skuFinal) ? round2(skuOriginal) : null)
    sku.setDataValue('discountPercentage', effectivePct > 0 ? effectivePct : null)
  }

  return product
}

module.exports = { appliesToProduct, computeProductDiscount, resolveProductPricing }
