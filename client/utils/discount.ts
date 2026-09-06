// @ts-nocheck
'use client'
/**
 * Calcula el precio de comparación a partir del precio de venta y el porcentaje de descuento.
 * Redondea al múltiplo de 5 más cercano.
 *
 * @param {number} retailPrice - Precio de venta actual
 * @param {number} discountPercentage - Porcentaje de descuento (1-100)
 * @returns {number|null} - Precio de comparación redondeado, o null si no hay datos válidos
 */
export function calculateComparePrice(retailPrice, discountPercentage) {
  const retail = Number(retailPrice)
  const discount = Number(discountPercentage)

  if (!retail || retail <= 0 || !discount || discount <= 0 || discount >= 100) {
    return null
  }

  const raw = retail / (1 - discount / 100)
  return Math.round(raw / 5) * 5
}
