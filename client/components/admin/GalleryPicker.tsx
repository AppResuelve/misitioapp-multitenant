// @ts-nocheck
'use client'
import { useState, useEffect, useMemo } from 'react'
import { Image } from 'lucide-react'
import { Modal } from './ui/Modal'
import { Spinner } from './ui/Spinner'
import api from '@/services/admin-api'

const TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'galeria', label: 'Galería' },
  { key: 'productos', label: 'Productos' },
  { key: 'branding', label: 'Branding' },
  { key: 'servicios', label: 'Servicios' },
]

export default function GalleryPicker({ open, onClose, onSelect, max = 4, currentCount = 0 }) {
  const [media, setMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [moving, setMoving] = useState(null)
  const [tab, setTab] = useState('todos')

  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get('/admin/upload')
      .then(({ data }) => setMedia(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [open])

  const filtered = useMemo(() => {
    if (tab === 'todos') return media
    return media.filter((m) => m.folder === tab)
  }, [media, tab])

  const handleSelect = async (item) => {
    if (currentCount >= max) return
    setMoving(item.id)
    try {
      const { data } = await api.post(`/admin/upload/${item.id}/move`, { folder: 'productos' })
      // Solo sacar de la lista si cambió de carpeta (no estaba ya en productos)
      if (item.folder !== 'productos') {
        setMedia((prev) => prev.filter((m) => m.id !== item.id))
      }
      onSelect(data.url)
    } catch {
      // ignore
    } finally {
      setMoving(null)
    }
  }

  const tabLabel = TABS.find((t) => t.key === tab)?.label || tab

  return (
    <Modal open={open} onClose={onClose} title="Galería">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Spinner />
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-1 mb-3 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
                  ${tab === t.key
                    ? 'bg-cyan-500/10 text-cyan-400'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                  }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-12">
              <Image className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
              <p className="text-zinc-500">No hay imágenes</p>
              <p className="text-sm text-zinc-600 mt-1">
                {tab === 'todos' ? 'Subí imágenes desde la sección Galería' : `La carpeta "${tabLabel}" está vacía`}
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-zinc-500 mb-3">
                {currentCount}/{max} imágenes · {filtered.length} en {tabLabel.toLowerCase()}
              </p>
              <div className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                {filtered.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    disabled={currentCount >= max || moving === item.id}
                    className="relative aspect-square rounded-lg overflow-hidden bg-zinc-800 border border-zinc-700 hover:border-cyan-500 transition-colors group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <img src={item.url} alt={item.filename} className="w-full h-full object-cover" />
                    {moving === item.id && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Spinner size="sm" />
                      </div>
                    )}
                    <p className="absolute bottom-0 left-0 right-0 px-1.5 py-1 text-[10px] text-zinc-300 bg-black/60 truncate">
                      {item.filename}
                    </p>
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </Modal>
  )
}
