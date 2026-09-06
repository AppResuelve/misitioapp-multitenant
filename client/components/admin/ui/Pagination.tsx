// @ts-nocheck
'use client'
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null

  const showNav = totalPages > 5

  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    if (page <= 2) return [1, 2, 3]
    if (page >= totalPages - 1) return [totalPages - 2, totalPages - 1, totalPages]
    return [page - 1, page, page + 1]
  }

  const visiblePages = getVisiblePages()

  const btnBase = "w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
  const btnActive = "bg-cyan-500 text-white"
  const btnInactive = "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
  const iconBtn = "border border-zinc-700 text-zinc-400 hover:border-cyan-500 hover:text-cyan-400"

  return (
    <div className="w-full flex items-center justify-center gap-2 mt-6">
      {showNav && (
        <button onClick={() => onPageChange(1)} disabled={page === 1} className={`${btnBase} ${iconBtn}`} aria-label="Primera página">
          <ChevronsLeft className="w-4 h-4" />
        </button>
      )}

      {showNav && (
        <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className={`${btnBase} ${iconBtn}`} aria-label="Página anterior">
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {visiblePages.map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
        >
          {p}
        </button>
      ))}

      {showNav && (
        <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className={`${btnBase} ${iconBtn}`} aria-label="Página siguiente">
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {showNav && (
        <button onClick={() => onPageChange(totalPages)} disabled={page === totalPages} className={`${btnBase} ${iconBtn}`} aria-label="Última página">
          <ChevronsRight className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
