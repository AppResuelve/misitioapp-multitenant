// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Layers,
  Settings2,
} from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useCampaigns } from "@/hooks/admin-useCampaigns";
import { useCategories } from "@/hooks/admin-useCategories";
import { useSiteContent } from "@/hooks/admin-useSiteContent";
import { siteContentService } from "@/services/siteContent.service";
import { Button, Input, Spinner } from "@/components/ui";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  CAROUSEL_SLOTS,
  LINK_TYPES,
  SITE_CONTENT_MESSAGES,
  MAX_SLIDES_PER_CAROUSEL,
} from "@/constants/siteContent";

const createEmptySlide = () => ({
  id:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now() + Math.random()),
  imageUrl: null,
  title: "",
  subtitle: "",
  buttonText: "",
  linkType: "none",
  categoryId: "",
  externalUrl: "",
});

const EMPTY_CAROUSEL = {
  name: "",
  slotKey: CAROUSEL_SLOTS[0]?.key || "hero",
  status: "draft",
  campaignId: "",
  config: {
    autoplay: true,
    interval: 5,
    customPerSlide: false, // false: textos generales fijos | true: textos específicos por slide
    overlayTitle: "",
    overlaySubtitle: "",
    overlayButtonText: "",
    overlayLinkType: "none",
    overlayCategoryId: "",
    overlayExternalUrl: "",
    slides: [createEmptySlide()],
  },
};

