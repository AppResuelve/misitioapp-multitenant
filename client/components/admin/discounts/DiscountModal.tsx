// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Plus, X, Package, FolderTree, Calendar, Layers } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useCampaigns } from "@/hooks/admin-useCampaigns";
import {
  Button,
  Input,
  DropdownSelect,
  Modal,
  Checkbox,
} from "@/components/ui";
import FastSearchModal from "@/components/admin/search/FastSearchModal";
import {
  DISCOUNT_TYPE_OPTIONS,
  DISCOUNT_STATUS_OPTIONS,
  DISCOUNT_MESSAGES,
} from "@/constants/discounts";
import { toLocalDatetimeInput } from "@/utils/date";
import { getCampaignSelectOptions } from "@/utils/campaignOptions";

export default function DiscountModal({
  open,
  onClose,
  form,
  setField,
  toggleId,
  onSave,
  saving,
  isEditing,
}) {
  const Alert = useAlert();
  const { campaigns } = useCampaigns();

  const [categorySearchOpen, setCategorySearchOpen] = useState(false);
  const [productSearchOpen, setProductSearchOpen] = useState(false);

  const [selectedItemLabels, setSelectedItemLabels] = useState<
    Record<string, string>
  >({});

  const currentCampaign = useMemo(() => {
    if (!form.campaignId) return null;
    return (
      campaigns.find((c) => String(c.id) === String(form.campaignId)) || null
    );
  }, [form.campaignId, campaigns]);

  const campaignOptions = useMemo(
    () => getCampaignSelectOptions(campaigns, form.campaignId),
    [campaigns, form.campaignId],
  );

  const handleCampaignChange = (campaignIdStr: string) => {
    const nextVal = campaignIdStr ? String(campaignIdStr) : "";
    setField("campaignId", nextVal);

    if (nextVal) {
      const selectedCamp = campaigns.find((c) => String(c.id) === nextVal);
      if (selectedCamp) {
        if (selectedCamp.startsAt) {
          setField("startAt", toLocalDatetimeInput(selectedCamp.startsAt));
        }
        if (selectedCamp.endsAt) {
          setField("endAt", toLocalDatetimeInput(selectedCamp.endsAt));
        }
      }
    }
  };

  const handleDateChange = async (
    field: "startAt" | "endAt",
    newValue: string,
  ) => {
    if (!currentCampaign) {
      setField(field, newValue);
      return;
    }

    const campDate =
      field === "startAt"
        ? currentCampaign.startsAt
          ? toLocalDatetimeInput(currentCampaign.startsAt)
          : ""
        : currentCampaign.endsAt
          ? toLocalDatetimeInput(currentCampaign.endsAt)
          : "";

    if (newValue === campDate) {
      setField(field, newValue);
      return;
    }

    const result = await Alert.fire({
      title: "Desasociar campaña",
      message: `Este descuento está vinculado a "${currentCampaign.name}". Modificar la fecha desvinculará la campaña. ¿Deseás continuar?`,
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Desasociar y cambiar",
      cancelButtonText: "Mantener campaña",
    });

    if (result.isConfirmed) {
      setField("campaignId", "");
      setField(field, newValue);
    }
  };

  const handleSelectResource = (item: any, type: "category" | "product") => {
    const key = type === "category" ? "categoryIds" : "productIds";
    const currentList = form[key] || [];

    if (!currentList.includes(item.id)) {
      setField(key, [...currentList, item.id]);
      setSelectedItemLabels((prev) => ({
        ...prev,
        [`${type}-${item.id}`]: item.name || item.label,
      }));
    }
  };

  const handleRemoveResource = (id: number, type: "category" | "product") => {
    const key = type === "category" ? "categoryIds" : "productIds";
    setField(
      key,
      (form[key] || []).filter((itemId: number) => itemId !== id),
    );
  };

  const validateAndSave = () => {
    if (!form.name?.trim()) {
      Alert.fire({ message: DISCOUNT_MESSAGES.NAME_REQUIRED, type: "warning" });
      return;
    }

    const pct = Number(form.percentage);
    if (isNaN(pct) || pct <= 0 || pct > 100) {
      Alert.fire({
        message: DISCOUNT_MESSAGES.PERCENTAGE_INVALID,
        type: "warning",
      });
      return;
    }

    // Fechas obligatorias solo si no tiene campaña (la campaña ya valida sus fechas)
    if (!form.campaignId && !form.startAt) {
      Alert.fire({
        message: DISCOUNT_MESSAGES.START_DATE_REQUIRED,
        type: "warning",
      });
      return;
    }

    if (
      form.endAt &&
      form.startAt &&
      new Date(form.endAt) < new Date(form.startAt)
    ) {
      Alert.fire({
        message: DISCOUNT_MESSAGES.END_DATE_INVALID,
        type: "warning",
      });
      return;
    }

    if (
      form.type === "category" &&
      (!form.categoryIds || form.categoryIds.length === 0)
    ) {
      Alert.fire({
        message: DISCOUNT_MESSAGES.CATEGORIES_REQUIRED,
        type: "warning",
      });
      return;
    }

    if (
      form.type === "products" &&
      (!form.productIds || form.productIds.length === 0)
    ) {
      Alert.fire({
        message: DISCOUNT_MESSAGES.PRODUCTS_REQUIRED,
        type: "warning",
      });
      return;
    }

    if (form.type === "price_range") {
      const min = Number(form.min) || 0;
      const max = Number(form.max) || 0;
      if (max > 0 && min > max) {
        Alert.fire({
          message: DISCOUNT_MESSAGES.PRICE_RANGE_INVALID,
          type: "warning",
        });
        return;
      }
    }

    if (
      form.type === "cart_total" &&
      (!form.minAmount || Number(form.minAmount) <= 0)
    ) {
      Alert.fire({
        message: DISCOUNT_MESSAGES.CART_MIN_REQUIRED,
        type: "warning",
      });
      return;
    }

    onSave();
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={isEditing ? "Editar descuento" : "Nuevo descuento"}
        size="xl"
      >
        <div className="space-y-4">
          <Input
            label="Nombre"
            value={form.name}
            onChange={(e) => setField("name", e.target.value)}
            placeholder="Ej: Descuento de fin de semana, Hot Sale..."
            required
            autoFocus
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DropdownSelect
              label="Tipo de descuento"
              value={form.type}
              onChange={(val) => setField("type", val)}
              options={DISCOUNT_TYPE_OPTIONS}
            />
            <Input
              label="Porcentaje (%)"
              type="number"
              min="1"
              max="100"
              value={form.percentage}
              onChange={(e) => setField("percentage", e.target.value)}
              placeholder="Ej: 15"
              required
            />
          </div>

          <div>
            <DropdownSelect
              label="Campaña asociada (opcional)"
              value={form.campaignId || ""}
              onChange={handleCampaignChange}
              options={campaignOptions}
              placeholder="Sin campaña — Descuento Base"
            />
          </div>

          {currentCampaign ? (
            <div className="flex items-center gap-2 p-3 text-sm font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <Calendar className="w-4 h-4 shrink-0" />
              <span>
                Sincronizado con la campaña{" "}
                <strong>{currentCampaign.name}</strong>. Las fechas y activación
                se gestionan automáticamente.
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 p-3 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)]/40 border border-[var(--color-border)] rounded-xl">
              <Layers className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" />
              <span>
                <strong>Descuento Base:</strong> Permanecerá activo en la tienda
                sin depender de ninguna campaña.
              </span>
            </div>
          )}

          {/* Categorías con FastSearch */}
          {form.type === "category" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Categorías participantes ({form.categoryIds?.length || 0})
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setCategorySearchOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar categoría
                </Button>
              </div>

              {form.categoryIds && form.categoryIds.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)]">
                  {form.categoryIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-2xs"
                    >
                      <FolderTree className="w-3 h-3 text-[var(--color-primary-text)]" />
                      <span>
                        {selectedItemLabels[`category-${id}`] ||
                          `Categoría #${id}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveResource(id, "category")}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)] italic p-3 rounded-lg border border-dashed border-[var(--color-border)] text-center">
                  Sin categorías seleccionadas. Hacé clic en &quot;Agregar
                  categoría&quot; para buscar.
                </p>
              )}
            </div>
          )}

          {/* Productos con FastSearch */}
          {form.type === "products" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Productos participantes ({form.productIds?.length || 0})
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => setProductSearchOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar producto
                </Button>
              </div>

              {form.productIds && form.productIds.length > 0 ? (
                <div className="flex flex-wrap gap-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] max-h-48 overflow-y-auto">
                  {form.productIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] border border-[var(--color-border)] shadow-2xs"
                    >
                      <Package className="w-3 h-3 text-[var(--color-primary-text)]" />
                      <span>
                        {selectedItemLabels[`product-${id}`] ||
                          `Producto #${id}`}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveResource(id, "product")}
                        className="hover:text-red-500 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-muted)] italic p-3 rounded-lg border border-dashed border-[var(--color-border)] text-center">
                  Sin productos seleccionados. Hacé clic en &quot;Agregar
                  producto&quot; para buscar.
                </p>
              )}
            </div>
          )}

          {/* Rango de precio */}
          {form.type === "price_range" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Precio mínimo ($)"
                type="number"
                min="0"
                value={form.min}
                onChange={(e) => setField("min", e.target.value)}
                placeholder="0"
              />
              <Input
                label="Precio máximo ($)"
                type="number"
                min="0"
                value={form.max}
                onChange={(e) => setField("max", e.target.value)}
                placeholder="Sin límite"
              />
            </div>
          )}

          {/* Total de carrito */}
          {form.type === "cart_total" && (
            <div className="space-y-4">
              <Input
                label="Monto mínimo del carrito ($)"
                type="number"
                min="0"
                value={form.minAmount}
                onChange={(e) => setField("minAmount", e.target.value)}
                placeholder="50000"
                required
              />
              <label className="flex items-start gap-2.5 text-sm text-[var(--color-text-secondary)] cursor-pointer">
                <Checkbox
                  checked={form.countDiscounted}
                  onChange={(e) =>
                    setField("countDiscounted", e.target.checked)
                  }
                  className="mt-0.5"
                />
                <span>
                  Los productos ya rebajados cuentan para el monto mínimo y
                  reciben este descuento acumulado.
                </span>
              </label>
            </div>
          )}

          {/* Fechas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Fecha y hora de inicio"
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => handleDateChange("startAt", e.target.value)}
              disabled={Boolean(form.campaignId)}
              required={!form.campaignId}
            />
            <Input
              label="Fecha y hora de fin (opcional)"
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => handleDateChange("endAt", e.target.value)}
              disabled={Boolean(form.campaignId)}
            />
          </div>

          <DropdownSelect
            label="Estado"
            value={form.status}
            onChange={(val) => setField("status", val)}
            options={DISCOUNT_STATUS_OPTIONS}
          />

          <div className="flex gap-3 justify-end pt-3 border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={validateAndSave} disabled={saving}>
              {saving ? "Guardando..." : "Guardar descuento"}
            </Button>
          </div>
        </div>
      </Modal>

      <FastSearchModal
        open={categorySearchOpen}
        onClose={() => setCategorySearchOpen(false)}
        scope="categories"
        lockScope={true}
        onSelect={(item) => handleSelectResource(item, "category")}
      />

      <FastSearchModal
        open={productSearchOpen}
        onClose={() => setProductSearchOpen(false)}
        scope="products"
        lockScope={true}
        onSelect={(item) => handleSelectResource(item, "product")}
      />
    </>
  );
}
