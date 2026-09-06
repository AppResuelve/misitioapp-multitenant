const attributesController = require('../../controllers/admin/attributes.controller')
const router = require('express').Router()

router.get('/', attributesController.list)
router.post('/', attributesController.create)
router.put('/:id', attributesController.update)
router.put('/:attrId/values/:valueId', attributesController.updateValue)
router.delete('/:id', attributesController.remove)

module.exports = router
