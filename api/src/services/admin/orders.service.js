const { Order } = require('../../models')

const list = async (tenantId, query = {}) => {
  const { page = 1, limit = 20, status } = query
  const offset = (page - 1) * limit

  const where = { tenantId }
  if (status) where.status = status

  const { count, rows } = await Order.findAndCountAll({
    where,
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  })

  return {
    orders: rows,
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / limit),
  }
}

const getById = async (tenantId, id) => {
  const order = await Order.findOne({ where: { tenantId, id } })
  if (!order) {
    throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  }
  return order
}

const updateStatus = async (tenantId, id, status) => {
  const order = await getById(tenantId, id)
  return order.update({ status })
}

const stats = async (tenantId) => {
  const total = await Order.count({ where: { tenantId } })
  const byStatus = await Order.findAll({
    where: { tenantId },
    attributes: ['status', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
    group: ['status'],
  })

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const monthCount = await Order.count({
    where: { tenantId, createdAt: { [require('sequelize').Op.gte]: thisMonth } },
  })

  const monthRevenue = await Order.sum('total', {
    where: {
      tenantId,
      createdAt: { [require('sequelize').Op.gte]: thisMonth },
      status: { [require('sequelize').Op.ne]: 'cancelled' },
    },
  })

  return {
    total,
    byStatus,
    thisMonth: { count: monthCount, revenue: monthRevenue || 0 },
  }
}

module.exports = { list, getById, updateStatus, stats }
