// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { Wrench, Send, Clock, CheckCircle, XCircle, Loader, AlertTriangle, Edit, ArrowLeft, Search, FolderOpen } from 'lucide-react'
import { Button } from '@/components/admin/ui/Form'
import { Card } from '@/components/admin/ui/Card'
import { Modal } from '@/components/admin/ui/Modal'
import { useAlert } from '@/components/admin/ui/AlertContext'
import { useChangeRequests, useChangeRequestsRemaining, useModules } from '@/hooks/admin-useChangeRequests'
import { Spinner } from '@/components/admin/ui/Spinner'
import api from '@/services/admin-api'

const STATUS_MAP = {
  pending: { label: 'Pendiente', icon: Clock, dot: 'bg-amber-500', text: 'text-amber-400' },
  in_progress: { label: 'En progreso', icon: Loader, dot: 'bg-cyan-500', text: 'text-cyan-400' },
  done: { label: 'Hecho', icon: CheckCircle, dot: 'bg-emerald-500', text: 'text-emerald-400' },
  cancelled: { label: 'Cancelado', icon: XCircle, dot: 'bg-zinc-500', text: 'text-zinc-400' },
}

const FIELD_COMPONENTS = {
  text: ({ field, value, onChange }) => (
    <input
      type="text"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
    />
  ),
  textarea: ({ field, value, onChange }) => (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      rows={3}
      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-sm resize-vertical"
    />
  ),
  number: ({ field, value, onChange }) => (
    <input
      type="number"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
    />
  ),
  email: ({ field, value, onChange }) => (
    <input
      type="email"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
    />
  ),
  url: ({ field, value, onChange }) => (
    <input
      type="url"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      placeholder={field.placeholder}
      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
    />
  ),
  color: ({ field, value, onChange }) => (
    <input
      type="color"
      value={value || '#000000'}
      onChange={(e) => onChange(field.key, e.target.value)}
      className="w-full h-10 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer"
    />
  ),
  date: ({ field, value, onChange }) => (
    <input
      type="date"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-500 text-sm"
    />
  ),
  datetime: ({ field, value, onChange }) => (
    <input
      type="datetime-local"
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-500 text-sm"
    />
  ),
  boolean: ({ field, value, onChange }) => (
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        checked={!!value}
        onChange={(e) => onChange(field.key, e.target.checked)}
        className="w-4 h-4 rounded border-zinc-600 bg-zinc-800 text-cyan-500 focus:ring-cyan-500"
      />
      <span className="text-sm text-zinc-400">{field.placeholder || field.label}</span>
    </label>
  ),
  select: ({ field, value, onChange }) => (
    <select
      value={value || ''}
      onChange={(e) => onChange(field.key, e.target.value)}
      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-500 text-sm"
    >
      <option value="">Seleccionar...</option>
      {(field.options || []).map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  ),
}

function DynamicField({ field, value, onChange }) {
  const Component = FIELD_COMPONENTS[field.type] || FIELD_COMPONENTS.text
  return (
    <div>
      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
        {field.label}
        {field.required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      <Component field={field} value={value} onChange={onChange} />
      {field.helpText && (
        <p className="text-xs text-zinc-600 mt-1">{field.helpText}</p>
      )}
    </div>
  )
}

export default function ChangeRequests() {
  const Alert = useAlert()
  const { requests, totalPages, page, loading, refetch } = useChangeRequests()
  const { limit, used, remaining, canRequest } = useChangeRequestsRemaining()
  const { categories, loading: modulesLoading } = useModules()
  const [selectedComponent, setSelectedComponent] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [editingRequest, setEditingRequest] = useState(null)
  const [formData, setFormData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [search, setSearch] = useState('')

  const filteredCategories = search.trim()
    ? categories
        .map((cat) => {
          const catMatch = cat.name.toLowerCase().includes(search.toLowerCase())
          const matchingComponents = cat.components.filter((comp) =>
            comp.name.toLowerCase().includes(search.toLowerCase()) ||
            (comp.description || '').toLowerCase().includes(search.toLowerCase())
          )
          if (catMatch || matchingComponents.length > 0) {
            return { ...cat, components: catMatch ? cat.components : matchingComponents }
          }
          return null
        })
        .filter(Boolean)
    : categories

  const handleOpenComponent = (category, component) => {
    setEditingRequest(null)
    setSelectedCategory(category)
    setSelectedComponent(component)
    setFormData({})
  }

  const handleEditRequest = (req) => {
    let foundCategory = null
    let foundComponent = null
    for (const cat of categories) {
      for (const comp of cat.components) {
        if (comp.id === req.componentId) {
          foundCategory = cat
          foundComponent = comp
          break
        }
      }
      if (foundComponent) break
    }
    if (!foundComponent) return

    setSelectedCategory(foundCategory)
    setSelectedComponent(foundComponent)
    setEditingRequest(req)
    setFormData(req.values || {})
  }

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!selectedComponent || !selectedCategory) return

    const fields = selectedComponent.fields || []
    const requiredFields = fields.filter((f) => f.required)
    if (requiredFields.length > 0) {
      const empty = requiredFields.some((f) => !formData[f.key] || (typeof formData[f.key] === 'string' && !formData[f.key].trim()))
      if (empty) {
        Alert.fire({ message: 'Completá todos los campos requeridos', type: 'warning' })
        return
      }
    }

    setSubmitting(true)
    try {
      let response
      if (editingRequest) {
        response = await api.put(`/admin/change-requests/${editingRequest.id}`, { values: formData })
      } else {
        response = await api.post('/admin/change-requests', {
          componentId: selectedComponent.id,
          categoryId: selectedCategory.id,
          values: formData,
        })
      }

      const { whatsappLink } = response.data

      Alert.fire({ message: editingRequest ? 'Solicitud actualizada' : 'Solicitud enviada. Te contactaremos pronto.', type: 'success' })
      setSelectedComponent(null)
      setSelectedCategory(null)
      setEditingRequest(null)
      refetch(1)

      if (whatsappLink) {
        window.open(whatsappLink, '_blank')
      }
    } catch (err) {
      let msg = 'Error al enviar solicitud'
      try {
        const body = typeof err.response?.data === 'string'
          ? JSON.parse(err.response.data)
          : err.response?.data
        msg = body?.error || body?.message || msg
      } catch {}
      Alert.fire({ message: msg, type: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const getComponentInfo = (compId) => {
    for (const cat of categories) {
      for (const comp of cat.components) {
        if (comp.id === compId) return { category: cat, component: comp }
      }
    }
    return null
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Solicitar cambio</h1>
          <p className="text-sm text-zinc-500">
            {canRequest
              ? `Te quedan ${remaining} de ${limit} cambios este mes`
              : `Ya usaste tus ${limit} cambios de este mes`}
          </p>
        </div>
        <Button variant="secondary" onClick={() => { setShowHistory(!showHistory); if (!showHistory) refetch(1) }}>
          {showHistory ? (
            <>
              <ArrowLeft className="w-4 h-4" />
              Volver
            </>
          ) : (
            <>
              <Clock className="w-4 h-4" />
              Historial
            </>
          )}
        </Button>
      </div>

      {!canRequest && requests.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
            <p className="text-zinc-300 font-medium mb-1">Límite alcanzado</p>
            <p className="text-sm text-zinc-500">Ya usaste tus {limit} cambios de este mes. Volvé el mes que viene.</p>
          </div>
        </Card>
      )}

      {/* Dynamic modules from platform */}
      {!showHistory && (
        <div className="mb-8">
          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar módulo o categoría..."
              className="w-full max-w-sm pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
            />
          </div>

          <div className="relative min-h-[200px]">
            {modulesLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <Spinner />
              </div>
            )}
          {modulesLoading ? null : filteredCategories.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                {search.trim() ? (
                  <>
                    <Search className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500">No se encontraron resultados para "{search}"</p>
                  </>
                ) : (
                  <>
                    <FolderOpen className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                    <p className="text-zinc-500">No hay módulos disponibles</p>
                  </>
                )}
              </div>
            </Card>
          ) : (
            filteredCategories.map((cat, catIndex) => (
              <div key={cat.id}>
                {catIndex > 0 && (
                  <hr className="border-zinc-800/50 my-6" />
                )}

                <div className="flex items-center gap-2 text-lg font-semibold text-zinc-200 mb-3">
                  {cat.icon && <span>{cat.icon}</span>}
                  {cat.name}
                  {!cat.free && cat.price != null && (
                    <span className="text-xs text-zinc-500 font-normal ml-2">desde ${cat.price}</span>
                  )}
                </div>

                {cat.components.length === 0 ? (
                  <p className="text-sm text-zinc-600 text-center py-6 border border-dashed border-zinc-800 rounded-lg ml-0">
                    No tiene componentes por ahora
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    {cat.components.map((comp) => {
                      const hasFields = (comp.fields || []).length > 0
                      const isPaid = comp.paidOverride
                      return (
                        <button
                          key={comp.id}
                          onClick={() => canRequest && hasFields && handleOpenComponent(cat, comp)}
                          disabled={!canRequest || !hasFields}
                          className={`text-left p-4 rounded-xl border transition-colors flex items-center gap-4
                            ${canRequest && hasFields
                              ? 'bg-zinc-900 border-zinc-800 hover:border-cyan-500 cursor-pointer'
                              : 'bg-zinc-900/50 border-zinc-800/50 opacity-50 cursor-not-allowed'
                            }`}
                        >
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <span className="text-xl shrink-0">{comp.icon || '🛠'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-zinc-200">{comp.name}</p>
                                {isPaid && comp.price != null && (
                                  <span className="text-xs text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                                    ${comp.price}
                                  </span>
                                )}
                              </div>
                              {comp.description && (
                                <p className="text-sm text-zinc-500 mt-0.5">{comp.description}</p>
                              )}
                              {comp.estimatedDays && (
                                <p className="text-xs text-zinc-600 mt-1">
                                  ~{comp.estimatedDays} día{comp.estimatedDays !== 1 ? 's' : ''}
                                </p>
                              )}
                              {!hasFields && (
                                <p className="text-xs text-zinc-600 mt-1">Próximamente</p>
                              )}
                            </div>
                          </div>
                          {comp.thumbnail && (
                            <img
                              src={comp.thumbnail}
                              alt={comp.name}
                              className="w-[100px] h-[100px] rounded-lg object-cover shrink-0 border border-zinc-800"
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))
          )}
          </div>
        </div>
      )}

      {/* History table */}
      {showHistory && (
        <>
        <div className="relative min-h-[200px]">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Spinner />
            </div>
          )}
          {loading ? null : requests.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Clock className="w-10 h-10 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-500">No hay solicitudes</p>
              </div>
            </Card>
          ) : (
            <Card>
              <div className="divide-y divide-zinc-800">
                {requests.map((req) => {
                  const status = STATUS_MAP[req.status] || STATUS_MAP.pending
                  const info = getComponentInfo(req.componentId)
                  const StatusIcon = status.icon
                  const isPending = req.status === 'pending'
                  return (
                    <div key={req.id} className="flex items-center gap-4 px-4 py-3 group">
                      <span className="text-xl shrink-0">{info?.component?.icon || '🛠'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200">
                          {info?.component?.name || `Componente ID ${req.componentId}`}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                          {Object.values(req.values || {}).slice(0, 2).join(' — ') || 'Sin datos'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <StatusIcon className={`w-4 h-4 ${status.text}`} />
                        <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
                      </div>
                      <span className="text-xs text-zinc-600 shrink-0">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      {isPending && (
                        <button
                          onClick={() => handleEditRequest(req)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-cyan-400 hover:bg-zinc-700 transition-colors opacity-0 group-hover:opacity-100"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => refetch(page - 1)}>
                Anterior
              </Button>
              <span className="text-sm text-zinc-400 px-3">Página {page} de {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => refetch(page + 1)}>
                Siguiente
              </Button>
            </div>
          )}
        </>
      )}

      {/* Form modal */}
      <Modal
        open={!!selectedComponent}
        onClose={() => { setSelectedComponent(null); setSelectedCategory(null); setEditingRequest(null) }}
        title={editingRequest ? `Editar: ${selectedComponent?.name}` : `Solicitar: ${selectedComponent?.name || ''}`}
      >
        {selectedComponent && (
          <div className="space-y-4">
            {selectedCategory && (
              <p className="text-xs text-zinc-500">
                {selectedCategory.icon} {selectedCategory.name} &rsaquo; {selectedComponent.icon} {selectedComponent.name}
              </p>
            )}

            {(selectedComponent.fields || []).map((field) => (
              <DynamicField
                key={field.key}
                field={field}
                value={formData[field.key]}
                onChange={handleFieldChange}
              />
            ))}

            {(selectedComponent.paidOverride && selectedComponent.price != null) && (
              <div className="bg-amber-400/10 border border-amber-400/20 rounded-lg p-3">
                <p className="text-sm text-amber-400">
                  Este cambio tiene un costo de <strong>${selectedComponent.price}</strong>
                </p>
              </div>
            )}

            <p className="text-xs text-zinc-600">
              Para imágenes, subilas a la Galería y pegá la URL acá.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <Button type="button" variant="secondary" onClick={() => { setSelectedComponent(null); setSelectedCategory(null); setEditingRequest(null) }}>
                Cancelar
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={submitting}>
                <Send className="w-4 h-4" />
                {submitting ? 'Enviando...' : editingRequest ? 'Actualizar' : 'Enviar solicitud'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
