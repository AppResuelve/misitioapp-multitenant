// @ts-nocheck
'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import { Upload, Trash2, Copy, Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/admin/ui/Form'
import { DropdownSelect } from '@/components/admin/ui/DropdownSelect'
import { Card } from '@/components/admin/ui/Card'
import { Spinner } from '@/components/admin/ui/Spinner'
import { uploadImage } from '@/services/admin-api'
import { useAlert } from '@/components/admin/ui/AlertContext'
import api from '@/services/admin-api'

const TABS = [
  { key: 'todos', label: 'Todos' },
  { key: 'galeria', label: 'Galería' },
  { key: 'productos', label: 'Productos' },
  { key: 'branding', label: 'Branding' },
  { key: 'servicios', label: 'Servicios' },
]

const UPLOAD_FOLDERS = ['galeria', 'productos', 'branding', 'servicios']

const PAGE_SIZE = 50

const folderLabel = (folder) => {
  const t = TABS.find((t) => t.key === folder)
  return t ? t.label : folder
}

export default function Media() {
  const [media, setMedia] = useState([])
  const [trashMedia, setTrashMedia] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [tab, setTab] = useState('todos')
  const [page, setPage] = useState(1)
  const [uploadFolder, setUploadFolder] = useState('galeria')
  const [emptying, setEmptying] = useState(false)
  const fileInputRef = useRef(null)
  const Alert = useAlert()

  const isTrash = tab === 'papelera'

  const fetchMedia = async () => {
    try {
      const { data } = await api.get('/admin/upload')
      setMedia(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const fetchTrash = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/admin/upload', { params: { trash: true } })
      setTrashMedia(data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isTrash) {
      fetchTrash()
    } else {
      fetchMedia()
    }
  }, [isTrash])

  const filtered = useMemo(() => {
    if (isTrash) return trashMedia
    if (tab === 'todos') return media
    return media.filter((m) => m.folder === tab)
  }, [media, trashMedia, tab, isTrash])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  useEffect(() => {
    setPage(1)
  }, [tab])

  const handleUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return

    setUploading(true)
    try {
      for (const file of files) {
        await uploadImage(file, uploadFolder)
      }
      await fetchMedia()
    } catch {
      Alert.fire({ message: 'Error al subir imagen', type: 'error' })
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDelete = async (item) => {
    if (isTrash) {
      const result = await Alert.fire({
        title: '¿Eliminar definitivamente?',
        message: 'La imagen se borrará de Cloudinary y todos los productos que la usan perderán la imagen. Esta acción es irreversible.',
        type: 'warning',
        variant: 'modal',
        showCancelButton: true,
        confirmButtonText: 'Eliminar para siempre',
        cancelButtonText: 'Cancelar',
      })
      if (!result.isConfirmed) return
      try {
        await api.delete(`/admin/upload/${item.id}/force`)
        fetchTrash()
      } catch {
        Alert.fire({ message: 'Error al eliminar imagen', type: 'error' })
      }
      return
    }

    try {
      const { data: usage } = await api.get(`/admin/upload/${item.id}/usage`)

      if (usage.count > 0) {
        const names = usage.products.map((p) => `• ${p.name}`).join('\n')
        const result = await Alert.fire({
          title: 'Imagen en uso',
          message: `Esta imagen está siendo usada por ${usage.count} producto(s):\n\n${names}\n\nSi la eliminás, pasará a la papelera y estos productos seguirán viéndola. Para borrarla definitivamente, vaciá la papelera.`,
          type: 'warning',
          variant: 'modal',
          showCancelButton: true,
          confirmButtonText: 'Mover a papelera',
          cancelButtonText: 'Cancelar',
        })
        if (!result.isConfirmed) return
      } else {
        const result = await Alert.fire({
          title: '¿Eliminar imagen?',
          message: 'La imagen se moverá a la papelera.',
          type: 'warning',
          variant: 'modal',
          showCancelButton: true,
          confirmButtonText: 'Mover a papelera',
          cancelButtonText: 'Cancelar',
        })
        if (!result.isConfirmed) return
      }

      await api.delete(`/admin/upload/${item.id}`)
      fetchMedia()
    } catch {
      Alert.fire({ message: 'Error al eliminar imagen', type: 'error' })
    }
  }

  const handleRestore = async (item) => {
    try {
      await api.post(`/admin/upload/${item.id}/restore`)
      fetchTrash()
      Alert.fire({ message: 'Imagen restaurada', type: 'success' })
    } catch {
      Alert.fire({ message: 'Error al restaurar', type: 'error' })
    }
  }

  const handleEmptyTrash = async () => {
    const result = await Alert.fire({
      title: '¿Vaciar papelera?',
      message: `Se eliminarán definitivamente ${trashMedia.length} imagen(es) de Cloudinary. Los productos que las usaban perderán la imagen.`,
      type: 'warning',
      variant: 'modal',
      showCancelButton: true,
      confirmButtonText: 'Vaciar papelera',
      cancelButtonText: 'Cancelar',
    })
    if (!result.isConfirmed) return

    setEmptying(true)
    try {
      const { data } = await api.post('/admin/upload/trash/empty')
      setTrashMedia([])
      Alert.fire({ message: `${data.deleted} imágenes eliminadas`, type: 'success' })
    } catch {
      Alert.fire({ message: 'Error al vaciar papelera', type: 'error' })
    } finally {
      setEmptying(false)
    }
  }

  const handleCopy = (url, id) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Galería</h1>
          <p className="text-sm text-zinc-500">
            {isTrash ? `${trashMedia.length} en papelera` : `${filtered.length} imágenes`}
          </p>
        </div>

        {isTrash ? (
          <Button variant="danger" onClick={handleEmptyTrash} disabled={emptying || trashMedia.length === 0}>
            <Trash2 className="w-4 h-4" />
            {emptying ? 'Vaciando...' : 'Vaciar papelera'}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <DropdownSelect
              options={UPLOAD_FOLDERS.map(f => ({ value: f, label: folderLabel(f) }))}
              value={uploadFolder}
              onChange={(v) => setUploadFolder(v as string)}
              className="w-40"
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
              <Upload className="w-4 h-4" />
              {uploading ? 'Subiendo...' : 'Subir'}
            </Button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
        {[...TABS, { key: 'papelera', label: 'Papelera' }].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors
              ${tab === t.key
                ? t.key === 'papelera'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-cyan-500/10 text-cyan-400'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
          >
            {t.label}
            {t.key === 'papelera' && trashMedia.length > 0 && (
              <span className="ml-1 text-zinc-500">({trashMedia.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="relative min-h-[200px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <Spinner />
          </div>
        )}
      {filtered.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            {isTrash ? (
              <>
                <Trash2 className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500">Papelera vacía</p>
                <p className="text-sm text-zinc-600 mt-1">Las imágenes que elimines aparecerán acá</p>
              </>
            ) : (
              <>
                <Upload className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500">No hay imágenes</p>
                <p className="text-sm text-zinc-600 mt-1">
                  {tab === 'todos' ? 'Subí imágenes para empezar' : `La carpeta "${folderLabel(tab)}" está vacía`}
                </p>
              </>
            )}
          </div>
        </Card>
      ) : (
        <>
          <Card>
            <div className="divide-y divide-zinc-800">
              {paged.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-4 py-3 first:rounded-t-xl last:rounded-b-xl hover:bg-zinc-800/30 transition-colors group"
                >
                  <img
                    src={item.url}
                    alt={item.publicId}
                    className="w-5 h-5 rounded object-cover shrink-0"
                  />
                  {!isTrash && (
                    <span className="text-xs text-zinc-500 w-18 shrink-0">{folderLabel(item.folder)}</span>
                  )}
                  <span className="flex-1 text-sm text-zinc-300 truncate font-mono">
                    {item.publicId}
                  </span>
                  {isTrash && (
                    <span className="text-xs text-zinc-600 shrink-0">
                      {item.deletedAt ? new Date(item.deletedAt).toLocaleDateString() : ''}
                    </span>
                  )}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isTrash ? (
                      <>
                        <button
                          onClick={() => handleRestore(item)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-zinc-700 transition-colors"
                          title="Restaurar"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
                          title="Eliminar definitivamente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCopy(item.url, item.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-cyan-400 hover:bg-zinc-700 transition-colors"
                          title="Copiar URL"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(item)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-zinc-700 transition-colors"
                          title="Mover a papelera"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-zinc-500">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  Anterior
                </button>
                <span className="text-zinc-600 text-xs px-1">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-xs"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </>
      )}
      </div>
    </div>
  )
}
