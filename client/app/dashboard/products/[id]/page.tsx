// @ts-nocheck
'use client'
import { useState, useEffect, useMemo, Fragment } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Image, Trash2, Plus, Search, X, Check, SlidersHorizontal } from 'lucide-react'
import { Button, Input } from '@/components/admin/ui/Form'
import TiptapEditor from '@/components/admin/ui/TiptapEditor'
import { DropdownSelect } from '@/components/admin/ui/DropdownSelect'
import { Checkbox } from '@/components/admin/ui/Checkbox'
import ImageUpload from '@/components/admin/ImageUpload'
import GalleryPicker from '@/components/admin/GalleryPicker'
import { Spinner } from '@/components/admin/ui/Spinner'
import { useProduct } from '@/hooks/admin-useProducts'
import { useCategories } from '@/hooks/admin-useCategories'
import api from '@/services/admin-api'
import { useAlert } from '@/components/admin/ui/AlertContext'
import { calculateComparePrice } from '@/utils/discount'
import { generateSkuCode } from '@/utils/skuGenerator'
import { useUnsavedChanges } from '@/context/UnsavedChangesContext'
import { useTags } from '@/hooks/admin-useTags'

const UNIT_LABEL = { kg: 'Gr', m: 'Cm', l: 'Ml' }
import { TagSelect } from '@/components/admin/TagSelect'

const EMPTY_PRODUCT = {
  name: '', slug: '', description: '', images: [],
  retailPrice: 0, comparePrice: null, discountPercentage: null,
  wholesalePrice: null, wholesaleMinQty: null,
  stock: 0,
  status: 'active', tags: [], categoryId: '',
}

const EMPTY_SKU = {
  retailPrice: 0, wholesalePrice: null, wholesaleMinQty: null,
  stock: 0, sku: '', images: [],
  sortOrder: 0, status: 'active', attributeValueIds: [],
}

const slugify = (text) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').substring(0, 255)

