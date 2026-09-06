// @ts-nocheck
import * as XLSX from 'xlsx'

export const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 255) || 'sin-nombre'

export const normalizeKey = (text) =>
  (text ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')

export const NAME_ALIASES = ['nombre', 'name', 'producto', 'product', 'product_name', 'producto_nombre']
export const PRICE_ALIASES = ['precio', 'price', 'importe', 'costo', 'valor', 'retail_price', 'precio_venta']
export const SLUG_ALIASES = ['slug', 'id', 'identificador', 'codigo_producto', 'codigo']

export const OPTIONAL_FIELDS = [
  { key: 'description', label: 'Descripción', aliases: ['descripcion', 'description', 'desc', 'detalle'] },
  { key: 'discountPercentage', label: '% Descuento', aliases: ['descuento', 'discount', 'porcentaje', 'off'] },
  { key: 'comparePrice', label: 'Precio de comparación', aliases: ['precio_original', 'compare_price', 'precio_anterior'] },
  { key: 'wholesalePrice', label: 'Precio mayorista', aliases: ['mayorista', 'wholesale', 'precio_mayorista'] },
  { key: 'wholesaleMinQty', label: 'Cant. mín. mayorista', aliases: ['unidades_mayorista', 'wholesale_min', 'cantidad_mayorista', 'min_mayorista'] },
  { key: 'stock', label: 'Stock', aliases: ['stock', 'cantidad', 'inventario', 'disponible'] },
  { key: 'sku', label: 'Código SKU', aliases: ['sku', 'codigo', 'code', 'cod'] },
  { key: 'images', label: 'URL imagen', aliases: ['imagen', 'image', 'foto', 'url_imagen', 'img'] },
]

export const ATTR_COL_PATTERN = /^(atributo|attr)[\s_-]?(\d+)$/i
export const VAL_COL_PATTERN = /^(valor|val)[\s_-]?(\d+)$/i

export const UPDATE_FIELDS = [
  { key: 'retailPrice', label: 'Precio', productField: 'price' },
  { key: 'wholesalePrice', label: 'Precio mayorista', productField: 'wholesalePrice' },
  { key: 'wholesaleMinQty', label: 'Cant. mín. mayorista', productField: 'wholesaleMinQty' },
  { key: 'discountPercentage', label: '% Descuento', productField: 'discountPercentage' },
  { key: 'comparePrice', label: 'Precio de comparación', productField: 'comparePrice' },
  { key: 'description', label: 'Descripción', productField: 'description' },
  { key: 'stock', label: 'Stock', productField: 'stock' },
  { key: 'sku', label: 'Código SKU', productField: 'sku' },
  { key: 'images', label: 'Imagen', productField: 'images' },
]

export const FIELD_UPDATE_LABELS = Object.fromEntries(
  UPDATE_FIELDS.map(f => [f.key, f.label])
)

export const SYSTEM_FIELDS = [
  ...UPDATE_FIELDS,
  { key: 'status', label: 'Estado', inputType: 'status' },
  { key: 'categoryId', label: 'Categoría', inputType: 'category' },
]

export function detectColumn(headers, aliases) {
  const lower = headers.map((h) => h.toLowerCase().trim())
  for (const alias of aliases) {
    const idx = lower.findIndex((h) => h === alias || h.includes(alias))
    if (idx !== -1) return headers[idx]
  }
  return ''
}

export function parseProducts(rawData, nameCol, priceCol, optionals, attrPairs, opts = {}) {
  const { slugCol = '' } = opts
  const products = []
  const errors = []
  const grouped = {}

  rawData.rows.forEach((row, i) => {
    const name = String(row[nameCol] ?? '').trim()
    const price = row[priceCol]

    if (!name) { errors.push(`Fila ${i + 2}: falta el nombre`); return }
    if (price == null || price === '' || isNaN(Number(price)) || Number(price) < 0) {
      errors.push(`Fila ${i + 2}: "${name}" — precio inválido`)
      return
    }

    const excelSlug = slugCol ? String(row[slugCol] ?? '').trim() : ''
    const key = normalizeKey(excelSlug || name)

    if (!grouped[key]) {
      grouped[key] = {
        name,
        slug: excelSlug || slugify(name),
        excelSlug: excelSlug || undefined,
        price: Number(price),
        skus: [],
      }
      for (const { key: fKey } of OPTIONAL_FIELDS) {
        const col = optionals[fKey]
        if (!col || row[col] == null || row[col] === '') continue
        if (fKey === 'images' || fKey === 'description' || fKey === 'sku') grouped[key][fKey] = String(row[col])
        else { const num = Number(row[col]); if (!isNaN(num)) grouped[key][fKey] = num }
      }
    }

    const attrValues = []
    attrPairs.forEach(({ attrCol, valCol, num }) => {
      const attrName = String(row[attrCol] ?? '').trim()
      const value = String(row[valCol] ?? '').trim()
      if (attrName && value) attrValues.push({ attrName, value })
    })

    if (attrValues.length > 0) {
      grouped[key].skus.push({
        retailPrice: row[priceCol] != null && row[priceCol] !== '' ? Number(row[priceCol]) : Number(price),
        stock: optionals['stock'] && row[optionals['stock']] != null ? Number(row[optionals['stock']]) || 0 : 0,
        sku: optionals['sku'] && row[optionals['sku']] != null ? String(row[optionals['sku']]).trim() : null,
        attrValues,
      })
    }
  })

  for (const p of Object.values(grouped)) {
    products.push(p)
  }

  return { products, errors }
}

export function parseUpdateProducts(rawData, slugCol, nameCol, priceCol, optionals, attrPairs, field) {
  const products = []
  const errors = []
  const grouped = {}

  const isSkuField = ['retailPrice', 'wholesalePrice', 'wholesaleMinQty', 'stock', 'sku', 'images'].includes(field)

  rawData.rows.forEach((row, i) => {
    const slug = slugCol ? String(row[slugCol] ?? '').trim() : ''
    if (!slug) {
      errors.push(`Fila ${i + 2}: falta el slug (identificador)`)
      return
    }

    const key = slug.toLowerCase()
    const name = nameCol ? String(row[nameCol] ?? '').trim() : ''

    if (!grouped[key]) {
      grouped[key] = {
        name: name || slug,
        slug,
        excelSlug: slug,
        skus: [],
      }
    }

    const col = field === 'retailPrice' ? priceCol : optionals[field]
    const rawVal = col ? row[col] : undefined

    const attrValues = []
    attrPairs.forEach(({ attrCol, valCol }) => {
      const attrName = String(row[attrCol] ?? '').trim()
      const value = String(row[valCol] ?? '').trim()
      if (attrName && value) attrValues.push({ attrName, value })
    })

    if (attrValues.length > 0 && isSkuField) {
      grouped[key].skus.push({ attrValues, value: rawVal })
    } else if (!Object.prototype.hasOwnProperty.call(grouped[key], 'value')) {
      grouped[key].value = rawVal
    }
  })

  for (const p of Object.values(grouped)) {
    if (p.skus.length === 0) {
      delete p.skus
    }
    products.push(p)
  }

  return { products, errors }
}

export function downloadTemplate() {
  const headers = [
    'nombre', 'descripcion', 'precio', 'stock',
    'precio_mayorista', 'cantidad_mayorista',
    'descuento', 'imagen', 'sku',
    'atributo_1', 'valor_1', 'atributo_2', 'valor_2',
  ]
  const example1 = [
    'Remera básica', 'Remera de algodón', 1500, 10,
    '', '', '', '', '',
    'Color', 'Rojo', 'Talle', 'M',
  ]
  const example2 = [
    'Remera básica', '', 1800, 5,
    '', '', '', '', '',
    'Color', 'Rojo', 'Talle', 'XL',
  ]
  const example3 = [
    'Alfajor chocolate', 'Sin variantes', 1400, 100,
    1000, 12, '', '', '',
    '', '', '', '',
  ]
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet([headers, example1, example2, example3])
  XLSX.utils.book_append_sheet(wb, ws, 'Productos')
  XLSX.writeFile(wb, 'plantilla-productos.xlsx')
}
