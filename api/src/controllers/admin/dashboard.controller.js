const dashboardService = require('../../services/admin/dashboard.service')

const get = async (req, res, next) => {
  try {
    const data = await dashboardService.get()
    res.json(data)
  } catch (err) {
    next(err)
  }
}

module.exports = { get }