function AttributeValueCard({ value, unitType, images, onRemove, onUpdateImages }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/50 overflow-hidden">
      <div role="button" tabIndex={0} onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left cursor-pointer">
        <span className={`text-zinc-500 text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        <span className="flex-1 text-sm font-medium text-zinc-200 truncate">{value}{unitType ? ` ${UNIT_LABEL[unitType] || unitType}` : ''}</span>
        {images.length > 0 && (
          <span className="text-xs text-zinc-500 shrink-0">{images.length} {images.length === 1 ? 'imagen' : 'imágenes'}</span>
        )}
        <button type="button" onClick={(e) => { e.stopPropagation(); onRemove() }}
          className="p-1 text-zinc-500 hover:text-red-400 transition-colors shrink-0" title="Quitar valor">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-zinc-700 pt-3">
          <ImageUpload
            images={images}
            onChange={onUpdateImages}
            max={2}
            cols={4}
            folder="atributos"
          />
        </div>
      )}
    </div>
  )
}

function SkuCard({ sku, index, attributes, unitType, onChange, onRemove, onStatusToggle }) {
  const [expanded, setExpanded] = useState(false)
  const Alert = useAlert()
  const unitName = unitType ? (UNIT_LABEL[unitType] || unitType) : null

  const label = useMemo(() => {
    if (!sku.attributeValueIds?.length) return `Variante ${index + 1}`
    return [...sku.attributeValueIds]
      .sort((a, b) => {
        const getAttrId = vId => attributes.find(at => at.values.some(v => v.id === vId))?.id || 0
        return getAttrId(a) - getAttrId(b)
      })
      .map(vId => {
        for (const attr of attributes) {
          const val = attr.values.find(v => v.id === vId)
          if (val) return attr.unitType ? `${val.value} ${UNIT_LABEL[attr.unitType] || attr.unitType}` : val.value
        }
        return vId
      })
      .join(' + ')
  }, [sku.attributeValueIds, attributes, index])

  const handleChange = (field, value) => {
    onChange(index, { ...sku, [field]: value })
  }

  return (
    <div className="rounded-xl border border-zinc-700 bg-zinc-900/50">
      <div role="button" tabIndex={0} onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setExpanded(!expanded) } }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/30 transition-colors text-left cursor-pointer">
        <span className={`text-zinc-500 text-xs transition-transform ${expanded ? 'rotate-90' : ''}`}>▶</span>
        <span className="flex-1 text-sm font-medium text-zinc-200 truncate">{label}</span>
        <span className="text-xs text-zinc-500 font-mono shrink-0">${sku.retailPrice || 0}</span>
        {!!unitType && <span className="text-[10px] text-zinc-600 shrink-0">(calculado)</span>}
        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${sku.status === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-zinc-700 text-zinc-500'}`}>
          {sku.status === 'active' ? 'activo' : 'borrador'}
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Input label={!!unitType ? `Precio venta x ${unitName}` : "Precio venta"} type="number" value={sku.retailPrice}
              readOnly={!!unitType} disabled={!!unitType}
              onChange={(e) => handleChange('retailPrice', e.target.value)} />
            <Input label="Stock" type="number" value={sku.stock}
              onChange={(e) => handleChange('stock', e.target.value)} />
            <div className="hidden sm:block">
              <Input label="Código SKU" value={sku.sku || ''}
                onChange={(e) => handleChange('sku', e.target.value)} placeholder="Opcional" />
            </div>
          </div>
          <div className="sm:hidden">
            <Input label="Código SKU" value={sku.sku || ''}
              onChange={(e) => handleChange('sku', e.target.value)} placeholder="Opcional" />
          </div>
          {!!unitType ? (
            <div>
              <DropdownSelect label="Estado" value={sku.status}
                onChange={(v) => handleChange('status', v)}
                options={[{ value: 'active', label: 'Activo' }, { value: 'draft', label: 'Borrador' }]} />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              <Input label="Precio mayorista" type="number" value={sku.wholesalePrice || ''}
                onChange={(e) => handleChange('wholesalePrice', e.target.value || null)} />
              <Input label="Cant. mín. mayorista" type="number" value={sku.wholesaleMinQty || ''}
                onChange={(e) => handleChange('wholesaleMinQty', e.target.value || null)} />
              <DropdownSelect label="Estado" value={sku.status}
                onChange={(v) => handleChange('status', v)}
                options={[{ value: 'active', label: 'Activo' }, { value: 'draft', label: 'Borrador' }]} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function ProductForm() {
  const { id } = useParams()
  const searchParams = useSearchParams()
  const backParams = new URLSearchParams()
  const pageVal = searchParams?.get('page')
  const catVal = searchParams?.get('categoryId')
  const tagVal = searchParams?.get('tagId')
  if (pageVal) backParams.set('page', pageVal)
  if (catVal) backParams.set('categoryId', catVal)
  if (tagVal) backParams.set('tagId', tagVal)
  const isEditing = Boolean(id) && id !== "new"
  const backToList = `/dashboard/products?${backParams.toString()}`
  const router = useRouter()
  const Alert = useAlert()
  const { product, loading: productLoading } = useProduct(id)
  const { categories } = useCategories()

  const [form, setForm] = useState(EMPTY_PRODUCT)
  const [skus, setSkus] = useState([])
  const [attributes, setAttributes] = useState([])
  const [selectedAttributes, setSelectedAttributes] = useState({})
  const [saving, setSaving] = useState(false)
  const [tagIds, setTagIds] = useState([])
  const [slugManual, setSlugManual] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const [showPriceModal, setShowPriceModal] = useState(false)
  const [priceDefaults, setPriceDefaults] = useState({ retail: true, wholesale: true })
  const [attrSearch, setAttrSearch] = useState('')
  const [attrSelectOpen, setAttrSelectOpen] = useState(false)

  const { isDirty, setIsDirty, confirmLeave } = useUnsavedChanges()
  const { tags } = useTags()

  useEffect(() => {
    api.get('/admin/attributes').then(({ data }) => setAttributes(data)).catch(() => {})
  }, [])

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '', slug: product.slug || '',
        description: product.description || '', images: product.images || [],
        retailPrice: product.retailPrice || 0, comparePrice: product.comparePrice || null,
        discountPercentage: product.discountPercentage || null,
        wholesalePrice: product.wholesalePrice || null,
        wholesaleMinQty: product.wholesaleMinQty || null,
        stock: product.skus?.find(s => !s.attributeValues?.length)?.stock ?? 0,
        status: product.status || 'active', tags: product.tags || [],
        categoryId: product.categoryId || '',
      })
      setTagIds(product.tagValues?.map(tv => tv.id) || [])
      setSlugManual(true)

      if (product.skus?.length > 0) {
        const realSkus = product.skus.filter(s => s.attributeValues?.length > 0)
        if (realSkus.length > 0) {
          const inferredAttrs = {}
          realSkus.forEach(sku => {
            sku.attributeValues.forEach(av => {
              const aId = av.attribute?.id
              if (!aId) return
              if (!inferredAttrs[aId]) inferredAttrs[aId] = new Set()
              inferredAttrs[aId].add(av.id)
            })
          })
          setSelectedAttributes(inferredAttrs)
          setSkus(realSkus.map(s => ({
            id: s.id, retailPrice: s.retailPrice || 0,
            wholesalePrice: s.wholesalePrice ?? null,
            wholesaleMinQty: s.wholesaleMinQty ?? null,
            stock: s.stock || 0, sku: s.sku || '', images: s.images || [],
            sortOrder: Number(s.sortOrder) || 0, status: s.status || 'active',
            attributeValueIds: (s.attributeValues || []).map(v => v.id),
          })))
        } else {
          setSkus([])
        }
      }
    }
  }, [product])

  const handleChange = (field, value) => {
    const next = { ...form, [field]: value }
    if (field === 'name' && !slugManual) next.slug = slugify(value)
    if (field === 'retailPrice' || field === 'discountPercentage') {
      const retail = field === 'retailPrice' ? Number(value) : Number(form.retailPrice)
      const pct = field === 'discountPercentage' ? Number(value) : Number(form.discountPercentage)
      next.comparePrice = calculateComparePrice(retail, pct)
    }
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
      if (current.has(valueId)) {
        current.delete(valueId)
      } else {
        current.add(valueId)
      }
      return { ...prev, [aId]: current }
    })
  }

  const modalAddAttr = (attr) => {
    setModalAttrs(prev => ({ ...prev, [attr.id]: new Set() }))
  }

  const hasOtherUnitType = (excludeAttrId) => {
    return Object.keys(modalAttrs).some(id => {
      if (Number(id) === excludeAttrId) return false
      const a = attributes.find(x => x.id === Number(id))
      return a?.unitType
    })
  }

  const modalAddAllValues = (attr) => {
    if (attr.unitType && hasOtherUnitType(attr.id)) return
    setModalAttrs(prev => ({ ...prev, [attr.id]: new Set(attr.values.map(v => v.id)) }))
  }

  const modalToggleAttrValue = (attrId, valueId) => {
    if (!modalAttrs[attrId]) {
      const attr = attributes.find(a => a.id === attrId)
      if (attr?.unitType && hasOtherUnitType(attrId)) return
      setModalAttrs(prev => ({ ...prev, [attrId]: new Set([valueId]) }))
      return
    }
    setModalAttrs(prev => {
      const current = new Set(prev[attrId])
      if (current.has(valueId)) {
        current.delete(valueId)
        if (current.size === 0) {
          const { [attrId]: _, ...rest } = prev
          return rest
        }
      } else {
        current.add(valueId)
      }
      return { ...prev, [attrId]: current }
    })
  }

  const modalRemoveAttr = async (attrId) => {
    const attr = attributes.find(a => a.id === Number(attrId))
    const result = await Alert.fire({
      title: '¿Quitar atributo?',
      message: `¿Quitar "${attr?.name}" y deseleccionar todos sus valores?`,
      type: 'warning', variant: 'modal', showCancelButton: true,
      confirmButtonText: 'Quitar', cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return
    const { [Number(attrId)]: _, ...rest } = modalAttrs; setModalAttrs(rest)
  }

  const updateAttrValueImages = async (valueId: number, images: string[]) => {
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

  const addValueToAttribute = async (attrId: number) => {
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
    setAttrSearch('')
    setAttrSelectOpen(false)
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
      setSkus([])
      setAttrModalOpen(false)
      return
    }
    // Deep clone: rompe referencias compartidas + normaliza keys a número
    const confirmed = {}
    for (const [k, v] of Object.entries(modalAttrs)) {
      confirmed[Number(k)] = new Set(v)
    }
    const generated = await handleGenerateSkus(confirmed)
    if (generated === false) return
    setSelectedAttributes(confirmed)
    setAttrSearch('')
    setAttrSelectOpen(false)
    setAttrModalOpen(false)
    setIsDirty(true)
  }

  const handleGenerateSkus = async (attrs = selectedAttributes) => {
    const groups = Object.entries(attrs)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, vIds]) => [...vIds])
      .filter(g => g.length > 0)

    if (!groups.length) return true

    // Primera vez: mostrar modal de precios
    if (skus.length === 0) {
      setShowPriceModal(true)
      return true
    }

    // Ya hay SKUs → herencia silenciosa
    return doGenerateSkus(attrs, false)
  }

  const doGenerateSkus = async (attrs, keepPriceDefaults = false) => {
    const groups = Object.entries(attrs)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([, vIds]) => [...vIds])
      .filter(g => g.length > 0)

    if (!groups.length) return

    const combinations = groups.reduce((acc, group) =>
      acc.flatMap(combo => group.map(vId => [...combo, vId])),
      [[]]
    )

    const keptIds = new Set()

    const UNIT_DIVISOR = { kg: 1000, m: 100, l: 1000 }
    const unitAttr = attributes.find(a => a.unitType)
    const divisor = unitAttr ? UNIT_DIVISOR[unitAttr.unitType] : null
    const basePrice = Number(form.retailPrice) || 0

    const newSkus = combinations.map(combo => {
      const sorted = [...combo].sort((a, b) => a - b)
      const existing = skus.find(s => {
        const sSorted = [...s.attributeValueIds].sort((a, b) => a - b)
        return sSorted.length === sorted.length && sSorted.every((vId, i) => vId === sorted[i])
      })
      if (existing?.id) { keptIds.add(existing.id); return { ...existing, attributeValueIds: combo } }

      let retailPrice = keepPriceDefaults ? form.retailPrice || 0 : 0
      if (divisor && unitAttr && basePrice > 0) {
        const unitValueId = combo.find(vId =>
          unitAttr.values.some(v => v.id === vId)
        )
        if (unitValueId) {
          const unitVal = unitAttr.values.find(v => v.id === unitValueId)
          const value = parseFloat(unitVal?.value)
          if (!isNaN(value) && value > 0) {
            retailPrice = (value / divisor) * basePrice
          }
        }
      }

      return {
        ...EMPTY_SKU,
        images: [],
        attributeValueIds: combo,
        sku: generateSkuCode(form.name, combo, attributes),
        retailPrice,
        wholesalePrice: keepPriceDefaults && priceDefaults.wholesale ? (form.wholesalePrice ?? null) : null,
        wholesaleMinQty: keepPriceDefaults && priceDefaults.wholesale ? (form.wholesaleMinQty ?? null) : null,
      }
    })

    const skusAtRisk = skus.filter(s =>
      s.id && !newSkus.some(ns => {
        const sSorted = [...s.attributeValueIds].sort((a, b) => a - b)
        const nsSorted = [...ns.attributeValueIds].sort((a, b) => a - b)
        return sSorted.length === nsSorted.length && sSorted.every((vId, i) => vId === nsSorted[i])
      })
    )
    const deletedCount = skusAtRisk.length
    if (deletedCount > 0) {
      const result = await Alert.fire({
        title: '¿Actualizar variantes?',
        message: `Se eliminarán ${deletedCount} variante(s) con sus precios y stock. ¿Continuar?`,
        type: 'warning',
        variant: 'modal',
        showCancelButton: true,
        confirmButtonText: 'Actualizar',
        cancelButtonText: 'Cancelar',
      })
      if (!result.isConfirmed) return false
    }

    setSkus(newSkus)
    setShowPriceModal(false)
    return true
  }

  const hasUnsyncedChanges = useMemo(() => {
    if (!Object.keys(selectedAttributes).length) return false
    const withValues = Object.entries(selectedAttributes).filter(([, vIds]) => vIds.size > 0)
    if (!withValues.length) return skus.length > 0
    const expectedCount = withValues.reduce((acc, [, vIds]) => acc * vIds.size, 1)
    return skus.length !== expectedCount
  }, [selectedAttributes, skus])

  // ── SKUs ──
  const updateSku = (i, sku) => { const nx = [...skus]; nx[i] = sku; setSkus(nx); setIsDirty(true) }
  const removeSku = (i) => setSkus(skus.filter((_, idx) => idx !== i))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) { Alert.fire({ message: 'El nombre es obligatorio', type: 'warning' }); return }
    if (!form.slug.trim()) handleChange('slug', slugify(form.name))
    if (hasUnsyncedChanges) {
      Alert.fire({ message: 'Los atributos no coinciden con las variantes. Generá las variantes primero.', type: 'warning' })
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form, categoryId: form.categoryId || null,
        tagIds,
        retailPrice: Number(form.retailPrice) || 0,
        comparePrice: form.comparePrice ? Number(form.comparePrice) : null,
        discountPercentage: form.discountPercentage ? Number(form.discountPercentage) : null,
        wholesalePrice: form.wholesalePrice ? Number(form.wholesalePrice) : null,
        wholesaleMinQty: form.wholesaleMinQty ? Number(form.wholesaleMinQty) : null,
        stock: Number(form.stock) || 0,
        skus: skus.map(s => ({
          ...(s.id && { id: s.id }),
          retailPrice: Number(s.retailPrice) || 0,
          wholesalePrice: s.wholesalePrice ? Number(s.wholesalePrice) : null,
          wholesaleMinQty: s.wholesaleMinQty ? Number(s.wholesaleMinQty) : null,
          stock: Number(s.stock) || 0, sku: s.sku || null,
          images: s.images || [], sortOrder: Number(s.sortOrder) || 0,
          status: s.status || 'active',
          attributeValueIds: s.attributeValueIds || [],
        })),
      }
      if (isEditing) await api.put(`/admin/products/${id}`, payload)
      else await api.post('/admin/products', payload)
      Alert.fire({ message: isEditing ? 'Producto actualizado' : 'Producto creado', type: 'success', duration: 1500 })
      setIsDirty(false)
      router.push(backToList)
    } catch (err) {
      Alert.fire({ message: err.response?.data?.error || 'Error al guardar producto', type: 'error' })
    } finally { setSaving(false) }
  }

  if (productLoading && isEditing) {
    return <div className="flex items-center justify-center py-32"><Spinner /></div>
  }

  return (
    <div>
      <button onClick={async () => { if (await confirmLeave()) router.push(backToList) }} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-4 transition-colors">
        <ArrowLeft className="w-4 h-4" /><span className="text-sm">Volver a productos</span>
      </button>

      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6 pb-24 lg:pb-0">
        <h1 className="text-2xl font-bold text-zinc-100">{isEditing ? `Editar ${form.name || 'Producto'}` : 'Nuevo Producto'}</h1>

        <ImageUpload images={form.images} onChange={(imgs) => handleChange('images', imgs)} max={4} folder="productos" />
        <button type="button" onClick={() => setGalleryOpen(true)}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700 transition-colors">
          <Image className="w-4 h-4" /> Buscar en galería
        </button>

        <Input label="Nombre" value={form.name} onChange={(e) => handleChange('name', e.target.value)} required />
        <Input label="Slug" value={form.slug} onChange={(e) => { setSlugManual(true); handleChange('slug', slugify(e.target.value)) }} placeholder="nombre-del-producto" required />
        <TiptapEditor label="Descripción" value={form.description || ''} onChange={(val) => handleChange('description', val)} placeholder="Descripción del producto que verán tus clientes" maxLength={2000} />

        <div className="grid grid-cols-3 items-end gap-4">
          <Input label="Precio de venta" type="number" min="0"
            value={form.retailPrice}
            onChange={(e) => handleChange('retailPrice', e.target.value)} />
          <Input label="% Descuento" type="number" min="1" max="100"
            value={form.discountPercentage || ''}
            onChange={(e) => handleChange('discountPercentage', e.target.value || null)}
            placeholder="Ej: 25" />
          <Input label="Precio de comparación" type="number" min="0"
            value={form.comparePrice || ''}
            onChange={(e) => handleChange('comparePrice', e.target.value || null)} />
        </div>

        {skus.length === 0 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Stock" type="number" min="0"
                value={form.stock}
                onChange={(e) => handleChange('stock', e.target.value)} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center gap-2 text-sm text-zinc-400 cursor-pointer">
                <Checkbox checked={form.wholesalePrice != null || form.wholesaleMinQty != null}
                  onChange={(e) => {
                    if (!e.target.checked) { handleChange('wholesalePrice', null); handleChange('wholesaleMinQty', null) }
                    else { handleChange('wholesalePrice', ''); handleChange('wholesaleMinQty', '') }
                  }} />
                ¿Tiene precio mayorista?
              </label>
            </div>

            {(form.wholesalePrice != null || form.wholesaleMinQty != null) && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Precio mayorista" type="number" value={form.wholesalePrice || ''} onChange={(e) => handleChange('wholesalePrice', e.target.value || null)} />
                <Input label="Cant. mín. mayorista" type="number" value={form.wholesaleMinQty || ''} onChange={(e) => handleChange('wholesaleMinQty', e.target.value || null)} />
              </div>
            )}
          </>
        )}

        {skus.length > 0 && product?.unitType ? (
          <div className="p-3 rounded-lg flex items-start gap-3"
            style={{ backgroundColor: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.25)' }}>
            <span className="text-sm shrink-0 mt-0.5">ℹ️</span>
            <div>
              <p className="text-xs font-medium text-cyan-400">Precios calculados por unidad</p>
              <p className="text-xs text-cyan-400/60 mt-0.5">
                Los precios de las variantes de este producto se calculan según el valor ({UNIT_LABEL[product.unitType] || product.unitType}). El precio base se usa como precio total de unidad.
              </p>
            </div>
          </div>
        ) : skus.length > 0 ? (() => {
          const minPrice = Math.min(...skus.map(s => Number(s.retailPrice)).filter(p => p > 0))
          return (
            <div className="p-3 rounded-lg flex items-start gap-3"
              style={{ backgroundColor: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}>
              <span className="text-sm shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-xs font-medium text-amber-400">Precio base sincronizado con variantes</p>
                <p className="text-xs text-amber-400/60 mt-0.5">
                  En el catálogo de productos se muestra el precio de la variante más económica. Actual: ${minPrice || 0}
                </p>
              </div>
            </div>
          )
        })() : null}

        <div className="grid grid-cols-2 gap-4">
          <DropdownSelect label="Estado" value={form.status}
            onChange={(v) => handleChange('status', v)}
            options={[{ value: 'active', label: 'Activo' }, { value: 'draft', label: 'Borrador' }]} />
          <DropdownSelect label="Categoría" value={form.categoryId}
            onChange={(v) => handleChange('categoryId', v)}
            options={[{ value: '', label: 'Sin categoría' }, ...categories.map(c => ({ value: c.id, label: c.name }))]} />
        </div>

        <TagSelect tags={tags} selected={tagIds} onChange={setTagIds} />

        {/* ═══ VARIANTES ═══ */}
        <div className="border-t border-zinc-800 pt-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-100">Variantes</h2>
              <p className="text-xs text-zinc-500">
                {Object.keys(selectedAttributes).length > 0
                  ? Object.entries(selectedAttributes)
                      .sort(([a], [b]) => Number(a) - Number(b))
                      .map(([aId]) => attributes.find(a => a.id === Number(aId))?.name)
                      .filter(Boolean)
                      .join(', ')
                  : 'Ninguno'}
                {' • '}
                {skus.length} variante(s)
              </p>
              {hasUnsyncedChanges && (
                <span className="text-xs text-yellow-400 mt-1 block">
                  Los atributos no coinciden con las variantes — abrí el administrador y actualizá.
                </span>
              )}
            </div>
            <button type="button" onClick={openAttrModal}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-700 transition-colors shrink-0">
              <SlidersHorizontal className="w-4 h-4" /> Administrar atributos
            </button>
          </div>
          <div className="space-y-2">
            {skus.map((sku, i) => (
              <SkuCard key={i} sku={sku} index={i} attributes={attributes} unitType={product?.unitType}
                onChange={updateSku} onRemove={removeSku} />
            ))}
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 lg:static flex gap-3 justify-end px-4 pb-8 pt-4 lg:p-0 lg:pt-2 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 lg:border-0 lg:bg-transparent z-20">
          <Button type="button" variant="secondary" onClick={() => {
            if (!isDirty) { router.push(backToList); return }
            Alert.fire({
              title: '¿Salir sin guardar?',
              message: 'Tenés cambios sin guardar. Si salís, los cambios se perderán.',
              type: 'warning',
              variant: 'modal',
              showCancelButton: true,
              confirmButtonText: 'Salir',
              cancelButtonText: 'Cancelar',
            }).then(result => { if (result.isConfirmed) router.push(backToList) })
          }}>Cancelar</Button>
          <Button type="submit" disabled={saving}>{saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear producto'}</Button>
        </div>
      </form>

      <GalleryPicker open={galleryOpen} onClose={() => setGalleryOpen(false)}
        onSelect={(url) => handleChange('images', [...form.images, url])} max={4} currentCount={form.images.length} />

      {/* Modal: Administrar atributos */}
      {attrModalOpen && (
        <div className="fixed inset-0 z-50 flex sm:items-center sm:justify-center sm:p-4">
          <div className="absolute inset-0 bg-black/60 cursor-pointer" onClick={handleCancelAttrs} />
          <div className="relative bg-zinc-900 border border-zinc-700 sm:rounded-2xl w-full h-full sm:h-auto sm:max-h-[85vh] max-w-2xl flex flex-col overflow-hidden">
            {/* Header — fixed */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-zinc-900/95 backdrop-blur border-b border-zinc-800 sm:rounded-t-2xl shrink-0">
              <h3 className="text-lg font-bold text-zinc-100">Administrar atributos</h3>
              <button type="button" onClick={handleCancelAttrs}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors" title="Cerrar">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Searchable select — below header */}
            {attributes.filter(a => !modalAttrs[a.id]).length > 0 && (
              <div className="px-6 pt-4 pb-2 shrink-0 relative">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                  <input
                    type="text"
                    value={attrSearch}
                    onChange={(e) => { setAttrSearch(e.target.value); setAttrSelectOpen(true) }}
                    onFocus={() => setAttrSelectOpen(true)}
                    placeholder="Agregar atributo..."
                    className="w-full pl-9 pr-3 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                {attrSelectOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => { setAttrSelectOpen(false); setAttrSearch('') }} />
                    <div className="absolute left-6 right-6 top-full mt-1 max-h-56 overflow-y-auto rounded-lg bg-zinc-800 border border-zinc-700 shadow-xl z-40 py-1">
                      {(() => {
                        const q = attrSearch.toLowerCase()
                        const filtered = attributes
                          .filter(a => {
                            const selected = modalAttrs[a.id]
                            if (!selected) return true
                            return selected.size < a.values.length
                          })
                          .filter(a => {
                            if (!q) return true
                            if (a.name.toLowerCase().includes(q)) return true
                            return a.values.some(v => v.value.toLowerCase().includes(q))
                          })
                        if (!filtered.length) {
                          return <p className="text-xs text-zinc-600 py-3 px-3">Sin resultados</p>
                        }
                        return filtered.map(attr => {
                          const isDisabled = attr.unitType && hasOtherUnitType(attr.id)
                          const selected = modalAttrs[attr.id]
                          const unselectedCount = selected ? attr.values.length - selected.size : attr.values.length
                          return (
                            <div key={attr.id} className={`${isDisabled ? 'opacity-40' : ''}`}>
                              <button type="button" onClick={() => { if (!isDisabled) { modalAddAllValues(attr); setAttrSearch('') } }}
                                disabled={isDisabled}
                                className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-zinc-700 transition-colors group">
                                <Plus className="w-3.5 h-3.5 text-zinc-500 group-hover:text-cyan-400 shrink-0 transition-colors" />
                                <span className="text-sm font-medium text-zinc-200">{attr.name}</span>
                                {attr.unitType && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shrink-0">por {UNIT_LABEL[attr.unitType] || attr.unitType}</span>
                                )}
                                {selected && (
                                  <span className="text-[10px] text-zinc-500 ml-auto shrink-0">{selected.size}/{attr.values.length}</span>
                                )}
                              </button>
                              {attr.values
                                .filter(v => !q || v.value.toLowerCase().includes(q))
                                .map(v => {
                                  const isSelected = selected?.has(v.id)
                                  return (
                                    <button key={v.id} type="button"
                                      onClick={() => { if (!isDisabled) { modalToggleAttrValue(attr.id, v.id); setAttrSearch('') } }}
                                      disabled={isDisabled}
                                      className={`w-full flex items-center gap-2 pl-8 pr-3 py-1.5 text-left hover:bg-zinc-700 transition-colors group ${isSelected ? 'opacity-50' : ''}`}>
                                      {isSelected
                                        ? <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                        : <span className="w-3.5 h-3.5 rounded-full border border-zinc-600 shrink-0 group-hover:border-cyan-400 transition-colors" />}
                                      <span className={`text-xs transition-colors ${isSelected ? 'text-zinc-500 line-through' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{v.value}{attr.unitType ? ` ${UNIT_LABEL[attr.unitType] || attr.unitType}` : ''}</span>
                                    </button>
                                  )
                                })
                              }
                            </div>
                          )
                        })
                      })()}
                    </div>
                  </>
                )}
              </div>
            )}

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
                          {attr.values.filter(v => valueIds.has(v.id)).map(v => (
                            <AttributeValueCard
                              key={v.id}
                              value={v.value}
                              unitType={attr.unitType}
                              images={v.images || []}
                              onRemove={() => modalToggleAttr(attrId, v.id)}
                              onUpdateImages={(imgs) => updateAttrValueImages(v.id, imgs)}
                            />
                          ))}
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

      {/* Modal de precios al generar variantes por primera vez */}
      {showPriceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 cursor-pointer" onClick={() => setShowPriceModal(false)} />
          <div className="relative bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-sm p-6 space-y-4">
            <h3 className="text-lg font-bold text-zinc-100">Aplicar precios a las variantes</h3>
            <p className="text-xs text-zinc-500">Los valores seleccionados se replicarán a todas las variantes generadas.</p>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={priceDefaults.retail}
                onChange={e => setPriceDefaults(p => ({ ...p, retail: e.target.checked }))}
                className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500" />
              <div>
                <span className="text-sm text-zinc-300">Precio de venta</span>
                <span className="text-sm text-cyan-400 ml-2 font-mono">${form.retailPrice || 0}</span>
              </div>
            </label>

            {form.wholesalePrice != null && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={priceDefaults.wholesale}
                  onChange={e => setPriceDefaults(p => ({ ...p, wholesale: e.target.checked }))}
                  className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500" />
                <div>
                  <span className="text-sm text-zinc-300">Precio mayorista</span>
                  <span className="text-sm text-cyan-400 ml-2 font-mono">${form.wholesalePrice || 0}</span>
                  {form.wholesaleMinQty && <span className="text-xs text-zinc-600 ml-1">(mín. {form.wholesaleMinQty}u)</span>}
                </div>
              </label>
            )}

            <div className="flex gap-3 justify-end pt-2">
              <Button variant="secondary" onClick={() => setShowPriceModal(false)}>Cancelar</Button>
              <Button onClick={() => doGenerateSkus(selectedAttributes, true)}>
                Generar {Object.values(selectedAttributes).reduce((acc, v) => acc * (v.size || 1), 1)} variantes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
