const { getStatus } = require('../services/billing.service')

// Bloquea el acceso al admin cuando la tienda está suspendida por falta de pago.
// El super_admin (role 'super_admin') queda exento.
const billingGuard = async (req, res, next) => {
  if (req.user?.role === 'super_admin') {
    return next()
  }

  try {
    const status = await getStatus()
    if (status === 'suspended') {
      return res.status(403).json({ error: 'store_suspended', message: 'Tienda suspendida por falta de pago.' })
    }
  } catch {
    // ante fallo de lectura, no bloquear
  }

  next()
}

module.exports = billingGuard
