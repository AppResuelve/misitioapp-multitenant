'use client'
import { Percent, Construction } from 'lucide-react'

export default function DiscountsPage() {
  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Descuentos</h1>
          <p className="text-sm text-zinc-500">Gestioná descuentos para productos del catálogo</p>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-24 rounded-xl border border-dashed border-zinc-700">
        <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-4">
          <Construction className="w-8 h-8 text-zinc-500" />
        </div>
        <h2 className="text-lg font-semibold text-zinc-200 mb-2">En desarrollo</h2>
        <p className="text-sm text-zinc-500 text-center max-w-md">
          Esta funcionalidad está siendo construida. Pronto podrás crear y gestionar descuentos para los productos de tu catálogo.
        </p>
      </div>
    </div>
  )
}
