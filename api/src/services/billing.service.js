const { Tenant } = require('../models')

const STATUSES = ['active', 'past_due', 'suspended']

// Devuelve el billing_status del tenant indicado.
const getStatus = async (tenantId) => {
  if (!tenantId) return 'active'
  const tenant = await Tenant.findByPk(tenantId)
  return STATUSES.includes(tenant?.billingStatus) ? tenant.billingStatus : 'active'
}

const setStatus = async (tenantId, status) => {
  if (!STATUSES.includes(status)) {
    throw Object.assign(new Error('Estado de billing inválido'), { status: 400 })
  }
  const tenant = await Tenant.findByPk(tenantId)
  if (!tenant) {
    throw Object.assign(new Error('Tenant no encontrado'), { status: 404 })
  }
  await tenant.update({ billingStatus: status })
  return tenant
}

module.exports = { getStatus, setStatus, STATUSES }
