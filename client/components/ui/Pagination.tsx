// @ts-nocheck
"use client";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

export function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const showNav = totalPages > 5;

  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (page <= 2) return [1, 2, 3];
    if (page >= totalPages - 1)
      return [totalPages - 2, totalPages - 1, totalPages];
    return [page - 1, page, page + 1];
  };

  const visiblePages = getVisiblePages();

  const btnBase =
    "w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]";
  const btnActive =
    "bg-[var(--color-primary)] text-white shadow-md shadow-[var(--color-primary)]/20 font-semibold";
  const btnInactive =
    "text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]";
  const iconBtn =
    "border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)]";

  return (
    <div className="w-full flex items-center justify-center gap-1.5 ">
      {showNav && (
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={page === 1}
          className={`${btnBase} ${iconBtn}`}
          aria-label="Primera página"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>
      )}

      {showNav && (
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className={`${btnBase} ${iconBtn}`}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {visiblePages.map((p) => (
        <button
          key={p}
          type="button"
          onClick={() => onPageChange(p)}
          className={`${btnBase} ${p === page ? btnActive : btnInactive}`}
        >
          {p}
        </button>
      ))}

      {showNav && (
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className={`${btnBase} ${iconBtn}`}
          aria-label="Página siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}

      {showNav && (
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={page === totalPages}
          className={`${btnBase} ${iconBtn}`}
          aria-label="Última página"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
