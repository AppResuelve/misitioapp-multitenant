// @/components/admin/content/FeaturedProductsConfig.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button, DropdownSelect, Input, Spinner } from "@/components/ui";
import ResourceSearchTrigger from "@/components/admin/search/ResourceSearchTrigger";
import { useAlert } from "@/context/AlertContext";
import { tagService } from "@/services/tags.service";

interface FeaturedProductsConfigProps {
  config: {
    mode?: "auto" | "tag" | "manual";
    tagName?: string;
    limit?: number;
    selectedProducts?: Array<{ id: number | string; name: string }>;
    [key: string]: any;
  };
  onChange: (key: string, value: any) => void;
  onBulkChange: (updates: Record<string, any>) => void;
}

export default function FeaturedProductsConfig({
  config,
  onChange,
  onBulkChange,
}: FeaturedProductsConfigProps) {
  const Alert = useAlert();
  const [availableTags, setAvailableTags] = useState<any[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);

  // Carga diferida de tags
  useEffect(() => {
    setLoadingTags(true);
    tagService
      .getActive()
      .then((tags) => setAvailableTags(tags || []))
      .catch((err) => console.error("Error al cargar tags activos:", err))
      .finally(() => setLoadingTags(false));
  }, []);

  const tagSelectOptions = useMemo(() => {
    const options: Array<{ value: string; label: string; count: number }> = [];

    availableTags.forEach((tag) => {
      (tag.values || []).forEach((val: any) => {
        const count = Number(
          val.productCount || val.dataValues?.productCount || 0,
        );
        options.push({
          value: val.value,
          label: `${val.value} (${tag.name}) — ${count} ${
            count === 1 ? "producto" : "productos"
          }`,
          count,
        });
      });
    });

    return options;
  }, [availableTags]);

  const selectedTagOption = useMemo(() => {
    return tagSelectOptions.find((opt) => opt.value === config.tagName);
  }, [tagSelectOptions, config.tagName]);

  const handleModeChange = async (newMode: "auto" | "tag" | "manual") => {
    const currentMode = config.mode || "auto";
    if (newMode === currentMode) return;

    const hasSelectedTag = Boolean(config.tagName);
    const hasSelectedProducts = (config.selectedProducts || []).length > 0;

    const needsConfirmation =
      (currentMode === "tag" && hasSelectedTag) ||
      (currentMode === "manual" && hasSelectedProducts);

    if (needsConfirmation) {
      const result = await Alert.fire({
        title: "Cambiar criterio de selección",
        message:
          currentMode === "tag"
            ? `Al cambiar de modo se desvinculará la etiqueta "${config.tagName}". ¿Deseás continuar?`
            : `Al cambiar de modo se deseleccionarán los ${config.selectedProducts?.length} productos agregados. ¿Deseás continuar?`,
        type: "warning",
        variant: "modal",
        showCancelButton: true,
        confirmButtonText: "Sí, cambiar criterio",
        cancelButtonText: "Cancelar",
      });

      if (!result.isConfirmed) return;
    }

    onBulkChange({
      mode: newMode,
      tagName: newMode === "tag" ? config.tagName : "",
      selectedProducts: newMode === "manual" ? config.selectedProducts : [],
      limit: newMode === "auto" ? 8 : config.limit,
    });
  };

  const handleTagChange = (tagName: string) => {
    const found = tagSelectOptions.find((opt) => opt.value === tagName);
    const total = found?.count || 1;

    onBulkChange({
      tagName,
      limit: config.limit ? Math.min(config.limit, total) : total,
    });
  };

  const currentMode = config.mode || "auto";

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 space-y-6 shadow-xs">
      <div>
        <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
          Criterio de Selección de Productos
        </h3>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Las tarjetas, imágenes, precios y enlaces se generan automáticamente
          desde el catálogo.
        </p>
      </div>

      {/* Selector de Modo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          {
            id: "auto",
            title: "Automático (Recomendado)",
            desc: "Novedades recientes o top de ventas del catálogo",
          },
          {
            id: "tag",
            title: "Por Etiqueta / Tag",
            desc: "Filtra por valor de etiqueta (ej: 'destacados')",
          },
          {
            id: "manual",
            title: "Selección Manual",
            desc: "Elegir productos específicos de una lista",
          },
        ].map((opt) => {
          const isSelected = currentMode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => handleModeChange(opt.id as any)}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer ${
                isSelected
                  ? "border-[var(--color-primary)] bg-[var(--color-primary)]/5 ring-1 ring-[var(--color-primary)]"
                  : "border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)]/40"
              }`}
            >
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {opt.title}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                {opt.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Modo Tag */}
      {currentMode === "tag" && (
        <div className="space-y-4">
          <div className="space-y-2">
            {loadingTags ? (
              <div className="flex items-center gap-2 py-2 text-sm text-[var(--color-text-muted)]">
                <Spinner size="sm" />
                <span>Cargando etiquetas con productos activos...</span>
              </div>
            ) : tagSelectOptions.length > 0 ? (
              <DropdownSelect
                label="Seleccionar Etiqueta / Tag"
                value={config.tagName || ""}
                onChange={handleTagChange}
                options={tagSelectOptions}
                placeholder="Elegí una etiqueta..."
              />
            ) : (
              <div className="p-3 text-xs rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400">
                No se encontraron etiquetas asignadas a productos activos.
              </div>
            )}
          </div>

          {selectedTagOption && (
            <div className="w-56">
              <Input
                label="Cantidad máxima a mostrar"
                type="number"
                min={1}
                max={selectedTagOption.count}
                value={config.limit ?? selectedTagOption.count}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  const clamped = Math.min(
                    Math.max(1, val),
                    selectedTagOption.count,
                  );
                  onChange("limit", clamped);
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Modo Manual */}
      {currentMode === "manual" && (
        <div className="space-y-3">
          <ResourceSearchTrigger
            label="Buscar y agregar producto a la vitrina"
            scope="products"
            status="active"
            onSelect={(prod) => {
              const currentList = config.selectedProducts || [];
              if (!currentList.some((p: any) => p.id === prod.id)) {
                onChange("selectedProducts", [
                  ...currentList,
                  { id: prod.id, name: prod.name },
                ]);
              }
            }}
          />

          {(config.selectedProducts || []).length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {config.selectedProducts.map((prod: any) => (
                <Button
                  key={prod.id}
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    onChange(
                      "selectedProducts",
                      config.selectedProducts.filter(
                        (p: any) => p.id !== prod.id,
                      ),
                    )
                  }
                  title="Quitar producto"
                >
                  {prod.name}
                  <X className="w-3.5 h-3.5 text-[var(--color-text-muted)] cursor-pointer" />
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[var(--color-text-muted)] italic">
              Aún no agregaste productos. Buscalos arriba para sumarlos al
              carrusel.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
