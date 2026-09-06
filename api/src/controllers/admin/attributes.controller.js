const attributesService = require('../../services/admin/attributes.service')

const list = async (req, res, next) => {
  try {
    const attributes = await attributesService.list()
    res.json(attributes)
  } catch (err) { next(err) }
}

const create = async (req, res, next) => {
  try {
    const attribute = await attributesService.create(req.body)
    res.status(201).json(attribute)
  } catch (err) { next(err) }
}

const update = async (req, res, next) => {
  try {
    const attribute = await attributesService.update(req.params.id, req.body)
    res.json(attribute)
  } catch (err) { next(err) }
}

const remove = async (req, res, next) => {
  try {
    await attributesService.remove(req.params.id)
    res.status(204).end()
  } catch (err) { next(err) }
}

const updateValue = async (req, res, next) => {
  try {
    const { AttributeValue } = require('../../models')
    const attr = await AttributeValue.update(
      { images: req.body.images || [] },
      { where: { id: req.params.valueId, attributeId: req.params.attrId } }
    )
    res.json({ ok: true })
  } catch (err) { next(err) }
}

module.exports = { list, create, update, remove, updateValue }
