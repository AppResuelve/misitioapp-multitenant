const { Setting } = require('../../models')

const getAll = async (tenantId) => {
  const rows = await Setting.findAll({ where: { tenantId } })
  const settings = {}
  rows.forEach((row) => {
    settings[row.key] = row.value
  })
  return settings
}

const get = async (tenantId, key) => {
  const setting = await Setting.findOne({ where: { tenantId, key } })
  return setting ? setting.value : null
}

const set = async (tenantId, key, value) => {
  const [setting] = await Setting.upsert({ tenantId, key, value })
  return setting
}

const setBulk = async (tenantId, data) => {
  // data = { business_name: '...', primary_color: '#...', ... }
  const entries = Object.entries(data).map(([key, value]) => ({ tenantId, key, value }))
  await Setting.bulkCreate(entries, {
    updateOnDuplicate: ['value'],
  })
  return getAll(tenantId)
}

module.exports = { getAll, get, set, setBulk }
