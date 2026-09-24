const settingsService = require('../../services/admin/settings.service')

const getAll = async (req, res, next) => {
  try {
    const settings = await settingsService.getAll(req.tenant.id)
    res.json(settings)
  } catch (err) {
    next(err)
  }
}

const setBulk = async (req, res, next) => {
  try {
    const settings = await settingsService.setBulk(req.tenant.id, req.body)
    res.json(settings)
  } catch (err) {
    next(err)
  }
}

module.exports = { getAll, setBulk }
