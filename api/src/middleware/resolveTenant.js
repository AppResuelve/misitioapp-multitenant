const { Tenant } = require('../models')
const { run } = require('../services/tenantContext')

// Resuelve el tenant por el header `X-Tenant-Slug` (lo envían la store y el admin).
// Setea req.tenant y ejecuta el resto de la request dentro del contexto de tenant.
const resolveTenant = async (req, res, next) => {
  try {
    const slug = req.headers['x-tenant-slug'] || req.body?.slug || req.params?.slug
    if (!slug) {
      return res.status(400).json({ error: 'X-Tenant-Slug requerido' })
    }

    const tenant = await Tenant.findOne({ where: { slug } })
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
