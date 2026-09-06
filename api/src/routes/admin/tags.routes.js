const tagsController = require('../../controllers/admin/tags.controller')
const router = require('express').Router()

router.get('/', tagsController.list)
router.post('/', tagsController.create)
router.put('/:id', tagsController.update)
router.delete('/:id', tagsController.remove)

module.exports = router
