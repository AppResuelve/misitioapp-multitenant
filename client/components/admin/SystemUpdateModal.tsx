// @ts-nocheck
'use client'
import { useState } from 'react'
import { Button } from './ui/Form'
import { Modal } from './ui/Modal'
import { Spinner } from './ui/Spinner'
import { useAlert } from './ui/AlertContext'
import api from '@/services/admin-api'
import { SYSTEM_FIELDS } from './lib/excel-utils'

const NUMERIC_FIELDS = ['retailPrice', 'wholesalePrice', 'wholesaleMinQty', 'discountPercentage', 'comparePrice', 'stock']

const selectClass = "w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-cyan-500"

export default function SystemUpdateModal({ open, onClose, selectedIds, categories = [], onUpdated }) {
  const Alert = useAlert()
  const [field, setField] = useState('')
  const [value, setValue] = useState('')
  const [processing, setProcessing] = useState(false)
  const [result, setResult] = useState(null)

  const isNumeric = NUMERIC_FIELDS.includes(field)

  const canApply = field && !processing && (() => {
    if (field === 'status' || field === 'categoryId') return true
    if (isNumeric) return value !== '' && !isNaN(Number(value))
    return true
  })()

  const selectField = (key) => {
    setField(key)
    setValue(key === 'status' ? 'active' : '')
  }

  const handleClose = () => {
    setField('')
    setValue('')
    setResult(null)
    onClose()
  }

  const buildPayloadValue = () => {
    if (field === 'status') return value
    if (field === 'categoryId') return value === '' ? null : Number(value)
    return value === '' ? null : value
  }

  const handleApply = async () => {
    if (!canApply) return
    setProcessing(true)
    try {
      const payload = {
        field,
        value: buildPayloadValue(),
        productIds: selectedIds,
      }
      const { data } = await api.post('/admin/products/bulk-update/system', payload)
      setResult(data)
      Alert.fire({
        message: `${data.updated} producto(s) actualizado(s). ${data.skipped > 0 ? `${data.skipped} omitido(s).` : ''}`,
        type: 'success',
      })
      onUpdated?.()
    } catch (err) {
      let msg = 'Error al actualizar productos'
      try {
        const body = typeof err.response?.data === 'string' ? JSON.parse(err.response.data) : err.response?.data
        msg = body?.error || body?.message || msg
      } catch {}
      Alert.fire({ message: msg, type: 'error' })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Actualizar desde el sistema" closable={!processing}>
      {result ? (
        <div className="space-y-4">
          <div className="text-center">
            <p className="text-emerald-400 font-medium text-lg">{result.updated} producto{result.updated !== 1 ? 's' : ''} actualizado{result.updated !== 1 ? 's' : ''}</p>
            {result.skipped > 0 && <p className="text-sm text-amber-400 mt-1">{result.skipped} omitido{result.skipped !== 1 ? 's' : ''}</p>}
            {result.skipped === 0 && <p className="text-sm text-zinc-500 mt-1">Sin omisiones</p>}
          </div>

          {result.warnings?.length > 0 && (
            <div className="max-h-52 overflow-y-auto border border-zinc-800 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-zinc-900 sticky top-0">
                  <tr className="text-zinc-500 text-xs uppercase tracking-wider">
                    <th className="text-left px-3 py-2 font-medium">Producto</th>
                    <th className="text-left px-3 py-2 font-medium">Motivo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800">
                  {result.warnings.map((w, i) => (
                    <tr key={i} className="text-zinc-300">
                      <td className="px-3 py-2 truncate max-w-[200px] font-mono text-xs">{w.slug}</td>
                      <td className="px-3 py-2 text-zinc-400">{w.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <Button type="button" onClick={handleClose}>Entendido</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-zinc-400">
            Se aplicará a {selectedIds.length} producto{selectedIds.length !== 1 ? 's' : ''} seleccionado{selectedIds.length !== 1 ? 's' : ''}.
          </p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SYSTEM_FIELDS.map(({ key, label }) => {
              const checked = field === key
              return (
                <label key={key}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors
                    ${checked
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300'
                      : 'bg-zinc-800/50 border-zinc-700 text-zinc-400 hover:border-zinc-600'}`}
                >
                  <input type="radio" name="sysField" checked={checked} onChange={() => selectField(key)} className="sr-only" />
                  <span className="text-sm">{label}</span>
                </label>
              )
            })}
          </div>

          {field === 'status' && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Nuevo estado</label>
              <select value={value} onChange={(e) => setValue(e.target.value)} className={selectClass}>
                <option value="active">Activo</option>
                <option value="draft">Borrador</option>
              </select>
            </div>
          )}

          {field === 'categoryId' && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Nueva categoría</label>
              <select value={value} onChange={(e) => setValue(e.target.value)} className={selectClass}>
                <option value="">Sin categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}

          {field && field !== 'status' && field !== 'categoryId' && (
            <div>
              <label className="block text-xs font-medium text-zinc-500 mb-1.5 uppercase tracking-wider">Nuevo valor</label>
              <input
                type={isNumeric ? 'number' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={isNumeric ? '0' : ''}
                min={field === 'discountPercentage' ? 1 : 0}
                max={field === 'discountPercentage' ? 100 : undefined}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          )}

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>Cancelar</Button>
            <Button type="button" onClick={handleApply} disabled={!canApply}>
              {processing ? 'Aplicando...' : `Aplicar a ${selectedIds.length} producto${selectedIds.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
