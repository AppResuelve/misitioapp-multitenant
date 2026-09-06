const servicesController = require('../../controllers/store/services.controller')
const router = require('express').Router()
router.get('/', servicesController.list)
router.get('/:slug', servicesController.getBySlug)
module.exports = router
