const { Order } = require('../../models')

const list = async (query = {}) => {
  const { page = 1, limit = 20, status } = query
  const offset = (page - 1) * limit

  const where = {}
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

const getById = async (id) => {
  const order = await Order.findByPk(id)
  if (!order) {
    throw Object.assign(new Error('Pedido no encontrado'), { status: 404 })
  }
  return order
}

const updateStatus = async (id, status) => {
  const order = await getById(id)
  return order.update({ status })
}

const stats = async () => {
  const total = await Order.count()
  const byStatus = await Order.findAll({
    attributes: ['status', [require('sequelize').fn('COUNT', require('sequelize').col('id')), 'count']],
    group: ['status'],
  })

  const thisMonth = new Date()
  thisMonth.setDate(1)
  thisMonth.setHours(0, 0, 0, 0)

  const monthCount = await Order.count({
    where: { createdAt: { [require('sequelize').Op.gte]: thisMonth } },
  })

  const monthRevenue = await Order.sum('total', {
    where: {
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
