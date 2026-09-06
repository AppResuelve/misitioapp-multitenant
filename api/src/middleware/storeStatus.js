const { Setting } = require('../models')
const { getStatus } = require('../services/billing.service')

const storeStatus = async (req, res, next) => {
  try {
    const billingStatus = await getStatus()

    if (billingStatus === 'suspended') {
      return res.status(503).json({ error: 'store_suspended', message: 'Tienda suspendida por falta de pago. Contactanos.' })
    }

    const row = await Setting.findOne({ where: { key: 'store_status' } })
    const status = row?.value || 'active'

    if (status === 'active') {
      return next()
    }

    if (status === 'draft') {
      return res.status(503).json({ error: 'store_draft', message: 'Tienda en construcción. Volvé pronto.' })
    }

    if (status === 'maintenance') {
      return res.status(503).json({ error: 'store_maintenance', message: 'Tienda en mantenimiento. Disculpá las molestias.' })
    }

    next()
  } catch {
    next()
  }
}

module.exports = storeStatus
