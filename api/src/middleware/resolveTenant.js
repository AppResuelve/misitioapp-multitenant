const { Op } = require('sequelize')
const { Tenant } = require('../models')
const { run } = require('../services/tenantContext')

// Resuelve el tenant por el header `X-Tenant-Slug` (lo envían la store y el admin).
// Acepta el slug, el domain o el admin_domain del tenant.
// Setea req.tenant y ejecuta el resto de la request dentro del contexto de tenant.
const resolveTenant = async (req, res, next) => {
  try {
    const value = req.headers['x-tenant-slug'] || req.body?.slug || req.params?.slug
    if (!value) {
      return res.status(400).json({ error: 'X-Tenant-Slug requerido' })
    }

    const tenant = await Tenant.findOne({
      where: {
        [Op.or]: [
          { slug: value },
          { domain: value },
          { adminDomain: value },
        ],
      },
    })
    if (!tenant) {
      return res.status(404).json({ error: 'Tenant no encontrado' })
    }

    req.tenant = tenant
    return run(tenant.id, () => next())
  } catch (err) {
    next(err)
  }
}

module.exports = resolveTenant
