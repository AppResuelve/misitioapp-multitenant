const { Attribute, AttributeValue } = require('../../models')

const includeValues = {
  model: AttributeValue,
  as: 'values',
  order: [['sort_order', 'ASC']],
}

const list = async () => {
  return Attribute.findAll({
    include: [includeValues],
    order: [['sort_order', 'ASC']],
  })
}

const create = async (data) => {
  const attr = await Attribute.create({ name: data.name, unitType: data.unit_type || null, sortOrder: data.sort_order || 0 })
  if (data.values && Array.isArray(data.values)) {
    for (const v of data.values) {
      await AttributeValue.create({ attributeId: attr.id, value: v.value, sortOrder: v.sort_order || 0 })
    }
  }
  return Attribute.findByPk(attr.id, { include: [includeValues] })
}

const update = async (id, data) => {
  const attr = await Attribute.findByPk(id)
  if (!attr) throw Object.assign(new Error('Atributo no encontrado'), { status: 404 })
  await attr.update({ name: data.name, unitType: data.unit_type !== undefined ? data.unit_type : attr.unitType, sortOrder: data.sort_order || 0 })
  if (data.values && Array.isArray(data.values)) {
    const keepIds = []
    for (const v of data.values) {
      if (v.id) {
        const av = await AttributeValue.findByPk(v.id)
        if (av && av.attributeId === attr.id) {
          await av.update({ value: v.value, sortOrder: v.sort_order || 0 })
          keepIds.push(av.id)
        }
      } else {
        const created = await AttributeValue.create({ attributeId: attr.id, value: v.value, sortOrder: v.sort_order || 0 })
        keepIds.push(created.id)
      }
    }
    await AttributeValue.destroy({ where: { attributeId: id, id: { [require('sequelize').Op.notIn]: keepIds } } })
  }
  return Attribute.findByPk(id, { include: [includeValues] })
}

const remove = async (id) => {
  const attr = await Attribute.findByPk(id)
  if (!attr) throw Object.assign(new Error('Atributo no encontrado'), { status: 404 })
  await attr.destroy()
}

module.exports = { list, create, update, remove }