export default function CarouselFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const Alert = useAlert();
  const { setIsDirty, confirmLeave } = useUnsavedChanges();

  const isEditing = Boolean(id) && id !== "new";

  const { createItem, updateItem } = useSiteContent({ kind: "carousel" });
  const { campaigns } = useCampaigns();
  const { categories } = useCategories();

  const [form, setForm] = useState(EMPTY_CAROUSEL);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  const querySlot = searchParams?.get("slotKey");

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
        const slides =
          Array.isArray(data.config?.slides) && data.config.slides.length > 0
            ? data.config.slides
            : [createEmptySlide()];

        setForm({
          name: data.name || "",
          slotKey: data.slotKey || CAROUSEL_SLOTS[0]?.key,
          status: data.status || "draft",
          campaignId: data.campaignId ? String(data.campaignId) : "",
          config: {
            autoplay: data.config?.autoplay !== false,
            interval: data.config?.interval || 5,
            customPerSlide: Boolean(data.config?.customPerSlide),
            overlayTitle: data.config?.overlayTitle || "",
            overlaySubtitle: data.config?.overlaySubtitle || "",
            overlayButtonText: data.config?.overlayButtonText || "",
            overlayLinkType: data.config?.overlayLinkType || "none",
            overlayCategoryId: data.config?.overlayCategoryId
              ? String(data.config.overlayCategoryId)
              : "",
            overlayExternalUrl: data.config?.overlayExternalUrl || "",
            slides,
          },
        });
      })
      .catch(() => {
        Alert.fire({ message: "No se encontró el carrusel", type: "error" });
        router.push("/dashboard/content/carousels");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id, isEditing, querySlot, router, Alert]);

  const handleBack = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (await confirmLeave()) {
      setIsDirty(false);
      router.push("/dashboard/content/carousels");
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleConfigChange = (key: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
    setIsDirty(true);
  };

  // Manejo de Diapositivas con tope de 6
  const addSlide = () => {
    if (form.config.slides.length >= MAX_SLIDES_PER_CAROUSEL) {
      Alert.fire({
        message: `El carrusel admite un límite máximo de ${MAX_SLIDES_PER_CAROUSEL} diapositivas.`,
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
    setIsDirty(true);
  };

  const removeSlide = (index: number) => {
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
    setIsDirty(true);
  };

  const moveSlide = (index: number, direction: "up" | "down") => {
    const newSlides = [...form.config.slides];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newSlides.length) return;

    const temp = newSlides[index];
    newSlides[index] = newSlides[targetIndex];
    newSlides[targetIndex] = temp;

    setForm((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        slides: newSlides,
      },
    }));
    setIsDirty(true);
  };

  const updateSlideField = (index: number, field: string, value: any) => {
    setForm((prev) => {
      const updated = [...prev.config.slides];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        config: {
          ...prev.config,
          slides: updated,
        },
      };
    });
    setIsDirty(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      Alert.fire({
        message: SITE_CONTENT_MESSAGES.NAME_REQUIRED,
        type: "warning",
      });
      return;
    }

    if (form.config.slides.length > MAX_SLIDES_PER_CAROUSEL) {
      Alert.fire({
        message: `No podés exceder las ${MAX_SLIDES_PER_CAROUSEL} diapositivas.`,
        type: "warning",
      });
      return;
    }

    const hasValidSlide = form.config.slides.some((s) => Boolean(s.imageUrl));
    if (!hasValidSlide) {
      Alert.fire({
        message: "Cargá al menos una imagen en tus diapositivas.",
        type: "warning",
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        kind: "carousel",
        slotKey: form.slotKey,
        status: form.status,
        campaignId: form.campaignId ? Number(form.campaignId) : null,
        config: {
          autoplay: Boolean(form.config.autoplay),
          interval: Number(form.config.interval) || 5,
          customPerSlide: Boolean(form.config.customPerSlide),
          // Props de título/CTA general
          overlayTitle: !form.config.customPerSlide
            ? form.config.overlayTitle.trim() || null
            : null,
          overlaySubtitle: !form.config.customPerSlide
            ? form.config.overlaySubtitle.trim() || null
            : null,
          overlayButtonText: !form.config.customPerSlide
            ? form.config.overlayButtonText.trim() || null
            : null,
          overlayLinkType: !form.config.customPerSlide
            ? form.config.overlayLinkType
            : "none",
          overlayCategoryId:
            !form.config.customPerSlide &&
            form.config.overlayLinkType === "category" &&
            form.config.overlayCategoryId
              ? Number(form.config.overlayCategoryId)
              : null,
          overlayExternalUrl:
            !form.config.customPerSlide &&
            form.config.overlayLinkType === "external"
              ? form.config.overlayExternalUrl.trim()
              : null,
          slides: form.config.slides.map((s) => ({
            id: s.id,
            imageUrl: s.imageUrl || null,
            // Si es personalizado se guardan sus props individuales, sino se mantienen limpios
            title:
              form.config.customPerSlide || form.slotKey === "brand_carousel"
                ? s.title
                  ? s.title.trim()
                  : null
                : null,
            subtitle:
              form.config.customPerSlide && form.slotKey !== "brand_carousel"
                ? s.subtitle
                  ? s.subtitle.trim()
                  : null
                : null,
            buttonText:
              form.config.customPerSlide && form.slotKey === "hero"
                ? s.buttonText
                  ? s.buttonText.trim()
                  : null
                : null,
            linkType: form.config.customPerSlide
              ? s.linkType || "none"
              : form.slotKey === "brand_carousel"
                ? s.linkType || "none"
                : "none",
            categoryId:
              (form.config.customPerSlide ||
                form.slotKey === "brand_carousel") &&
              s.linkType === "category" &&
              s.categoryId
                ? Number(s.categoryId)
                : null,
            externalUrl:
              (form.config.customPerSlide ||
                form.slotKey === "brand_carousel") &&
              s.linkType === "external"
                ? (s.externalUrl || "").trim()
                : null,
          })),
        },
      };

      if (isEditing) {
        await updateItem(id, payload);
        Alert.fire({
          message: SITE_CONTENT_MESSAGES.UPDATE_SUCCESS,
          type: "success",
          duration: 1500,
        });
      } else {
        await createItem(payload);
        Alert.fire({
          message: SITE_CONTENT_MESSAGES.CREATE_SUCCESS,
          type: "success",
          duration: 1500,
        });
      }

      setIsDirty(false);
      router.push("/dashboard/content/carousels");
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        SITE_CONTENT_MESSAGES.SAVE_ERROR;
      Alert.fire({ message: msg, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const isBrandSlot = form.slotKey === "brand_carousel";
  const isSocialProof = form.slotKey === "social_proof";
  const isHero = form.slotKey === "hero";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-5xl mx-auto space-y-6">
      {/* Barra superior de navegación */}
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
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear carrusel"}
          </Button>
        </div>
      </div>

      {/* Bloque: Configuración Principal del Carrusel */}
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 space-y-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {isEditing ? "Editar Carrusel" : "Nuevo Carrusel"}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Configuración general, tipo de ranura y comportamiento de rotación.
          </p>
        </div>

        <Input
          label="Nombre interno del carrusel"
          value={form.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder={
            isBrandSlot
              ? "Ej: Marcas Aliadas y Proveedores..."
              : "Ej: Hero Principal Primavera 2026..."
          }
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Ranura / Tipo de Carrusel
            </label>
            <select
              value={form.slotKey}
              onChange={(e) => handleFieldChange("slotKey", e.target.value)}
              disabled={isEditing}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            >
              {CAROUSEL_SLOTS.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Campaña asociada (opcional)
            </label>
            <select
              value={form.campaignId}
              onChange={(e) => handleFieldChange("campaignId", e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)] transition-colors"
            >
              <option value="">Ninguna (Permanente / Manual)</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Opciones de Rotación */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-[var(--color-bg-elevated)]/40 border border-[var(--color-border)]">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.config.autoplay}
              onChange={(e) => handleConfigChange("autoplay", e.target.checked)}
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
                className="w-20 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
              />
            </div>
          )}
        </div>

        {/* Título y Contenido General (Solo si no es Marcas y está en modo General) */}
        {!isBrandSlot && !form.config.customPerSlide && (
          <div className="p-4 bg-[var(--color-bg-elevated)]/30 rounded-xl space-y-4 border border-[var(--color-border)]">
            <div className="flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-[var(--color-primary)]" />
              <p className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Contenido General Superpuesto (Permanece fijo mientras rotan las
                fotos)
              </p>
            </div>

            <Input
              label="Título general"
              value={form.config.overlayTitle}
              onChange={(e) =>
                handleConfigChange("overlayTitle", e.target.value)
              }
              placeholder="Ej: Pastelería Artesanal de Autor"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Bajada o subtítulo general"
                value={form.config.overlaySubtitle}
                onChange={(e) =>
                  handleConfigChange("overlaySubtitle", e.target.value)
                }
                placeholder="Elaborado cada mañana con ingredientes seleccionados"
              />
              <Input
                label="Texto del botón (CTA)"
                value={form.config.overlayButtonText}
                onChange={(e) =>
                  handleConfigChange("overlayButtonText", e.target.value)
                }
                placeholder="Ej: Ver catálogo completo"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                  Destino del botón general
                </label>
                <select
                  value={form.config.overlayLinkType}
                  onChange={(e) =>
                    handleConfigChange("overlayLinkType", e.target.value)
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                >
                  {LINK_TYPES.map((lt) => (
                    <option key={lt.value} value={lt.value}>
                      {lt.label}
                    </option>
                  ))}
                </select>
              </div>

              {form.config.overlayLinkType === "category" && (
                <div>
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                    Categoría destino
                  </label>
                  <select
                    value={form.config.overlayCategoryId}
                    onChange={(e) =>
                      handleConfigChange("overlayCategoryId", e.target.value)
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                  >
                    <option value="">Seleccioná categoría...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {form.config.overlayLinkType === "external" && (
                <Input
                  label="URL Externa"
                  value={form.config.overlayExternalUrl}
                  onChange={(e) =>
                    handleConfigChange("overlayExternalUrl", e.target.value)
                  }
                  placeholder="https://..."
                />
              )}
            </div>
          </div>
        )}

        {/* Checkbox abajo de todo en el bloque principal: Habilitar opciones por diapositiva */}
        {!isBrandSlot && (
          <div className="pt-2 border-t border-[var(--color-border)]">
            <label className="flex items-start gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/20 hover:bg-[var(--color-bg-elevated)]/40 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={form.config.customPerSlide}
                onChange={(e) =>
                  handleConfigChange("customPerSlide", e.target.checked)
                }
                className="w-4 h-4 mt-0.5 rounded border-[var(--color-border)] text-[var(--color-primary)] focus:ring-[var(--color-primary)]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Personalizar títulos, botones y enlaces individuales por cada
                  diapositiva
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                  Si está desactivado, el carrusel mantendrá el título y botón
                  general fijos mientras las fotos se suceden de fondo.
                </p>
              </div>
            </label>
          </div>
        )}
      </div>

      {/* Bloque: Gestor de Diapositivas (Tope de 6) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[var(--color-primary)]" />
            <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
              Diapositivas ({form.config.slides.length} de{" "}
              {MAX_SLIDES_PER_CAROUSEL})
            </h3>
          </div>

          {form.config.slides.length < MAX_SLIDES_PER_CAROUSEL ? (
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
          )}
        </div>

        <div className="space-y-4">
          {form.config.slides.map((slide, index) => (
            <div
              key={slide.id || index}
              className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4 shadow-xs"
            >
              {/* Barra superior de la tarjeta de diapositiva */}
              <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-[var(--color-text-secondary)]">
                    {isBrandSlot
                      ? slide.title
                        ? `Marca: ${slide.title}`
                        : "Logo de Marca"
                      : slide.title
                        ? `Diapositiva: "${slide.title}"`
                        : "Foto de Diapositiva"}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveSlide(index, "up")}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-30 cursor-pointer"
                    title="Subir orden"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSlide(index, "down")}
                    disabled={index === form.config.slides.length - 1}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] disabled:opacity-30 cursor-pointer"
                    title="Bajar orden"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSlide(index)}
                    disabled={form.config.slides.length <= 1}
                    className="p-1.5 rounded-lg text-[var(--color-text-muted)] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 disabled:opacity-30 cursor-pointer"
                    title="Eliminar diapositiva"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Contenido adaptado por slot */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Imagen/Logo */}
                <div
                  className={
                    isBrandSlot || !form.config.customPerSlide
                      ? "md:col-span-5"
                      : "md:col-span-4"
                  }
                >
                  <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                    {isBrandSlot
                      ? "Logo de la marca (PNG o SVG recomendado)"
                      : "Fotografía de la diapositiva"}
                  </label>
                  <ImageUpload
                    images={slide.imageUrl ? [slide.imageUrl] : []}
                    onChange={(imgs) =>
                      updateSlideField(index, "imageUrl", imgs[0] || null)
                    }
                    max={1}
                    folder="carousels"
                  />
                </div>

                {/* Campos condicionales */}
                <div
                  className={
                    isBrandSlot || !form.config.customPerSlide
                      ? "md:col-span-7 space-y-3.5"
                      : "md:col-span-8 space-y-3.5"
                  }
                >
                  {/* CASO 1: Carrusel de Marcas (Solo nombre de marca + enlace externo opcional) */}
                  {isBrandSlot && (
                    <>
                      <Input
                        label="Nombre de la marca / Empresa"
                        value={slide.title || ""}
                        onChange={(e) =>
                          updateSlideField(index, "title", e.target.value)
                        }
                        placeholder="Ej: Callebaut, KitchenAid..."
                        required
                      />
                      <Input
                        label="Sitio web o enlace (opcional)"
                        value={slide.externalUrl || ""}
                        onChange={(e) => {
                          updateSlideField(
                            index,
                            "externalUrl",
                            e.target.value,
                          );
                          updateSlideField(
                            index,
                            "linkType",
                            e.target.value ? "external" : "none",
                          );
                        }}
                        placeholder="https://..."
                      />
                    </>
                  )}

                  {/* CASO 2: Modo General activo (las diapositivas solo aportan la imagen) */}
                  {!isBrandSlot && !form.config.customPerSlide && (
                    <div className="p-4 rounded-xl bg-[var(--color-bg-surface)] border border-[var(--color-border)] text-xs text-[var(--color-text-muted)] space-y-1">
                      <p className="font-medium text-[var(--color-text-secondary)]">
                        Diapositiva en modo fondo general
                      </p>
                      <p>
                        Esta imagen rotará manteniendo el título, subtítulo y
                        botón de acción configurados arriba.
                      </p>
                    </div>
                  )}

                  {/* CASO 3: Modo Personalizado por diapositiva */}
                  {!isBrandSlot && form.config.customPerSlide && (
                    <>
                      <Input
                        label="Título específico"
                        value={slide.title || ""}
                        onChange={(e) =>
                          updateSlideField(index, "title", e.target.value)
                        }
                        placeholder="Ej: Especial Macarons Franceses"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Input
                          label={
                            isSocialProof
                              ? "Reseña o comentario"
                              : "Subtítulo o bajada"
                          }
                          value={slide.subtitle || ""}
                          onChange={(e) =>
                            updateSlideField(index, "subtitle", e.target.value)
                          }
                          placeholder={
                            isSocialProof
                              ? "Amamos la torta de boda..."
                              : "Edición limitada"
                          }
                        />
                        {isHero && (
                          <Input
                            label="Texto del botón (CTA)"
                            value={slide.buttonText || ""}
                            onChange={(e) =>
                              updateSlideField(
                                index,
                                "buttonText",
                                e.target.value,
                              )
                            }
                            placeholder="Ej: Ver más"
                          />
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                            Destino del clic
                          </label>
                          <select
                            value={slide.linkType || "none"}
                            onChange={(e) =>
                              updateSlideField(
                                index,
                                "linkType",
                                e.target.value,
                              )
                            }
                            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                          >
                            {LINK_TYPES.map((lt) => (
                              <option key={lt.value} value={lt.value}>
                                {lt.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {slide.linkType === "category" && (
                          <div>
                            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                              Categoría destino
                            </label>
                            <select
                              value={slide.categoryId || ""}
                              onChange={(e) =>
                                updateSlideField(
                                  index,
                                  "categoryId",
                                  e.target.value,
                                )
                              }
                              className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-primary)]"
                            >
                              <option value="">Seleccioná categoría...</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {slide.linkType === "external" && (
                          <Input
                            label="URL Externa"
                            value={slide.externalUrl || ""}
                            onChange={(e) =>
                              updateSlideField(
                                index,
                                "externalUrl",
                                e.target.value,
                              )
                            }
                            placeholder="https://..."
                          />
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}
