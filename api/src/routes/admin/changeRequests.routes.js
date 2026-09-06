const changeRequestsController = require('../../controllers/admin/changeRequests.controller')

const router = require('express').Router()

router.get('/modules', changeRequestsController.modules)
router.get('/remaining', changeRequestsController.getRemaining)
router.get('/', changeRequestsController.list)
router.post('/', changeRequestsController.create)
router.put('/:id', changeRequestsController.update)

module.exports = router
