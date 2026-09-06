const { Category, Product } = require('../../models')

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 255)
}

const list = async () => {
  return Category.findAll({
    order: [['order', 'ASC'], ['name', 'ASC']],
    include: [{
      model: Product,
      as: 'products',
      attributes: ['id'],
      where: { status: 'active' },
      required: false,
    }],
  })
}

const getById = async (id) => {
  const category = await Category.findByPk(id)
  if (!category) {
    throw Object.assign(new Error('Categoría no encontrada'), { status: 404 })
  }
  return category
}

const create = async (data) => {
  if (!data.slug && data.name) {
    data.slug = slugify(data.name)
  }
  return Category.create(data)
}

const update = async (id, data) => {
  const category = await getById(id)
  if (!data.slug && data.name) {
    data.slug = slugify(data.name)
  }
  if (data.slug && data.slug !== category.slug) {
    const existing = await Category.findOne({ where: { slug: data.slug } })
    if (existing && existing.id !== category.id) {
      throw Object.assign(new Error('Ya existe una categoría con ese slug'), { status: 400 })
    }
  }
  return category.update(data)
}

const remove = async (id) => {
  const category = await getById(id)
  return category.destroy()
}

const reorder = async (orderedIds) => {
  const updates = orderedIds.map((categoryId, index) =>
    Category.update({ order: index }, { where: { id: categoryId } })
  )
  await Promise.all(updates)
  return list()
}

const toggleStatus = async (id, status) => {
  const category = await getById(id)
  await category.update({ status })
  return category
}

module.exports = { list, getById, create, update, remove, reorder, toggleStatus }
