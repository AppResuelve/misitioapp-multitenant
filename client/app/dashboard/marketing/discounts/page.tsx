// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useAlert } from "@/context/AlertContext";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import {
  Plus,
  Trash2,
  Percent,
  Calendar,
  Eye,
  EyeOff,
  AlertTriangle,
  Megaphone,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import DiscountModal from "@/components/admin/discounts/DiscountModal";
import api from "@/services/admin-api";
import {
  DISCOUNT_TYPE_LABELS,
  EMPTY_DISCOUNT_FORM,
  DISCOUNT_MESSAGES,
} from "@/constants/discounts";
import { toLocalDatetimeInput, formatDateLocale } from "@/utils/date";

function getDiscountState(d) {
  if (d.status === "draft") {
    return {
      key: "draft",
      label: "Borrador",
      cls: "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
    };
  }
  const now = new Date();
  const start = d.startAt ? new Date(d.startAt) : null;
  const end = d.endAt ? new Date(d.endAt) : null;

  if (start && start > now) {
    return {
      key: "scheduled",
      label: "Programado",
      cls: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
    };
  }
  if (end && end < now) {
    return {
      key: "expired",
      label: "Vencido",
      cls: "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20",
    };
  }
  return {
    key: "active",
    label: "Activo",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  };
}

