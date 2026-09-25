const discountsService = require('../../services/admin/discounts.service')
const { validateDiscount, validateDiscountUpdate } = require('../../validations/discount.schema')

const list = async (req, res, next) => {
  try {
    const [discounts, overlaps] = await Promise.all([
      discountsService.list(req.tenant.id),
      discountsService.overlaps(req.tenant.id),
    ])
    res.json({ discounts, overlaps })
  } catch (err) {
    next(err)
  }
}

const create = async (req, res, next) => {
  try {
    const data = validateDiscount(req.body)
    const discount = await discountsService.create(req.tenant.id, data)
    res.status(201).json(discount)
  } catch (err) {
    next(err)
  }
}

const update = async (req, res, next) => {
  try {
    const data = validateDiscountUpdate(req.body)
    const discount = await discountsService.update(req.tenant.id, req.params.id, data)
    res.json(discount)
  } catch (err) {
    next(err)
  }
}

const remove = async (req, res, next) => {
  try {
    await discountsService.remove(req.tenant.id, req.params.id)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

const setStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!['draft', 'active'].includes(status)) {
      return res.status(400).json({ error: 'Status inválido' })
    }
    const discount = await discountsService.setStatus(req.tenant.id, req.params.id, status)
    res.json(discount)
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, update, remove, setStatus }
