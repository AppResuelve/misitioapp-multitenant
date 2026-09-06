export function formatPrice(price: any) {
  if (price == null) return '$0'
  return `$${Number(price).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(dateString: string) {
  if (!dateString) return ''
  const d = new Date(dateString)
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export const ORDER_STATUS_MAP = {
  new: { label: 'Nuevo', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  seen: { label: 'Visto', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  confirmed: { label: 'Confirmado', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  delivered: { label: 'Entregado', color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30' },
  cancelled: { label: 'Cancelado', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
}
