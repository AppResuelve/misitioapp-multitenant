// @ts-nocheck
"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Calendar,
  Images as CarouselIcon,
  CheckCircle2,
  Layers,
  Lock,
} from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useSiteContent } from "@/hooks/admin-useSiteContent";
import { Button, Spinner } from "@/components/ui";
import {
  CAROUSEL_SLOTS,
  SITE_CONTENT_MESSAGES,
  MAX_ITEMS_PER_SLOT,
} from "@/constants/siteContent";

export default function CarouselsPage() {
  const {
    items: carousels,
    loading: loadingCarousels,
    toggleItemStatus,
    deleteItem,
  } = useSiteContent({ kind: "carousel" });

  const Alert = useAlert();
  const [togglingId, setTogglingId] = useState<number | null>(null);

  const handleToggleStatus = async (carousel) => {
    if (carousel.status === "archived") {
      Alert.fire({
        message: "Los contenidos archivados no pueden conmutarse directamente.",
        type: "warning",
      });
      return;
    }

    setTogglingId(carousel.id);
    try {
      await toggleItemStatus(carousel.id);
    } catch {
      Alert.fire({
        message: SITE_CONTENT_MESSAGES.STATUS_ERROR,
        type: "error",
      });
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (carousel) => {
    const result = await Alert.fire({
      title: SITE_CONTENT_MESSAGES.DELETE_CONFIRM_TITLE,
      message: SITE_CONTENT_MESSAGES.DELETE_CONFIRM_TEXT(carousel.name),
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: "Eliminar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteItem(carousel.id);
      Alert.fire({
        message: SITE_CONTENT_MESSAGES.DELETE_SUCCESS,
        type: "success",
      });
    } catch {
      Alert.fire({
        message: SITE_CONTENT_MESSAGES.DELETE_ERROR,
        type: "error",
      });
    }
  };

  // Determina si este carrusel es el que efectivamente está mostrándose en el Storefront
  const isCarouselLive = (carousel, allSlotCarousels) => {
    if (carousel.status !== "active") return false;
    const now = new Date();

    // Caso A: Asociado a campaña
    if (carousel.campaignId && carousel.campaign) {
      const camp = carousel.campaign;
      if (camp.status !== "active") return false;
      const start = new Date(camp.startsAt);
      const end = new Date(camp.endsAt);
      return now >= start && now <= end;
    }

    // Caso B: Es base (sin campaña).
    // Solo está en vivo si no hay ningún carrusel de campaña activo y corriendo ahora en este slot
    const hasRunningCampaignCarousel = allSlotCarousels.some((c) => {
      if (c.id === carousel.id || !c.campaignId || !c.campaign) return false;
      if (c.status !== "active" || c.campaign.status !== "active") return false;
      const s = new Date(c.campaign.startsAt);
      const e = new Date(c.campaign.endsAt);
      return now >= s && now <= e;
    });

    if (hasRunningCampaignCarousel) return false;

    // Verificar fechas propias si tuviese
    const start = carousel.startsAt ? new Date(carousel.startsAt) : null;
    const end = carousel.endsAt ? new Date(carousel.endsAt) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;

    return true;
  };

  const populatedSlots = CAROUSEL_SLOTS.filter((slot) =>
    carousels.some((c) => c.slotKey === slot.key),
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Carruseles del Sitio
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Gestioná secuencias de diapositivas y galerías dinámicas. Máximo{" "}
            {MAX_ITEMS_PER_SLOT} activos/borradores por espacio.
          </p>
        </div>
        <Link href="/dashboard/content/carousels/new">
          <Button>
            <Plus className="w-4 h-4" />
            Nuevo Carrusel
          </Button>
        </Link>
      </div>

      <div className="relative min-h-[220px]">
        {loadingCarousels && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-[var(--color-bg-base)]/60 backdrop-blur-xs">
            <Spinner size="lg" />
          </div>
        )}

        {!loadingCarousels && carousels.length === 0 ? (
          <div className="text-center py-16 rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)]/30">
            <CarouselIcon className="w-10 h-10 text-[var(--color-text-muted)] mx-auto mb-2 opacity-50" />
            <p className="font-medium text-[var(--color-text-primary)]">
              No hay carruseles configurados
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-4">
              Comenzá creando tu primer carrusel interactivo para la tienda
              pública.
            </p>
            <Link href="/dashboard/content/carousels/new">
              <Button size="sm">
                <Plus className="w-3.5 h-3.5 mr-1" />
                Crear primer carrusel
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {populatedSlots.map((slot) => {
              const slotCarousels = carousels.filter(
                (c) => c.slotKey === slot.key,
              );
              // Solo activos y borradores cuentan para el límite
              const activeCount = slotCarousels.filter(
                (c) => c.status !== "archived",
              ).length;
              const isSlotFull = activeCount >= MAX_ITEMS_PER_SLOT;

              return (
                <div
                  key={slot.key}
                  className="bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4 shadow-xs"
                >
                  {/* Encabezado del Slot */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--color-border)]">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                          {slot.label}
                        </h2>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isSlotFull
                              ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {activeCount}/{MAX_ITEMS_PER_SLOT}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {slot.description} • Sugerido:{" "}
                        <span className="font-medium text-[var(--color-text-secondary)]">
                          {slot.recommendedSize}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Tarjetas de Carruseles */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {slotCarousels.map((carousel) => {
                      const isActive = carousel.status === "active";
                      const isArchived = carousel.status === "archived";
                      const isLive = isCarouselLive(carousel, slotCarousels);

                      const slides = carousel.config?.slides || [];
                      const firstSlideImage = slides[0]?.imageUrl || null;

                      return (
                        <div
                          key={carousel.id}
                          className={`flex flex-col justify-between p-4 rounded-xl border transition-all ${
                            isLive
                              ? "bg-[var(--color-bg-card)] border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30"
                              : isArchived
                                ? "bg-[var(--color-bg-card)]/60 border-[var(--color-border)] opacity-60"
                                : "bg-[var(--color-bg-card)] border-[var(--color-border)] hover:border-[var(--color-border-hover)]"
                          }`}
                        >
                          <div className="space-y-3">
                            <div className="w-full h-32 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] overflow-hidden relative flex items-center justify-center">
                              {firstSlideImage ? (
                                <img
                                  src={firstSlideImage}
                                  alt={carousel.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="text-center p-3 text-[var(--color-text-muted)]">
                                  <CarouselIcon className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                  <span className="text-[11px]">
                                    {carousel.slotKey === "featured_products"
                                      ? "Vitrina dinámica de productos"
                                      : "Sin diapositivas"}
                                  </span>
                                </div>
                              )}

                              {isLive && (
                                <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" />
                                  En vivo ahora
                                </span>
                              )}

                              {carousel.slotKey !== "featured_products" && (
                                <span className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-xs text-white text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Layers className="w-3 h-3" />
                                  {slides.length} diapositiva
                                  {slides.length === 1 ? "" : "s"}
                                </span>
                              )}
                            </div>

                            <div>
                              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                                {carousel.name}
                              </p>

                              {/* Badges de Campaña / Evergreen y Ajustes */}
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {carousel.campaign ? (
                                  <span
                                    className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium"
                                    style={{
                                      backgroundColor: `${
                                        carousel.campaign.color || "#6366f1"
                                      }15`,
                                      color:
                                        carousel.campaign.color || "#6366f1",
                                    }}
                                  >
                                    <Calendar className="w-3 h-3" />
                                    {carousel.campaign.name}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-medium bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
                                    <Layers className="w-3 h-3" />
                                    Carrusel Base (Evergreen)
                                  </span>
                                )}

                                {carousel.slotKey !== "featured_products" && (
                                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)]">
                                    Autoplay:{" "}
                                    {carousel.config?.autoplay !== false
                                      ? `${carousel.config?.interval || 5}s`
                                      : "Manual"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Toggle Activo y Acciones */}
                          <div className="flex items-center justify-between pt-3 mt-4 border-t border-[var(--color-border)]">
                            {isArchived ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-500 border border-zinc-500/30">
                                <Lock className="w-3 h-3" />
                                Archivado
                              </span>
                            ) : (
                              (() => {
                                // 🔒 Verificamos si la campaña padre está en borrador
                                const isCampaignDraft =
                                  carousel.campaign &&
                                  carousel.campaign.status === "draft";
                                const isDisabled =
                                  togglingId === carousel.id || isCampaignDraft;

                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleStatus(carousel)}
                                    disabled={isDisabled}
                                    title={
                                      isCampaignDraft
                                        ? `La campaña "${carousel.campaign.name}" está en borrador. Activá la campaña para poder activar este carrusel.`
                                        : undefined
                                    }
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                      isCampaignDraft
                                        ? "opacity-40 cursor-not-allowed bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
                                        : isActive
                                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 cursor-pointer disabled:opacity-50"
                                          : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 cursor-pointer disabled:opacity-50"
                                    }`}
                                  >
                                    {togglingId === carousel.id ? (
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

                            <div className="flex items-center gap-1">
                              <Link
                                href={`/dashboard/content/carousels/${carousel.id}`}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isArchived
                                    ? "text-[var(--color-text-muted)] opacity-30 pointer-events-none"
                                    : "text-[var(--color-text-muted)] hover:text-[var(--color-primary-text)] hover:bg-[var(--color-bg-elevated)]"
                                }`}
                                title={
                                  isArchived
                                    ? "Archivado (solo lectura)"
                                    : "Editar carrusel"
                                }
                              >
                                <Edit className="w-4 h-4" />
                              </Link>
                              <button
                                type="button"
                                onClick={() => handleDelete(carousel)}
                                className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                title="Eliminar carrusel"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
