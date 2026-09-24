const ordersService = require('../../services/admin/orders.service')

const list = async (req, res, next) => {
  try {
    const result = await ordersService.list(req.tenant.id, req.query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const getById = async (req, res, next) => {
  try {
    const order = await ordersService.getById(req.tenant.id, req.params.id)
    res.json(order)
  } catch (err) {
    next(err)
  }
}

const updateStatus = async (req, res, next) => {
  try {
    const order = await ordersService.updateStatus(req.tenant.id, req.params.id, req.body.status)
    res.json(order)
  } catch (err) {
    next(err)
  }
}

const stats = async (req, res, next) => {
  try {
    const result = await ordersService.stats(req.tenant.id)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getById, updateStatus, stats }
