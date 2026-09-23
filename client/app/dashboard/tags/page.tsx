// @ts-nocheck
'use client'
import { useState, useEffect } from "react";
import { Plus, Trash2, Tag } from 'lucide-react'
import { Button, Input } from '@/components/admin/ui/Form'
import { Modal } from '@/components/admin/ui/Modal'
import { Spinner } from '@/components/admin/ui/Spinner'
import { useAlert } from '@/components/admin/ui/AlertContext'
import { useUnsavedChanges } from '@/context/UnsavedChangesContext'
import { useTags } from '@/hooks/admin-useTags'
import api from '@/services/admin-api'

export default function TagsPage() {
  const { tags, loading, refetch } = useTags()
  const Alert = useAlert()
  const { setIsDirty, confirmLeave } = useUnsavedChanges()
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', color: '#6366f1', values: [] })
  const [originalForm, setOriginalForm] = useState(null)

  const openNew = () => { setEditingId('new'); setForm({ name: '', color: '#6366f1', values: [] }); setOriginalForm(null); setIsDirty(false) }
  const openEdit = (tag) => {
    const snapshot = { name: tag.name, color: tag.color, values: (tag.values || []).map(v => ({ id: v.id, value: v.value, sortOrder: v.sortOrder || 0 })) }
    setEditingId(tag.id)
    setForm(snapshot)
    setOriginalForm(snapshot)
    setIsDirty(false)
  }
  const closeForm = async () => { if (await confirmLeave()) { setEditingId(null); setOriginalForm(null) } }

  const addValue = () => { setForm({ ...form, values: [...form.values, { value: '', sortOrder: form.values.length }] }); setIsDirty(true) }
  const removeValue = (i) => { setForm({ ...form, values: form.values.filter((_, idx) => idx !== i) }); setIsDirty(true) }
  const handleValueChange = (i, value) => {
    const vals = [...form.values]
    vals[i] = { ...vals[i], value }
    setForm({ ...form, values: vals })
    setIsDirty(true)
  }

  const buildConflictMessage = (body) => {
    const lines = [body.message]
    if (body.sampleProducts?.length > 0) {
      lines.push('')
      lines.push('Productos afectados:')
      body.sampleProducts.forEach(p => lines.push(`  • ${p.name}`))
      if (body.affectedCount > body.sampleProducts.length) {
        lines.push(`  ...y ${body.affectedCount - body.sampleProducts.length} más`)
      }
    }
    lines.push('')
    lines.push('Si continuás, se desasociará de esos productos.')
    return lines.join('\n')
  }

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.fire({ message: 'El nombre es obligatorio', type: 'warning' }); return }
    setSaving(true)
    try {
      const payload = {
        name: form.name,
        color: form.color,
        values: form.values.map(v => ({
          ...(v.id && { id: v.id }),
          value: v.value,
          sortOrder: v.sortOrder || 0,
        })),
      }
      if (editingId === 'new') {
        await api.post('/admin/tags', payload)
      } else {
        try {
          await api.put(`/admin/tags/${editingId}`, payload)
        } catch (err) {
          const body = err.response?.data
          if (body?.requiresConfirmation) {
            const result = await Alert.fire({
              title: '¿Guardar cambios?',
              message: buildConflictMessage(body),
              type: 'warning',
              variant: 'modal',
              showCancelButton: true,
              confirmButtonText: 'Guardar',
              cancelButtonText: 'Cancelar',
            })
            if (result.isConfirmed) {
              await api.put(`/admin/tags/${editingId}?force=true`, payload)
            } else {
              if (originalForm) setForm(originalForm)
              setIsDirty(false)
              setSaving(false)
              return
            }
          } else {
            throw err
          }
        }
      }
      Alert.fire({ message: editingId === 'new' ? 'Etiqueta creada' : 'Etiqueta actualizada', type: 'success', duration: 1500 })
      setIsDirty(false); setEditingId(null); setOriginalForm(null); refetch()
    } catch { Alert.fire({ message: 'Error al guardar', type: 'error' }) }
    finally { setSaving(false) }
  }

  const handleDelete = async (tag) => {
    try {
      await api.delete(`/admin/tags/${tag.id}`)
      Alert.fire({ message: 'Etiqueta eliminada', type: 'success' })
      refetch()
    } catch (err) {
      const body = err.response?.data
      if (body?.requiresConfirmation) {
        const result = await Alert.fire({
          title: '¿Eliminar etiqueta?',
          message: buildConflictMessage(body),
          type: 'warning',
          variant: 'modal',
          showCancelButton: true,
          confirmButtonText: 'Eliminar',
          cancelButtonText: 'Cancelar',
        })
        if (result.isConfirmed) {
          try {
            await api.delete(`/admin/tags/${tag.id}?force=true`)
            Alert.fire({ message: 'Etiqueta eliminada', type: 'success' })
            refetch()
          } catch { Alert.fire({ message: 'Error al eliminar', type: 'error' }) }
        }
      } else {
        Alert.fire({ message: 'Error al eliminar', type: 'error' })
      }
    }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner /></div>

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Etiquetas</h1>
          <p className="text-sm text-zinc-500 mt-1">Gestioná etiquetas para filtrar productos en la tienda</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Nueva etiqueta</Button>
      </div>

      <div className="space-y-3">
        {tags.map(tag => (
          <div key={tag.id} className="rounded-xl border border-zinc-700 bg-zinc-900/50 overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: tag.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-zinc-100">{tag.name}</h3>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(tag.values || []).map(v => (
                    <span key={v.id} className="text-xs px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                      {v.value}
                    </span>
                  ))}
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => openEdit(tag)}>Editar</Button>
              <button onClick={() => handleDelete(tag)} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {tags.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-zinc-700">
            <Tag className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">No hay etiquetas creadas</p>
            <p className="text-xs text-zinc-600 mt-1">Creá etiquetas como "Mascotas" o "Tamaño" para agrupar productos</p>
          </div>
        )}
      </div>

      {editingId && (
        <Modal
          open={!!editingId}
          onClose={closeForm}
          title={editingId === 'new' ? 'Nueva etiqueta' : 'Editar etiqueta'}
          closable
        >
          <div className="space-y-4">
            <Input
              label="Nombre"
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setIsDirty(true) }}
              placeholder="Mascotas, Tamaño..."
            />
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-zinc-400">Color</label>
              <input
                type="color"
                value={form.color}
                onChange={(e) => { setForm({ ...form, color: e.target.value }); setIsDirty(true) }}
                className="w-10 h-10 rounded-lg border border-zinc-700 bg-zinc-800 cursor-pointer"
              />
              <span className="text-xs text-zinc-500 font-mono">{form.color}</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-zinc-400">Valores</span>
                <button type="button" onClick={addValue} className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300">
                  <Plus className="w-3 h-3" /> Agregar valor
                </button>
              </div>
              {form.values.length === 0 ? (
                <p className="text-xs text-zinc-600 italic">Ej: Perro, Gato, Otros...</p>
              ) : (
                <div className="space-y-2">
                  {form.values.map((v, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600 w-5">{i + 1}</span>
                      <input
                        type="text"
                        value={v.value}
                        onChange={(e) => handleValueChange(i, e.target.value)}
                        placeholder="Valor"
                        className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:border-cyan-500"
                      />
                      <button onClick={() => removeValue(i)} className="p-1.5 text-zinc-600 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={closeForm}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
