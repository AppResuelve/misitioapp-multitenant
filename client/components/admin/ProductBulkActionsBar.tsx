// @ts-nocheck
"use client";

import { SlidersHorizontal, Trash2 } from "lucide-react";
import { Button, Spinner } from "@/components/ui";

interface ProductBulkActionsBarProps {
  selectedCount: number;
  onOpenSystemUpdate: () => void;
  onBulkDelete: () => void;
  isProcessing?: boolean;
}

export default function ProductBulkActionsBar({
  selectedCount,
  onOpenSystemUpdate,
  onBulkDelete,
  isProcessing = false,
}: ProductBulkActionsBarProps) {
  const canApplyBulk = selectedCount >= 2;

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-[var(--color-primary-light)]/40 border border-[var(--color-primary)]/20 transition-colors">
      <span className="text-sm text-[var(--color-primary-text)] font-semibold whitespace-nowrap">
        {selectedCount} seleccionado(s)
      </span>

      <div className="flex items-center gap-2 shrink-0">
        <Button
          size="sm"
          variant="secondary"
          onClick={onOpenSystemUpdate}
          disabled={!canApplyBulk || isProcessing}
          className="gap-2"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-500" />
          <span>Editar en lote</span>
        </Button>

        <Button
          size="sm"
          variant="danger"
          onClick={onBulkDelete}
          disabled={!canApplyBulk || isProcessing}
          className="gap-1.5"
          title={
            !canApplyBulk
              ? "Seleccioná al menos 2 productos para eliminar en lote"
              : "Eliminar seleccionados"
          }
        >
          {isProcessing ? (
            <Spinner size="sm" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Eliminar</span>
        </Button>
      </div>
    </div>
  );
}
