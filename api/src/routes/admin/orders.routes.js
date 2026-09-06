const ordersController = require('../../controllers/admin/orders.controller')

const router = require('express').Router()

router.get('/stats', ordersController.stats)
router.get('/', ordersController.list)
router.get('/:id', ordersController.getById)
router.put('/:id/status', ordersController.updateStatus)

module.exports = router
