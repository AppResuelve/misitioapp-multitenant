const { Tag, TagValue, Product, sequelize } = require('../../models')
const { Op } = require('sequelize')

const includeValues = {
  model: TagValue,
  as: 'values',
  order: [['sort_order', 'ASC']],
}

const countProductsUsingValues = async (tenantId, tagValueIds) => {
  if (!tagValueIds || tagValueIds.length === 0) return 0
  return Product.count({
    where: { tenantId },
    distinct: true,
    include: [{
      model: TagValue,
      as: 'tagValues',
      where: { tenantId, id: { [Op.in]: tagValueIds } },
      attributes: [],
    }],
  })
}

const getSampleProducts = async (tenantId, tagValueIds, limit = 3) => {
  if (!tagValueIds || tagValueIds.length === 0) return []
  return Product.findAll({
    where: {
      tenantId,
      id: {
        [Op.in]: sequelize.literal(`(
          SELECT DISTINCT product_id
          FROM product_tags
          WHERE tag_value_id IN (${tagValueIds.join(',')})
        )`),
      },
    },
    attributes: ['id', 'name'],
    limit,
  })
}

const buildConflictResponse = async (tenantId, valueIds, code, tagName) => {
  const affectedCount = await countProductsUsingValues(tenantId, valueIds)
  if (affectedCount === 0) return null
  const sampleProducts = await getSampleProducts(tenantId, valueIds)
  return {
    success: false,
    code,
    message: `La etiqueta '${tagName}' está asociada a ${affectedCount} producto(s).`,
    requiresConfirmation: true,
    affectedCount,
    sampleProducts: sampleProducts.map(p => ({ id: p.id, name: p.name })),
  }
}

const list = async (tenantId) => {
  return Tag.findAll({
    where: { tenantId },
    include: [includeValues],
    order: [['sort_order', 'ASC']],
  })
}

const create = async (tenantId, data) => {
  const tag = await Tag.create({ tenantId, name: data.name, color: data.color || '#6366f1', sortOrder: data.sortOrder || 0 })
  if (data.values && Array.isArray(data.values)) {
    for (const v of data.values) {
      await TagValue.create({ tenantId, tagId: tag.id, value: v.value, sortOrder: v.sortOrder || 0 })
    }
  }
  return Tag.findOne({ where: { tenantId, id: tag.id }, include: [includeValues] })
}

const update = async (tenantId, id, data, force) => {
  const tag = await Tag.findOne({ where: { tenantId, id } })
  if (!tag) throw Object.assign(new Error('Etiqueta no encontrada'), { status: 404 })
  await tag.update({ name: data.name, color: data.color, sortOrder: data.sortOrder || 0 })
  if (data.values && Array.isArray(data.values)) {
    const keepIds = []
    for (const v of data.values) {
      if (v.id) {
        const tv = await TagValue.findOne({ where: { tenantId, id: v.id } })
        if (tv && tv.tagId === tag.id) {
          await tv.update({ value: v.value, sortOrder: v.sortOrder || 0 })
          keepIds.push(tv.id)
        }
      } else {
        const created = await TagValue.create({ tenantId, tagId: tag.id, value: v.value, sortOrder: v.sortOrder || 0 })
        keepIds.push(created.id)
      }
    }
    const allValueIds = (await TagValue.findAll({ where: { tenantId, tagId: id }, attributes: ['id'] })).map(v => v.id)
    const removedIds = allValueIds.filter(rid => !keepIds.includes(rid))
    if (removedIds.length > 0 && !force) {
      const conflict = await buildConflictResponse(tenantId, removedIds, 'TAG_VALUES_IN_USE', tag.name)
      if (conflict) return { tag: null, conflict }
    }
    await TagValue.destroy({ where: { tenantId, tagId: id, id: { [Op.notIn]: keepIds } } })
  }
  return Tag.findOne({ where: { tenantId, id }, include: [includeValues] })
}

const remove = async (tenantId, id, force) => {
  const tag = await Tag.findOne({ where: { tenantId, id } })
  if (!tag) throw Object.assign(new Error('Etiqueta no encontrada'), { status: 404 })

  if (!force) {
    const valueIds = (await TagValue.findAll({ where: { tenantId, tagId: id }, attributes: ['id'] })).map(v => v.id)
    const conflict = await buildConflictResponse(tenantId, valueIds, 'TAG_IN_USE', tag.name)
    if (conflict) return conflict
  }

  await tag.destroy()
  return true
}

module.exports = { list, create, update, remove }
