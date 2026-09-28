const branchesController = require('../../controllers/store/branches.controller')

const router = require('express').Router()

router.get('/', branchesController.list)

module.exports = router