const { Setting, sequelize } = require('../../models')
const { QueryTypes } = require('sequelize')

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

// 1 consulta: INSERT ... ON CONFLICT (tenant_id, key)
const upsertSetting = async (tenantId, key, value) => {
  await sequelize.query(
    `INSERT INTO settings (tenant_id, key, value, created_at, updated_at)
     VALUES (:tenantId, :key, :value::jsonb, NOW(), NOW())
     ON CONFLICT (tenant_id, key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    {
      replacements: {
        tenantId,
        key,
        value: value === null || value === undefined ? null : JSON.stringify(value),
      },
      type: QueryTypes.INSERT,
    }
  )
}

const set = async (tenantId, key, value) => {
  await upsertSetting(tenantId, key, value)
  return { tenantId, key, value }
}

// 1 sola consulta para N settings
const setBulk = async (tenantId, data) => {
  const entries = Object.entries(data)
  if (entries.length === 0) return getAll(tenantId)

  const values = entries
    .map((_, i) => `(:tenantId, :key${i}, :value${i}::jsonb, NOW(), NOW())`)
    .join(', ')

  const replacements = { tenantId }
  entries.forEach(([key, value], i) => {
    replacements[`key${i}`] = key
    replacements[`value${i}`] = value === null || value === undefined ? null : JSON.stringify(value)
  })

  await sequelize.query(
    `INSERT INTO settings (tenant_id, key, value, created_at, updated_at)
     VALUES ${values}
     ON CONFLICT (tenant_id, key)
     DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    { replacements, type: QueryTypes.INSERT }
  )

  return getAll(tenantId)
}

module.exports = { getAll, get, set, setBulk, upsertSetting }
