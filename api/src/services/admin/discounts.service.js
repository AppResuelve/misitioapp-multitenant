const { Discount, Product } = require('../../models')
const { Op } = require('sequelize')
const { appliesToProduct } = require('../../utils/discountApplication')

const validateConfig = (type, config) => {
  const cfg = config || {}
  if (type === 'category') {
    const ids = cfg.categoryIds || []
    if (!Array.isArray(ids) || ids.length === 0) {
      throw Object.assign(new Error('Seleccioná al menos una categoría'), { status: 400 })
    }
  } else if (type === 'price_range') {
    const min = Number(cfg.min)
    const max = Number(cfg.max)
    if (Number.isNaN(min) || Number.isNaN(max)) {
      throw Object.assign(new Error('El rango de precio necesita min y max'), { status: 400 })
    }
    if (min >= max) {
      throw Object.assign(new Error('El mínimo debe ser menor al máximo'), { status: 400 })
    }
  } else if (type === 'products') {
    const ids = cfg.productIds || []
    if (!Array.isArray(ids) || ids.length === 0) {
      throw Object.assign(new Error('Seleccioná al menos un producto'), { status: 400 })
    }
  } else if (type === 'cart_total') {
    const minAmount = Number(cfg.minAmount)
    if (Number.isNaN(minAmount) || minAmount <= 0) {
      throw Object.assign(new Error('El monto mínimo es obligatorio y debe ser mayor a 0'), { status: 400 })
    }
  }
  return cfg
}

const list = async (tenantId) => {
  return Discount.findAll({ where: { tenantId }, order: [['created_at', 'DESC']] })
}

const overlaps = async (tenantId) => {
  const now = new Date()
  const discounts = await Discount.findAll({
    where: {
      tenantId,
      status: 'active',
      type: { [Op.ne]: 'cart_total' },
      startAt: { [Op.lte]: now },
      [Op.or]: [{ endAt: null }, { endAt: { [Op.gte]: now } }],
    },
  })
  if (discounts.length === 0) return []

  const products = await Product.findAll({
    where: { tenantId, status: 'active' },
    attributes: ['id', 'name', 'retailPrice', 'categoryId'],
  })

  const result = []
  for (const p of products) {
    const applied = discounts.filter((d) => appliesToProduct(d, p))
    if (applied.length > 1) {
      result.push({
        productId: p.id,
        name: p.name,
        discounts: applied.map((d) => ({ id: d.id, name: d.name, percentage: d.percentage })),
      })
    }
  }
  return result
}

const create = async (tenantId, data) => {
  const config = validateConfig(data.type, data.config)
  return Discount.create({
    tenantId,
    name: data.name,
    type: data.type,
    percentage: data.percentage,
    config,
    status: data.status || 'draft',
    startAt: data.startAt,
    endAt: data.endAt || null,
  })
}

const update = async (tenantId, id, data) => {
  const discount = await Discount.findOne({ where: { tenantId, id } })
  if (!discount) throw Object.assign(new Error('Descuento no encontrado'), { status: 404 })

  if (data.type) {
    const nextConfig = data.config !== undefined ? data.config : discount.config
    validateConfig(data.type, nextConfig)
  }

  await discount.update({
    ...(data.name !== undefined && { name: data.name }),
    ...(data.type !== undefined && { type: data.type }),
    ...(data.percentage !== undefined && { percentage: data.percentage }),
    ...(data.config !== undefined && { config: data.config }),
    ...(data.status !== undefined && { status: data.status }),
    ...(data.startAt !== undefined && { startAt: data.startAt }),
    ...(data.endAt !== undefined && { endAt: data.endAt }),
  })
  return discount
}

const remove = async (tenantId, id) => {
  const discount = await Discount.findOne({ where: { tenantId, id } })
  if (!discount) throw Object.assign(new Error('Descuento no encontrado'), { status: 404 })
  await discount.destroy()
}

const setStatus = async (tenantId, id, status) => {
  const discount = await Discount.findOne({ where: { tenantId, id } })
  if (!discount) throw Object.assign(new Error('Descuento no encontrado'), { status: 404 })
  await discount.update({ status })
  return discount
}

module.exports = { list, overlaps, create, update, remove, setStatus }
