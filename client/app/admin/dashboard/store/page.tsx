// @ts-nocheck
'use client'
import { useState, useEffect, useRef } from 'react'
import { ExternalLink, Globe, AlertTriangle, Pencil, Copy, Check } from 'lucide-react'
import { Spinner } from '@/components/admin/ui/Spinner'
import { DropdownSelect } from '@/components/admin/ui/DropdownSelect'
import api from '@/services/admin-api'

const STORE_STATUS = [
  { value: 'active', label: 'Activa', icon: Globe, dot: 'bg-emerald-500', card: 'border-emerald-500/30 bg-emerald-500/5' },
  { value: 'draft', label: 'Borrador', icon: Pencil, dot: 'bg-amber-500', card: 'border-amber-500/30 bg-amber-500/5' },
  { value: 'maintenance', label: 'Mantenimiento', icon: AlertTriangle, dot: 'bg-red-500', card: 'border-red-500/30 bg-red-500/5' },
]

const IFRAME_W = 1440
const IFRAME_H = 900
const MAX_HEIGHT = 600

export default function Store() {
  const [status, setStatus] = useState('active')
  const [saving, setSaving] = useState(false)
  const [scale, setScale] = useState(0.5)
  const [iframeKey, setIframeKey] = useState(0)
  const containerRef = useRef(null)
  const current = STORE_STATUS.find((s) => s.value === status) || STORE_STATUS[0]
  const StatusIcon = current.icon

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => {
        if (data.store_status) setStatus(data.store_status)
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => {
      const w = el.clientWidth
      const s = w / IFRAME_W
      setScale(s)
      el.style.height = `${Math.min(IFRAME_H * s, MAX_HEIGHT)}px`
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus)
    setSaving(true)
    await api.put('/admin/settings', { store_status: newStatus })
    setIframeKey((k) => k + 1)
    setSaving(false)
  }

  const storeUrl = process.env.NEXT_PUBLIC_STORE_URL;
  const [copied, setCopied] = useState(false);

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Tienda</h1>
          <p className="text-sm text-zinc-500">Vista previa de tu sitio público</p>
        </div>
        <div className="flex items-center gap-2 pl-2">
          <button
            onClick={handleCopyUrl}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200 transition-colors text-sm font-medium"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            URL
          </button>
          {storeUrl && (
            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 transition-colors text-sm font-medium"
            >
              <span className="hidden sm:inline">Ver tienda</span>
              <span className="sm:hidden">Ver</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>

      {/* Iframe preview — se escala como mockup desktop */}
      <div
        ref={containerRef}
        className="relative rounded-xl overflow-hidden border border-zinc-800 mb-6 bg-zinc-950"
        style={{ height: Math.ceil(IFRAME_H * scale) }}
      >
        {storeUrl && (
          <iframe
            key={iframeKey}
            src={storeUrl}
            inert
            className="pointer-events-none absolute top-0 left-0"
            style={{
              width: `${IFRAME_W}px`,
              height: `${IFRAME_H}px`,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
            title="Vista previa de la tienda"
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>

      {/* Status controls */}
      <div className="flex flex-col gap-2 p-4 rounded-xl border bg-zinc-900/50 border-zinc-800">
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">Estado de la tienda:</span>
          <DropdownSelect
            options={STORE_STATUS.map(s => ({ value: s.value, label: s.label }))}
            value={status}
            onChange={(v) => handleStatusChange(v as string)}
            disabled={saving}
            className="w-44"
          />
          <span className={`w-2 h-2 rounded-full ${current.dot}`} />
          {saving && <Spinner size="sm" />}
        </div>
        <span className="text-sm text-zinc-500">
          {status === 'active' && 'Tu tienda está visible para todo el mundo'}
          {status === 'draft' && 'Tu tienda está oculta. Ideal para hacer cambios.'}
          {status === 'maintenance' && 'Tu tienda está en mantenimiento. Contactanos.'}
        </span>
      </div>
    </div>
  )
}
