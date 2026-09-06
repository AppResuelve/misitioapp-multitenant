const productsService = require('../../services/store/products.service')

const list = async (req, res, next) => {
  try {
    const result = await productsService.list(req.query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const getBySlug = async (req, res, next) => {
  try {
    const product = await productsService.getBySlug(req.params.slug)
    res.json(product)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getBySlug }
