const settingsService = require('../../services/store/settings.service')
const { Branch } = require('../../models')

const getSettings = async (req, res, next) => {
  try {
    const [settings, branches] = await Promise.all([
      settingsService.getSettings(req.tenant.id),
      Branch.findAll({
        where: { tenantId: req.tenant.id, isActive: true },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      }),
    ])
    res.json({ ...settings, branches })
  } catch (err) {
    next(err)
  }
}

module.exports = { getSettings }
