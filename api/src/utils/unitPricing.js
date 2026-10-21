/**
 * Divisores para calcular precio proporcional según tipo de unidad.
 * Los valores de atributo se expresan en subunidades (gramos, cm, ml).
 */
const UNIT_DIVISOR = { kg: 1000, m: 100, l: 1000 };

const UNIT_LABEL = { kg: "Gr", m: "Cm", l: "Ml" };

/**
 * Asigna el unitType al producto y, si está habilitado el flag,
 * recalcula proporcionalmente el retailPrice de cada SKU.
 *
 * @param {object} product - Producto con skus y attributeValues cargados.
 * @param {boolean} autoCalculate - Flag de storeSettings (por defecto true).
 */
function applyUnitPricing(product, autoCalculate = true) {
  try {
    if (!product?.skus?.length) return;

    let unitAttr = null;
    for (const sku of product.skus) {
      for (const av of sku.attributeValues || []) {
        if (av.attribute?.unitType) {
          unitAttr = av.attribute;
          break;
        }
      }
      if (unitAttr) break;
    }

    if (!unitAttr) return;

    // 1. Siempre vinculamos el unitType para el frontend
    product.unitType = unitAttr.unitType;

    // 2. Si no se debe autocalcular, preservamos los precios reales de la DB
    if (!autoCalculate) return;

    const divisor = UNIT_DIVISOR[unitAttr.unitType];
    if (!divisor) return;

    const basePrice = Number(product.retailPrice) || 0;

    // 3. Recálculo proporcional
    for (const sku of product.skus) {
      for (const av of sku.attributeValues || []) {
        if (av.attributeId === unitAttr.id) {
          const value = parseFloat(av.value);
          if (!isNaN(value) && value > 0 && basePrice > 0) {
            sku.retailPrice = String((value / divisor) * basePrice);
          }
          break;
        }
      }
    }
  } catch (err) {
    console.error(
      "[unitPricing applyUnitPricing] ERROR:",
      err.message,
      err.stack,
      "| product:",
      product?.id,
    );
  }
}

module.exports = { UNIT_DIVISOR, UNIT_LABEL, applyUnitPricing };