export default function DiscountsPage() {
  const Alert = useAlert();
  const { setIsDirty, confirmLeave } = useUnsavedChanges();

  const [discounts, setDiscounts] = useState([]);
  const [overlaps, setOverlaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_DISCOUNT_FORM);

  const refetch = async () => {
    try {
      const { data } = await api.get("/admin/discounts");
      setDiscounts(data.discounts || []);
      setOverlaps(data.overlaps || []);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    refetch().finally(() => setLoading(false));
  }, []);

  const openNew = () => {
    setEditingId("new");
    setIsDirty(false);
    setForm({
      ...EMPTY_DISCOUNT_FORM,
      campaignId: "",
      startAt: toLocalDatetimeInput(new Date().toISOString()),
    });
  };

  const openEdit = (d) => {
    setEditingId(d.id);
    setIsDirty(false);
    setForm({
      name: d.name,
      type: d.type,
      percentage: String(d.percentage ?? ""),
      status: d.status,
      campaignId: d.campaignId ? String(d.campaignId) : "",
      startAt: d.startAt ? toLocalDatetimeInput(d.startAt) : "",
      endAt: d.endAt ? toLocalDatetimeInput(d.endAt) : "",
      categoryIds: d.config?.categoryIds || [],
      productIds: d.config?.productIds || [],
      min: d.config?.min != null ? String(d.config.min) : "",
      max: d.config?.max != null ? String(d.config.max) : "",
      minAmount: d.config?.minAmount != null ? String(d.config.minAmount) : "",
      countDiscounted: !!d.config?.countDiscounted,
    });
  };

  const closeForm = async () => {
    if (await confirmLeave()) {
      setEditingId(null);
      setForm(EMPTY_DISCOUNT_FORM);
      setIsDirty(false);
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const toggleId = (key, id) => {
    setForm((prev) => {
      const list = prev[key] || [];
      return {
        ...prev,
        [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
      };
    });
    setIsDirty(true);
  };

  const buildConfig = () => {
    switch (form.type) {
      case "category":
        return { categoryIds: form.categoryIds.map(Number) };
      case "price_range":
        return {
          min: form.min ? Number(form.min) : 0,
          max: form.max ? Number(form.max) : null,
        };
      case "products":
        return { productIds: form.productIds.map(Number) };
      case "cart_total":
        return {
          minAmount: Number(form.minAmount) || 0,
          countDiscounted: !!form.countDiscounted,
        };
      default:
        return {};
    }
  };

  const handleSave = async () => {
    const payload = {
      name: form.name.trim(),
      type: form.type,
      percentage: Number(form.percentage),
      status: form.status,
      campaignId: form.campaignId ? Number(form.campaignId) : null,
      startAt: new Date(form.startAt).toISOString(),
      endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      config: buildConfig(),
    };

    setSaving(true);
    try {
      if (editingId === "new") {
        await api.post("/admin/discounts", payload);
      } else {
        await api.put(`/admin/discounts/${editingId}`, payload);
      }

      Alert.fire({
        message:
          editingId === "new"
            ? DISCOUNT_MESSAGES.SAVE_SUCCESS_NEW
            : DISCOUNT_MESSAGES.SAVE_SUCCESS_EDIT,
        type: "success",
        duration: 1500,
      });
      setIsDirty(false);
      setEditingId(null);
      refetch();
    } catch (err) {
      Alert.fire({
        message:
          err.response?.data?.error ||
          err.response?.data?.message ||
          DISCOUNT_MESSAGES.SAVE_ERROR,
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (d) => {
    const result = await Alert.fire({
      title: DISCOUNT_MESSAGES.DELETE_CONFIRM_TITLE,
      message: DISCOUNT_MESSAGES.DELETE_CONFIRM_TEXT(d.name),
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/admin/discounts/${d.id}`);
      Alert.fire({
        message: DISCOUNT_MESSAGES.DELETE_SUCCESS,
        type: "success",
      });
      refetch();
    } catch {
      Alert.fire({ message: DISCOUNT_MESSAGES.DELETE_ERROR, type: "error" });
    }
  };

  const handleToggle = async (d) => {
    const next = d.status === "active" ? "draft" : "active";
    try {
      await api.patch(`/admin/discounts/${d.id}/status`, { status: next });
      refetch();
    } catch {
      Alert.fire({ message: DISCOUNT_MESSAGES.STATUS_ERROR, type: "error" });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Descuentos
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Creá descuentos por tipo y programá su duración
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" /> Nuevo descuento
        </Button>
      </div>

      {/* Alerta de solapamiento */}
      {overlaps.length > 0 && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 transition-colors">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Productos con más de un descuento aplicado
          </div>
          <div className="space-y-1.5 pl-6">
            {overlaps.map((o) => (
              <p
                key={o.productId}
                className="text-sm text-amber-900/90 dark:text-amber-200/90"
              >
                <span className="font-semibold">{o.name}</span>:{" "}
                {o.discounts
                  .map((d) => `${d.name} (${d.percentage}%)`)
                  .join(" + ")}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Lista de descuentos */}
      <div className="space-y-3">
        {discounts.map((d) => {
          const state = getDiscountState(d);
          return (
            <div
              key={d.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-5 transition-colors shadow-xs"
            >
              <div className="flex items-start sm:items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-base text-[var(--color-text-primary)]">
                      {d.name}
                    </h3>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${state.cls}`}
                    >
                      {state.label}
                    </span>

                    {/* Badge de Campaña si está vinculada */}
                    {d.campaign && (
                      <span
                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-medium"
                        style={{
                          backgroundColor: `${d.campaign.color || "#6366f1"}15`,
                          color: d.campaign.color || "#6366f1",
                        }}
                      >
                        <Megaphone className="w-3 h-3" />
                        {d.campaign.name}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mt-1.5 text-sm">
                    <span className="text-[var(--color-primary-text)] font-bold">
                      {d.percentage}% OFF
                    </span>
                    <span className="text-[var(--color-text-muted)]">•</span>
                    <span className="text-[var(--color-text-secondary)]">
                      {DISCOUNT_TYPE_LABELS[d.type] || d.type}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--color-text-muted)]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {formatDateLocale(d.startAt)} →{" "}
                      {d.endAt ? formatDateLocale(d.endAt) : "Sin fecha límite"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEdit(d)}
                  >
                    Editar
                  </Button>
                  <button
                    type="button"
                    onClick={() => handleToggle(d)}
                    title={
                      d.status === "active" ? "Pasar a borrador" : "Publicar"
                    }
                    className="p-2 text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] rounded-lg hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer"
                  >
                    {d.status === "active" ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(d)}
                    className="p-2 text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-500/10 transition-colors cursor-pointer"
                    title="Eliminar descuento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {discounts.length === 0 && (
          <div className="text-center py-16 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]/30">
            <Percent className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-3 opacity-60" />
            <p className="font-medium text-[var(--color-text-primary)]">
              No hay descuentos creados
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Creá descuentos globales, por categoría, por precio o por
              producto.
            </p>
          </div>
        )}
      </div>

      {/* Modal Abstraído */}
      <DiscountModal
        open={Boolean(editingId)}
        onClose={closeForm}
        form={form}
        setField={setField}
        toggleId={toggleId}
        onSave={handleSave}
        saving={saving}
        isEditing={editingId !== "new"}
      />
    </div>
  );
}
