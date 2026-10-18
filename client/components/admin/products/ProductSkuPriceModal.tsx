// @ts-nocheck
"use client";

import { Modal, Button, Checkbox } from "@/components/ui";

interface ProductSkuPriceModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  formRetailPrice: number;
  formWholesalePrice?: number | null;
  formWholesaleMinQty?: number | null;
  priceDefaults: { retail: boolean; wholesale: boolean };
  onChangeDefaults: (defaults: { retail: boolean; wholesale: boolean }) => void;
  combinationsCount: number;
}

export default function ProductSkuPriceModal({
  open,
  onClose,
  onConfirm,
  formRetailPrice,
  formWholesalePrice,
  formWholesaleMinQty,
  priceDefaults,
  onChangeDefaults,
  combinationsCount,
}: ProductSkuPriceModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Aplicar precios a las variantes"
      size="sm"
    >
      <div className="space-y-4">
        <p className="text-xs text-[var(--color-text-secondary)]">
          Los valores seleccionados se replicarán a todas las variantes
          generadas.
        </p>

        <div className="space-y-3 pt-1">
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <Checkbox
              checked={priceDefaults.retail}
              onChange={(e) =>
                onChangeDefaults({ ...priceDefaults, retail: e.target.checked })
              }
            />
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                Precio de venta:
              </span>
              <span className="text-sm font-mono font-semibold text-[var(--color-primary-text)]">
                ${formRetailPrice || 0}
              </span>
            </div>
          </label>

          {formWholesalePrice != null && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <Checkbox
                checked={priceDefaults.wholesale}
                onChange={(e) =>
                  onChangeDefaults({
                    ...priceDefaults,
                    wholesale: e.target.checked,
                  })
                }
              />
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  Precio mayorista:
                </span>
                <span className="text-sm font-mono font-semibold text-[var(--color-primary-text)]">
                  ${formWholesalePrice || 0}
                </span>
                {formWholesaleMinQty && (
                  <span className="text-xs text-[var(--color-text-muted)]">
                    (mín. {formWholesaleMinQty}u)
                  </span>
                )}
              </div>
            </label>
          )}
        </div>

        <div className="flex gap-3 justify-end pt-3 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onConfirm}>
            Generar {combinationsCount} variantes
          </Button>
        </div>
      </div>
    </Modal>
  );
}
