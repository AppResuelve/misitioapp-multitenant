const settingsController = require('../../controllers/store/settings.controller')

const router = require('express').Router()

router.get('/', settingsController.getSettings)

module.exports = router
