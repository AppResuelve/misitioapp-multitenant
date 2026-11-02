// @ts-nocheck
"use client";

import { useState, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Tag,
  Megaphone,
  Lock,
} from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useCampaigns, Campaign } from "@/hooks/admin-useCampaigns";
import { Button, Spinner } from "@/components/ui";
import { CAMPAIGN_MESSAGES } from "@/constants/campaigns";
import { CampaignModal } from "@/components/admin/campaigns/CampaignModal";

const formatDateDisplay = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

// Prioridad operativa real: En curso primero, luego próximas, luego borradores y finalmente archivadas/finalizadas
const calculateSortWeight = (camp: Campaign): number => {
  if (camp.status === "archived") return 4;
  if (camp.status === "draft") return 3;
  if (camp.status === "active") {
    if (camp.timingStatus === "running") return 1;
    if (camp.timingStatus === "upcoming") return 2;
    return 4; // active pero ended
  }
  return 5;
};

export default function CampaignsPage() {
  const {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    toggleCampaignStatus,
  } = useCampaigns();

  const { confirmLeave } = useUnsavedChanges();
  const Alert = useAlert();

  const [activeTab, setActiveTab] = useState<
    "all" | "active" | "draft" | "archived"
  >("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  // Filtrado y ordenamiento reactivo por vigencia operativa
  const filteredCampaigns = useMemo(() => {
    const list =
      activeTab === "all"
        ? [...campaigns]
        : campaigns.filter((c) => c.status === activeTab);

    return list.sort((a, b) => {
      const weightA = calculateSortWeight(a);
      const weightB = calculateSortWeight(b);
      if (weightA !== weightB) return weightA - weightB;

      // Desempate: la fecha de inicio más reciente primero
      return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
    });
  }, [campaigns, activeTab]);

  const counts = useMemo(
    () => ({
      all: campaigns.length,
      active: campaigns.filter((c) => c.status === "active").length,
      draft: campaigns.filter((c) => c.status === "draft").length,
      archived: campaigns.filter((c) => c.status === "archived").length,
    }),
    [campaigns],
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (campaign: Campaign) => {
    if (campaign.status === "archived") return;
    setEditing(campaign);
    setModalOpen(true);
  };

  const closeModal = async () => {
    if (await confirmLeave()) {
      setModalOpen(false);
      setEditing(null);
    }
  };

  const handleSave = async (payload: any) => {
    if (new Date(payload.endsAt) <= new Date(payload.startsAt)) {
      Alert.fire({
        message: CAMPAIGN_MESSAGES.INVALID_DATE_RANGE,
        type: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await updateCampaign(editing.id, payload);
        Alert.fire({
          message: CAMPAIGN_MESSAGES.UPDATE_SUCCESS,
          type: "success",
          duration: 1500,
        });
      } else {
        await createCampaign(payload);
        Alert.fire({
          message: CAMPAIGN_MESSAGES.CREATE_SUCCESS,
          type: "success",
          duration: 1500,
        });
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        CAMPAIGN_MESSAGES.SAVE_ERROR;
      Alert.fire({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (campaign: Campaign) => {
    if (campaign.status === "archived") {
      Alert.fire({
        message:
          "Las campañas archivadas no pueden ser reactivadas directamente.",
        type: "warning",
      });
      return;
    }

    const now = new Date();
    if (new Date(campaign.endsAt) <= now) {
      Alert.fire({
        message:
          "Esta campaña ya superó su fecha de fin. Para activarla, edita sus fechas primero.",
        type: "warning",
      });
      return;
    }

    setTogglingId(campaign.id);
    try {
      await toggleCampaignStatus(campaign.id);
    } catch (err: any) {
      Alert.fire({
        message: err.response?.data?.error || CAMPAIGN_MESSAGES.STATUS_ERROR,
        type: "error",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (campaign: Campaign) => {
    const result = await Alert.fire({
      title: CAMPAIGN_MESSAGES.DELETE_CONFIRM_TITLE,
      message: CAMPAIGN_MESSAGES.DELETE_CONFIRM_TEXT(campaign.name),
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteCampaign(campaign.id);
      Alert.fire({
        message: CAMPAIGN_MESSAGES.DELETE_SUCCESS,
        type: "success",
      });
    } catch (err: any) {
      Alert.fire({
        message: CAMPAIGN_MESSAGES.DELETE_ERROR,
        type: "error",
      });
    }
  };

  const renderTimingBadge = (timing?: string) => {
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
            Programada
          </span>
        );
      case "ended":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Finalizada
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
            Campañas y Eventos
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Programá fechas especiales para sincronizar descuentos y banners
            temáticos automáticamente.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nueva Campaña
        </Button>
      </div>

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
          Todas ({counts.all})
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
          Activas ({counts.active})
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
          Archivadas ({counts.archived})
        </button>
      </div>

      {/* Contenedor Principal: Tabla */}
      <div className="relative min-h-[220px] bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl overflow-hidden shadow-xs">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-bg-base)]/60 backdrop-blur-xs">
            <Spinner size="lg" />
          </div>
        )}

        {filteredCampaigns.length === 0 && !loading ? (
          <div className="text-center py-16 px-4">
            <Megaphone className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2 opacity-60" />
            <p className="font-medium text-[var(--color-text-primary)]">
              No hay campañas en esta sección
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Las campañas creadas aparecerán aquí según su estado.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-[var(--color-text-primary)]">
              <thead className="bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)] uppercase tracking-wider">
                <tr>
                  <th scope="col" className="px-6 py-3.5 font-semibold">
                    Campaña
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
                {filteredCampaigns.map((camp) => {
                  const isArchived = camp.status === "archived";

                  return (
                    <tr
                      key={camp.id}
                      className="hover:bg-[var(--color-bg-surface)]/50 transition-colors"
                    >
                      {/* Identificación */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-3.5 h-3.5 rounded-full shrink-0 ring-4 ring-[var(--color-bg-elevated)]"
                            style={{ backgroundColor: camp.color || "#6366f1" }}
                            title={`Color: ${camp.color}`}
                          />
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-[var(--color-text-primary)] truncate">
                              {camp.name}
                            </p>
                            <span className="flex items-center gap-1 text-xs text-[var(--color-text-muted)] mt-0.5">
                              <Tag className="w-3 h-3" />/{camp.slug}
                            </span>
                            {camp.description && (
                              <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-1 max-w-xs">
                                {camp.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Fechas */}
                      <td className="px-6 py-4 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-[var(--color-text-muted)]" />
                            {formatDateDisplay(camp.startsAt)}
                          </span>
                          <span className="text-[var(--color-text-muted)] pl-4.5">
                            → {formatDateDisplay(camp.endsAt)}
                          </span>
                        </div>
                      </td>

                      {/* Timing Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderTimingBadge(camp.timingStatus)}
                      </td>

                      {/* Estado / Toggle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isArchived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-500 border border-zinc-500/30">
                            <Lock className="w-3 h-3" />
                            Archivada
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(camp)}
                            disabled={togglingId === camp.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 w-[96px] justify-center ${
                              camp.status === "active"
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                            }`}
                          >
                            {togglingId === camp.id ? (
                              <Spinner size="sm" />
                            ) : (
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  camp.status === "active"
                                    ? "bg-emerald-500"
                                    : "bg-amber-500"
                                }`}
                              />
                            )}
                            {camp.status === "active" ? "Activa" : "Borrador"}
                          </button>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(camp)}
                            disabled={isArchived}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isArchived
                                ? "text-[var(--color-text-muted)] opacity-30 cursor-not-allowed"
                                : "text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)] cursor-pointer"
                            }`}
                            title={
                              isArchived
                                ? "Campaña archivada (no editable)"
                                : "Editar campaña"
                            }
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDelete(camp)}
                            className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Eliminar campaña"
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

      {/* Modal de Campaña */}
      <CampaignModal
        open={modalOpen}
        onClose={closeModal}
        onSave={handleSave}
        editing={editing}
        saving={saving}
      />
    </div>
  );
}
