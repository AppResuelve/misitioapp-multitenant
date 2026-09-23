// @ts-nocheck
'use client'
import { Store, Package, Tags, TrendingUp } from 'lucide-react'
import { Card } from '@/components/admin/ui/Card'
import { useDashboard } from '@/hooks/admin-useDashboard'

const STORE_STATUS_MAP = {
  active: { label: 'Activa', dot: 'bg-emerald-500' },
  draft: { label: 'Borrador', dot: 'bg-amber-500' },
  maintenance: { label: 'Mantenimiento', dot: 'bg-red-500' },
}

export default function Dashboard() {
  const { data, loading } = useDashboard()
  const statusInfo = STORE_STATUS_MAP[data?.store?.status] || { label: data?.store?.status || '—', dot: 'bg-zinc-500' }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Store className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-1">Tienda</p>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-5 w-32 bg-zinc-800 rounded" />
              <div className="h-4 w-20 bg-zinc-800 rounded" />
            </div>
          ) : (
            <>
              <p className="text-xl font-bold text-zinc-100 truncate">{data?.store?.name}</p>
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`w-2 h-2 rounded-full ${statusInfo.dot}`} />
                <span className="text-sm text-zinc-400">{statusInfo.label}</span>
              </div>
            </>
          )}
        </Card>

        <Card>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-1">Productos</p>
          {loading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-8 w-12 bg-zinc-800 rounded" />
              <div className="h-4 w-28 bg-zinc-800 rounded" />
            </div>
          ) : (
            <>
              <p className="text-2xl font-bold text-zinc-100">{data?.products?.active ?? 0}</p>
              <p className="text-sm text-zinc-500 mt-1">activos de {data?.products?.total ?? 0} total</p>
              {data?.topProducts?.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 mb-2">
                    <TrendingUp className="w-3 h-3" />Más pedidos
                  </div>
                  <ol className="space-y-1">
                    {data.topProducts.map((p, i) => (
                      <li key={i} className="flex items-center justify-between text-sm">
                        <span className="text-zinc-300 truncate">{p.name}</span>
                        <span className="text-xs text-zinc-500 ml-2 shrink-0 tabular-nums">{p.count}x</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </Card>

        <Card>
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
              <Tags className="w-5 h-5" />
            </div>
          </div>
          <p className="text-sm text-zinc-400 mb-1">Categorías</p>
          {loading ? (
            <div className="animate-pulse"><div className="h-8 w-12 bg-zinc-800 rounded" /></div>
          ) : (
            <p className="text-2xl font-bold text-zinc-100">{data?.categories?.total ?? 0}</p>
          )}
        </Card>
      </div>
    </div>
  )
}
