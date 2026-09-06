const { z } = require('zod')

const productSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  slug: z.string().optional(),
  description: z.string().max(2000, 'La descripción no puede superar los 2000 caracteres').optional(),
  images: z.array(z.string()).optional(),
  retailPrice: z.coerce.number().min(0, 'El precio de venta debe ser mayor o igual a 0'),
  comparePrice: z.coerce.number().nullable().optional(),
  discountPercentage: z.coerce.number().int().min(1, 'El descuento debe ser al menos 1%').max(100, 'El descuento no puede superar 100%').nullable().optional(),
  wholesalePrice: z.coerce.number().nullable().optional(),
  wholesaleMinQty: z.coerce.number().int().nullable().optional(),
  stock: z.coerce.number().int().optional(),
  status: z.enum(['active', 'draft']).optional(),
  tags: z.array(z.string()).optional(),
  tagIds: z.array(z.number()).optional(),
  categoryId: z.coerce.number().nullable().optional(),
  skus: z.array(z.object({
    id: z.coerce.number().int().optional(),
    retailPrice: z.coerce.number().min(0).optional(),
    wholesalePrice: z.coerce.number().nullable().optional(),
    wholesaleMinQty: z.coerce.number().int().nullable().optional(),
    stock: z.coerce.number().int().optional(),
    sku: z.string().nullable().optional(),
    images: z.array(z.string()).optional(),
    sortOrder: z.coerce.number().int().optional(),
    status: z.enum(['active', 'draft']).optional(),
    attributeValueIds: z.array(z.coerce.number().int()).optional(),
  })).optional(),
})

const productUpdateSchema = productSchema.partial()

const bulkProductSchema = z.array(z.object({
  name: z.string().min(1),
  slug: z.string().optional(),
  price: z.coerce.number().min(0),
  description: z.string().max(2000, 'La descripción no puede superar los 2000 caracteres').optional(),
  images: z.union([z.string(), z.array(z.string())]).optional(),
  retailPrice: z.coerce.number().optional(),
  comparePrice: z.coerce.number().nullable().optional(),
  discountPercentage: z.coerce.number().int().min(1).max(100).nullable().optional(),
  wholesalePrice: z.coerce.number().nullable().optional(),
  wholesaleMinQty: z.coerce.number().int().nullable().optional(),
  stock: z.coerce.number().int().optional(),
  sku: z.string().nullable().optional(),
  skus: z.array(z.object({
    retailPrice: z.coerce.number().optional(),
    wholesalePrice: z.coerce.number().nullable().optional(),
    wholesaleMinQty: z.coerce.number().int().nullable().optional(),
    stock: z.coerce.number().int().optional(),
    sku: z.string().nullable().optional(),
    images: z.array(z.string()).optional(),
    status: z.enum(['active', 'draft']).optional(),
    attrValues: z.array(z.object({
      attrName: z.string(),
      value: z.string(),
    })).optional(),
  })).optional(),
}))

function validateProduct(body) {
  const result = productSchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map(e => e.message).join(', ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  return result.data
}

function validateProductUpdate(body) {
  const result = productUpdateSchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map(e => e.message).join(', ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  return result.data
}

function validateBulkProducts(body) {
  const result = bulkProductSchema.safeParse(body.products)
  if (!result.success) {
    const message = result.error.issues.map(e => e.message).join(', ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  return result.data
}

const UPDATE_FIELD_ENUM = [
  'retailPrice', 'wholesalePrice', 'wholesaleMinQty',
  'discountPercentage', 'comparePrice', 'description',
  'stock', 'sku', 'images',
]

const SYSTEM_FIELD_ENUM = [...UPDATE_FIELD_ENUM, 'status', 'categoryId']

const attrValueSchema = z.object({
  attrName: z.string(),
  value: z.string(),
})

const bulkPreviewSchema = z.object({
  field: z.enum(UPDATE_FIELD_ENUM, 'Campo inválido para actualizar'),
  products: z.array(z.object({
    slug: z.string().min(1, 'El slug es obligatorio para identificar el producto'),
    value: z.any().optional(),
    skus: z.array(z.object({
      attrValues: z.array(attrValueSchema).optional(),
      value: z.any().optional(),
    })).optional(),
  })),
})

const bulkUpdateSchema = z.object({
  field: z.enum(UPDATE_FIELD_ENUM, 'Campo inválido para actualizar'),
  products: z.array(z.object({
    slug: z.string().min(1, 'El slug es obligatorio para identificar el producto'),
    oldValue: z.any().optional(),
    newValue: z.any().optional(),
    skus: z.array(z.object({
      attrValues: z.array(attrValueSchema).optional(),
      oldValue: z.any().optional(),
      newValue: z.any().optional(),
    })).optional(),
  })),
})

const systemUpdateSchema = z.object({
  field: z.enum(SYSTEM_FIELD_ENUM, 'Campo inválido para actualizar'),
  value: z.any().optional(),
  productIds: z.array(z.coerce.number().int()).min(1, 'Debe seleccionar al menos un producto'),
})

function validateBulkPreview(body) {
  const result = bulkPreviewSchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map(e => e.message).join(', ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  return result.data
}

function validateBulkUpdate(body) {
  const result = bulkUpdateSchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map(e => e.message).join(', ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  return result.data
}

function validateSystemUpdate(body) {
  const result = systemUpdateSchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map(e => e.message).join(', ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  return result.data
}

module.exports = { productSchema, productUpdateSchema, bulkProductSchema, bulkPreviewSchema, bulkUpdateSchema, systemUpdateSchema, validateProduct, validateProductUpdate, validateBulkProducts, validateBulkPreview, validateBulkUpdate, validateSystemUpdate }
