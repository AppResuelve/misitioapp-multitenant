/**
 * Genera un código SKU automático a partir del nombre del producto y sus atributos.
 */
function generateSkuCode(productName, attributeValueIds, attributes) {
  const normalize = (str) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()

  const namePart = normalize(productName || '')
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .slice(0, 2)
    .map(w => w.substring(0, 4))
    .join('-')
    || normalize(productName || '').substring(0, 6)

  const attrPart = (attributeValueIds || [])
    .map(vId => {
      for (const attr of attributes) {
        const val = attr.values.find(v => v.id === vId)
        if (val) return normalize(val.value).substring(0, 3)
      }
      return null
    })
    .filter(Boolean)
    .join('-')

  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()

  const parts = [namePart, attrPart, suffix].filter(Boolean)
  return parts.join('-')
}

module.exports = { generateSkuCode }
