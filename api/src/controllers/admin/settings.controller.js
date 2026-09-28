const settingsService = require('../../services/admin/settings.service')
const { Tenant } = require('../../models')

const getAll = async (req, res, next) => {
  try {
    const [settings, tenant] = await Promise.all([
      settingsService.getAll(req.tenant.id),
      Tenant.findByPk(req.tenant.id, { attributes: ['domain'] }),
    ])
    res.json({
      ...settings,
      domain: tenant?.domain || null,
    })
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