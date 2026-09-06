// @ts-nocheck
'use client'
import { useState, useEffect, useRef } from 'react'
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react'
import { Button, Input } from '@/components/admin/ui/Form'
import { Modal } from '@/components/admin/ui/Modal'
import { Spinner } from '@/components/admin/ui/Spinner'
import { useCategories } from '@/hooks/admin-useCategories'
import { useUnsavedChanges } from '@/context/UnsavedChangesContext'
import api from '@/services/admin-api'
import { useAlert } from '@/components/admin/ui/AlertContext'

const slugify = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 255)

export default function Categories() {
  const { categories, loading, refetch } = useCategories()
  const { setIsDirty, confirmLeave } = useUnsavedChanges()
  const Alert = useAlert()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManual, setSlugManual] = useState(false)
  const [ordered, setOrdered] = useState([])
  const [toggling, setToggling] = useState(null)
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

  useEffect(() => {
    setOrdered(categories)
  }, [categories])

  const handleDragStart = (index) => {
    dragItem.current = index
  }

  const handleDragEnter = (index) => {
    dragOverItem.current = index
  }

  const handleDragEnd = async () => {
    const from = dragItem.current
    const to = dragOverItem.current
    if (from === null || to === null || from === to) return

    const reordered = [...ordered]
    const [moved] = reordered.splice(from, 1)
    reordered.splice(to, 0, moved)
    setOrdered(reordered)

    dragItem.current = null
    dragOverItem.current = null

    try {
      await api.put('/admin/categories/reorder', {
        orderedIds: reordered.map((c) => c.id),
      })
    } catch {
      Alert.fire({ message: 'Error al reordenar', type: 'error' })
      refetch()
    }
  }

  const openCreate = () => {
    setEditing(null)
    setName('')
    setSlug('')
    setSlugManual(false)
    setIsDirty(false)
    setModalOpen(true)
  }

  const openEdit = (cat) => {
    setEditing(cat)
    setName(cat.name)
    setSlug(cat.slug)
    setSlugManual(true)
    setIsDirty(false)
    setModalOpen(true)
  }

  const closeModal = async () => {
    if (await confirmLeave()) {
      setModalOpen(false)
      setEditing(null)
      setIsDirty(false)
    }
  }

  const handleNameChange = (value) => {
    setName(value)
    setIsDirty(true)
    if (!slugManual) {
      setSlug(slugify(value))
    }
  }

  const handleSlugChange = (value) => {
    setSlug(value)
    setSlugManual(true)
    setIsDirty(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      Alert.fire({ message: 'El nombre es obligatorio', type: 'warning' })
      return
    }

    const finalSlug = slug.trim() || slugify(name)

    try {
      if (editing) {
        await api.put(`/admin/categories/${editing.id}`, { name, slug: finalSlug })
      } else {
        await api.post('/admin/categories', { name, slug: finalSlug, order: categories.length })
      }
      setModalOpen(false)
      setIsDirty(false)
      Alert.fire({ message: editing ? 'Categoría actualizada' : 'Categoría creada', type: 'success', duration: 1500 })
      refetch()
    } catch (err) {
      let msg = 'Error al guardar categoría'
      try {
        const body = typeof err.response?.data === 'string'
          ? JSON.parse(err.response.data)
          : err.response?.data
        msg = body?.error || body?.message || msg
      } catch {}
      Alert.fire({ message: msg, type: 'error' })
    }
  }

  const handleDelete = async (cat) => {
    const result = await Alert.fire({
      title: '¿Eliminar categoría?',
      message: `"${cat.name}" se eliminará permanentemente.`,
      type: 'warning',
      variant: 'modal',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return
    await api.delete(`/admin/categories/${cat.id}`)
    refetch()
  }

  const handleToggleStatus = async (cat) => {
    const newStatus = cat.status === 'active' ? 'draft' : 'active'
    setToggling(cat.id)
    try {
      await api.patch(`/admin/categories/${cat.id}/status`, { status: newStatus })
      setOrdered(prev => prev.map(c => c.id === cat.id ? { ...c, status: newStatus } : c))
    } catch {
      Alert.fire({ message: 'Error al cambiar estado', type: 'error' })
    } finally {
      setToggling(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Categorías</h1>
          <p className="text-sm text-zinc-500">{ordered.length} categorías</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nueva Categoría
        </Button>
      </div>

      <div className="relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}

      <div className="space-y-2">
        {ordered.length === 0 ? (
          <p className="text-zinc-500">No hay categorías</p>
        ) : (
          ordered.map((cat, i) => (
            <div
              key={cat.id}
              draggable
              onDragStart={() => handleDragStart(i)}
              onDragEnter={() => handleDragEnter(i)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => e.preventDefault()}
              className="flex items-center gap-3 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl group transition-colors"
            >
              <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200">{cat.name}</p>
                <p className="text-xs text-zinc-500">{cat.slug}</p>
              </div>
              <span className="text-xs text-zinc-600">{cat.products?.length || 0} productos</span>
              <button
                onClick={() => handleToggleStatus(cat)}
                disabled={toggling === cat.id}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 w-[96px] justify-center shrink-0
                  ${cat.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
                  }`}
              >
                {toggling === cat.id ? (
                  <Spinner size="sm" />
                ) : (
                  <span className={`w-2 h-2 rounded-full ${cat.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                )}
                {cat.status === 'active' ? 'Activo' : 'Borrador'}
              </button>
              <button onClick={() => openEdit(cat)} className="p-1.5 rounded-lg text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors opacity-0 group-hover:opacity-100">
                <Edit className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(cat)} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
      </div>

      <Modal open={modalOpen} onClose={closeModal} title={editing ? 'Editar categoría' : 'Nueva categoría'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Nombre" value={name} onChange={(e) => handleNameChange(e.target.value)} required />
          <Input label="Slug" value={slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="nombre-de-categoria" required />
          <div className="flex gap-3 pt-2 justify-end">
            <Button type="button" variant="secondary" onClick={closeModal}>Cancelar</Button>
            <Button type="submit">{editing ? 'Guardar cambios' : 'Crear categoría'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
