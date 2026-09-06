const { ChangeRequest } = require('../../models')

const PLATFORM_API_URL = process.env.PLATFORM_API_URL || 'https://api.appresuelve.site'
const PLATFORM_API_KEY = process.env.PLATFORM_API_KEY || ''

let cachedModules = null
let cachedAt = 0
const CACHE_TTL = 5 * 60 * 1000

const fetchModules = async () => {
  const now = Date.now()
  if (cachedModules && (now - cachedAt) < CACHE_TTL) {
    return cachedModules
  }

  if (!PLATFORM_API_KEY) {
    throw Object.assign(new Error('PLATFORM_API_KEY no configurada en el servidor'), { status: 500 })
  }

  const res = await fetch(`${PLATFORM_API_URL.replace(/\/+$/, '')}/api/modules`, {
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': PLATFORM_API_KEY,
    },
  })

  if (!res.ok) {
    throw Object.assign(new Error('Error al obtener módulos de la platform'), { status: 502 })
  }

  const categories = await res.json()
  cachedModules = categories
  cachedAt = now
  return categories
}

const findComponentInModules = (categories, componentId) => {
  for (const cat of categories) {
    for (const comp of cat.components) {
      if (comp.id === componentId) {
        return { category: cat, component: comp }
      }
    }
  }
  return null
}

const list = async (query = {}) => {
  const { page = 1, limit = 20 } = query
  const offset = (page - 1) * limit

  const { count, rows } = await ChangeRequest.findAndCountAll({
    order: [['createdAt', 'DESC']],
    limit: Number(limit),
    offset,
  })

  return {
    requests: rows,
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / limit),
  }
}

const getRemaining = async () => {
  const { Setting } = require('../../models')
  const settings = {}
  const rows = await Setting.findAll()
  rows.forEach((r) => { settings[r.key] = r.value })

  const limit = settings.monthly_changes_limit ?? 2
  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  let used = settings.changes_this_month ?? 0
  if (settings.changes_month !== monthKey) {
    used = 0
    await Setting.upsert({ key: 'changes_this_month', value: 0 })
    await Setting.upsert({ key: 'changes_month', value: monthKey })
  }

  return { limit, used, remaining: limit - used, canRequest: used < limit }
}

const create = async (componentId, categoryId, values) => {
  const { Setting } = require('../../models')

  const { remaining } = await getRemaining()
  if (remaining <= 0) {
    throw Object.assign(new Error('Ya alcanzaste el límite de cambios de este mes.'), { status: 429 })
  }

  const modules = await fetchModules()
  const match = findComponentInModules(modules, componentId)
  if (!match) {
    throw Object.assign(new Error('Componente no encontrado en los módulos disponibles.'), { status: 400 })
  }

  const { component } = match
  const free = component.paidOverride ? false : true
  const price = component.paidOverride ? component.price : null

  const whatsappMessage = `🛠 *Solicitud de cambio: ${component.icon || ''} ${component.name}*

${Object.entries(values).map(([k, v]) => `• *${k}:* ${v}`).join('\n')}`

  const request = await ChangeRequest.create({
    componentId,
    categoryId,
    values,
    free,
    price,
    whatsappMessage,
  })

  const phone = process.env.WHATSAPP_NOTIFY_NUMBER || ''
  const whatsappLink = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
    : ''

  const now = new Date()
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

  const settings = {}
  const rows = await Setting.findAll()
  rows.forEach((r) => { settings[r.key] = r.value })

  if (settings.changes_month !== monthKey) {
    await Setting.upsert({ key: 'changes_this_month', value: 1 })
    await Setting.upsert({ key: 'changes_month', value: monthKey })
  } else {
    await Setting.upsert({ key: 'changes_this_month', value: (settings.changes_this_month ?? 0) + 1 })
  }

  return { ...request.toJSON(), whatsappLink }
}

const update = async (id, values) => {
  const request = await ChangeRequest.findByPk(id)
  if (!request) {
    throw Object.assign(new Error('Solicitud no encontrada'), { status: 404 })
  }
  if (request.status !== 'pending') {
    throw Object.assign(new Error('Solo se pueden editar solicitudes pendientes'), { status: 400 })
  }

  const modules = await fetchModules()
  const match = findComponentInModules(modules, request.componentId)
  const label = match ? `${match.component.icon || ''} ${match.component.name}` : `ID ${request.componentId}`

  const whatsappMessage = `🛠 *Solicitud de cambio (editada): ${label}*

${Object.entries(values).map(([k, v]) => `• *${k}:* ${v}`).join('\n')}`

  const phone = process.env.WHATSAPP_NOTIFY_NUMBER || ''
  const whatsappLink = phone
    ? `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(whatsappMessage)}`
    : ''

  const updated = await request.update({ values, whatsappMessage })

  return { ...updated.toJSON(), whatsappLink }
}

const updateStatus = async (id, status, adminNotes) => {
  const request = await ChangeRequest.findByPk(id)
  if (!request) {
    throw Object.assign(new Error('Solicitud no encontrada'), { status: 404 })
  }
  return request.update({ status, ...(adminNotes && { adminNotes }) })
}

module.exports = { fetchModules, list, getRemaining, create, update, updateStatus }
