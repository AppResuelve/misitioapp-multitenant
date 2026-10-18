// @ts-nocheck
"use client";

import { useState } from "react";
import { Search, X, Package, Folder } from "lucide-react";
import FastSearchModal from "./FastSearchModal";

interface ResourceSearchTriggerProps {
  label: string;
  scope: "products" | "categories";
  selectedId: string | number | null;
  selectedName?: string;
  onSelect: (item: any) => void;
  onClear: () => void;
  placeholder?: string;
}

export default function ResourceSearchTrigger({
  label,
  scope,
  selectedId,
  selectedName,
  onSelect,
  onClear,
  placeholder,
}: ResourceSearchTriggerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
        {label}
      </label>

      {selectedId ? (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-[var(--color-primary)]/40 bg-[var(--color-primary-light)]/20 transition-colors">
          <div className="flex items-center gap-2 truncate">
            {scope === "products" ? (
              <Package className="w-4 h-4 text-[var(--color-primary-text)] shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-[var(--color-primary-text)] shrink-0" />
            )}
            <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
              {selectedName || `ID: ${selectedId}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="text-xs text-[var(--color-primary-text)] font-medium hover:underline cursor-pointer"
            >
              Cambiar
            </button>
            <button
              type="button"
              onClick={onClear}
              className="p-1 rounded-md text-[var(--color-text-muted)] hover:text-red-500 cursor-pointer"
              title="Quitar selección"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setModalOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-border-hover)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            <span>
              {placeholder ||
                (scope === "products"
                  ? "Seleccionar producto..."
                  : "Seleccionar categoría...")}
            </span>
          </div>
          <span className="text-xs px-2 py-0.5 rounded bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-muted)]">
            Buscar
          </span>
        </button>
      )}

      {/* Modal con scope bloqueado */}
      <FastSearchModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        scope={scope}
        lockScope={true}
        onSelect={onSelect}
      />
    </div>
  );
}
