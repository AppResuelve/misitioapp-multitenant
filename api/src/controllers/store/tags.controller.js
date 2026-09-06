const tagsService = require('../../services/store/tags.service')

const list = async (req, res, next) => {
  try {
    const { categoryId, tagIds } = req.query
    const activeTagIds = tagIds
      ? (Array.isArray(tagIds) ? tagIds.map(Number) : tagIds.split(',').map(Number)).filter(Boolean)
      : []
    const tags = await tagsService.list(categoryId || null, activeTagIds)
    res.json(tags)
  } catch (err) { next(err) }
}

module.exports = { list }
