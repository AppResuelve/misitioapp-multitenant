const ordersController = require('../../controllers/store/orders.controller')

const router = require('express').Router()

router.post('/', ordersController.create)

module.exports = router
