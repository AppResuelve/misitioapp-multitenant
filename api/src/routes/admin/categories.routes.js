const categoriesController = require('../../controllers/admin/categories.controller')

const router = require('express').Router()

router.get('/', categoriesController.list)
router.put('/reorder', categoriesController.reorder)
router.get('/:id', categoriesController.getById)
router.post('/',           categoriesController.create)
router.patch('/:id/status', categoriesController.toggleStatus)
router.put('/:id',         categoriesController.update)
router.delete('/:id', categoriesController.remove)

module.exports = router
