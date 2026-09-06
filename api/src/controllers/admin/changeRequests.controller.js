const changeRequestsService = require('../../services/admin/changeRequests.service')

const modules = async (req, res, next) => {
  try {
    const result = await changeRequestsService.fetchModules()
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const list = async (req, res, next) => {
  try {
    const result = await changeRequestsService.list(req.query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const getRemaining = async (req, res, next) => {
  try {
    const result = await changeRequestsService.getRemaining()
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const { componentId, categoryId, values } = req.body
    const request = await changeRequestsService.create(componentId, categoryId, values)
    res.status(201).json(request)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const request = await changeRequestsService.update(req.params.id, req.body.values)
    res.json(request)
  } catch (err) {
    next(err)
  }
}

module.exports = { modules, list, getRemaining, create, update }
