const settingsService = require('../../services/store/settings.service')

const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings()
    res.json(settings)
  } catch (err) {
    next(err)
  }
}

module.exports = { getSettings }
