const { Attribute, AttributeValue } = require('../../models')

const includeValues = {
  model: AttributeValue,
  as: 'values',
  order: [['sort_order', 'ASC']],
}

const list = async (tenantId) => {
  return Attribute.findAll({
    where: { tenantId },
    include: [includeValues],
    order: [['sort_order', 'ASC']],
  })
}

const create = async (tenantId, data) => {
  const attr = await Attribute.create({ tenantId, name: data.name, unitType: data.unit_type || null, sortOrder: data.sort_order || 0 })
  if (data.values && Array.isArray(data.values)) {
    for (const v of data.values) {
      await AttributeValue.create({ tenantId, attributeId: attr.id, value: v.value, sortOrder: v.sort_order || 0 })
    }
  }
  return Attribute.findOne({ where: { tenantId, id: attr.id }, include: [includeValues] })
}

const update = async (tenantId, id, data) => {
  const attr = await Attribute.findOne({ where: { tenantId, id } })
  if (!attr) throw Object.assign(new Error('Atributo no encontrado'), { status: 404 })
  await attr.update({ name: data.name, unitType: data.unit_type !== undefined ? data.unit_type : attr.unitType, sortOrder: data.sort_order || 0 })
  if (data.values && Array.isArray(data.values)) {
    const keepIds = []
    for (const v of data.values) {
      if (v.id) {
        const av = await AttributeValue.findOne({ where: { tenantId, id: v.id } })
        if (av && av.attributeId === attr.id) {
          await av.update({ value: v.value, sortOrder: v.sort_order || 0 })
          keepIds.push(av.id)
        }
      } else {
        const created = await AttributeValue.create({ tenantId, attributeId: attr.id, value: v.value, sortOrder: v.sort_order || 0 })
        keepIds.push(created.id)
      }
    }
    await AttributeValue.destroy({ where: { tenantId, attributeId: id, id: { [require('sequelize').Op.notIn]: keepIds } } })
  }
  return Attribute.findOne({ where: { tenantId, id }, include: [includeValues] })
}

const remove = async (tenantId, id) => {
  const attr = await Attribute.findOne({ where: { tenantId, id } })
  if (!attr) throw Object.assign(new Error('Atributo no encontrado'), { status: 404 })
  await attr.destroy()
}

module.exports = { list, create, update, remove }
