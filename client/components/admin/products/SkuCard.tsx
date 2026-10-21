// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import { Trash2, ChevronRight } from "lucide-react";
import { Input, DropdownSelect } from "@/components/ui";
import { useAlert } from "@/context/AlertContext";
import { UNIT_LABEL } from "@/constants/productForm";

interface SkuCardProps {
  sku: any;
  index: number;
  attributes: any[];
  unitType?: string | null;
  onChange: (index: number, updatedSku: any) => void;
  onRemove: (index: number) => void;
}

export default function SkuCard({
  sku,
  index,
  attributes = [],
  unitType,
  onChange,
  onRemove,
}: SkuCardProps) {
  const [expanded, setExpanded] = useState(false);
  const Alert = useAlert();
  const unitName = unitType ? UNIT_LABEL[unitType] || unitType : null;

  const label = useMemo(() => {
    if (!sku.attributeValueIds?.length) return `Variante ${index + 1}`;

    return [...sku.attributeValueIds]
      .sort((a, b) => {
        const getAttrId = (vId: number) =>
          attributes.find((at) => at.values.some((v: any) => v.id === vId))
            ?.id || 0;
        return getAttrId(a) - getAttrId(b);
      })
      .map((vId) => {
        for (const attr of attributes) {
          const val = attr.values.find((v: any) => v.id === vId);
          if (val) {
            return attr.unitType
              ? `${val.value} ${UNIT_LABEL[attr.unitType] || attr.unitType}`
              : val.value;
          }
        }
        return vId;
      })
      .join(" + ");
  }, [sku.attributeValueIds, attributes, index]);

  const handleChange = (field: string, value: any) => {
    onChange(index, { ...sku, [field]: value });
  };

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] transition-colors overflow-hidden shadow-xs">
      {/* Header Fila */}
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

        <span className="flex-1 text-sm font-semibold text-[var(--color-text-primary)] truncate">
          {label}
        </span>

        <span className="text-xs font-mono font-semibold text-[var(--color-text-secondary)] shrink-0">
          ${sku.retailPrice || 0}
        </span>

        <span
          className={`text-xs px-2.5 py-0.5 rounded-full font-medium shrink-0 border ${
            sku.status === "active"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)] border-[var(--color-border)]"
          }`}
        >
          {sku.status === "active" ? "Activo" : "Borrador"}
        </span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            Alert.fire({
              message:
                'Para eliminar esta variante, abrí "Administrar atributos" y deseleccioná sus valores.',
              type: "info",
              variant: "banner",
            });
          }}
          className="p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] rounded shrink-0 transition-colors cursor-pointer"
          title="Cómo eliminar variante"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Detalle Acordeón */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-[var(--color-border)] pt-3 space-y-3 bg-[var(--color-bg-base)]/30">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Input
              label={
                Boolean(unitType)
                  ? `Precio venta (${unitName})`
                  : "Precio venta"
              }
              type="number"
              min="0"
              value={sku.retailPrice ?? ""}
              onChange={(e) =>
                handleChange(
                  "retailPrice",
                  e.target.value ? Number(e.target.value) : "",
                )
              }
            />
            <Input
              label="Stock"
              type="number"
              min="0"
              value={sku.stock}
              onChange={(e) => handleChange("stock", e.target.value)}
            />
            <div className="hidden sm:block">
              <Input
                label="Código SKU"
                value={sku.sku || ""}
                onChange={(e) => handleChange("sku", e.target.value)}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="sm:hidden">
            <Input
              label="Código SKU"
              value={sku.sku || ""}
              onChange={(e) => handleChange("sku", e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Precio mayorista"
              type="number"
              min="0"
              value={sku.wholesalePrice || ""}
              onChange={(e) =>
                handleChange("wholesalePrice", e.target.value || null)
              }
            />
            <Input
              label="Cant. mín. mayorista"
              type="number"
              min="1"
              value={sku.wholesaleMinQty || ""}
              onChange={(e) =>
                handleChange("wholesaleMinQty", e.target.value || null)
              }
            />
            <DropdownSelect
              label="Estado"
              value={sku.status}
              onChange={(v) => handleChange("status", v)}
              options={[
                { value: "active", label: "Activo" },
                { value: "draft", label: "Borrador" },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}
