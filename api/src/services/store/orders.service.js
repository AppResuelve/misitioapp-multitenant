const { Order } = require('../../models')

const create = async (tenantId, data) => {
  return Order.create({
    tenantId,
    items: data.items || [],
    customerName: data.customerName,
    customerPhone: data.customerPhone,
    customerEmail: data.customerEmail || null,
    total: data.total || 0,
    notes: data.notes || null,
    status: 'new',
  })
}

module.exports = { create }
