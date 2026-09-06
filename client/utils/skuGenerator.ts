/**
 * Genera un código SKU automático a partir del nombre del producto y sus atributos.
 */
export function generateSkuCode(
  productName: string,
  attributeValueIds: number[],
  attributes: Array<{ id: number; name: string; values: Array<{ id: number; value: string }> }>
): string {
  const normalize = (str: string) =>
    str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase()

  // Parte del nombre: hasta 2 palabras, ≥2 chars, ≤4 chars cada una
  const namePart = normalize(productName || '')
    .split(/\s+/)
    .filter(w => w.length >= 2)
    .slice(0, 2)
    .map(w => w.substring(0, 4))
    .join('-')
    || normalize(productName || '').substring(0, 6)

  // Parte de atributos: 3 primeros chars de cada valor, normalizados
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

  // Sufijo aleatorio de 4 chars
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase()

  const parts = [namePart, attrPart, suffix].filter(Boolean)
  return parts.join('-')
}
