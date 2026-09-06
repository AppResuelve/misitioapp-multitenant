const { Setting } = require('../../models')

const getAll = async () => {
  const rows = await Setting.findAll()
  const settings = {}
  rows.forEach((row) => {
    settings[row.key] = row.value
  })
  return settings
}

const get = async (key) => {
  const setting = await Setting.findOne({ where: { key } })
  return setting ? setting.value : null
}

const set = async (key, value) => {
  const [setting] = await Setting.upsert({ key, value })
  return setting
}

const setBulk = async (data) => {
  // data = { business_name: '...', primary_color: '#...', ... }
  const entries = Object.entries(data).map(([key, value]) => ({ key, value }))
  await Setting.bulkCreate(entries, {
    updateOnDuplicate: ['value'],
  })
  return getAll()
}

module.exports = { getAll, get, set, setBulk }
