const tagsService = require('../../services/admin/tags.service')

const list = async (req, res, next) => {
  try {
    const tags = await tagsService.list()
    res.json(tags)
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const tag = await tagsService.create(req.body)
    res.status(201).json(tag)
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const result = await tagsService.update(req.params.id, req.body, req.query.force === 'true')
    if (result?.conflict) {
      return res.status(409).json(result.conflict)
    }
    res.json(result)
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    const result = await tagsService.remove(req.params.id, req.query.force === 'true')
    if (result && result.requiresConfirmation) {
      return res.status(409).json(result)
    }
    res.status(204).end()
  } catch (err) { next(err) }
}

module.exports = { list, create, update, remove }
