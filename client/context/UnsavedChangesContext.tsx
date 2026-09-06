// @ts-nocheck
'use client'
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAlert } from '@/components/admin/ui/AlertContext'

interface UnsavedChangesCtx {
  isDirty: boolean
  setIsDirty: (d: boolean) => void
  confirmLeave: () => Promise<boolean>
}

const Ctx = createContext<UnsavedChangesCtx | null>(null)

export function UnsavedChangesProvider({ children }: { children: React.ReactNode }) {
  const [isDirty, setIsDirty] = useState(false)
  const Alert = useAlert()

  // beforeunload
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = '' }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  const confirmLeave = useCallback(async () => {
    if (!isDirty) return true
    const result = await Alert.fire({
      title: '¿Salir sin guardar?',
      message: 'Tenés cambios sin guardar. Si salís, los cambios se perderán.',
      type: 'warning', variant: 'modal',
      showCancelButton: true,
      confirmButtonText: 'Salir', cancelButtonText: 'Cancelar',
    })
    if (result.isConfirmed) setIsDirty(false)
    return result.isConfirmed
  }, [isDirty, Alert])

  return <Ctx.Provider value={{ isDirty, setIsDirty, confirmLeave }}>{children}</Ctx.Provider>
}

export function useUnsavedChanges() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useUnsavedChanges debe usarse dentro de UnsavedChangesProvider')
  return ctx
}
