const productsController = require('../../controllers/admin/products.controller')

const router = require('express').Router()

router.get('/', productsController.list)
router.get('/export', productsController.exportProducts)
router.get('/:id', productsController.getById)
router.post('/', productsController.create)
router.patch('/:id/status', productsController.toggleStatus)
router.put('/:id', productsController.update)
router.delete('/:id', productsController.remove)
router.post('/bulk', productsController.bulkCreate)
router.post('/bulk-update/preview', productsController.previewDiff)
router.post('/bulk-update', productsController.bulkUpdate)
router.post('/bulk-update/system', productsController.systemUpdate)

module.exports = router
