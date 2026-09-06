const dashboardController = require('../../controllers/admin/dashboard.controller')

const router = require('express').Router()

router.get('/', dashboardController.get)

module.exports = router
