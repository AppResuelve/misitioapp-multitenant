const categoriesController = require('../../controllers/store/categories.controller')

const router = require('express').Router()

router.get('/', categoriesController.list)

module.exports = router
