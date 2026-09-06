const categoriesService = require('../../services/store/categories.service')

const list = async (req, res, next) => {
  try {
    const categories = await categoriesService.list()
    res.json(categories)
  } catch (err) {
    next(err)
  }
}

const getBySlug = async (req, res, next) => {
  try {
    const category = await categoriesService.getBySlug(req.params.slug)
    res.json(category)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getBySlug }
