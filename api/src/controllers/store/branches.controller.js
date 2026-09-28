const branchesService = require('../../services/store/branches.service')

const list = async (req, res, next) => {
  try {
    const branches = await branchesService.list(req.tenant.id)
    res.json(branches)
  } catch (err) {
    next(err)
  }
}

module.exports = { list }