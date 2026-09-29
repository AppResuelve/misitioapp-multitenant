const { Op } = require('sequelize')
const { Tenant } = require('../models')

// Resuelve el tenant por el header `X-Tenant-Slug` (lo envían la store y el admin).
// Acepta el slug, el domain o el admin_domain del tenant.
// Setea req.tenant para que controllers y services lo usen explicitamente.
const resolveTenant = async (req, res, next) => {
  console.log('[resolveTenant] url:', req.originalUrl, '| x-tenant-slug header:', req.headers['x-tenant-slug'], '| body.slug:', req.body?.slug, '| params.slug:', req.params?.slug)
  try {
    const value = req.headers['x-tenant-slug'] || req.body?.slug || req.params?.slug
    if (!value) {
      console.log('[resolveTenant] NO TENANT VALUE — returning 400')
      return res.status(400).json({ error: 'X-Tenant-Slug requerido' })
    }

    console.log('[resolveTenant] resolving tenant for value:', value)
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
      console.log('[resolveTenant] tenant NOT FOUND for value:', value)
      return res.status(404).json({ error: 'Tenant no encontrado' })
    }

    console.log('[resolveTenant] resolved tenant:', tenant.id, tenant.slug)
    req.tenant = tenant
    next()
  } catch (err) {
    console.error('[resolveTenant] ERROR:', err.message, err.stack)
    next(err)
  }
}

module.exports = resolveTenant
