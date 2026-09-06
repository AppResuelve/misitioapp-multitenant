// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Plus, Search, Edit, Trash2, FileSpreadsheet, MoreHorizontal, SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/admin/ui/Form'
import { DropdownSelect } from '@/components/admin/ui/DropdownSelect'
import { Table } from '@/components/admin/ui/Table'
import { Modal } from '@/components/admin/ui/Modal'
import { Spinner } from '@/components/admin/ui/Spinner'
import { Pagination } from '@/components/admin/ui/Pagination'
import BulkProductModal from '@/components/admin/BulkProductModal'
import BulkUpdateModal from '@/components/admin/BulkUpdateModal'
import SystemUpdateModal from '@/components/admin/SystemUpdateModal'
import { useProducts } from '@/hooks/admin-useProducts'
import { useCategories } from '@/hooks/admin-useCategories'
import { useTags } from '@/hooks/admin-useTags'
import { useAlert } from '@/components/admin/ui/AlertContext'
import api from '@/services/admin-api'
import { formatPrice } from '@/components/admin/lib/utils'

export default function Products() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const Alert = useAlert()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(() => searchParams?.get('categoryId') || '')
  const [tagId, setTagId] = useState(() => searchParams?.get('tagId') || '')
  const [page, setPage] = useState(() => Number(searchParams?.get('page')) || 1)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false)
  const [systemUpdateOpen, setSystemUpdateOpen] = useState(false)
  const [toggling, setToggling] = useState(null)
  const [selected, setSelected] = useState([])
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const [newMenuOpen, setNewMenuOpen] = useState(false)
  const [editMenuOpen, setEditMenuOpen] = useState(false)

  const params = { page, limit: 20, search, ...(categoryId && { categoryId }), ...(tagId && { tagId }) }
  const { products, total, totalPages, loading, refetch, updateProduct } = useProducts(params)
  const { categories } = useCategories()
  const { tags } = useTags()

  useEffect(() => {
    const sp = new URLSearchParams(searchParams?.toString() || '')
    sp.set('page', String(page))
    if (categoryId) sp.set('categoryId', categoryId)
    else sp.delete('categoryId')
    if (tagId) sp.set('tagId', tagId)
    else sp.delete('tagId')
    router.replace(`/dashboard/products?${sp.toString()}`)
  }, [page, categoryId, tagId])

  const handleToggleStatus = async (e, product) => {
    e.stopPropagation()
    const newStatus = product.status === 'active' ? 'draft' : 'active'
    setToggling(product.id)
    try {
      await api.patch(`/admin/products/${product.id}/status`, { status: newStatus })
      updateProduct(product.id, { status: newStatus })
    } catch (err) {
      Alert.fire({ message: 'Error al cambiar estado', type: 'error' })
    } finally {
      setToggling(null)
    }
  }

  const handleBulkDelete = async () => {
    const result = await Alert.fire({
      title: '¿Eliminar productos?',
      message: `${selected.length} producto(s) se eliminarán permanentemente. Esta acción es irreversible.`,
      type: 'warning',
      variant: 'modal',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return

    setBulkProcessing(true)
    try {
      for (const id of selected) {
        await api.delete(`/admin/products/${id}`)
      }
      Alert.fire({ message: `${selected.length} producto(s) eliminados`, type: 'success' })
      setSelected([])
      refetch()
    } catch {
      Alert.fire({ message: 'Error al eliminar', type: 'error' })
    } finally {
      setBulkProcessing(false)
    }
  }

  const handleSelectAll = async () => {
    const currentIds = new Set(products.map(p => p.id))
    const outsideCount = selected.filter(id => !currentIds.has(id)).length
    const allCurrentSelected = products.length > 0 && products.every(p => selected.includes(p.id))

    if (outsideCount > 0) {
      const action = allCurrentSelected
        ? 'se borrará toda la selección (incluidos los de otras páginas)'
        : 'se reemplazará la selección actual por la de esta página'
      const result = await Alert.fire({
        title: 'Reemplazar selección',
        message: `Tenés ${outsideCount} producto(s) seleccionado(s) en otras páginas. Al continuar, ${action}.`,
        type: 'warning',
        variant: 'modal',
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
      })
      if (!result.isConfirmed) return
    }

    if (allCurrentSelected) setSelected([])
    else setSelected(products.map(p => p.id))
  }

  const handleDelete = async (product) => {
    const result = await Alert.fire({
      title: '¿Eliminar producto?',
      message: `"${product.name}" se eliminará permanentemente.`,
      type: 'warning',
      variant: 'modal',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return
    await api.delete(`/admin/products/${product.id}`)
    refetch()
  }

  const buildProductUrl = (productId) => {
    const params = new URLSearchParams()
    params.set('page', String(page))
    if (categoryId) params.set('categoryId', categoryId)
    if (tagId) params.set('tagId', tagId)
    return `/dashboard/products/${productId}?${params.toString()}`
  }

  const columns = [
    {
      header: 'Producto',
      className: 'min-w-[260px]',
      accessor: (p) => (
        <div className="flex items-center gap-3">
          {p.images?.[0] ? (
            <img src={p.images[0]} alt="" className="w-10 h-10 min-w-10 rounded-lg object-cover bg-zinc-800 shrink-0" />
          ) : (
            <div className="w-10 h-10 min-w-10 rounded-lg bg-zinc-800 shrink-0" />
          )}
          <div>
            <p className="font-medium text-zinc-200">{p.name}</p>
            <p className="text-xs text-zinc-500">{p.slug}</p>
          </div>
        </div>
      ),
    },
    { header: 'Categoría', accessor: (p) => p.category?.name || '—' },
    {
      header: 'Etiquetas',
      className: 'max-w-[180px]',
      accessor: (p) => {
        const tv = p.tagValues || []
        if (tv.length === 0) return <span className="text-zinc-600">—</span>
        return (
          <div className="flex flex-wrap gap-1">
            {tv.slice(0, 3).map(tv => (
              <span key={tv.id} className="text-xs px-1.5 py-0.5 rounded-full text-zinc-300" style={{ backgroundColor: (tv.tag?.color || '#6366f1') + '30', color: tv.tag?.color || '#a5b4fc' }}>
                {tv.value}
              </span>
            ))}
            {tv.length > 3 && <span className="text-xs text-zinc-500">+{tv.length - 3}</span>}
          </div>
        )
      },
    },
    { header: 'Precio', accessor: (p) => formatPrice(p.retailPrice) },
    {
      header: 'Variantes',
      accessor: (p) => (
        <span className="text-sm text-zinc-400">{(p.skus || []).filter(s => s.attributeValues?.length > 0).length}</span>
      ),
    },
    {
      header: 'Estado',
      accessor: (p) => (
        <button
          onClick={(e) => handleToggleStatus(e, p)}
          disabled={toggling === p.id}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer w-[96px] justify-center shrink-0
            ${p.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            } disabled:opacity-50`}
        >
          {toggling === p.id ? (
            <Spinner size="sm" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${p.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          )}
          {p.status === 'active' ? 'Activo' : 'Borrador'}
        </button>
      ),
    },
    {
      header: 'Acciones',
      accessor: (p) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); router.push(buildProductUrl(p.id)) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(p) }} className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Productos</h1>
          <p className="text-sm text-zinc-500">{total} productos</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Button onClick={() => setNewMenuOpen(!newMenuOpen)}>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nuevo Producto</span>
              <span className="sm:hidden">Nuevo</span>
            </Button>
            {newMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNewMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 p-1">
                  <Link
                    href="/dashboard/products/new"
                    onClick={() => setNewMenuOpen(false)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Creación única
                  </Link>
                  <button
                    onClick={() => { setNewMenuOpen(false); setBulkOpen(true) }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Creación masiva
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6 md:flex-row md:items-center">
        <div className="relative flex-1 w-full md:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm placeholder-zinc-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-3 md:flex md:gap-3">
          <DropdownSelect
            options={[{ value: '', label: 'Todas las categorías' }, ...categories.map(c => ({ value: c.id, label: c.name }))]}
            value={categoryId}
            onChange={(v) => { setCategoryId(v); setPage(1) }}
            className="w-full md:w-48"
          />
          <DropdownSelect
            options={[{ value: '', label: 'Todas las etiquetas' }, ...tags.flatMap(t => t.values.map(v => ({ value: v.id, label: `${t.name}: ${v.value}` })))]}
            value={tagId}
            onChange={(v) => { setTagId(v); setPage(1) }}
            className="w-full md:w-48"
          />
        </div>
      </div>

      {/* Bulk actions */}
      <div className="flex items-center gap-3 mb-4 px-4 py-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20">
        <span className="text-sm text-cyan-400 font-medium whitespace-nowrap">{selected.length} seleccionado(s)</span>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <div className="relative">
            <Button size="sm" variant="secondary" onClick={() => {
              if (selected.length > 0) setEditMenuOpen(!editMenuOpen)
              else setBulkUpdateOpen(true)
            }}>
              <Edit className="w-4 h-4" />
              Editar
            </Button>
            {editMenuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setEditMenuOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 p-1">
                  <button
                    onClick={() => { setEditMenuOpen(false); setSystemUpdateOpen(true) }}
                    disabled={selected.length < 2}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Desde el sistema
                  </button>
                  <button
                    onClick={() => { setEditMenuOpen(false); setBulkUpdateOpen(true) }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Planilla Excel
                  </button>
                </div>
              </>
            )}
          </div>
          <button
            onClick={handleBulkDelete}
            disabled={bulkProcessing || selected.length < 2}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setMoreOpen(true)}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            title="Más acciones"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-950/50">
            <Spinner />
          </div>
        )}
      <Table
        columns={columns}
        data={products}
        onRowClick={(p) => router.push(buildProductUrl(p.id))}
        emptyMessage="No hay productos"
        selectable
        selected={selected}
        onSelectionChange={setSelected}
        onSelectAll={handleSelectAll}
      />

      </div>

      {/* Pagination */}
      <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />

      <BulkProductModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        categories={categories}
        onCreated={refetch}
      />

      <BulkUpdateModal
        open={bulkUpdateOpen}
        onClose={() => setBulkUpdateOpen(false)}
        onUpdated={refetch}
      />

      <SystemUpdateModal
        open={systemUpdateOpen}
        onClose={() => setSystemUpdateOpen(false)}
        selectedIds={selected}
        categories={categories}
        onUpdated={() => { refetch(); setSelected([]) }}
      />

      {/* More actions modal */}
      <Modal open={moreOpen} onClose={() => setMoreOpen(false)} title="Más acciones">
        <div className="text-center py-8">
          <p className="text-zinc-400">En desarrollo</p>
        </div>
      </Modal>
    </div>
  )
}
