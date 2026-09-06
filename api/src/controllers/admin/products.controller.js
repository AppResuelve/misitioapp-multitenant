const productsService = require('../../services/admin/products.service')
const { validateProduct, validateProductUpdate, validateBulkProducts, validateBulkPreview, validateBulkUpdate, validateSystemUpdate } = require('../../validations/product.schema')

const list = async (req, res, next) => {
  try {
    const result = await productsService.list(req.query)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const getById = async (req, res, next) => {
  try {
    const product = await productsService.getById(req.params.id)
    res.json(product)
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const data = validateProduct(req.body)
    const product = await productsService.create(data)
    res.status(201).json(product)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const data = validateProductUpdate(req.body)
    const product = await productsService.update(req.params.id, data)
    res.json(product)
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    await productsService.remove(req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

const bulkCreate = async (req, res, next) => {
  try {
    const products = validateBulkProducts(req.body)
    const { categoryId } = req.body
    const result = await productsService.bulkCreate(products, categoryId)
    res.status(201).json(result)
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
    const product = await productsService.toggleStatus(req.params.id, status)
    res.json(product)
  } catch (err) {
    next(err)
  }
}

const exportProducts = async (req, res, next) => {
  try {
    const buffer = await productsService.exportToExcel()
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', 'attachment; filename=productos.xlsx')
    res.send(buffer)
  } catch (err) {
    next(err)
  }
}

const bulkUpdate = async (req, res, next) => {
  try {
    const { field, products } = validateBulkUpdate(req.body)
    const result = await productsService.bulkUpdate(field, products)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const previewDiff = async (req, res, next) => {
  try {
    const { field, products } = validateBulkPreview(req.body)
    const result = await productsService.previewDiff(field, products)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

const systemUpdate = async (req, res, next) => {
  try {
    const { field, value, productIds } = validateSystemUpdate(req.body)
    const result = await productsService.systemUpdate(field, value, productIds)
    res.json(result)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, getById, create, update, remove, bulkCreate, toggleStatus, exportProducts, bulkUpdate, previewDiff, systemUpdate }
