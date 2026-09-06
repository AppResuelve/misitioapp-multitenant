const tagsController = require('../../controllers/store/tags.controller')
const router = require('express').Router()

router.get('/', tagsController.list)

module.exports = router
