// @/components/admin/content/SlideEditor.tsx
"use client";

import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { Input } from "@/components/ui";
import ImageUpload from "@/components/admin/ImageUpload";
import LinkDestinationSelector from "./LinkDestinationSelector";

interface SlideEditorProps {
  slide: any;
  index: number;
  totalSlides: number;
  isBrandSlot: boolean;
  isSocialProof: boolean;
  isHero: boolean;
  customPerSlide: boolean;
  onMove: (index: number, direction: "up" | "down") => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: any) => void;
  onBulkUpdate: (index: number, updates: Record<string, any>) => void;
}

export default function SlideEditor({
  slide,
  index,
  totalSlides,
  isBrandSlot,
  isSocialProof,
  isHero,
  customPerSlide,
  onMove,
  onRemove,
  onUpdate,
  onBulkUpdate,
}: SlideEditorProps) {
  const isCustom = customPerSlide || isBrandSlot;

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4 shadow-xs">
      {/* Barra superior de la diapositiva */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] text-xs font-bold flex items-center justify-center">
            {index + 1}
          </span>
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">
            {isBrandSlot
              ? slide.title
                ? `Marca: ${slide.title}`
                : "Logo de Marca"
              : slide.title
                ? `Diapositiva: "${slide.title}"`
                : "Foto de Diapositiva"}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onMove(index, "up")}
            disabled={index === 0}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-30 cursor-pointer"
            title="Subir orden"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onMove(index, "down")}
            disabled={index === totalSlides - 1}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-30 cursor-pointer"
            title="Bajar orden"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(index)}
            disabled={totalSlides <= 1}
            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 cursor-pointer"
            title="Eliminar diapositiva"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Imagen / Logo */}
        <div
          className={
            isBrandSlot || !customPerSlide ? "md:col-span-5" : "md:col-span-4"
          }
        >
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
            {isBrandSlot
              ? "Logo de la marca (PNG o SVG recomendado)"
              : "Fotografía de la diapositiva"}
          </label>
          <ImageUpload
            images={slide.imageUrl ? [slide.imageUrl] : []}
            onChange={(imgs) => onUpdate(index, "imageUrl", imgs[0] || null)}
            max={1}
            folder="carousels"
            cols={1}
          />
        </div>

        {/* Campos condicionales */}
        <div
          className={
            isBrandSlot || !customPerSlide
              ? "md:col-span-7 space-y-3.5"
              : "md:col-span-8 space-y-3.5"
          }
        >
          {/* CASO 1: Marcas */}
          {isBrandSlot && (
            <>
              <Input
                label="Nombre de la marca / Empresa"
                value={slide.title || ""}
                onChange={(e) => onUpdate(index, "title", e.target.value)}
                placeholder="Ej: Callebaut, KitchenAid..."
                required
              />
              <Input
                label="Sitio web o enlace (opcional)"
                value={slide.externalUrl || ""}
                onChange={(e) => {
                  onBulkUpdate(index, {
                    externalUrl: e.target.value,
                    linkType: e.target.value ? "external" : "none",
                  });
                }}
                placeholder="https://..."
              />
            </>
          )}

          {/* CASO 2: Fondo General */}
          {!isBrandSlot && !customPerSlide && (
            <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-1">
              <p className="font-medium text-[var(--color-text-secondary)]">
                Diapositiva en modo fondo general
              </p>
              <p>
                Esta imagen rotará manteniendo el título, subtítulo y botón de
                acción configurados arriba.
              </p>
            </div>
          )}

          {/* CASO 3: Personalizado por Diapositiva */}
          {!isBrandSlot && customPerSlide && (
            <>
              <Input
                label="Título específico"
                value={slide.title || ""}
                onChange={(e) => onUpdate(index, "title", e.target.value)}
                placeholder="Ej: Especial Macarons Franceses"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label={
                    isSocialProof ? "Reseña o comentario" : "Subtítulo o bajada"
                  }
                  value={slide.subtitle || ""}
                  onChange={(e) => onUpdate(index, "subtitle", e.target.value)}
                  placeholder={
                    isSocialProof
                      ? "Amamos la torta de boda..."
                      : "Edición limitada"
                  }
                />
                {isHero && (
                  <Input
                    label="Texto del botón (CTA)"
                    value={slide.buttonText || ""}
                    onChange={(e) =>
                      onUpdate(index, "buttonText", e.target.value)
                    }
                    placeholder="Ej: Ver más"
                  />
                )}
              </div>

              <LinkDestinationSelector
                label="Destino del clic"
                values={slide}
                onChange={(updates) => onBulkUpdate(index, updates)}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
