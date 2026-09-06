// @ts-nocheck
'use client'
import { createContext, useContext, useState, useEffect } from 'react'
import api, { resetLogoutFlag } from '@/services/admin-api'

const AuthCtx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/auth/me')
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const h = () => setUser(null)
    window.addEventListener('auth:logout', h)
    return () => window.removeEventListener('auth:logout', h)
  }, [])

  const login = async (email, password) => {
    resetLogoutFlag()
    const { data } = await api.post('/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    resetLogoutFlag()
    try {
      await api.post('/auth/logout')
    } catch {}
    setUser(null)
  }

  return <AuthCtx.Provider value={{ user, loading, login, logout }}>{children}</AuthCtx.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}
