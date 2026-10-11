// @ts-nocheck
'use client'
const SIZES = {
  sm: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-3xl',
  '2xl': 'max-w-5xl',
}

export function Modal({ open, onClose, title, children, closable = true, size = 'lg' }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closable ? onClose : undefined} />
      <div className={`relative bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl w-full ${SIZES[size] || SIZES.lg} max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">{title}</h2>
          {closable && (
            <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
