const { Branch } = require('../../models')

const list = async (tenantId) => {
  return Branch.findAll({
    where: { tenantId, isActive: true },
    order: [['sortOrder', 'ASC'], ['name', 'ASC']],
  })
}

module.exports = { list }