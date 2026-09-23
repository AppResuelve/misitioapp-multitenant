// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Plus, Search, Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/admin/ui/Form'
import { Table } from '@/components/admin/ui/Table'
import { Spinner } from '@/components/admin/ui/Spinner'
import { useAlert } from '@/components/admin/ui/AlertContext'
import api from '@/services/admin-api'
import { formatPrice } from '@/components/admin/lib/utils'

export default function Services() {
  const router = useRouter()
  const Alert = useAlert()
  const [services, setServices] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [toggling, setToggling] = useState(null)

  const fetchServices = async (p = 1) => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/services', { params: { page: p, limit: 20, search: search || undefined } })
      setServices(data.services)
      setTotal(data.total)
      setPage(data.page)
      setTotalPages(data.totalPages)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchServices() }, [])

  useEffect(() => { fetchServices(1) }, [search])

  const handleToggleStatus = async (e, service) => {
    e.stopPropagation()
    const newStatus = service.status === 'active' ? 'draft' : 'active'
    setToggling(service.id)
    try {
      await api.put(`/admin/services/${service.id}`, { status: newStatus })
      setServices((prev) => prev.map((s) => s.id === service.id ? { ...s, status: newStatus } : s))
    } catch {
      Alert.fire({ message: 'Error al cambiar estado', type: 'error' })
    } finally {
      setToggling(null)
    }
  }

  const handleDelete = async (service) => {
    const result = await Alert.fire({
      title: '¿Eliminar servicio?',
      message: `"${service.name}" se eliminará permanentemente.`,
      type: 'warning', variant: 'modal', showCancelButton: true,
      confirmButtonText: 'Eliminar', cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return
    await api.delete(`/admin/services/${service.id}`)
    fetchServices(page)
  }

  const columns = [
    {
      header: 'Servicio',
      className: 'min-w-[260px]',
      accessor: (s) => (
        <div className="flex items-center gap-3">
          {s.images?.[0] ? (
            <img src={s.images[0]} alt="" className="w-10 h-10 min-w-10 rounded-lg object-cover bg-zinc-800 shrink-0" />
          ) : (
            <div className="w-10 h-10 min-w-10 rounded-lg bg-zinc-800 shrink-0" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">{s.name}</p>
            <p className="text-xs text-zinc-500 truncate">{s.slug}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Precio',
      className: 'min-w-[120px]',
      accessor: (s) => <span className="tabular-nums">{s.price ? formatPrice(s.price) : '—'}</span>,
    },
    {
      header: 'Estado',
      accessor: (s) => (
        <button
          onClick={(e) => handleToggleStatus(e, s)}
          disabled={toggling === s.id}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer min-w-[90px] justify-center
            ${s.status === 'active'
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            } disabled:opacity-50`}
        >
          {toggling === s.id ? <Spinner size="sm" /> : <span className={`w-2 h-2 rounded-full ${s.status === 'active' ? 'bg-emerald-400' : 'bg-amber-400'}`} />}
          {s.status === 'active' ? 'Activo' : 'Borrador'}
        </button>
      ),
    },
    {
      header: 'Acciones',
      accessor: (s) => (
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/services/${s.id}`) }} className="p-1.5 rounded-lg text-zinc-500 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(s) }} className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors">
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
          <h1 className="text-2xl font-bold text-zinc-100">Servicios</h1>
          <p className="text-sm text-zinc-500">{total} servicios</p>
        </div>
        <Link href="/dashboard/services/new">
          <Button>
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuevo Servicio</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        </Link>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar servicios..."
            className="w-full pl-9 pr-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
          />
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
        data={services}
        onRowClick={(s) => router.push(`/dashboard/services/${s.id}`)}
        emptyMessage="No hay servicios"
      />
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => fetchServices(page - 1)}>Anterior</Button>
          <span className="text-sm text-zinc-400 px-3">Página {page} de {totalPages}</span>
          <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => fetchServices(page + 1)}>Siguiente</Button>
        </div>
      )}
    </div>
  )
}
