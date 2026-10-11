'use client'
import { Spinner } from './Spinner'

interface LoadingOverlayProps {
  open: boolean
  message?: string
  description?: string
}

export function LoadingOverlay({ open, message, description }: LoadingOverlayProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className="text-center px-4">
        <Spinner size="lg" />
        {message && (
          <p className="text-zinc-200 font-medium mt-4">{message}</p>
        )}
        {description && (
          <p className="text-zinc-500 text-sm mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}
