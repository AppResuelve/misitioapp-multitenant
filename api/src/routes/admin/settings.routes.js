const settingsController = require('../../controllers/admin/settings.controller')

const router = require('express').Router()

router.get('/', settingsController.getAll)
router.put('/', settingsController.setBulk)

module.exports = router
