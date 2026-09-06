/**
 * Calcula el precio de comparación a partir del precio de venta y el porcentaje de descuento.
 * Redondea al múltiplo de 5 más cercano.
 *
 * @param {number} retailPrice - Precio de venta actual
 * @param {number} discountPercentage - Porcentaje de descuento (1-100)
 * @returns {number|null} - Precio de comparación redondeado, o null si no hay datos válidos
 */
function calculateComparePrice(retailPrice, discountPercentage) {
  const retail = Number(retailPrice)
  const discount = Number(discountPercentage)

  if (!retail || retail <= 0 || !discount || discount <= 0 || discount >= 100) {
    return null
  }

  const raw = retail / (1 - discount / 100)
  return Math.round(raw / 5) * 5
}

/**
 * Resuelve comparePrice y discountPercentage de forma consistente.
 * - Si hay % pero no comparePrice, lo calcula y redondea.
 * - Si hay ambos, valida que comparePrice > retailPrice.
 * - Si solo hay comparePrice sin %, lo deja tal cual (pero no activa descuento en store).
 */
function resolveDiscountFields(retailPrice, comparePrice, discountPercentage) {
  let resolvedCompare = comparePrice != null ? Number(comparePrice) : null
  const resolvedPct = discountPercentage != null ? Number(discountPercentage) : null

  if (resolvedPct && !resolvedCompare) {
    resolvedCompare = calculateComparePrice(retailPrice, resolvedPct)
  }

  if (resolvedCompare != null && retailPrice != null) {
    if (resolvedCompare <= Number(retailPrice)) {
      throw Object.assign(
        new Error('El precio de comparación debe ser mayor al precio de venta'),
        { status: 400 }
      )
    }
  }

  return { comparePrice: resolvedCompare, discountPercentage: resolvedPct }
}

module.exports = { calculateComparePrice, resolveDiscountFields }
