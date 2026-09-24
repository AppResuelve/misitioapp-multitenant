const { Category } = require('../../models')

const list = async (tenantId) => {
  return Category.findAll({
    where: { tenantId, status: 'active' },
    order: [['order', 'ASC'], ['name', 'ASC']],
  })
}

const getBySlug = async (tenantId, slug) => {
  const category = await Category.findOne({ where: { tenantId, slug } })
  if (!category) {
    throw Object.assign(new Error('Categoría no encontrada'), { status: 404 })
  }
  return category
}

module.exports = { list, getBySlug }
