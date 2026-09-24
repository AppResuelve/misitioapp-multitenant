const uploadService = require('../../services/admin/upload.service')

const upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se envió ninguna imagen' })
    }

    const media = await uploadService.uploadImage(req.tenant.id, req.file.buffer, req.file.originalname, req.body.folder, req.tenant?.folderPrefix)
    res.status(201).json(media)
  } catch (err) {
    next(err)
  }
}

const list = async (req, res, next) => {
  try {
    const media = await uploadService.list(req.tenant.id, req.query.folder, { trash: req.query.trash === 'true' })
    res.json(media)
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    await uploadService.remove(req.tenant.id, req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

const forceDelete = async (req, res, next) => {
  try {
    await uploadService.forceDelete(req.tenant.id, req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

const restore = async (req, res, next) => {
  try {
    const media = await uploadService.restore(req.tenant.id, req.params.id)
    res.json(media)
  } catch (err) {
    next(err)
  }
}

const emptyTrash = async (req, res, next) => {
  try {
    const result = await uploadService.emptyTrash(req.tenant.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const usage = async (req, res, next) => {
  try {
    const result = await uploadService.checkUsage(req.tenant.id, req.params.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const move = async (req, res, next) => {
  try {
    const media = await uploadService.moveToFolder(req.tenant.id, req.params.id, req.body.folder, req.tenant?.folderPrefix)
    res.json(media)
  } catch (err) {
    next(err)
  }
}

module.exports = { upload, list, remove, forceDelete, restore, emptyTrash, usage, move }
