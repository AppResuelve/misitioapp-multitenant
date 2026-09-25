const discountsController = require('../../controllers/store/discounts.controller')

const router = require('express').Router()

router.get('/', discountsController.getCartDiscounts)

module.exports = router
