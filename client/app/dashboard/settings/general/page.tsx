// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { Button, Input, Textarea } from '@/components/admin/ui/Form'
import { Card } from '@/components/admin/ui/Card'
import { Spinner } from '@/components/admin/ui/Spinner'
import { useUnsavedChanges } from '@/context/UnsavedChangesContext'
import ImageUpload from '@/components/admin/ImageUpload'
import api from '@/services/admin-api'

export default function GeneralSettings() {
  const { setIsDirty } = useUnsavedChanges()
  const [settings, setSettings] = useState({
    business_name: '',
    business_slogan: '',
    business_description: '',
    logo_url: '',
    favicon_url: '',
    email: '',
    instagram: '',
    facebook: '',
    tiktok: '',
    youtube: '',
  })
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
      setMessage('Guardado')
    } catch {
      setMessage('Error al guardar')
    } finally {
      setSaving(false)
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
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">General</h1>

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
          </Card>

          <Card>
            <h2 className="text-lg font-semibold text-zinc-100 mb-4">Contacto</h2>
            <div className="space-y-4">
              <Input
                label="Email"
                value={settings.email}
                onChange={(e) => handleChange('email', e.target.value)}
                type="email"
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
              <Input
                label="TikTok"
                value={settings.tiktok}
                onChange={(e) => handleChange('tiktok', e.target.value)}
                placeholder="https://tiktok.com/@..."
              />
              <Input
                label="YouTube"
                value={settings.youtube}
                onChange={(e) => handleChange('youtube', e.target.value)}
                placeholder="https://youtube.com/@..."
              />
            </div>
          </Card>
        </div>

        <div className="fixed bottom-0 left-0 right-0 lg:static flex gap-3 justify-end items-center px-4 pb-8 pt-4 lg:p-0 lg:mt-6 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800 lg:border-0 lg:bg-transparent z-20">
          {message && (
            <span className={`text-sm mr-auto ${message.includes('Error') ? 'text-red-400' : 'text-emerald-400'}`}>
              {message}
            </span>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </div>
  )
}