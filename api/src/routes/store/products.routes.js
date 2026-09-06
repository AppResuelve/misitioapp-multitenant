const productsController = require('../../controllers/store/products.controller')

const router = require('express').Router()

router.get('/', productsController.list)
router.get('/:slug', productsController.getBySlug)

module.exports = router
