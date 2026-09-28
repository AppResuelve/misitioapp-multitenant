// @ts-nocheck
'use client'

export default function HelpSettings() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-zinc-100 mb-6">Ayuda</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-zinc-100 mb-2">Próximamente</h2>
        <p className="text-sm text-zinc-400 max-w-xs">
          Esta sección estará disponible en futuras actualizaciones.
        </p>
      </div>
    </div>
  )
}