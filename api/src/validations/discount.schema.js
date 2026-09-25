const { z } = require('zod')

const discountSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  type: z.enum(['global', 'category', 'price_range', 'products', 'cart_total']),
  percentage: z.coerce.number().int().min(1, 'El descuento debe ser al menos 1%').max(100, 'El descuento no puede superar 100%'),
  config: z.record(z.any()).optional().default({}),
  status: z.enum(['draft', 'active']).optional().default('draft'),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().nullable().optional(),
})

const discountUpdateSchema = discountSchema.partial()

function validateDiscount(body) {
  const result = discountSchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map((e) => e.message).join(', ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  return result.data
}

function validateDiscountUpdate(body) {
  const result = discountUpdateSchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map((e) => e.message).join(', ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  return result.data
}

module.exports = { discountSchema, discountUpdateSchema, validateDiscount, validateDiscountUpdate }
