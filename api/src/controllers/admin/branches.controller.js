const branchesService = require('../../services/admin/branches.service')

const list = async (req, res, next) => {
  try {
    const branches = await branchesService.list(req.tenant.id)
    res.json(branches)
  } catch (err) {
    next(err)
  }
}

const getById = async (req, res, next) => {
  try {
    const branch = await branchesService.getById(req.tenant.id, req.params.id)
    res.json(branch)
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const branch = await branchesService.create(req.tenant.id, req.body)
    res.status(201).json(branch)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const branch = await branchesService.update(req.tenant.id, req.params.id, req.body)
    res.json(branch)
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    await branchesService.remove(req.tenant.id, req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

const reorder = async (req, res, next) => {
  try {
    const branches = await branchesService.reorder(req.tenant.id, req.body.orderedIds)
    res.json(branches)
  } catch (err) {
    next(err)
  }
}

const toggleStatus = async (req, res, next) => {
  try {
    const branch = await branchesService.toggleStatus(req.tenant.id, req.params.id)
    res.json(branch)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getById, create, update, remove, reorder, toggleStatus }