// @ts-nocheck
"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useCampaigns } from "@/hooks/admin-useCampaigns";
import { useCategories } from "@/hooks/admin-useCategories";
import { useProducts } from "@/hooks/admin-useProducts";
import { Button, Input, Select, Modal, Checkbox } from "@/components/ui";
import {
  DISCOUNT_TYPE_OPTIONS,
  DISCOUNT_STATUS_OPTIONS,
  DISCOUNT_MESSAGES,
} from "@/constants/discounts";
import { toLocalDatetimeInput } from "@/utils/date";

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
  const { categories } = useCategories();
  const { products } = useProducts({ limit: 1000 });
  const [productSearch, setProductSearch] = useState("");

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const term = productSearch.toLowerCase();
    return products.filter((p) => p.name?.toLowerCase().includes(term));
  }, [products, productSearch]);

  const handleCampaignChange = (campaignIdStr: string) => {
    setField("campaignId", campaignIdStr);

    if (campaignIdStr) {
      const selectedCamp = campaigns.find(
        (c) => String(c.id) === String(campaignIdStr),
      );
      if (selectedCamp) {
        // Si no tenía fechas manuales o las quiere sincronizar con la campaña
        if (selectedCamp.startsAt && !form.startAt) {
          setField("startAt", toLocalDatetimeInput(selectedCamp.startsAt));
        }
        if (selectedCamp.endsAt && !form.endAt) {
          setField("endAt", toLocalDatetimeInput(selectedCamp.endsAt));
        }
      }
    }
  };

  const validateAndSave = () => {
    if (!form.name.trim()) {
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

    if (!form.startAt) {
      Alert.fire({
        message: DISCOUNT_MESSAGES.START_DATE_REQUIRED,
        type: "warning",
      });
      return;
    }

    if (form.endAt && new Date(form.endAt) < new Date(form.startAt)) {
      Alert.fire({
        message: DISCOUNT_MESSAGES.END_DATE_INVALID,
        type: "warning",
      });
      return;
    }

    if (form.type === "category" && form.categoryIds.length === 0) {
      Alert.fire({
        message: DISCOUNT_MESSAGES.CATEGORIES_REQUIRED,
        type: "warning",
      });
      return;
    }

    if (form.type === "products" && form.productIds.length === 0) {
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
          <Select
            label="Tipo de descuento"
            value={form.type}
            onChange={(e) => setField("type", e.target.value)}
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

        {/* Selector de Campaña Asociada */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Campaña asociada (opcional)
          </label>
          <select
            value={form.campaignId || ""}
            onChange={(e) => handleCampaignChange(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
          >
            <option value="">Ninguna (Permanente / General)</option>
            {campaigns.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Condicional: Por Categoría */}
        {form.type === "category" && (
          <div>
            <span className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Categorías participantes
            </span>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] p-3 space-y-1.5">
              {categories.map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2.5 text-sm text-[var(--color-text-primary)] cursor-pointer py-1 hover:opacity-80 transition-opacity"
                >
                  <Checkbox
                    checked={form.categoryIds.includes(c.id)}
                    onChange={() => toggleId("categoryIds", c.id)}
                  />
                  <span>{c.name}</span>
                </label>
              ))}
              {categories.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)] italic py-2 text-center">
                  No hay categorías disponibles
                </p>
              )}
            </div>
          </div>
        )}

        {/* Condicional: Rango de Precio */}
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

        {/* Condicional: Por Productos */}
        {form.type === "products" && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                Productos seleccionados ({form.productIds.length})
              </span>
            </div>
            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
              <input
                type="text"
                placeholder="Buscar producto por nombre..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-base)] p-3 space-y-1.5">
              {filteredProducts.map((p) => (
                <label
                  key={p.id}
                  className="flex items-center gap-2.5 text-sm text-[var(--color-text-primary)] cursor-pointer py-1 hover:opacity-80 transition-opacity"
                >
                  <Checkbox
                    checked={form.productIds.includes(p.id)}
                    onChange={() => toggleId("productIds", p.id)}
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              ))}
              {filteredProducts.length === 0 && (
                <p className="text-xs text-[var(--color-text-muted)] italic py-2 text-center">
                  No se encontraron productos
                </p>
              )}
            </div>
          </div>
        )}

        {/* Condicional: Total de Carrito */}
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
                onChange={(e) => setField("countDiscounted", e.target.checked)}
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
            onChange={(e) => setField("startAt", e.target.value)}
            required
          />
          <Input
            label="Fecha y hora de fin (opcional)"
            type="datetime-local"
            value={form.endAt}
            onChange={(e) => setField("endAt", e.target.value)}
          />
        </div>

        <Select
          label="Estado"
          value={form.status}
          onChange={(e) => setField("status", e.target.value)}
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
  );
}
