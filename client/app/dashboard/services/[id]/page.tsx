// @ts-nocheck
'use client'
import { useState, useEffect, useMemo, Fragment } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { Button, Input, Textarea } from '@/components/admin/ui/Form'
import { DropdownSelect } from '@/components/admin/ui/DropdownSelect'
import ImageUpload from '@/components/admin/ImageUpload'
import { Spinner } from '@/components/admin/ui/Spinner'
import { useAlert } from '@/components/admin/ui/AlertContext'
import api from '@/services/admin-api'
import { useUnsavedChanges } from '@/context/UnsavedChangesContext'

const EMPTY_SERVICE = { name: '', slug: '', description: '', images: [], price: 0, status: 'active' }
const EMPTY_VARIANT = { price: 0, durationMinutes: '', sortOrder: 0, status: 'active', modifiers: [], attributeValueIds: [], images: [] }
const EMPTY_MODIFIER = { name: '', price: 0, maxSelection: null, sortOrder: 0, status: 'active' }

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 255)

function VariantCard({ variant, index, attributes, onChange, onRemove }) {
  const [expanded, setExpanded] = useState(false)
  const Alert = useAlert()

  const label = useMemo(() => {
    if (!variant.attributeValueIds?.length) return `Variante ${index + 1}`
    return [...variant.attributeValueIds]
      .sort((a, b) => {
        const getAttrId = vId => attributes.find(at => at.values.some(v => v.id === vId))?.id || 0
        return getAttrId(a) - getAttrId(b)
      })
      .map(vId => {
        for (const attr of attributes) { const val = attr.values.find(v => v.id === vId); if (val) return val.value }
        return vId
      })
      .join(' + ')
  }, [variant.attributeValueIds, attributes, index])

  const handleChange = (field, value) => { onChange(index, { ...variant, [field]: value }) }

  const handleModifierChange = (modIndex, field, value) => {
    const n = [...variant.modifiers]; n[modIndex] = { ...n[modIndex], [field]: value }
    onChange(index, { ...variant, modifiers: n })
  }
  const addModifier = () => onChange(index, { ...variant, modifiers: [...variant.modifiers, { ...EMPTY_MODIFIER }] })
  const removeModifier = (mi) => onChange(index, { ...variant, modifiers: variant.modifiers.filter((_, i) => i !== mi) })

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 overflow-hidden">
      <div role="button" tabIndex={0} onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left cursor-pointer">
        <span className={`text-zinc-500 text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        <span className="flex-1 text-sm font-medium text-zinc-200 truncate">{label}</span>
        <span className="text-xs text-zinc-500 font-mono shrink-0">${variant.price || 0}</span>
        {variant.durationMinutes ? <span className="text-xs text-zinc-600 shrink-0">{variant.durationMinutes} min</span> : null}
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${variant.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
          {variant.status === 'active' ? 'activo' : 'borrador'}
        </span>
        <button type="button" onClick={(e) => {
          e.stopPropagation()
          Alert.fire({ message: 'Para eliminar esta variante, abrí "Administrar atributos" y deseleccioná sus valores.', type: 'info', variant: 'banner' })
        }}
          className="p-1 text-zinc-600 hover:text-zinc-400 rounded shrink-0" title="Cómo eliminar">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-700 pt-3 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <Input label="Precio" type="number" value={variant.price} onChange={(e) => handleChange('price', e.target.value)} />
            <Input label="Duración (min)" type="number" value={variant.durationMinutes} onChange={(e) => handleChange('durationMinutes', e.target.value)} placeholder="Opcional" />
            <DropdownSelect label="Estado" value={variant.status}
              onChange={(v) => handleChange('status', v)}
              options={[{ value: 'active', label: 'Activo' }, { value: 'draft', label: 'Borrador' }]} />
          </div>
          <ImageUpload images={variant.images || []} onChange={(imgs) => handleChange('images', imgs)} max={1} folder={`servicios/var-${variant.id || index}`} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-zinc-400">Modificadores</span>
              <button type="button" onClick={addModifier} className="flex items-center gap-1 text-xs font-medium text-cyan-400 hover:text-cyan-300">
                <Plus className="w-3 h-3" /> Agregar
              </button>
            </div>
            {variant.modifiers.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">Sin modificadores</p>
            ) : (
              <div className="space-y-2">
                {variant.modifiers.map((m, mi) => (
                  <div key={mi} className="flex items-center gap-2 p-3 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                    <input type="text" value={m.name} onChange={(e) => handleModifierChange(mi, 'name', e.target.value)} placeholder="Nombre"
                      className="flex-1 min-w-0 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 text-sm focus:outline-none focus:border-cyan-500" />
                    <input type="number" value={m.price} onChange={(e) => handleModifierChange(mi, 'price', e.target.value)} placeholder="+$"
                      className="w-28 px-2.5 py-1.5 bg-zinc-800 border border-zinc-700 rounded text-zinc-200 text-sm focus:outline-none focus:border-cyan-500" />
                    <button type="button" onClick={() => removeModifier(mi)} className="p-1 text-zinc-600 hover:text-red-400 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ServiceForm() {
  const { id } = useParams()
  const isEditing = Boolean(id) && id !== "new"
  const router = useRouter()
  const Alert = useAlert()
  const [form, setForm] = useState(EMPTY_SERVICE)
  const [variants, setVariants] = useState([])
  const [attributes, setAttributes] = useState([])
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [saving, setSaving] = useState(false)
  const { isDirty, setIsDirty, confirmLeave } = useUnsavedChanges()
  const [loading, setLoading] = useState(isEditing)
  const [slugManual, setSlugManual] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)

  useEffect(() => { api.get('/admin/attributes').then(({ data }) => setAttributes(data)).catch(() => {}) }, [])

  useEffect(() => {
    if (!id) return
    api.get(`/admin/services/${id}`).then(({ data }) => {
      setForm({ name: data.name || '', slug: data.slug || '', description: data.description || '', images: data.images || [], price: data.price || 0, status: data.status || 'active' })
      setSlugManual(true)
      if (data.variants?.length > 0) {
        const realVariants = data.variants.filter(v => v.attributeValues?.length > 0)
        if (realVariants.length > 0) {
          const inferredAttrs = {}
          realVariants.forEach(v => {
            v.attributeValues.forEach(av => {
              const aId = av.attribute?.id; if (!aId) return
              if (!inferredAttrs[aId]) inferredAttrs[aId] = new Set()
              inferredAttrs[aId].add(av.id)
            })
          })
          setSelectedAttributes(inferredAttrs)
          setVariants(realVariants.map(v => ({
            id: v.id, price: v.price || 0, durationMinutes: v.durationMinutes || '',
            images: v.images || [], sortOrder: v.sortOrder || 0, status: v.status || 'active',
            attributeValueIds: (v.attributeValues || []).map(av => av.id),
            modifiers: (v.modifiers || []).map(m => ({
              id: m.id, name: m.name || '', price: m.price || 0,
              maxSelection: m.maxSelection ?? null, 
              sortOrder: m.sortOrder || 0, status: m.status || 'active',
            })),
          })))
        } else {
          setVariants([])
        }
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value }
    if (field === 'name' && !slugManual) next.slug = slugify(value)
    setForm(next)
    setIsDirty(true)
  }

  // ── Atributos (modal) ──
  const [attrModalOpen, setAttrModalOpen] = useState(false)
  const [modalAttrs, setModalAttrs] = useState({})

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (attrModalOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [attrModalOpen])

  const openAttrModal = () => {
    const copy = {}
    Object.entries(selectedAttributes).forEach(([k, v]) => { copy[Number(k)] = new Set(v) })
    setModalAttrs(copy)
    setAttrModalOpen(true)
  }

  const modalToggleAttr = (attrId, valueId) => {
    setModalAttrs(prev => {
      const aId = Number(attrId); const current = new Set(prev[aId] || [])
      if (current.has(valueId)) { current.delete(valueId) } else { current.add(valueId) }
      return { ...prev, [aId]: current }
    })
  }

  const modalAddAttr = (attr) => {
    setModalAttrs(prev => ({ ...prev, [attr.id]: new Set() }))
  }

  const modalRemoveAttr = async (attrId) => {
    const attr = attributes.find(a => a.id === Number(attrId))
    const result = await Alert.fire({
      title: '¿Quitar atributo?',
      message: `¿Quitar "${attr?.name}" y deseleccionar todos sus valores?`,
      type: 'warning',
      variant: 'modal',
      showCancelButton: true,
      confirmButtonText: 'Quitar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return
    const { [Number(attrId)]: _, ...rest } = modalAttrs; setModalAttrs(rest)
  }

  const updateAttrValueImages = async (valueId, images) => {
    for (const attr of attributes) {
      const v = attr.values.find(x => x.id === valueId)
      if (v) {
        api.put(`/admin/attributes/${attr.id}/values/${valueId}`, { images }).catch(() => {})
        setAttributes(prev => prev.map(a => a.id === attr.id ? {
          ...a,
          values: a.values.map(x => x.id === valueId ? { ...x, images } : x),
        } : a))
        break
      }
    }
  }

  const addValueToAttribute = async (attrId) => {
    const name = window.prompt('Nombre del nuevo valor:')
    if (!name || !name.trim()) return
    const attr = attributes.find(a => a.id === attrId)
    if (!attr) return
    const payload = {
      name: attr.name,
      sort_order: 0,
      values: [...attr.values.map(v => ({ id: v.id, value: v.value, sort_order: v.sortOrder || 0 })), { value: name.trim(), sort_order: attr.values.length }],
    }
    try {
      const { data } = await api.put(`/admin/attributes/${attrId}`, payload)
      setAttributes(prev => prev.map(a => a.id === attrId ? data : a))
    } catch { Alert.fire({ message: 'Error al agregar valor', type: 'error' }) }
  }

  const handleCancelAttrs = () => {
    const copy = {}
    Object.entries(selectedAttributes).forEach(([k, v]) => { copy[Number(k)] = new Set(v) })
    setModalAttrs(copy)
    setAttrModalOpen(false)
  }

  const handleConfirmAttrs = async () => {
    const emptyAttr = Object.entries(modalAttrs).find(([, vIds]) => vIds.size === 0)
    if (emptyAttr) {
      const attr = attributes.find(a => a.id === Number(emptyAttr[0]))
      await Alert.fire({ message: `Seleccioná al menos un valor para "${attr?.name || 'el atributo'}"`, type: 'warning', variant: 'banner' })
      return
    }
    if (Object.keys(modalAttrs).length === 0) {
      setIsDirty(true)
      setSelectedAttributes({})
      setVariants([])
      setAttrModalOpen(false)
      return
    }
    const confirmed = {}
    for (const [k, v] of Object.entries(modalAttrs)) {
      confirmed[Number(k)] = new Set(v)
    }
    setSelectedAttributes(confirmed)
    setAttrModalOpen(false)
    setIsDirty(true)
    handleGenerateSkus(confirmed)
  }

  const handleGenerateSkus = (attrs = selectedAttributes) => {
    const groups = Object.entries(attrs).sort(([a], [b]) => Number(a) - Number(b)).map(([, vIds]) => [...vIds]).filter(g => g.length > 0)
    if (!groups.length) return
    // Primera vez: mostrar modal
    if (variants.length === 0) { setShowPriceModal(true); return }
    // Ya hay variantes → herencia silenciosa
    doGenerateVariants(attrs, false)
  }

  const doGenerateVariants = async (attrs, keepPrice = false) => {
    const groups = Object.entries(attrs).sort(([a], [b]) => Number(a) - Number(b)).map(([, vIds]) => [...vIds]).filter(g => g.length > 0)
    if (!groups.length) return
    const combinations = groups.reduce((acc, group) => acc.flatMap(combo => group.map(vId => [...combo, vId])), [[]])
    const keptIds = new Set()
    const newVariants = combinations.map(combo => {
      const sorted = [...combo].sort((a, b) => a - b)
      const existing = variants.find(v => {
        const s = [...v.attributeValueIds].sort((a, b) => a - b)
        return s.every(vId => sorted.includes(vId))
      })
      if (existing?.id) { keptIds.add(existing.id); return { ...existing, attributeValueIds: combo } }
      return { ...EMPTY_VARIANT, images: [], attributeValueIds: combo, price: keepPrice ? (form.price || 0) : 0 }
    })
    const skusAtRisk = variants.filter(v =>
      v.id && !newVariants.some(nv => {
        const vSorted = [...v.attributeValueIds].sort((a, b) => a - b)
        const nvSorted = [...nv.attributeValueIds].sort((a, b) => a - b)
        return vSorted.every(vId => nvSorted.includes(vId))
      })
    )
    const deletedCount = skusAtRisk.length
    if (deletedCount > 0) {
      const result = await Alert.fire({
        title: '¿Actualizar variantes?',
        message: `Se eliminarán ${deletedCount} variante(s) con sus precios y modificadores. ¿Continuar?`,
        type: 'warning',
        variant: 'modal',
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar',
      })
      if (!result.isConfirmed) return
    }
    setVariants(newVariants); setShowPriceModal(false)
  }

  const hasUnsyncedChanges = useMemo(() => {
    if (!Object.keys(selectedAttributes).length) return false
    const withVals = Object.entries(selectedAttributes).filter(([, vIds]) => vIds.size > 0)
    if (!withVals.length) return variants.length > 0
    return variants.length !== withVals.reduce((acc, [, vIds]) => acc * vIds.size, 1)
  }, [selectedAttributes, variants])

  // ── Variants ──
  const updateVariant = (i, v) => { const nx = [...variants]; nx[i] = v; setVariants(nx); setIsDirty(true) }
  const removeVariant = (i) => setVariants(variants.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { Alert.fire({ message: 'El nombre es obligatorio', type: 'warning' }); return }
    if (!form.slug.trim()) handleChange('slug', slugify(form.name))
    if (hasUnsyncedChanges) { Alert.fire({ message: 'Los atributos no coinciden con las variantes. Generá las variantes primero.', type: 'warning' }); return }
    setSaving(true)
    try {
      const payload = {
        ...form, price: Number(form.price) || 0,
        variants: variants.map(v => ({
          ...(v.id && { id: v.id }),
          price: Number(v.price) || 0,
          durationMinutes: v.durationMinutes ? Number(v.durationMinutes) : null,
          images: v.images || [], sortOrder: v.sortOrder || 0, status: v.status || 'active',
          attributeValueIds: v.attributeValueIds || [],
          modifiers: v.modifiers.map(m => ({
            ...(m.id && { id: m.id }), name: m.name, price: Number(m.price) || 0,
            maxSelection: m.maxSelection ?? null, sortOrder: m.sortOrder || 0, 

            status: m.status || 'active',
          })),
        })),
      }
      if (isEditing) await api.put(`/admin/services/${id}`, payload)
      else await api.post('/admin/services', payload)
      Alert.fire({ message: isEditing ? 'Servicio actualizado' : 'Servicio creado', type: 'success', duration: 1500 })
      setIsDirty(false)
      router.push('/dashboard/services')
    } catch (err) {
      let msg = 'Error al guardar'
      try { const b = typeof err.response?.data === 'string' ? JSON.parse(err.response.data) : err.response?.data; msg = b?.error || b?.message || msg } catch {}
      Alert.fire({ message: msg, type: 'error' })
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-32"><Spinner /></div>
  const availableAttrs = attributes.filter(a => !selectedAttributes[a.id])

  return (
    <div>
      <button onClick={async () => { if (await confirmLeave()) router.push('/dashboard/services') }} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /><span className="text-sm">Volver a servicios</span>
      </button>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 pb-24 lg:pb-0">
        <h1 className="text-2xl font-bold text-zinc-100">{isEditing ? `Editar ${form.name || 'Servicio'}` : 'Nuevo Servicio'}</h1>

        <ImageUpload images={form.images} onChange={(imgs) => handleChange('images', imgs)} max={2} folder="servicios" />
        <Input label="Nombre" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
        <Input label="Slug" value={form.slug} onChange={(e) => { setSlugManual(true); handleChange('slug', slugify(e.target.value)) }} placeholder="nombre-del-servicio" required />
        <Textarea label="Descripción" value={form.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Descripción del servicio" maxLength={1000} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Precio" type="number" value={form.price} onChange={(e) => handleChange('price', e.target.value)}
            readOnly={variants.length > 0} disabled={variants.length > 0} />
          <DropdownSelect label="Estado" value={form.status}
            onChange={(v) => handleChange('status', v)}
            options={[{ value: 'active', label: 'Activo' }, { value: 'draft', label: 'Borrador' }]} />
        </div>

        {variants.length > 0 && (
          <div className="p-3 rounded-lg flex items-start gap-3"
            style={{ backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}>
            <span className="text-sm shrink-0 mt-0.5">⚠️</span>
            <div>
              <p className="text-xs font-medium text-amber-400">Precios gestionados por variante</p>
              <p className="text-xs text-amber-400/60 mt-0.5">
                El precio de cada combinación se define en su variante.
                {form.price > 0 && ` Más bajo actual: $${form.price}.`}
              </p>
            </div>
          </div>
        )}

        {/* ═══ ATRIBUTOS DEL SERVICIO (barra) ═══ */}
        <div className="border-t border-zinc-800 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-zinc-400">
              Atributos:{' '}
              {Object.keys(selectedAttributes).length > 0
                ? Object.entries(selectedAttributes)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([aId]) => attributes.find(a => a.id === Number(aId))?.name)
                    .filter(Boolean)
                    .join(', ')
                : 'Ninguno'}
              {' • '}
              {variants.length} variante(s)
            </span>
            <Button type="button" variant="secondary" size="sm" onClick={openAttrModal}>
              Administrar atributos
            </Button>
          </div>
          {hasUnsyncedChanges && (
            <span className="text-xs text-yellow-400 mt-2 block">
              Los atributos no coinciden con las variantes — abrí el administrador y actualizá.
            </span>
          )}
        </div>

        {/* ═══ VARIANTES ═══ */}
        {variants.length > 0 && (
          <div className="border-t border-zinc-800 pt-6">
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Variantes</h2>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <VariantCard key={i} variant={v} index={i} attributes={attributes}
                  onChange={updateVariant} onRemove={removeVariant} />
              ))}
            </div>
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 lg:static flex gap-3 justify-end px-4 pb-8 pt-4 lg:p-0 lg:pt-2 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 lg:border-0 lg:bg-transparent z-20">
          <Button type="button" variant="secondary" onClick={() => {
            if (!isDirty) { router.push('/dashboard/services'); return }
            Alert.fire({
              title: '¿Salir sin guardar?',
              message: 'Tenés cambios sin guardar. Si salís, los cambios se perderán.',
              type: 'warning',
              variant: 'modal',
              showCancelButton: true,
              confirmButtonText: 'Salir',
              cancelButtonText: 'Cancelar',
            }).then(result => { if (result.isConfirmed) router.push('/dashboard/services') })
          }}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear servicio'}</Button>
        </div>
      </form>

      {/* Modal: Administrar atributos */}
      {attrModalOpen && (
        <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 cursor-pointer" onClick={handleCancelAttrs} />
          <div className="relative bg-zinc-900 border border-zinc-700 sm:rounded-2xl w-full h-full sm:h-auto sm:max-h-[85vh] max-w-2xl flex flex-col overflow-hidden">
            {/* Header — fixed */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 sm:rounded-t-2xl shrink-0">
              <h3 className="text-lg font-bold text-zinc-100">Administrar atributos</h3>
              {attributes.filter(a => !modalAttrs[a.id]).length > 0 && (
                <div className="relative group">
                  <button type="button"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 border border-zinc-700 hover:border-cyan-500 transition-colors">
                    <Plus className="w-3 h-3" />
                    <span className="hidden sm:inline">Agregar atributo</span>
                    <span className="sm:hidden">Agregar</span>
                  </button>
                  <div className="absolute right-0 top-full mt-1 w-48 py-1 rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-40">
                    {attributes.filter(a => !modalAttrs[a.id]).map(a => (
                      <button key={a.id} type="button" onClick={() => modalAddAttr(a)}
                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors">{a.name}</button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3" style={{ minHeight: '40vh' }}>
              {Object.entries(modalAttrs).sort(([a], [b]) => Number(a) - Number(b)).length === 0 ? (
                <p className="text-xs text-zinc-600">Sin atributos seleccionados</p>
              ) : (
                Object.entries(modalAttrs).sort(([a], [b]) => Number(a) - Number(b)).map(([attrId, valueIds], idx) => {
                  const attr = attributes.find(a => a.id === Number(attrId))
                  if (!attr) return null
                  return (
                    <Fragment key={attrId}>
                      {idx > 0 && <hr className="border-zinc-800" />}
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-sm font-medium text-zinc-300">{attr.name}</span>
                          <button type="button" onClick={() => modalRemoveAttr(attrId)}
                            className="text-zinc-500 hover:text-red-400 transition-colors cursor-pointer" title="Quitar atributo">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex flex-col gap-2">
                          {attr.values.map(v => {
                            const checked = valueIds.has(v.id)
                            return (
                              <div key={v.id}
                                className={`rounded-xl border-2 p-3 transition-colors min-h-[100px] flex flex-col ${
                                  checked ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-700'
                                }`}>
                                <button
                                  onClick={() => modalToggleAttr(attrId, v.id)}
                                  className="flex items-center gap-2 hover:opacity-80 transition-opacity mb-2 group cursor-pointer hover:bg-zinc-800/30 rounded-lg px-2 py-1 -mx-2 -my-1">
                                  {checked ? <Trash2 className="w-4 h-4 text-zinc-500 group-hover:text-red-400 transition-colors" /> : <Plus className="w-4 h-4 text-zinc-500 group-hover:text-cyan-400 transition-colors" />}
                                  <span className={`text-sm font-medium ${checked ? 'text-cyan-400' : 'text-zinc-300'}`}>{v.value}</span>
                                </button>
                                {checked && (
                                  <div className="flex-1">
                                    <ImageUpload
                                      images={v.images || []}
                                      onChange={(imgs) => updateAttrValueImages(v.id, imgs)}
                                      max={2} cols={4} folder="atributos"
                                    />
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </Fragment>
                  )
                })
              )}
            </div>

            {/* Footer — fixed */}
            <div className="sticky bottom-0 z-10 flex gap-3 justify-end px-6 py-4 bg-zinc-900/95 backdrop-blur border-t border-zinc-800 sm:rounded-b-2xl shrink-0">
              <button onClick={handleCancelAttrs} className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors">Cancelar</button>
              <button onClick={handleConfirmAttrs} className="cursor-pointer px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500 text-white hover:bg-cyan-600 transition-colors">Actualizar variantes</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de precio al generar variantes por primera vez */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 cursor-pointer" onClick={() => setShowPriceModal(false)} />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-zinc-100">Aplicar precio a las variantes</h3>
            <p className="text-xs text-zinc-500">El precio base se replicará a todas las variantes generadas.</p>

            <div className="text-sm text-zinc-400">
              Precio del servicio: <span className="text-cyan-400 font-mono">${form.price || 0}</span>
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowPriceModal(false)}>Cancelar</Button>
              <Button onClick={() => doGenerateVariants(selectedAttributes, true)}>
                Generar {Object.values(selectedAttributes).reduce((acc, v) => acc * (v.size || 1), 1)} variantes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
