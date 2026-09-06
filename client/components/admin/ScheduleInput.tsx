// @ts-nocheck
'use client'
import { Plus, X } from 'lucide-react'

const DAYS = [
  { key: 'mon', label: 'Lun' },
  { key: 'tue', label: 'Mar' },
  { key: 'wed', label: 'Mié' },
  { key: 'thu', label: 'Jue' },
  { key: 'fri', label: 'Vie' },
  { key: 'sat', label: 'Sáb' },
  { key: 'sun', label: 'Dom' },
]

const DAY_NAMES = { mon: 'Lunes', tue: 'Martes', wed: 'Miércoles', thu: 'Jueves', fri: 'Viernes', sat: 'Sábado', sun: 'Domingo' }
const DAY_ORDER = { mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6, sun: 7 }

function formatPreview(schedules) {
  if (!schedules || schedules.length === 0) return ''
  return schedules.map((block) => {
    if (!block.days || block.days.length === 0) return ''
    const sorted = [...block.days].sort((a, b) => DAY_ORDER[a] - DAY_ORDER[b])
    const daysLabel = sorted.length > 2
      ? `${DAY_NAMES[sorted[0]].slice(0, 3)} a ${DAY_NAMES[sorted[sorted.length - 1]].slice(0, 3)}`
      : sorted.map((d) => DAY_NAMES[d]).join(' y ')
    const timesLabel = (block.timeRanges || []).map((r) => `${r.open} a ${r.close}`).join(' / ') || 'Sin horario'
    return `${daysLabel}: ${timesLabel}`
  }).filter(Boolean).join('\n')
}

export default function ScheduleInput({ value = [], onChange }) {
  const schedules = Array.isArray(value) && value.length > 0 ? value : [{ days: [], timeRanges: [{ open: '09:00', close: '18:00' }] }]

  const handleChange = (newSchedules) => {
    onChange(newSchedules)
  }

  const toggleDay = (blockIdx, day) => {
    const updated = schedules.map((block, i) => {
      if (i !== blockIdx) return block
      const days = block.days.includes(day)
        ? block.days.filter((d) => d !== day)
        : [...block.days, day]
      return { ...block, days }
    })
    handleChange(updated)
  }

  const updateTime = (blockIdx, rangeIdx, field, value) => {
    const updated = schedules.map((block, i) => {
      if (i !== blockIdx) return block
      const ranges = [...block.timeRanges]
      ranges[rangeIdx] = { ...ranges[rangeIdx], [field]: value }
      return { ...block, timeRanges: ranges }
    })
    handleChange(updated)
  }

  const addTimeRange = (blockIdx) => {
    const updated = schedules.map((block, i) => {
      if (i !== blockIdx) return block
      if (block.timeRanges.length >= 2) return block
      const last = block.timeRanges[block.timeRanges.length - 1]
      return { ...block, timeRanges: [...block.timeRanges, { open: last?.close || '13:00', close: '18:00' }] }
    })
    handleChange(updated)
  }

  const removeTimeRange = (blockIdx, rangeIdx) => {
    const updated = schedules.map((block, i) => {
      if (i !== blockIdx) return block
      return { ...block, timeRanges: block.timeRanges.filter((_, j) => j !== rangeIdx) }
    })
    handleChange(updated)
  }

  const addBlock = () => {
    if (schedules.length >= 2) return
    handleChange([...schedules, { days: [], timeRanges: [{ open: '09:00', close: '13:00' }] }])
  }

  const removeBlock = (blockIdx) => {
    handleChange(schedules.filter((_, i) => i !== blockIdx))
  }

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-zinc-400">Horarios de atención</label>

      {schedules.map((block, blockIdx) => (
        <div key={blockIdx} className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 font-medium uppercase tracking-wider">Bloque {blockIdx + 1}</span>
            {schedules.length > 1 && (
              <button onClick={() => removeBlock(blockIdx)} className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Quitar bloque">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Day selector */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Días</p>
            <div className="flex flex-wrap gap-1.5">
              {DAYS.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggleDay(blockIdx, key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    block.days.includes(key)
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Time ranges */}
          <div>
            <p className="text-xs text-zinc-500 mb-2">Horarios</p>
            <div className="space-y-2">
              {block.timeRanges.map((range, rangeIdx) => (
                <div key={rangeIdx} className="flex items-center gap-2">
                  <input
                    type="time"
                    value={range.open}
                    onChange={(e) => updateTime(blockIdx, rangeIdx, 'open', e.target.value)}
                    className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                  <span className="text-zinc-600 text-xs">hasta</span>
                  <input
                    type="time"
                    value={range.close}
                    onChange={(e) => updateTime(blockIdx, rangeIdx, 'close', e.target.value)}
                    className="px-2 py-1.5 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-xs focus:outline-none focus:border-cyan-500"
                  />
                  {block.timeRanges.length > 1 && (
                    <button onClick={() => removeTimeRange(blockIdx, rangeIdx)} className="p-1 rounded text-zinc-500 hover:text-red-400 transition-colors" title="Quitar horario">
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {block.timeRanges.length < 2 && (
              <button
                type="button"
                onClick={() => addTimeRange(blockIdx)}
                className="mt-2 text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Agregar horario
              </button>
            )}
          </div>
        </div>
      ))}

      {schedules.length < 2 && (
        <button
          type="button"
          onClick={addBlock}
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 w-full justify-center py-2 rounded-lg border border-dashed border-zinc-700 hover:border-cyan-500/50"
        >
          <Plus className="w-3 h-3" /> Agregar bloque de días
        </button>
      )}

      {schedules.some((b) => b.days?.length > 0 && b.timeRanges?.length > 0) && (
        <div className="px-4 py-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-sm text-cyan-300 whitespace-pre-line leading-relaxed">
          {formatPreview(schedules)}
        </div>
      )}
    </div>
  )
}
