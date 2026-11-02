// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Layers, Plus, Settings2, Lock } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useCampaigns } from "@/hooks/admin-useCampaigns";
import { useSiteContent } from "@/hooks/admin-useSiteContent";
import { useSlotAvailability } from "@/hooks/admin-useSlotAvailability";
import { siteContentService } from "@/services/siteContent.service";
import { Button, DropdownSelect, Input, Spinner } from "@/components/ui";

import CampaignScheduleFields from "@/components/admin/content/CampaignScheduleFields";
import LinkDestinationSelector from "@/components/admin/content/LinkDestinationSelector";
import FeaturedProductsConfig from "@/components/admin/content/FeaturedProductsConfig";
import SlideEditor from "@/components/admin/content/SlideEditor";

import {
  CAROUSEL_SLOTS,
  SITE_CONTENT_MESSAGES,
  MAX_SLIDES_PER_CAROUSEL,
  EMPTY_CAROUSEL,
  createEmptySlide,
} from "@/constants/siteContent";
import { toLocalDatetimeInput } from "@/utils/date";

export default function CarouselFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const Alert = useAlert();
  const { confirmLeave } = useUnsavedChanges();

  // Filtrar archivados para que no ocupen cupo en el selector de ranura
  const { items: allCarousels } = useSiteContent({ kind: "carousel" });
  const activeAndDraftCarousels = useMemo(
    () => allCarousels.filter((c) => c.status !== "archived"),
    [allCarousels],
  );

  const { campaigns } = useCampaigns();

  const [form, setForm] = useState(EMPTY_CAROUSEL);
  const isEditing = Boolean(id) && id !== "new";
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const isArchived = form.status === "archived";

  const querySlot = searchParams?.get("slotKey");

  // Hook compartido para cálculo y validación de slots (solo cuenta no archivados)
  const { slotOptions } = useSlotAvailability({
    slots: CAROUSEL_SLOTS,
    existingItems: activeAndDraftCarousels,
    currentSlotKey: form.slotKey,
    currentId: id,
    isEditing,
    onSelectSlot: (slotKey) => setForm((prev) => ({ ...prev, slotKey })),
  });

  // Carga inicial e hidratación limpia
  useEffect(() => {
    if (!isEditing) {
      if (querySlot) {
        setForm((prev) => ({ ...prev, slotKey: querySlot }));
      }
      setLoading(false);
      return;
    }

    setLoading(true);
    siteContentService
      .getById(id)
      .then((data) => {
        const rawSlides =
          Array.isArray(data.config?.slides) && data.config.slides.length > 0
            ? data.config.slides
            : [createEmptySlide()];

        const slides = rawSlides.map((s) => ({
          ...createEmptySlide(),
          ...s,
          categoryId: s.categoryId ? String(s.categoryId) : "",
          productId: s.productId ? String(s.productId) : "",
        }));

        const savedConfig = data.config || {};

        setForm({
          name: data.name || "",
          slotKey: data.slotKey || CAROUSEL_SLOTS[0]?.key,
          status: data.status || "draft",
          campaignId: data.campaignId ? String(data.campaignId) : "",
          startAt: data.startsAt ? toLocalDatetimeInput(data.startsAt) : "",
          endAt: data.endsAt ? toLocalDatetimeInput(data.endsAt) : "",
          linkType: data.linkType || "none",
          categoryId: data.categoryId ? String(data.categoryId) : "",
          categoryName: data.category?.name || "",
          productId: data.productId ? String(data.productId) : "",
          productName: data.product?.name || "",
          externalUrl: data.externalUrl || "",
          config: {
            ...EMPTY_CAROUSEL.config,
            ...savedConfig,
            mode: savedConfig.mode || "auto",
            tagName: savedConfig.tagName || "",
            limit: Number(savedConfig.limit) || 8,
            selectedProducts: savedConfig.selectedProducts || [],
            productIds: savedConfig.productIds || [],
            autoplay: savedConfig.autoplay !== false,
            interval: savedConfig.interval || 5,
            customPerSlide: Boolean(savedConfig.customPerSlide),
            overlayTitle: savedConfig.overlayTitle || "",
            overlaySubtitle: savedConfig.overlaySubtitle || "",
            overlayButtonText: savedConfig.overlayButtonText || "",
            slides,
          },
        });
      })
      .catch((err) => {
        console.error("Error cargando carrusel:", err);
        Alert.fire({ message: "No se encontró el carrusel", type: "error" });
        router.push("/dashboard/content/carousels");
      })
      .finally(() => setLoading(false));
  }, [id, isEditing, querySlot, router, Alert]);

  const handleBack = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (await confirmLeave()) {
      router.push("/dashboard/content/carousels");
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleConfigChange = (key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }));
  };

  const handleConfigBulkChange = (updates: Record<string, any>) => {
    setForm((prev) => ({
      ...prev,
      config: { ...prev.config, ...updates },
    }));
  };

  // Gestor de diapositivas
  const addSlide = () => {
    if (isArchived) return;
    if (form.config.slides.length >= MAX_SLIDES_PER_CAROUSEL) {
      Alert.fire({
        message: `El carrusel admite un máximo de ${MAX_SLIDES_PER_CAROUSEL} diapositivas.`,
        type: "warning",
      });
      return;
    }
    setForm((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        slides: [...prev.config.slides, createEmptySlide()],
      },
    }));
  };

  const removeSlide = (index: number) => {
    if (isArchived) return;
    if (form.config.slides.length <= 1) {
      Alert.fire({
        message: "El carrusel debe contener al menos una diapositiva.",
        type: "warning",
      });
      return;
    }
    setForm((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        slides: prev.config.slides.filter((_, i) => i !== index),
      },
    }));
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    if (isArchived) return;
    const newSlides = [...form.config.slides];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    handleConfigChange("slides", newSlides);
  };

  const updateSlideField = (index: number, field: string, value: any) => {
    if (isArchived) return;
    const updated = [...form.config.slides];
    updated[index] = { ...updated[index], [field]: value };
    handleConfigChange("slides", updated);
  };

  const updateSlideBulk = (index: number, updates: Record<string, any>) => {
    if (isArchived) return;
    const updated = [...form.config.slides];
    updated[index] = { ...updated[index], ...updates };
    handleConfigChange("slides", updated);
  };

  const isBrandSlot = form.slotKey === "brand_carousel";
  const isSocialProof = form.slotKey === "social_proof";
  const isHero = form.slotKey === "hero";
  const isFeaturedProducts = form.slotKey === "featured_products";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isArchived) return;

    if (!form.name.trim()) {
      Alert.fire({
        message: SITE_CONTENT_MESSAGES.NAME_REQUIRED,
        type: "warning",
      });
      return;
    }

    if (!isFeaturedProducts) {
      const hasValidSlide = form.config.slides.some((s) => Boolean(s.imageUrl));
      if (!hasValidSlide) {
        Alert.fire({
          message: "Cargá al menos una imagen en tus diapositivas.",
          type: "warning",
        });
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        kind: "carousel",
        slotKey: form.slotKey,
        status: form.status,
        campaignId: form.campaignId ? Number(form.campaignId) : null,
        startsAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endsAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        linkType: !form.config.customPerSlide ? form.linkType : "none",
        categoryId:
          form.linkType === "category" && form.categoryId
            ? Number(form.categoryId)
            : null,
        productId:
          form.linkType === "product" && form.productId
            ? Number(form.productId)
            : null,
        externalUrl:
          !form.config.customPerSlide && form.linkType === "external"
            ? form.externalUrl.trim()
            : null,
        config: {
          autoplay: Boolean(form.config.autoplay),
          interval: Number(form.config.interval) || 5,
          ...(isFeaturedProducts
            ? {
                mode: form.config.mode || "auto",
                tagName: form.config.tagName || "",
                selectedProducts: form.config.selectedProducts || [],
                productIds: (form.config.selectedProducts || []).map(
                  (p: any) => (typeof p === "object" ? p.id : p),
                ),
                limit:
                  form.config.mode === "manual"
                    ? (form.config.selectedProducts || []).length
                    : Number(form.config.limit) || 8,
              }
            : {
                customPerSlide: Boolean(form.config.customPerSlide),
                overlayTitle: !form.config.customPerSlide
                  ? form.config.overlayTitle.trim() || null
                  : null,
                overlaySubtitle: !form.config.customPerSlide
                  ? form.config.overlaySubtitle.trim() || null
                  : null,
                overlayButtonText: !form.config.customPerSlide
                  ? form.config.overlayButtonText.trim() || null
                  : null,
                slides: form.config.slides.map((s) => ({
                  id: s.id,
                  imageUrl: s.imageUrl || null,
                  title: s.title?.trim() || null,
                  subtitle: s.subtitle?.trim() || null,
                  buttonText: s.buttonText?.trim() || null,
                  linkType: s.linkType || "none",
                  categoryId: s.categoryId ? Number(s.categoryId) : null,
                  categoryName: s.categoryName || null,
                  categorySlug: s.categorySlug || null,
                  productId: s.productId ? Number(s.productId) : null,
                  productName: s.productName || null,
                  productSlug: s.productSlug || null,
                  externalUrl: s.externalUrl?.trim() || null,
                })),
              }),
        },
      };

      if (isEditing) {
        await siteContentService.update(id, payload);
        Alert.fire({
          message: SITE_CONTENT_MESSAGES.UPDATE_SUCCESS,
          type: "success",
          duration: 1500,
        });
      } else {
        await siteContentService.create(payload);
        Alert.fire({
          message: SITE_CONTENT_MESSAGES.CREATE_SUCCESS,
          type: "success",
          duration: 1500,
        });
      }

      router.push("/dashboard/content/carousels");
    } catch (err: any) {
      console.error("Error al guardar carrusel:", err);
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        SITE_CONTENT_MESSAGES.SAVE_ERROR;
      Alert.fire({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6 mb-36">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Carruseles
        </button>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={handleBack}
            disabled={saving}
          >
            {isArchived ? "Volver" : "Cancelar"}
          </Button>
          {!isArchived && (
            <Button type="submit" disabled={saving}>
              {saving
                ? "Guardando..."
                : isEditing
                  ? "Guardar cambios"
                  : "Crear carrusel"}
            </Button>
          )}
        </div>
      </div>

      {/* Bloque: Configuración Principal */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 space-y-6 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              {isEditing ? "Editar Carrusel" : "Nuevo Carrusel"}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Configuración general, tipo de ranura y comportamiento de
              rotación.
            </p>
          </div>

          {isArchived && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-500 border border-zinc-500/30">
              <Lock className="w-3.5 h-3.5" />
              Carrusel Archivado (Solo lectura)
            </span>
          )}
        </div>

        {/* Nombre y Estado inicial */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Nombre interno del carrusel"
              value={form.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder={
                isBrandSlot
                  ? "Ej: Marcas Aliadas y Proveedores..."
                  : "Ej: Hero Principal Primavera 2026..."
              }
              disabled={isArchived}
              required
              autoFocus
            />
          </div>
          <div>
            <DropdownSelect
              label="Estado inicial"
              value={form.status}
              onChange={(val) => handleFieldChange("status", val)}
              disabled={isArchived}
              options={[
                { value: "draft", label: "Borrador" },
                { value: "active", label: "Activo" },
              ]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DropdownSelect
            label="Ranura / Tipo de Carrusel"
            value={form.slotKey}
            onChange={(val) => handleFieldChange("slotKey", val)}
            options={slotOptions}
            disabled={isEditing || isArchived}
            placeholder="Seleccionar ranura..."
          />
          <div className="hidden sm:block" />
        </div>

        {/* Campaña y Rango de Fechas */}
        <CampaignScheduleFields
          campaignId={form.campaignId}
          startAt={form.startAt}
          endAt={form.endAt}
          campaigns={campaigns}
          disabled={isArchived}
          onChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
        />

        {/* Rotación Autoplay */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--color-bg-elevated)]/40 border border-[var(--color-border)]">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.config.autoplay}
              onChange={(e) => handleConfigChange("autoplay", e.target.checked)}
              disabled={isArchived}
              className="w-4 h-4 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
            />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">
              Rotación automática (Autoplay)
            </span>
          </label>

          {form.config.autoplay && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--color-text-secondary)]">
                Segundos por diapositiva:
              </span>
              <input
                type="number"
                min={2}
                max={20}
                value={form.config.interval}
                onChange={(e) =>
                  handleConfigChange("interval", Number(e.target.value))
                }
                disabled={isArchived}
                className="w-20 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          )}
        </div>

        {/* Contenido General Superpuesto */}
        {!isBrandSlot && !isFeaturedProducts && !form.config.customPerSlide && (
          <div className="p-4 bg-[var(--color-bg-elevated)]/30 rounded-xl space-y-4 border border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[var(--color-primary)]" />
              <p className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Contenido General Superpuesto (Fijo mientras rotan las fotos)
              </p>
            </div>

            <Input
              label="Título general"
              value={form.config.overlayTitle}
              onChange={(e) =>
                handleConfigChange("overlayTitle", e.target.value)
              }
              placeholder="Ej: Pastelería Artesanal de Autor"
              disabled={isArchived}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Bajada o subtítulo general"
                value={form.config.overlaySubtitle}
                onChange={(e) =>
                  handleConfigChange("overlaySubtitle", e.target.value)
                }
                placeholder="Elaborado cada mañana con ingredientes seleccionados"
                disabled={isArchived}
              />
              <Input
                label="Texto del botón (CTA)"
                value={form.config.overlayButtonText}
                onChange={(e) =>
                  handleConfigChange("overlayButtonText", e.target.value)
                }
                placeholder="Ej: Ver catálogo completo"
                disabled={isArchived}
              />
            </div>

            <LinkDestinationSelector
              label="Destino del botón general"
              values={form}
              disabled={isArchived}
              onChange={(updates) =>
                setForm((prev) => ({ ...prev, ...updates }))
              }
            />
          </div>
        )}

        {/* Checkbox: Personalizar por Diapositiva */}
        {!isBrandSlot && !isFeaturedProducts && (
          <div className="pt-2 border-t border-[var(--color-border)]">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/20 hover:bg-[var(--color-bg-elevated)]/40 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={form.config.customPerSlide}
                onChange={(e) =>
                  handleConfigChange("customPerSlide", e.target.checked)
                }
                disabled={isArchived}
                className="w-4 h-4 mt-0.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Personalizar títulos, botones y enlaces individuales por cada
                  diapositiva
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Si está desactivado, el carrusel mantendrá el título y botón
                  general fijos de fondo.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Bloque: Vitrina de Productos Destacados O Diapositivas */}
      {isFeaturedProducts ? (
        <FeaturedProductsConfig
          config={form.config}
          disabled={isArchived}
          onChange={handleConfigChange}
          onBulkChange={handleConfigBulkChange}
        />
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[var(--color-primary)]" />
              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                Diapositivas ({form.config.slides.length} de{" "}
                {MAX_SLIDES_PER_CAROUSEL})
              </h3>
            </div>

            {!isArchived &&
              (form.config.slides.length < MAX_SLIDES_PER_CAROUSEL ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={addSlide}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar diapositiva
                </Button>
              ) : (
                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                  Límite alcanzado ({MAX_SLIDES_PER_CAROUSEL} máx)
                </span>
              ))}
          </div>

          <div className="space-y-4">
            {form.config.slides.map((slide, index) => (
              <SlideEditor
                key={slide.id || index}
                slide={slide}
                index={index}
                totalSlides={form.config.slides.length}
                isBrandSlot={isBrandSlot}
                isSocialProof={isSocialProof}
                isHero={isHero}
                customPerSlide={form.config.customPerSlide}
                disabled={isArchived}
                onMove={moveSlide}
                onRemove={removeSlide}
                onUpdate={updateSlideField}
                onBulkUpdate={updateSlideBulk}
              />
            ))}
          </div>
        </div>
      )}
    </form>
  );
}
