const uploadController = require('../../controllers/admin/upload.controller')
const { upload } = require('../../middleware/upload')

const router = require('express').Router()

router.get('/', uploadController.list)
router.post('/', upload, uploadController.upload)
router.get('/:id/usage', uploadController.usage)
router.delete('/:id', uploadController.remove)
router.delete('/:id/force', uploadController.forceDelete)
router.post('/:id/restore', uploadController.restore)
router.post('/trash/empty', uploadController.emptyTrash)
router.post('/:id/move', uploadController.move)

module.exports = router
