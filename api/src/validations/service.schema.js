const { z } = require('zod')

const serviceSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  slug: z.string().optional(),
  description: z.string().max(1000, 'La descripción no puede superar los 1000 caracteres').optional(),
  images: z.array(z.string()).optional(),
  price: z.coerce.number().min(0, 'El precio debe ser mayor o igual a 0'),
  status: z.enum(['active', 'draft']).optional(),
  variants: z.array(z.object({
    id: z.coerce.number().int().optional(),
    price: z.coerce.number().min(0).optional(),
    durationMinutes: z.coerce.number().int().nullable().optional(),
    sortOrder: z.coerce.number().int().optional(),
    status: z.enum(['active', 'draft']).optional(),
    images: z.array(z.string()).optional(),
    attributeValueIds: z.array(z.coerce.number().int()).optional(),
    modifiers: z.array(z.object({
      id: z.coerce.number().int().optional(),
      name: z.string().min(1, 'El nombre del modificador es obligatorio'),
      price: z.coerce.number().min(0),
      maxSelection: z.coerce.number().int().nullable().optional(),
      sortOrder: z.coerce.number().int().optional(),
      status: z.enum(['active', 'draft']).optional(),
    })).optional(),
  })).optional(),
})

const serviceUpdateSchema = serviceSchema.partial()

function validateService(body) {
  const result = serviceSchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map(e => e.message).join(', ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  return result.data
}

function validateServiceUpdate(body) {
  const result = serviceUpdateSchema.safeParse(body)
  if (!result.success) {
    const message = result.error.issues.map(e => e.message).join(', ')
    throw Object.assign(new Error(message), { status: 400 })
  }
  return result.data
}

module.exports = { serviceSchema, serviceUpdateSchema, validateService, validateServiceUpdate }
