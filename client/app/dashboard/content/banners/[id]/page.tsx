// @ts-nocheck
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Info, Lock } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useCampaigns } from "@/hooks/admin-useCampaigns";
import { useSiteContent } from "@/hooks/admin-useSiteContent";
import { useSlotAvailability } from "@/hooks/admin-useSlotAvailability";
import { siteContentService } from "@/services/siteContent.service";
import { Button, DropdownSelect, Input, Spinner } from "@/components/ui";
import ImageUpload from "@/components/admin/ImageUpload";
import CampaignScheduleFields from "@/components/admin/content/CampaignScheduleFields";
import LinkDestinationSelector from "@/components/admin/content/LinkDestinationSelector";

import {
  BANNER_SLOTS,
  SITE_CONTENT_MESSAGES,
  EMPTY_BANNER,
} from "@/constants/siteContent";
import { SLOT_ALLOWED_LINKS } from "@/types/siteContent";
import { toLocalDatetimeInput } from "@/utils/date";

export default function BannerFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const Alert = useAlert();
  const { confirmLeave } = useUnsavedChanges();

  // Filtrar banners archivados para no limitar la disponibilidad de la ranura
  const { items: allBanners } = useSiteContent({ kind: "banner" });
  const activeAndDraftBanners = useMemo(
    () => allBanners.filter((b) => b.status !== "archived"),
    [allBanners],
  );

  const { campaigns } = useCampaigns();

  const [form, setForm] = useState(EMPTY_BANNER);
  const isEditing = Boolean(id) && id !== "new";
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const isArchived = form.status === "archived";

  const querySlot = searchParams?.get("slotKey");

  const handleSlotChange = (newSlotKey: string) => {
    const allowed = SLOT_ALLOWED_LINKS[newSlotKey] || [
      "none",
      "category",
      "product",
      "external",
    ];
    const isCurrentLinkValid = allowed.includes(form.linkType);

    setForm((prev) => {
      const nextLinkType = isCurrentLinkValid
        ? prev.linkType
        : allowed.includes("category")
          ? "category"
          : allowed.includes("product")
            ? "product"
            : allowed[0] || "none";

      return {
        ...prev,
        slotKey: newSlotKey,
        linkType: nextLinkType,
        ...(!isCurrentLinkValid && {
          categoryId: "",
          categoryName: "",
          productId: "",
          productName: "",
          externalUrl: "",
        }),
      };
    });
  };

  const { slotOptions } = useSlotAvailability({
    slots: BANNER_SLOTS,
    existingItems: activeAndDraftBanners, // Solo los no archivados cuentan
    currentSlotKey: form.slotKey,
    currentId: id,
    isEditing,
    onSelectSlot: handleSlotChange,
  });

  const currentSlotDef = useMemo(() => {
    return BANNER_SLOTS.find((s) => s.key === form.slotKey);
  }, [form.slotKey]);

  const allowedLinks = useMemo(() => {
    return (
      SLOT_ALLOWED_LINKS[form.slotKey] || [
        "none",
        "category",
        "product",
        "external",
      ]
    );
  }, [form.slotKey]);

  useEffect(() => {
    if (!isEditing) {
      if (querySlot) handleSlotChange(querySlot);
      setLoading(false);
      return;
    }

    setLoading(true);
    siteContentService
      .getById(id)
      .then((data) => {
        setForm({
          name: data.name || "",
          slotKey: data.slotKey || BANNER_SLOTS[0]?.key,
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
            imageUrl: data.config?.imageUrl || null,
            title: data.config?.title || "",
            subtitle: data.config?.subtitle || "",
            buttonText: data.config?.buttonText || "",
          },
        });
      })
      .catch((err) => {
        console.error("Error al cargar banner:", err);
        Alert.fire({ message: "No se encontró el banner", type: "error" });
        router.push("/dashboard/content/banners");
      })
      .finally(() => setLoading(false));
  }, [id, isEditing, querySlot, router, Alert]);

  const handleBack = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (await confirmLeave()) {
      router.push("/dashboard/content/banners");
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

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        kind: "banner",
        slotKey: form.slotKey,
        status: form.status,
        campaignId: form.campaignId ? Number(form.campaignId) : null,
        startsAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endsAt: form.endAt ? new Date(form.endAt).toISOString() : null,
        linkType: form.linkType,
        categoryId:
          form.linkType === "category" && form.categoryId
            ? Number(form.categoryId)
            : null,
        productId:
          form.linkType === "product" && form.productId
            ? Number(form.productId)
            : null,
        externalUrl:
          form.linkType === "external" ? form.externalUrl.trim() : null,
        config: {
          imageUrl: form.config.imageUrl || null,
          title: form.config.title.trim() || null,
          subtitle: form.config.subtitle.trim() || null,
          buttonText: form.config.buttonText.trim() || null,
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

      router.push("/dashboard/content/banners");
    } catch (err: any) {
      console.error("Error al guardar banner:", err);
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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-38">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Banners
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
                  : "Crear banner"}
            </Button>
          )}
        </div>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 space-y-6 shadow-xs">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
              {isEditing ? "Editar Banner" : "Nuevo Banner"}
            </h2>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Configurá la ubicación, programación temporal y enlaces para la
              tienda pública.
            </p>
          </div>

          {isArchived && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-500 border border-zinc-500/30">
              <Lock className="w-3.5 h-3.5" />
              Banner Archivado (Solo lectura)
            </span>
          )}
        </div>

        {/* Nombre y Estado inicial */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Nombre interno del banner"
              value={form.name}
              onChange={(e) => handleFieldChange("name", e.target.value)}
              placeholder="Ej: Promo Envío Gratis Octubre..."
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
            label="Ranura / Espacio"
            value={form.slotKey}
            onChange={handleSlotChange}
            options={slotOptions}
            disabled={isEditing || isArchived}
            placeholder="Seleccionar ranura..."
          />
          <div className="hidden sm:block" />
        </div>

        {/* Info del Slot */}
        {currentSlotDef && (
          <div className="flex items-start gap-2.5 p-3 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)]/60 border border-[var(--color-border)] rounded-xl">
            <Info className="w-4 h-4 shrink-0 text-primary mt-0.5" />
            <div>
              <p>{currentSlotDef.description}</p>
              <p className="mt-1 font-medium text-[var(--color-text-primary)]">
                Medida recomendada: {currentSlotDef.recommendedSize}
              </p>
            </div>
          </div>
        )}

        {/* Campaña y Rango de Fechas */}
        <CampaignScheduleFields
          campaignId={form.campaignId}
          startAt={form.startAt}
          endAt={form.endAt}
          campaigns={campaigns}
          disabled={isArchived}
          onChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
        />

        {/* Imagen del Banner */}
        {form.slotKey !== "top_bar" && (
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Imagen del banner
            </label>
            <ImageUpload
              images={form.config.imageUrl ? [form.config.imageUrl] : []}
              onChange={(imgs) =>
                handleConfigChange("imageUrl", imgs[0] || null)
              }
              disabled={isArchived}
              max={1}
              folder="banners"
              cols={3}
            />
          </div>
        )}

        {/* Textos y CTA */}
        <div className="p-4 bg-[var(--color-bg-elevated)]/40 rounded-xl space-y-4 border border-[var(--color-border)]">
          <p className="text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
            Llamada a la acción (Opcional)
          </p>
          <Input
            label="Título superpuesto o visible"
            value={form.config.title}
            onChange={(e) => handleConfigChange("title", e.target.value)}
            placeholder="Ej: 20% OFF en Tartas Frutales"
            disabled={isArchived}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Subtítulo o bajada"
              value={form.config.subtitle}
              onChange={(e) => handleConfigChange("subtitle", e.target.value)}
              placeholder="Válido abonando en efectivo"
              disabled={isArchived}
            />
            <Input
              label="Texto del botón (CTA)"
              value={form.config.buttonText}
              onChange={(e) => handleConfigChange("buttonText", e.target.value)}
              placeholder="Ej: Ver promociones"
              disabled={isArchived}
            />
          </div>
        </div>

        {/* Selector de Destino */}
        <div className="space-y-4">
          <LinkDestinationSelector
            values={form}
            allowedLinks={allowedLinks}
            disabled={isArchived}
            onChange={(updates) => setForm((prev) => ({ ...prev, ...updates }))}
          />
        </div>
      </div>
    </form>
  );
}
