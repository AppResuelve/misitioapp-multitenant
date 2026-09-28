const branchesController = require('../../controllers/admin/branches.controller')

const router = require('express').Router()

router.get('/', branchesController.list)
router.put('/reorder', branchesController.reorder)
router.get('/:id', branchesController.getById)
router.post('/', branchesController.create)
router.patch('/:id/toggle-status', branchesController.toggleStatus)
router.put('/:id', branchesController.update)
router.delete('/:id', branchesController.remove)

module.exports = router