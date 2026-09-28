// @ts-nocheck
'use client'
import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { Button, Input } from '@/components/admin/ui/Form'
import { Modal } from '@/components/admin/ui/Modal'
import { Spinner } from '@/components/admin/ui/Spinner'
import { useAlert } from '@/components/admin/ui/AlertContext'
import ScheduleInput from '@/components/admin/ScheduleInput'
import api from '@/services/admin-api'

export default function ContactSettings() {
  const Alert = useAlert()
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [hours, setHours] = useState([])

  useEffect(() => {
    fetchBranches()
  }, [])

  const fetchBranches = async () => {
    try {
      const { data } = await api.get('/admin/branches')
      setBranches(data)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setName('')
    setPhone('')
    setAddress('')
    setHours([])
    setModalOpen(true)
  }

  const openEdit = (branch) => {
    setEditing(branch)
    setName(branch.name)
    setPhone(branch.phone)
    setAddress(branch.address || '')
    setHours(branch.hours ? JSON.parse(branch.hours) : [])
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setEditing(null)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name,
        phone,
        address: address || null,
        hours: JSON.stringify(hours),
      }
      if (editing) {
        await api.put(`/admin/branches/${editing.id}`, payload)
      } else {
        await api.post('/admin/branches', payload)
      }
      await fetchBranches()
      closeModal()
    } catch {
      Alert.fire({ message: 'Error al guardar', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (branch) => {
    if (!confirm(`¿Eliminar "${branch.name}"?`)) return
    try {
      await api.delete(`/admin/branches/${branch.id}`)
      await fetchBranches()
    } catch {
      Alert.fire({ message: 'Error al eliminar', type: 'error' })
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-zinc-100">Contacto</h1>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Agregar sucursal
        </Button>
      </div>

      {branches.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-zinc-100 mb-2">No hay sucursales cargadas</h2>
          <p className="text-sm text-zinc-400 mb-4">
            Hacé clic en &quot;Agregar sucursal&quot; para crear la primera.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-6 py-3">Nombre</th>
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-6 py-3">Teléfono</th>
                <th className="text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider px-6 py-3">Dirección</th>
                <th className="text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider px-6 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((branch) => (
                <tr key={branch.id} className="border-b border-zinc-800 last:border-0 hover:bg-zinc-800/50">
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-zinc-100">{branch.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-400">{branch.phone}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-zinc-400">{branch.address || '—'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEdit(branch)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(branch)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? 'Editar sucursal' : 'Agregar sucursal'}
        size="md"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Sucursal Centro"
            required
          />
          <Input
            label="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="5493624123456"
            required
          />
          <Input
            label="Dirección"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Av. Paraguay 78"
          />
          <ScheduleInput
            value={hours}
            onChange={(val) => setHours(val)}
          />
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="secondary" onClick={closeModal}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}