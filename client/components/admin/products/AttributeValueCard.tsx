// @ts-nocheck
"use client";

import { useState } from "react";
import { Trash2, ChevronRight } from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import { UNIT_LABEL } from "@/constants/productForm";

interface AttributeValueCardProps {
  value: string;
  unitType?: string | null;
  images: string[];
  onRemove: () => void;
  onUpdateImages: (images: string[]) => void;
}

export default function AttributeValueCard({
  value,
  unitType,
  images = [],
  onRemove,
  onUpdateImages,
}: AttributeValueCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] overflow-hidden transition-colors">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setExpanded(!expanded)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setExpanded(!expanded);
          }
        }}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--color-bg-elevated)]/50 transition-colors text-left cursor-pointer"
      >
        <ChevronRight
          className={`w-4 h-4 text-[var(--color-text-muted)] transition-transform duration-200 shrink-0 ${
            expanded ? "rotate-90 text-[var(--color-primary-text)]" : ""
          }`}
        />

        <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)] truncate">
          {value}
          {unitType ? ` ${UNIT_LABEL[unitType] || unitType}` : ""}
        </span>

        {images.length > 0 && (
          <span className="text-xs text-[var(--color-text-muted)] font-medium shrink-0">
            {images.length} {images.length === 1 ? "imagen" : "imágenes"}
          </span>
        )}

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="p-1 text-[var(--color-text-muted)] hover:text-red-500 rounded transition-colors shrink-0 cursor-pointer"
          title="Quitar valor"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-3 bg-[var(--color-bg-base)]/40">
          <ImageUpload
            images={images}
            onChange={onUpdateImages}
            max={2}
            cols={4}
            folder="atributos"
          />
        </div>
      )}
    </div>
  );
}
