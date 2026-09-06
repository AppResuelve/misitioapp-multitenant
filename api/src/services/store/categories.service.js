const { Category } = require('../../models')

const list = async () => {
  return Category.findAll({
    where: { status: 'active' },
    order: [['order', 'ASC'], ['name', 'ASC']],
  })
}

const getBySlug = async (slug) => {
  const category = await Category.findOne({ where: { slug } })
  if (!category) {
    throw Object.assign(new Error('Categoría no encontrada'), { status: 404 })
  }
  return category
}

module.exports = { list, getBySlug }
