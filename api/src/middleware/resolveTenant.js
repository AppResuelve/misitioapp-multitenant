const { Op } = require('sequelize')
const { Tenant } = require('../models')

// Resuelve el tenant por el header `X-Tenant-Slug` (lo envían la store y el admin).
// Acepta el slug, el domain o el admin_domain del tenant.
// Setea req.tenant para que controllers y services lo usen explicitamente.
const resolveTenant = async (req, res, next) => {
  try {
    const value = req.headers['x-tenant-slug'] || req.body?.slug || req.params?.slug
    console.log('[DEBUG resolveTenant] value:', JSON.stringify(value), '| method:', req.method, '| path:', req.path)
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
      console.log('[DEBUG resolveTenant] TENANT NO ENCONTRADO para value:', JSON.stringify(value))
      return res.status(404).json({ error: 'Tenant no encontrado' })
    }

    console.log('[DEBUG resolveTenant] tenant encontrado → id:', tenant.id, '| slug:', JSON.stringify(tenant.slug), '| domain:', JSON.stringify(tenant.domain), '| adminDomain:', JSON.stringify(tenant.adminDomain))
    req.tenant = tenant
    next()
  } catch (err) {
    next(err)
  }
}

module.exports = resolveTenant
