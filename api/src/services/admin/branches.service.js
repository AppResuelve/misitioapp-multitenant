const { Branch } = require('../../models')

const list = async (tenantId) => {
  return Branch.findAll({
    where: { tenantId },
    order: [['sortOrder', 'ASC'], ['name', 'ASC']],
  })
}

const getById = async (tenantId, id) => {
  const branch = await Branch.findOne({ where: { tenantId, id } })
  if (!branch) {
    throw Object.assign(new Error('Sucursal no encontrada'), { status: 404 })
  }
  return branch
}

const create = async (tenantId, data) => {
  return Branch.create({ ...data, tenantId })
}

const update = async (tenantId, id, data) => {
  const branch = await getById(tenantId, id)
  return branch.update(data)
}

const remove = async (tenantId, id) => {
  const branch = await getById(tenantId, id)
  return branch.destroy()
}

const reorder = async (tenantId, orderedIds) => {
  const updates = orderedIds.map((branchId, index) =>
    Branch.update({ sortOrder: index }, { where: { tenantId, id: branchId } })
  )
  await Promise.all(updates)
  return list(tenantId)
}

const toggleStatus = async (tenantId, id) => {
  const branch = await getById(tenantId, id)
  return branch.update({ isActive: !branch.isActive })
}

module.exports = { list, getById, create, update, remove, reorder, toggleStatus }