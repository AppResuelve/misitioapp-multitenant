// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { Plus, Trash2, Percent, Calendar, Eye, EyeOff, AlertTriangle } from 'lucide-react'
import { Button, Input, Select } from '@/components/admin/ui/Form'
import { Modal } from '@/components/admin/ui/Modal'
import { Spinner } from '@/components/admin/ui/Spinner'
import { Checkbox } from '@/components/admin/ui/Checkbox'
import { useAlert } from '@/components/admin/ui/AlertContext'
import { useCategories } from '@/hooks/admin-useCategories'
import { useProducts } from '@/hooks/admin-useProducts'
import api from '@/services/admin-api'

const TYPE_LABELS = {
  global: 'Global (todos los productos)',
  category: 'Por categoría',
  price_range: 'Por rango de precio',
  products: 'Productos seleccionados',
  cart_total: 'Por volumen de compra (carrito)',
}

const EMPTY_FORM = {
  name: '',
  type: 'global',
  percentage: '',
  status: 'draft',
  startAt: '',
  endAt: '',
  categoryIds: [],
  productIds: [],
  min: '',
  max: '',
  minAmount: '',
  countDiscounted: false,
}

function toLocalInput(iso) {
  const d = new Date(iso)
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

function discountState(d) {
  if (d.status === 'draft') return { key: 'draft', label: 'Borrador', cls: 'bg-zinc-800 text-zinc-400' }
  const now = new Date()
  const start = new Date(d.startAt)
  const end = d.endAt ? new Date(d.endAt) : null
  if (start > now) return { key: 'scheduled', label: 'Programado', cls: 'bg-blue-500/10 text-blue-400 border border-blue-500/20' }
  if (end && end < now) return { key: 'expired', label: 'Vencido', cls: 'bg-red-500/10 text-red-400 border border-red-500/20' }
  return { key: 'active', label: 'Activo', cls: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' }
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}

export default function DiscountsPage() {
  const Alert = useAlert()
  const { categories } = useCategories()
  const { products } = useProducts({ limit: 1000 })

  const [discounts, setDiscounts] = useState([])
  const [overlaps, setOverlaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const refetch = async () => {
    try {
      const { data } = await api.get('/admin/discounts')
      setDiscounts(data.discounts || [])
      setOverlaps(data.overlaps || [])
    } catch { /* ignore */ }
  }

  useEffect(() => { refetch().finally(() => setLoading(false)) }, [])

  const openNew = () => {
    setEditingId('new')
    setForm({ ...EMPTY_FORM, startAt: toLocalInput(new Date().toISOString()) })
  }

  const openEdit = (d) => {
    setEditingId(d.id)
    setForm({
      name: d.name,
      type: d.type,
      percentage: String(d.percentage ?? ''),
      status: d.status,
      startAt: d.startAt ? toLocalInput(d.startAt) : '',
      endAt: d.endAt ? toLocalInput(d.endAt) : '',
      categoryIds: d.config?.categoryIds || [],
      productIds: d.config?.productIds || [],
      min: d.config?.min != null ? String(d.config.min) : '',
      max: d.config?.max != null ? String(d.config.max) : '',
      minAmount: d.config?.minAmount != null ? String(d.config.minAmount) : '',
      countDiscounted: !!d.config?.countDiscounted,
    })
  }

  const closeForm = () => { setEditingId(null); setForm(EMPTY_FORM) }

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }))

  const toggleId = (key, id) => {
    setForm((prev) => {
      const list = prev[key] || []
      return { ...prev, [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] }
    })
  }

  const buildConfig = () => {
    switch (form.type) {
      case 'category': return { categoryIds: form.categoryIds.map(Number) }
      case 'price_range': return { min: Number(form.min), max: Number(form.max) }
      case 'products': return { productIds: form.productIds.map(Number) }
      case 'cart_total': return { minAmount: Number(form.minAmount), countDiscounted: !!form.countDiscounted }
      default: return {}
    }
  }

  const handleSave = async () => {
    if (!form.name.trim()) { Alert.fire({ message: 'El nombre es obligatorio', type: 'warning' }); return }
    if (!form.startAt) { Alert.fire({ message: 'La fecha de inicio es obligatoria', type: 'warning' }); return }

    const payload = {
      name: form.name,
      type: form.type,
      percentage: Number(form.percentage) || 0,
      status: form.status,
      startAt: new Date(form.startAt).toISOString(),
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      config: buildConfig(),
    }

    setSaving(true)
    try {
      if (editingId === 'new') await api.post('/admin/discounts', payload)
      else await api.put(`/admin/discounts/${editingId}`, payload)
      Alert.fire({ message: editingId === 'new' ? 'Descuento creado' : 'Descuento actualizado', type: 'success', duration: 1500 })
      closeForm()
      refetch()
    } catch (err) {
      Alert.fire({ message: err.response?.data?.error || 'Error al guardar', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (d) => {
    const result = await Alert.fire({
      title: '¿Eliminar descuento?',
      message: `Se eliminará "${d.name}" definitivamente.`,
      type: 'warning',
      variant: 'modal',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return
    try {
      await api.delete(`/admin/discounts/${d.id}`)
      Alert.fire({ message: 'Descuento eliminado', type: 'success' })
      refetch()
    } catch { Alert.fire({ message: 'Error al eliminar', type: 'error' }) }
  }

  const handleToggle = async (d) => {
    const next = d.status === 'active' ? 'draft' : 'active'
    try {
      await api.patch(`/admin/discounts/${d.id}/status`, { status: next })
      refetch()
    } catch { Alert.fire({ message: 'Error al cambiar estado', type: 'error' }) }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner /></div>

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Descuentos</h1>
          <p className="text-sm text-zinc-500 mt-1">Creá descuentos por tipo y programá su duración</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Nuevo descuento</Button>
      </div>

      {overlaps.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-2 text-amber-400 font-medium mb-2">
            <AlertTriangle className="w-4 h-4" />
            Productos con más de un descuento
          </div>
          <div className="space-y-1">
            {overlaps.map((o) => (
              <p key={o.productId} className="text-sm text-amber-200/80">
                <span className="font-medium">{o.name}</span>: {o.discounts.map((d) => `${d.name} (${d.percentage}%)`).join(' + ')}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {discounts.map((d) => {
          const state = discountState(d)
          return (
            <div key={d.id} className="rounded-xl border border-zinc-700 bg-zinc-900/50 overflow-hidden">
              <div className="flex items-center gap-3 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-zinc-100">{d.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${state.cls}`}>{state.label}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-zinc-400">
                    <span className="text-cyan-400 font-semibold">{d.percentage}% OFF</span>
                    <span className="text-zinc-500">{TYPE_LABELS[d.type] || d.type}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(d.startAt)} → {d.endAt ? formatDate(d.endAt) : 'sin fin'}</span>
                  </div>
                </div>
                <Button variant="secondary" size="sm" onClick={() => openEdit(d)}>Editar</Button>
                <button
                  onClick={() => handleToggle(d)}
                  title={d.status === 'active' ? 'Pasar a borrador' : 'Publicar'}
                  className="p-2 text-zinc-500 hover:text-cyan-400 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  {d.status === 'active' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
                <button onClick={() => handleDelete(d)} className="p-2 text-zinc-500 hover:text-red-400 rounded-lg hover:bg-zinc-800 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        })}
        {discounts.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-zinc-700">
            <Percent className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
            <p className="text-zinc-500">No hay descuentos creados</p>
            <p className="text-xs text-zinc-600 mt-1">Creá descuentos globales, por categoría, por precio o por producto</p>
          </div>
        )}
      </div>

      {editingId && (
        <Modal open={!!editingId} onClose={closeForm} title={editingId === 'new' ? 'Nuevo descuento' : 'Editar descuento'} size="xl" closable>
          <div className="space-y-4">
            <Input
              label="Nombre"
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              placeholder="Ej: Descuento de otoño"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select
                label="Tipo de descuento"
                value={form.type}
                onChange={(e) => setField('type', e.target.value)}
                options={Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label }))}
              />
              <Input
                label="Porcentaje (%)"
                type="number"
                min="1"
                max="100"
                value={form.percentage}
                onChange={(e) => setField('percentage', e.target.value)}
                placeholder="Ej: 10"
              />
            </div>

            {form.type === 'category' && (
              <div>
                <span className="block text-sm font-medium text-zinc-400 mb-1.5">Categorías</span>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-700 p-2 space-y-1">
                  {categories.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer py-0.5">
                      <Checkbox checked={form.categoryIds.includes(c.id)} onChange={() => toggleId('categoryIds', c.id)} />
                      {c.name}
                    </label>
                  ))}
                  {categories.length === 0 && <p className="text-xs text-zinc-600 p-2">No hay categorías</p>}
                </div>
              </div>
            )}

            {form.type === 'price_range' && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Precio mínimo ($)" type="number" min="0" value={form.min} onChange={(e) => setField('min', e.target.value)} placeholder="0" />
                <Input label="Precio máximo ($)" type="number" min="0" value={form.max} onChange={(e) => setField('max', e.target.value)} placeholder="50000" />
              </div>
            )}

            {form.type === 'products' && (
              <div>
                <span className="block text-sm font-medium text-zinc-400 mb-1.5">Productos</span>
                <div className="max-h-48 overflow-y-auto rounded-lg border border-zinc-700 p-2 space-y-1">
                  {products.map((p) => (
                    <label key={p.id} className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer py-0.5">
                      <Checkbox checked={form.productIds.includes(p.id)} onChange={() => toggleId('productIds', p.id)} />
                      {p.name}
                    </label>
                  ))}
                  {products.length === 0 && <p className="text-xs text-zinc-600 p-2">No hay productos</p>}
                </div>
              </div>
            )}

            {form.type === 'cart_total' && (
              <div className="space-y-4">
                <Input label="Monto mínimo del carrito ($)" type="number" min="0" value={form.minAmount} onChange={(e) => setField('minAmount', e.target.value)} placeholder="50000" />
                <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer">
                  <Checkbox checked={form.countDiscounted} onChange={(e) => setField('countDiscounted', e.target.checked)} />
                  Los productos con descuento participan (cuentan para el monto y reciben el descuento)
                </label>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Inicio (obligatorio)"
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setField('startAt', e.target.value)}
              />
              <Input
                label="Fin (vacío = sin fin)"
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setField('endAt', e.target.value)}
              />
            </div>

            <Select
              label="Estado"
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              options={[
                { value: 'draft', label: 'Borrador (guardar sin publicar)' },
                { value: 'active', label: 'Activo (publicar)' },
              ]}
            />

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
