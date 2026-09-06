const servicesService = require('../../services/store/services.service')

const list = async (req, res, next) => {
  try { res.json(await servicesService.list(req.query)) } catch (err) { next(err) }
}
const getBySlug = async (req, res, next) => {
  try { res.json(await servicesService.getBySlug(req.params.slug)) } catch (err) { next(err) }
}

module.exports = { list, getBySlug }
