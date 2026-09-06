const servicesController = require('../../controllers/admin/services.controller')

const router = require('express').Router()

router.get('/', servicesController.list)
router.get('/:id', servicesController.getById)
router.post('/', servicesController.create)
router.put('/:id', servicesController.update)
router.delete('/:id', servicesController.remove)

module.exports = router
