// @ts-nocheck
"use client";

const SIZES = {
  sm: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-3xl",
  "2xl": "max-w-5xl",
};

export function Modal({
  open,
  onClose,
  title,
  children,
  closable = true,
  size = "lg",
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={closable ? onClose : undefined}
      />

      {/* Contenedor Modal */}
      <div
        className={`relative bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl w-full ${
          SIZES[size] || SIZES.lg
        } max-h-[90vh] flex flex-col overflow-hidden transition-all`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {title}
          </h2>
          {closable && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Body scrollable */}
        <div className="p-6 overflow-y-auto text-[var(--color-text-primary)]">
          {children}
        </div>
      </div>
    </div>
  );
}
