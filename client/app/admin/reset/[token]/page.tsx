'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Key, Eye, EyeOff, Loader } from 'lucide-react'
import api from '@/services/admin-api'

export default function ResetPassword() {
  const params = useParams()
  const router = useRouter()
  const token = params?.token as string | undefined

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password.length < 6) { setError('Mínimo 6 caracteres'); return }
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }

    setError('')
    setLoading(true)
    try {
      const { data } = await api.post('/auth/reset-password', { token, password })
      if (data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (err) {
      let msg = 'Error al restablecer'
      try { const b = typeof err.response?.data === 'string' ? JSON.parse(err.response.data) : err.response?.data; msg = b?.error || b?.message || msg } catch {}
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm text-center">
          <p className="text-zinc-400 mb-4">Token no proporcionado.</p>
          <Link href="/forgot" className="text-sm text-cyan-400 hover:text-cyan-300">Volver a recuperar</Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <Key className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100 mb-2">¡Contraseña actualizada!</h1>
          <p className="text-sm text-zinc-400">Redirigiendo al panel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-cyan-500/10 flex items-center justify-center mx-auto mb-4">
            <Key className="w-7 h-7 text-cyan-400" />
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Nueva contraseña</h1>
          <p className="text-sm text-zinc-500 mt-1">Elegí una contraseña para tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">{error}</div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
                required
                autoFocus
              />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">Confirmar</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repetí la contraseña"
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-cyan-500 text-sm"
              required
            />
          </div>
          <button type="submit" disabled={loading}
            className="w-full py-2.5 px-4 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors disabled:opacity-50 text-sm">
            {loading ? 'Actualizando...' : 'Actualizar contraseña'}
          </button>
        </form>

        <p className="text-center mt-4">
          <Link href="/login" className="text-sm text-zinc-500 hover:text-cyan-400 transition-colors">Volver al login</Link>
        </p>
      </div>
    </div>
  )
}
