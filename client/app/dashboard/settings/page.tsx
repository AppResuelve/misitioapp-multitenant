// @ts-nocheck
'use client'
// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from "next/navigation"
import { Download } from 'lucide-react'
import { Button, Input, Textarea } from '@/components/admin/ui/Form'
import { Card } from '@/components/admin/ui/Card'
import { Spinner } from '@/components/admin/ui/Spinner'
import { useUnsavedChanges } from '@/context/UnsavedChangesContext'
import ImageUpload from '@/components/admin/ImageUpload'
import ScheduleInput from '@/components/admin/ScheduleInput'
import { downloadTemplate } from '@/components/admin/lib/excel-utils'
import api from '@/services/admin-api'

const DEFAULT_SETTINGS = {
  business_name: '',
  business_slogan: '',
  business_description: '',
  logo_url: '',
  favicon_url: '',
  whatsapp_number: '',
  email: '',
  address: '',
  business_hours: [],
  instagram: '',
  facebook: '',
}

export default function Settings() {
  const router = useRouter()
  const { setIsDirty, confirmLeave } = useUnsavedChanges()
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    api.get('/admin/settings')
      .then(({ data }) => setSettings((prev) => ({ ...prev, ...data })))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setIsDirty(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await api.put('/admin/settings', settings)
      setIsDirty(false)
      setMessage('Configuración guardada')
    } catch (err) {
      setMessage('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

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
      setMessage('Error al descargar productos')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Configuración del negocio</h1>

      <form onSubmit={handleSave} className="pb-24 lg:pb-0">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Información general</h2>
            <div className="space-y-4">
              <Input
                label="Nombre del negocio"
                value={settings.business_name}
                onChange={(e) => handleChange('business_name', e.target.value)}
              />
              <Input
                label="Slogan"
                value={settings.business_slogan}
                onChange={(e) => handleChange('business_slogan', e.target.value)}
              />
              <Textarea
                label="Descripción"
                value={settings.business_description}
                onChange={(e) => handleChange('business_description', e.target.value)}
                maxLength={1000}
              />
              <div className="max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <ImageUpload
                    label="Logo"
                    images={settings.logo_url ? [settings.logo_url] : []}
                    onChange={(imgs) => handleChange('logo_url', imgs[0] || '')}
                    max={1}
                    cols={2}
                    folder="branding"
                  />
                  <ImageUpload
                    label="Favicon"
                    images={settings.favicon_url ? [settings.favicon_url] : []}
                    onChange={(imgs) => handleChange('favicon_url', imgs[0] || '')}
                    max={1}
                    cols={2}
                    folder="branding"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Contacto</h2>
            <div className="space-y-4">
              <Input
                label="WhatsApp"
                value={settings.whatsapp_number}
                onChange={(e) => handleChange('whatsapp_number', e.target.value)}
                type="tel"
                autoComplete="tel"
                placeholder="5493834971799"
              />
              <Input
                label="Email para contacto"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                type="email"
              />
              <Input
                label="Dirección"
                value={settings.address}
                onChange={(e) => handleChange('address', e.target.value)}
              />
              <ScheduleInput
                value={settings.business_hours}
                onChange={(val) => handleChange('business_hours', val)}
              />
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Redes sociales</h2>
            <div className="space-y-4">
              <Input
                label="Instagram"
                value={settings.instagram}
                onChange={(e) => handleChange('instagram', e.target.value)}
                placeholder="https://instagram.com/..."
              />
              <Input
                label="Facebook"
                value={settings.facebook}
                onChange={(e) => handleChange('facebook', e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
          </Card>
        </div>

        <div className="fixed bottom-0 left-0 right-0 lg:static flex gap-3 justify-end items-center px-4 pb-8 pt-4 lg:p-0 lg:mt-6 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 lg:border-0 lg:bg-transparent z-20">
          <Button type="button" variant="secondary" onClick={async () => { if (await confirmLeave()) router.push('/dashboard') }}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
          {message && (
            <span className={`text-sm ${message.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
              {message}
            </span>
          )}
        </div>
      </form>

      <Card>
        <h2 className="text-lg font-semibold text-zinc-100 mb-4">Planillas de productos</h2>
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
      </Card>
    </div>
  )
}
