// @ts-nocheck
"use client";

import { Info, AlertTriangle } from "lucide-react";
import { Input, Checkbox } from "@/components/ui";
import { UNIT_LABEL } from "@/constants/productForm";

interface ProductPricingSectionProps {
  form: any;
  onChange: (field: string, value: any) => void;
  hasSkus: boolean;
  skus: any[];
  unitType?: string | null;
}

export default function ProductPricingSection({
  form,
  onChange,
  hasSkus,
  skus,
  unitType,
}: ProductPricingSectionProps) {
  const validPrices = hasSkus
    ? skus.map((s) => Number(s.retailPrice)).filter((p) => p > 0)
    : [];

  const minVariantPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;

  return (
    <div className="space-y-4">
      {/* Grilla estricta 2 filas x 2 columnas (mantiene layout en mobile) */}
      <div className="grid grid-cols-2 gap-3 items-end">
        {/* Fila 1 */}
        <Input
          label="Precio de venta"
          type="number"
          min="0"
          value={form.retailPrice}
          onChange={(e) => onChange("retailPrice", e.target.value)}
          required
        />
        <Input
          label="% Descuento"
          type="number"
          min="1"
          max="100"
          value={form.discountPercentage || ""}
          onChange={(e) =>
            onChange("discountPercentage", e.target.value || null)
          }
          placeholder="Ej: 25"
        />

        {/* Fila 2 */}
        <Input
          label="Precio comparación"
          type="number"
          min="0"
          value={form.comparePrice || ""}
          onChange={(e) => onChange("comparePrice", e.target.value || null)}
          placeholder="Ej: 12000"
        />
        <Input
          label="Stock"
          type="number"
          min="0"
          value={
            hasSkus
              ? skus.reduce((acc, s) => acc + (Number(s.stock) || 0), 0)
              : form.stock
          }
          readOnly={hasSkus}
          disabled={hasSkus}
          onChange={(e) => onChange("stock", e.target.value)}
          placeholder="0"
          title={
            hasSkus ? "El stock se administra por cada variante" : undefined
          }
        />
      </div>

      {/* Mayorista: solo disponible si no hay variantes */}
      {!hasSkus && (
        <div className="space-y-3 pt-1">
          <label className="flex items-center gap-2.5 text-sm font-medium text-[var(--color-text-secondary)] cursor-pointer select-none">
            <Checkbox
              checked={
                form.wholesalePrice != null || form.wholesaleMinQty != null
              }
              onChange={(e) => {
                if (!e.target.checked) {
                  onChange("wholesalePrice", null);
                  onChange("wholesaleMinQty", null);
                } else {
                  onChange("wholesalePrice", "");
                  onChange("wholesaleMinQty", "");
                }
              }}
            />
            <span>¿Tiene precio mayorista?</span>
          </label>

          {(form.wholesalePrice != null || form.wholesaleMinQty != null) && (
            <div className="grid grid-cols-2 gap-3 items-end">
              <Input
                label="Precio mayorista"
                type="number"
                min="0"
                value={form.wholesalePrice || ""}
                onChange={(e) =>
                  onChange("wholesalePrice", e.target.value || null)
                }
                placeholder="0"
              />
              <Input
                label="Cant. mín."
                type="number"
                min="1"
                value={form.wholesaleMinQty || ""}
                onChange={(e) =>
                  onChange("wholesaleMinQty", e.target.value || null)
                }
                placeholder="10"
              />
            </div>
          )}
        </div>
      )}

      {/* Banners contextuales de variantes */}
      {hasSkus ? (
        <div className="p-3 rounded-xl flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/25 transition-colors">
          <AlertTriangle className="w-4 h-4 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Variantes configuradas{" "}
              {unitType ? `(${UNIT_LABEL[unitType] || unitType})` : ""}
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)] leading-snug">
              El catálogo muestra la variante más accesible ($
              {minVariantPrice || 0}).
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
