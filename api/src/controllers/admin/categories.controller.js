const categoriesService = require('../../services/admin/categories.service')

const list = async (req, res, next) => {
  try {
    const categories = await categoriesService.list()
    res.json(categories)
  } catch (err) {
    next(err)
  }
}

const getById = async (req, res, next) => {
  try {
    const category = await categoriesService.getById(req.params.id)
    res.json(category)
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const category = await categoriesService.create(req.body)
    res.status(201).json(category)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const category = await categoriesService.update(req.params.id, req.body)
    res.json(category)
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    await categoriesService.remove(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

const reorder = async (req, res, next) => {
  try {
    const categories = await categoriesService.reorder(req.body.orderedIds)
    res.json(categories)
  } catch (err) {
    next(err)
  }
}

const toggleStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['active', 'draft'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' })
    }
    const category = await categoriesService.toggleStatus(req.params.id, status)
    res.json(category)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getById, create, update, remove, reorder, toggleStatus }
