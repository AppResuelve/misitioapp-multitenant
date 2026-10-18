// @ts-nocheck
"use client";

import { useState } from "react";
import { Plus, Edit, Trash2, Calendar, Tag, Megaphone } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useCampaigns, Campaign } from "@/hooks/admin-useCampaigns";
import { Button, Input, Modal, Spinner } from "@/components/ui";
import { slugify } from "@/utils/slugify";
import { CAMPAIGN_MESSAGES } from "@/constants/campaigns";
import { COLOR_PALETTE } from "@/constants/colors";

const formatDateInput = (dateStr?: string | null) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
};

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

export default function CampaignsPage() {
  const {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    toggleCampaignStatus,
  } = useCampaigns();

  const { setIsDirty, confirmLeave } = useUnsavedChanges();
  const Alert = useAlert();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [color, setColor] = useState(COLOR_PALETTE[0] || "#6366f1");
  const [slugManual, setSlugManual] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const resetForm = () => {
    setName("");
    setSlug("");
    setDescription("");
    setStartsAt("");
    setEndsAt("");
    setColor(COLOR_PALETTE[0] || "#6366f1");
    setSlugManual(false);
    setEditing(null);
    setIsDirty(false);
  };

  const openCreate = () => {
    resetForm();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartsAt(formatDateInput(now.toISOString()));
    setEndsAt(formatDateInput(nextWeek.toISOString()));
    setModalOpen(true);
  };

  const openEdit = (campaign: Campaign) => {
    setEditing(campaign);
    setName(campaign.name);
    setSlug(campaign.slug);
    setDescription(campaign.description || "");
    setStartsAt(formatDateInput(campaign.startsAt));
    setEndsAt(formatDateInput(campaign.endsAt));
    setColor(campaign.color || COLOR_PALETTE[0] || "#6366f1");
    setSlugManual(true);
    setIsDirty(false);
    setModalOpen(true);
  };

  const closeModal = async () => {
    if (await confirmLeave()) {
      setModalOpen(false);
      resetForm();
    }
  };

  const handleNameChange = (val: string) => {
    setName(val);
    setIsDirty(true);
    if (!slugManual) {
      setSlug(slugify(val));
    }
  };

  const handleSlugChange = (val: string) => {
    setSlug(val);
    setSlugManual(true);
    setIsDirty(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      Alert.fire({ message: CAMPAIGN_MESSAGES.NAME_REQUIRED, type: "warning" });
      return;
    }

    if (!startsAt || !endsAt) {
      Alert.fire({
        message: CAMPAIGN_MESSAGES.DATES_REQUIRED,
        type: "warning",
      });
      return;
    }

    if (new Date(endsAt) <= new Date(startsAt)) {
      Alert.fire({
        message: CAMPAIGN_MESSAGES.INVALID_DATE_RANGE,
        type: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        slug: slug.trim() || slugify(name),
        description: description.trim() || null,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
        color,
      };

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
      resetForm();
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
    setTogglingId(campaign.id);
    try {
      await toggleCampaignStatus(campaign.id);
    } catch (err: any) {
      Alert.fire({
        message: CAMPAIGN_MESSAGES.STATUS_ERROR,
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
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            En curso
          </span>
        );
      case "upcoming":
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Programada
          </span>
        );
      case "ended":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
            Finalizada
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Campañas y Eventos
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Definí las fechas de Hot Sale, Cyber Monday o fechas especiales para
            sincronizar banners y descuentos.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="w-4 h-4" />
          Nueva Campaña
        </Button>
      </div>

      <div className="relative min-h-[220px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-bg-base)]/60 backdrop-blur-xs">
            <Spinner size="lg" />
          </div>
        )}

        <div className="space-y-3">
          {campaigns.length === 0 && !loading ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]/30">
              <Megaphone className="w-8 h-8 text-[var(--color-text-muted)] mx-auto mb-2 opacity-60" />
              <p className="font-medium text-[var(--color-text-primary)]">
                No hay campañas configuradas
              </p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Creá tu primera campaña para agrupar promociones y banners por
                fecha.
              </p>
            </div>
          ) : (
            campaigns.map((camp) => (
              <div
                key={camp.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] hover:border-[var(--color-border-hover)] rounded-xl transition-all shadow-xs"
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  <div
                    className="w-3.5 h-3.5 rounded-full mt-1 shrink-0 ring-4 ring-[var(--color-bg-elevated)]"
                    style={{ backgroundColor: camp.color || "#6366f1" }}
                    title={`Color: ${camp.color}`}
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-base font-semibold text-[var(--color-text-primary)] truncate">
                        {camp.name}
                      </p>
                      {renderTimingBadge(camp.timingStatus)}
                    </div>

                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-muted)] mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />/{camp.slug}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDateDisplay(camp.startsAt)} →{" "}
                        {formatDateDisplay(camp.endsAt)}
                      </span>
                    </div>

                    {camp.description && (
                      <p className="text-xs text-[var(--color-text-secondary)] mt-2 line-clamp-1">
                        {camp.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(camp)}
                    disabled={togglingId === camp.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors cursor-pointer disabled:opacity-50 w-[96px] justify-center shrink-0 ${
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

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(camp)}
                      className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)] transition-colors cursor-pointer"
                      title="Editar campaña"
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
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title={editing ? "Editar campaña" : "Nueva campaña"}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <Input
            label="Nombre de la campaña"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Día de la Madre, Hot Sale..."
            required
            autoFocus
          />

          <Input
            label="Identificador único (Slug)"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            placeholder="dia-de-la-madre"
            required
          />

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Descripción interna (opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setIsDirty(true);
              }}
              rows={2}
              placeholder="Notas para el equipo o detalles de la estrategia..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                Inicio
              </label>
              <input
                type="datetime-local"
                value={startsAt}
                onChange={(e) => {
                  setStartsAt(e.target.value);
                  setIsDirty(true);
                }}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                Fin
              </label>
              <input
                type="datetime-local"
                value={endsAt}
                onChange={(e) => {
                  setEndsAt(e.target.value);
                  setIsDirty(true);
                }}
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-card)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
              Color identificador
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setColor(c);
                    setIsDirty(true);
                  }}
                  className={`w-7 h-7 rounded-full cursor-pointer transition-transform ${
                    color === c
                      ? "ring-2 ring-offset-2 ring-[var(--color-primary)] scale-110"
                      : "hover:scale-105 opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 justify-end border-t border-[var(--color-border)]">
            <Button
              type="button"
              variant="secondary"
              onClick={closeModal}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving
                ? "Guardando..."
                : editing
                  ? "Guardar cambios"
                  : "Crear campaña"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
