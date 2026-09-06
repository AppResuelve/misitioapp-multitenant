const ordersService = require('../../services/store/orders.service')

const create = async (req, res, next) => {
  try {
    const order = await ordersService.create(req.body)
    res.status(201).json(order)
  } catch (err) {
    next(err)
  }
}

module.exports = { create }
