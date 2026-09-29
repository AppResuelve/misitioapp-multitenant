const productsService = require('../../services/store/products.service')

const list = async (req, res, next) => {
  console.log('[PRODUCTS CTRL list] tenant:', req.tenant?.id, '| query:', JSON.stringify(req.query))
  try {
    const result = await productsService.list(req.tenant.id, req.query)
    console.log('[PRODUCTS CTRL list] result:', result.total, 'products, page:', result.page)
    res.json(result)
  } catch (err) {
    console.error('[PRODUCTS CTRL list] ERROR:', err.message, err.stack)
    next(err)
  }
}

const getBySlug = async (req, res, next) => {
  console.log('[PRODUCTS CTRL getBySlug] tenant:', req.tenant?.id, '| slug:', req.params.slug)
  try {
    const product = await productsService.getBySlug(req.tenant.id, req.params.slug)
    console.log('[PRODUCTS CTRL getBySlug] found:', product?.id, product?.name)
    res.json(product)
  } catch (err) {
    console.error('[PRODUCTS CTRL getBySlug] ERROR:', err.message, '| status:', err.status, '| stack:', err.stack)
    next(err)
  }
}

module.exports = { list, getBySlug }
