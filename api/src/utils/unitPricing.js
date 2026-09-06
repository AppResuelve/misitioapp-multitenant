/**
 * Divisores para calcular precio proporcional según tipo de unidad.
 * Los valores de atributo se expresan en subunidades (gramos, cm, ml).
 */
const UNIT_DIVISOR = { kg: 1000, m: 100, l: 1000 }

const UNIT_LABEL = { kg: 'Gr', m: 'Cm', l: 'Ml' }

/**
 * Recalcula el retailPrice de cada SKU de un producto según su unitType.
 * Llama a esta función después de cargar los productos con eager loading.
 *
 * @param {object} product - Producto con .skus[].attributeValues[].attribute
 */
function applyUnitPricing(product) {
  if (!product?.skus?.length) return

  let unitAttr = null
  for (const sku of product.skus) {
    for (const av of sku.attributeValues || []) {
      if (av.attribute?.unitType) {
        unitAttr = av.attribute
        break
      }
    }
    if (unitAttr) break
  }

  if (!unitAttr) return

  product.unitType = unitAttr.unitType

  const divisor = UNIT_DIVISOR[unitAttr.unitType]
  if (!divisor) return

  const basePrice = Number(product.retailPrice) || 0

  for (const sku of product.skus) {
    for (const av of sku.attributeValues || []) {
      if (av.attributeId === unitAttr.id) {
        const value = parseFloat(av.value)
        if (!isNaN(value) && value > 0 && basePrice > 0) {
          sku.retailPrice = String((value / divisor) * basePrice)
        }
        break
      }
    }
  }
}

module.exports = { UNIT_DIVISOR, UNIT_LABEL, applyUnitPricing }
