const settingsService = require('../../services/store/settings.service')
const { Branch } = require('../../models')

const DAY_NAMES = { mon: 'Lun', tue: 'Mar', wed: 'Mié', thu: 'Jue', fri: 'Vie', sat: 'Sáb', sun: 'Dom' }
const DAY_ORDER = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 }

function hasGaps(sortedDays) {
  for (let i = 1; i < sortedDays.length; i++) {
    if (DAY_ORDER[sortedDays[i]] - DAY_ORDER[sortedDays[i - 1]] > 1) {
      return true
    }
  }
  return false
}

function formatDaysLabel(sortedShortDays) {
  if (sortedShortDays.length === 0) return ''
  if (sortedShortDays.length === 1) return DAY_NAMES[sortedShortDays[0]]
  if (sortedShortDays.length === 2) {
    return `${DAY_NAMES[sortedShortDays[0]]} y ${DAY_NAMES[sortedShortDays[1]]}`
  }
  if (!hasGaps(sortedShortDays)) {
    return `${DAY_NAMES[sortedShortDays[0]]} a ${DAY_NAMES[sortedShortDays[sortedShortDays.length - 1]]}`
  }
  const abbreviated = sortedShortDays.map((d) => DAY_NAMES[d])
  return abbreviated.slice(0, -1).join(', ') + ' y ' + abbreviated[abbreviated.length - 1]
}

function formatBranchHours(hoursJson) {
  if (!hoursJson) return []
  try {
    const schedules = typeof hoursJson === 'string' ? JSON.parse(hoursJson) : hoursJson
    if (!Array.isArray(schedules)) return []
    return schedules
      .map((block) => {
        if (!block.days || block.days.length === 0) return null
        const sorted = [...block.days].sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b])
        const daysLabel = formatDaysLabel(sorted)
        const timesLabel = (block.timeRanges || [])
          .map((r) => `${r.open} a ${r.close}`)
          .join(' / ') || 'Sin horario'
        return `${daysLabel}: ${timesLabel}`
      })
      .filter(Boolean)
  } catch {
    return []
  }
}

const getSettings = async (req, res, next) => {
  try {
    const [settings, branches] = await Promise.all([
      settingsService.getSettings(req.tenant.id),
      Branch.findAll({
        where: { tenantId: req.tenant.id, isActive: true },
        order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      }),
    ])

    const formattedBranches = branches.map((b) => ({
      ...b.toJSON(),
      hours: formatBranchHours(b.hours),
    }))

    res.json({ ...settings, branches: formattedBranches })
  } catch (err) {
    next(err)
  }
}

module.exports = { getSettings }