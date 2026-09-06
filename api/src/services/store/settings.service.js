const { Setting } = require('../../models')

const DEFAULTS = [
  { key: 'store_status', value: 'active' },
  { key: 'whatsapp_number', value: '' },
  { key: 'business_name', value: '' },
  { key: 'business_slogan', value: '' },
  { key: 'business_description', value: '' },
  { key: 'logo_url', value: '/logotipo.png' },
  { key: 'favicon_url', value: '/logotipo.png' },
  { key: 'email', value: '' },
  { key: 'address', value: '' },
  { key: 'business_hours', value: [] },
  { key: 'instagram', value: '' },
  { key: 'facebook', value: '' },
  { key: 'tiktok', value: '' },
  { key: 'youtube', value: '' },
  { key: 'monthly_changes_limit', value: 2 },
  { key: 'changes_this_month', value: 0 },
]

const ensureDefaults = async () => {
  for (const { key, value } of DEFAULTS) {
    await Setting.findOrCreate({ where: { key }, defaults: { key, value } })
  }
}

const getSettings = async () => {
  const rows = await Setting.findAll()
  const settings = {}
  rows.forEach((row) => {
    settings[row.key] = row.value
  })
  return settings
}

module.exports = { ensureDefaults, getSettings }
