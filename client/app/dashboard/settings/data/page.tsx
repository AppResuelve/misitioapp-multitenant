// @ts-nocheck
'use client'

import { Button } from '@/components/admin/ui/Form'
import { Download } from 'lucide-react'
import { downloadTemplate } from '@/components/admin/lib/excel-utils'
import api from '@/services/admin-api'

export default function DataSettings() {
  const handleDownloadProducts = async () => {
    try {
      const { data } = await api.get('/admin/products/export', { responseType: 'blob' })
      const url = window.URL.createObjectURL(new Blob([data]))
      const a = document.createElement('a')
      a.href = url
      a.download = 'productos.xlsx'
      a.click()
      window.URL.revokeObjectURL(url)
    } catch {
      // silent fail
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Datos</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Planillas de productos</h2>
        <p className="text-sm text-zinc-400 mb-4">
          Descargá la planilla con todos tus productos para editarlos en Excel y volver a importarlos.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="secondary" onClick={handleDownloadProducts}>
            <Download className="w-4 h-4" />
            Descargar planilla de productos
          </Button>
          <Button type="button" variant="secondary" onClick={downloadTemplate}>
            <Download className="w-4 h-4" />
            Descargar plantilla vacía
          </Button>
        </div>
      </div>
    </div>
  )
}