// @ts-nocheck
"use client";

import { useState, useEffect, useMemo } from "react";
import { useAlert } from "@/context/AlertContext";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import {
  Plus,
  Trash2,
  Percent,
  Calendar,
  Edit,
  Lock,
  Layers,
  ArrowRight,
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
import { OverlapsAlert } from "@/components/ui/OverlapsAlert";

// Prioridad operativa idéntica a campañas: En curso -> Programados -> Borradores -> Archivados/Finalizados
const calculateSortWeight = (d: any): number => {
  if (d.status === "archived") return 4;
  if (d.status === "draft") return 3;
  if (d.status === "active") {
    const now = new Date();
    const start = d.campaign?.startsAt
      ? new Date(d.campaign.startsAt)
      : d.startAt
        ? new Date(d.startAt)
        : null;
    const end = d.campaign?.endsAt
      ? new Date(d.campaign.endsAt)
      : d.endAt
        ? new Date(d.endAt)
        : null;

    if (start && start > now) return 2; // Programado
    if (end && end < now) return 4; // Vencido
    return 1; // En curso
  }
  return 5;
};

const getTimingStatus = (d: any) => {
  const now = new Date();
  const start = d.campaign?.startsAt
    ? new Date(d.campaign.startsAt)
    : d.startAt
      ? new Date(d.startAt)
      : null;
  const end = d.campaign?.endsAt
    ? new Date(d.campaign.endsAt)
    : d.endAt
      ? new Date(d.endAt)
      : null;

  if (start && start > now) return "upcoming";
  if (end && end < now) return "ended";
  return "running";
};

export default function DiscountsPage() {
  const Alert = useAlert();
  const { confirmLeave } = useUnsavedChanges();

  const [discounts, setDiscounts] = useState([]);
  const [overlaps, setOverlaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_DISCOUNT_FORM);
  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "draft" | "archived"
  >("all");

  const refetch = async () => {
    try {
      const { data } = await api.get("/admin/discounts");
      setDiscounts(data.discounts || data || []);
      if (data.overlaps) {
        setOverlaps(data.overlaps);
      } else {
        const ovRes = await api
          .get("/admin/discounts/overlaps")
          .catch(() => ({ data: [] }));
        setOverlaps(ovRes.data || []);
      }
    } catch (err) {
      console.error("Error al cargar descuentos:", err);
    }
  };

  useEffect(() => {
    refetch().finally(() => setLoading(false));
  }, []);

  const filteredDiscounts = useMemo(() => {
    const list =
      activeTab === "all"
        ? [...discounts]
        : discounts.filter((d) => d.status === activeTab);

    return list.sort((a, b) => {
      const weightA = calculateSortWeight(a);
      const weightB = calculateSortWeight(b);
      if (weightA !== weightB) return weightA - weightB;

      const dateA = a.campaign?.startsAt || a.startAt;
      const dateB = b.campaign?.startsAt || b.startAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [discounts, activeTab]);

  const counts = useMemo(
    () => ({
      all: discounts.length,
      active: discounts.filter((d) => d.status === "active").length,
      draft: discounts.filter((d) => d.status === "draft").length,
      archived: discounts.filter((d) => d.status === "archived").length,
    }),
    [discounts],
  );

  const openNew = () => {
    setEditingId("new");
    setForm({
      ...EMPTY_DISCOUNT_FORM,
      status: "draft",
      campaignId: "",
      startAt: toLocalDatetimeInput(new Date().toISOString()),
      endAt: "",
    });
  };

  const openEdit = (d) => {
    if (d.status === "archived") return;
    setEditingId(d.id);

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
    }
  };

  const setField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleId = (key, id) => {
    setForm((prev) => {
      const list = prev[key] || [];
      return {
        ...prev,
        [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id],
      };
    });
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
    if (!form.name?.trim()) {
      Alert.fire({
        message: "El nombre del descuento es requerido",
        type: "warning",
      });
      return;
    }

    if (form.endAt && new Date(form.endAt) <= new Date(form.startAt)) {
      Alert.fire({
        message: "La fecha de fin debe ser posterior a la fecha de inicio.",
        type: "warning",
      });
      return;
    }

    const payload = {
      name: form.name.trim(),
      type: form.type,
      percentage: Number(form.percentage),
      status: form.status,
      campaignId: form.campaignId ? Number(form.campaignId) : null,
      startAt: form.startAt
        ? new Date(form.startAt).toISOString()
        : new Date().toISOString(),
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
    if (d.status === "archived") {
      Alert.fire({
        message: "Los descuentos archivados no pueden conmutarse directamente.",
        type: "warning",
      });
      return;
    }

    const next = d.status === "active" ? "draft" : "active";
    setTogglingId(d.id);
    try {
      await api.patch(`/admin/discounts/${d.id}/status`, { status: next });
      await refetch();
    } catch (err) {
      Alert.fire({
        message: err.response?.data?.error || DISCOUNT_MESSAGES.STATUS_ERROR,
        type: "error",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const renderTimingBadge = (d: any) => {
    const timing = getTimingStatus(d);
    switch (timing) {
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En curso
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Programado
          </span>
        );
      case "ended":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Finalizado
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Descuentos y Promociones
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Creá reglas de descuento globales, por categoría o asociadas a
            campañas especiales.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="w-4 h-4" /> Nuevo descuento
        </Button>
      </div>

      {/* Alerta de solapamiento */}
      <OverlapsAlert overlaps={overlaps} />

      {/* Pestañas de estado */}
      <div className="flex border-b border-[var(--color-border)] gap-6 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "all"
              ? "border-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Todos ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("active")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "active"
              ? "border-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Activos ({counts.active})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("draft")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "draft"
              ? "border-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Borradores ({counts.draft})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("archived")}
          className={`pb-3 border-b-2 transition-colors cursor-pointer ${
            activeTab === "archived"
              ? "border-[var(--color-primary)] text-[var(--color-primary-text)] font-semibold"
              : "border-transparent text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          Archivados ({counts.archived})
        </button>
      </div>

      {/* Tabla Principal */}
      <div className="relative min-h-[220px] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xs">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-bg-base)]/60 backdrop-blur-xs">
            <Spinner size="lg" />
          </div>
        )}

        {filteredDiscounts.length === 0 && !loading ? (
          <div className="text-center py-16 px-4">
            <Percent className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2 opacity-60" />
            <p className="font-medium text-[var(--color-text-primary)]">
              No hay descuentos en esta sección
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Los descuentos creados o programados aparecerán aquí según su
              estado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--color-text-primary)]">
              <thead className="bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Descuento
                  </th>{" "}
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Campaña asociada
                  </th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Porcentaje & Tipo
                  </th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Vigencia
                  </th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Tiempo
                  </th>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Estado
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3.5 font-semibold text-right"
                  >
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredDiscounts.map((d) => {
                  const isArchived = d.status === "archived";
                  const isActive = d.status === "active";
                  const effectiveStart = d.campaign?.startsAt || d.startAt;
                  const effectiveEnd = d.campaign?.endsAt || d.endAt;

                  return (
                    <tr
                      key={d.id}
                      className="hover:bg-[var(--color-bg-surface)]/50 transition-colors"
                    >
                      {/* Identificación */}
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                            {d.name}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 mt-1">
                          {d.campaign ? (
                            <span
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md"
                              style={{
                                backgroundColor: `${d.campaign.color || "#6366f1"}15`,
                                color: d.campaign.color || "#6366f1",
                              }}
                            >
                              <Calendar className="w-4 h-4" />
                              {d.campaign.name}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                              <Layers className="w-6 h-6" />
                              Descuento Independiente
                            </span>
                          )}
                        </div>
                      </td>
                      {/* Porcentaje y Tipo */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-[var(--color-primary)]/10 text-[var(--color-primary-text)] border border-[var(--color-primary)]/20">
                            {d.percentage}% OFF
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)]">
                            {DISCOUNT_TYPE_LABELS[d.type] || d.type}
                          </span>
                        </div>
                      </td>

                      {/* Vigencia */}
                      <td className="px-6 py-4 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-[var(--color-text-muted)]" />
                            {formatDateLocale(effectiveStart)}
                          </span>
                          <span className="flex items-center text-[var(--color-text-muted)] gap-1.5 pl-2.5">
                            <ArrowRight className="w-3 h-3" />
                            {effectiveEnd
                              ? formatDateLocale(effectiveEnd)
                              : "Sin fecha límite"}
                          </span>
                        </div>
                      </td>

                      {/* Timing Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderTimingBadge(d)}
                      </td>

                      {/* Estado / Toggle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-500 border border-zinc-500/30">
                            <Lock className="w-3 h-3" />
                            Archivado
                          </span>
                        ) : (
                          (() => {
                            // 🔒 Verificamos si la campaña padre está en borrador
                            const isCampaignDraft =
                              d.campaign && d.campaign.status === "draft";
                            const isDisabled =
                              togglingId === d.id || isCampaignDraft;

                            return (
                              <button
                                type="button"
                                onClick={() => handleToggle(d)}
                                disabled={isDisabled}
                                title={
                                  isCampaignDraft
                                    ? `La campaña "${d.campaign.name}" está en borrador. Activá la campaña para poder activar este descuento.`
                                    : undefined
                                }
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors w-[96px] justify-center ${
                                  isCampaignDraft
                                    ? "opacity-40 cursor-not-allowed bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                                    : isActive
                                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer disabled:opacity-50"
                                      : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer disabled:opacity-50"
                                }`}
                              >
                                {togglingId === d.id ? (
                                  <Spinner size="sm" />
                                ) : (
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      isActive
                                        ? "bg-emerald-500"
                                        : "bg-amber-500"
                                    }`}
                                  />
                                )}
                                {isActive ? "Activo" : "Borrador"}
                              </button>
                            );
                          })()
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(d)}
                            disabled={isArchived}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isArchived
                                ? "text-[var(--color-text-muted)] opacity-30 cursor-not-allowed"
                                : "text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)] cursor-pointer"
                            }`}
                            title={
                              isArchived
                                ? "Archivado (solo lectura)"
                                : "Editar descuento"
                            }
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(d)}
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Eliminar descuento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Descuento */}
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
