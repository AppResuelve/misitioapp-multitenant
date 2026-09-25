const discountsController = require('../../controllers/admin/discounts.controller')

const router = require('express').Router()

router.get('/', discountsController.list)
router.post('/', discountsController.create)
router.patch('/:id/status', discountsController.setStatus)
router.put('/:id', discountsController.update)
router.delete('/:id', discountsController.remove)

module.exports = router
