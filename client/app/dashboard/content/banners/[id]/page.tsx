// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useAlert } from "@/context/AlertContext";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useCampaigns } from "@/hooks/admin-useCampaigns";
import { useCategories } from "@/hooks/admin-useCategories";
import { useSiteContent } from "@/hooks/admin-useSiteContent";
import { siteContentService } from "@/services/siteContent.service";
import { Button, DropdownSelect, Input, Spinner } from "@/components/ui";
import ImageUpload from "@/components/admin/ImageUpload";
import {
  BANNER_SLOTS,
  LINK_TYPES,
  SITE_CONTENT_MESSAGES,
} from "@/constants/siteContent";
import ResourceSearchTrigger from "@/components/admin/search/ResourceSearchTrigger";

const EMPTY_BANNER = {
  name: "",
  slotKey: BANNER_SLOTS[0]?.key || "top_bar",
  status: "draft",
  campaignId: "",
  linkType: "none",
  categoryId: "",
  productId: "",
  externalUrl: "",
  config: {
    imageUrl: null,
    title: "",
    subtitle: "",
    buttonText: "",
  },
};

export default function BannerFormPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const Alert = useAlert();
  const { confirmLeave } = useUnsavedChanges();

  const isEditing = Boolean(id) && id !== "new";

  const { createItem, updateItem } = useSiteContent({ kind: "banner" });
  const { campaigns } = useCampaigns();
  const { categories } = useCategories();

  const [form, setForm] = useState(EMPTY_BANNER);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  // Si viene con slotKey precargado en URL (ej: /banners/new?slotKey=category_highlight)
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
        setForm({
          name: data.name || "",
          slotKey: data.slotKey || BANNER_SLOTS[0]?.key,
          status: data.status || "draft",
          campaignId: data.campaignId ? String(data.campaignId) : "",
          linkType: data.linkType || "none",
          categoryId: data.categoryId ? String(data.categoryId) : "",
          productId: data.productId ? String(data.productId) : "",
          externalUrl: data.externalUrl || "",
          config: {
            imageUrl: data.config?.imageUrl || null,
            title: data.config?.title || "",
            subtitle: data.config?.subtitle || "",
            buttonText: data.config?.buttonText || "",
          },
        });
      })
      .catch(() => {
        Alert.fire({ message: "No se encontró el banner", type: "error" });
        router.push("/dashboard/content/banners");
      })
      .finally(() => {
        setLoading(false);
      });
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
      config: {
        ...prev.config,
        [key]: value,
      },
    }));
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

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        kind: "banner",
        slotKey: form.slotKey,
        status: form.status,
        campaignId: form.campaignId ? Number(form.campaignId) : null,
        linkType: form.linkType,
        categoryId:
          form.linkType === "category" && form.categoryId
            ? Number(form.categoryId)
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

      router.push("/dashboard/content/banners");
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[350px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 pb-38">
      {/* Barra de cabecera con volver */}
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
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving
              ? "Guardando..."
              : isEditing
                ? "Guardar cambios"
                : "Crear banner"}
          </Button>
        </div>
      </div>

      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 space-y-6 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
            {isEditing ? "Editar Banner" : "Nuevo Banner"}
          </h2>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Configurá la ubicación, imagen y llamada a la acción para la tienda
            pública.
          </p>
        </div>

        <Input
          label="Nombre interno del banner"
          value={form.name}
          onChange={(e) => handleFieldChange("name", e.target.value)}
          placeholder="Ej: Promo Envío Gratis Octubre..."
          required
          autoFocus
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <DropdownSelect
              label="Ranura / Espacio"
              value={form.slotKey}
              onChange={(val) => handleFieldChange("slotKey", val)}
              options={BANNER_SLOTS.map((s) => ({
                value: s.key,
                label: s.label,
              }))}
              disabled={isEditing}
              placeholder="Seleccionar ranura..."
            />
          </div>

          <div>
            <DropdownSelect
              label="Campaña asociada (opcional)"
              value={form.campaignId || ""}
              onChange={(val) => handleFieldChange("campaignId", val)}
              options={[
                { value: "", label: "Ninguna (Permanente / Manual)" },
                ...campaigns.map((c) => ({
                  value: String(c.id),
                  label: c.name,
                })),
              ]}
              placeholder="Seleccionar campaña..."
            />
          </div>
        </div>

        {/* Imagen */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
            Imagen del banner
          </label>
          <ImageUpload
            images={form.config.imageUrl ? [form.config.imageUrl] : []}
            onChange={(imgs) => handleConfigChange("imageUrl", imgs[0] || null)}
            max={1}
            folder="banners"
          />
        </div>

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
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Subtítulo o bajada"
              value={form.config.subtitle}
              onChange={(e) => handleConfigChange("subtitle", e.target.value)}
              placeholder="Válido abonando en efectivo"
            />
            <Input
              label="Texto del botón (CTA)"
              value={form.config.buttonText}
              onChange={(e) => handleConfigChange("buttonText", e.target.value)}
              placeholder="Ej: Ver promociones"
            />
          </div>
        </div>

        {/* Destino del Enlace */}
        <div className="space-y-4">
          <div>
            <DropdownSelect
              label="Destino del clic"
              value={form.linkType || "none"}
              onChange={(val) => handleFieldChange("linkType", val)}
              options={LINK_TYPES}
              placeholder="Seleccionar destino..."
            />
          </div>

          {form.linkType === "category" && (
            <ResourceSearchTrigger
              label="Categoría vinculada"
              scope="categories"
              selectedId={form.categoryId}
              selectedName={
                categories.find((c) => String(c.id) === String(form.categoryId))
                  ?.name
              }
              onSelect={(cat) => handleFieldChange("categoryId", cat.id)}
              onClear={() => handleFieldChange("categoryId", "")}
            />
          )}

          {form.linkType === "product" && (
            <ResourceSearchTrigger
              label="Producto específico vinculado"
              scope="products"
              selectedId={form.productId}
              selectedName={form.productName} // o resuelto por ID
              onSelect={(prod) => {
                handleFieldChange("productId", prod.id);
                handleFieldChange("productName", prod.name);
              }}
              onClear={() => {
                handleFieldChange("productId", "");
                handleFieldChange("productName", "");
              }}
            />
          )}

          {form.linkType === "external" && (
            <Input
              label="URL Externa"
              value={form.externalUrl}
              onChange={(e) => handleFieldChange("externalUrl", e.target.value)}
              placeholder="https://instagram.com/..."
              required
            />
          )}
        </div>
      </div>
    </form>
  );
}
