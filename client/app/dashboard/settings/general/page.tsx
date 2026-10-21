// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Textarea,
  Card,
  Spinner,
  Checkbox,
} from "@/components/ui";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { useAlert } from "@/context/AlertContext";
import ImageUpload from "@/components/admin/ImageUpload";

import api from "@/services/admin-api";
import {
  INITIAL_GENERAL_SETTINGS,
  SOCIAL_NETWORKS_DICT,
  SOCIAL_NETWORK_KEYS,
  GENERAL_SETTINGS_MESSAGES,
} from "@/constants/generalSettings";

export default function GeneralSettings() {
  const Alert = useAlert();
  const { isDirty } = useUnsavedChanges();

  const [settings, setSettings] = useState(INITIAL_GENERAL_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get("/admin/settings")
      .then(({ data }) => {
        setSettings({
          businessName: data.businessName || "",
          businessSlogan: data.businessSlogan || "",
          businessDescription: data.businessDescription || "",
          logoUrl: data.logoUrl || "",
          faviconUrl: data.faviconUrl || "",
          email: data.email || "",
          socialLinks: {
            ...INITIAL_GENERAL_SETTINGS.socialLinks,
            ...(data.socialLinks || {}),
          },
          autoCalculateUnitPrices: data.autoCalculateUnitPrices ?? true,
        });
      })
      .catch(() => {
        Alert.fire({
          message: GENERAL_SETTINGS_MESSAGES.FETCH_ERROR,
          type: "error",
        });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSocialChange = (key: string, value: string) => {
    setSettings((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [key]: value,
      },
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Si está vacío o solo tiene espacios, mandamos null
    const cleanEmail = settings.email?.trim() ? settings.email.trim() : null;
    try {
      await api.put("/admin/settings", {
        businessName: settings.businessName,
        businessSlogan: settings.businessSlogan,
        businessDescription: settings.businessDescription,
        logoUrl: settings.logoUrl,
        faviconUrl: settings.faviconUrl,
        email: cleanEmail, //REVISAR ESTO, LUEGO EL EMAIL DEBERIA SER OBLIGATORIO POR LO MENOS PARA ACTIVAR LA STORE DEL CLIENTE.
        socialLinks: settings.socialLinks,
        autoCalculateUnitPrices: settings.autoCalculateUnitPrices,
      });

      Alert.fire({
        message: GENERAL_SETTINGS_MESSAGES.SAVE_SUCCESS,
        type: "success",
        duration: 1500,
      });
    } catch (err: any) {
      Alert.fire({
        message:
          err.response?.data?.message ||
          err.response?.data?.error ||
          GENERAL_SETTINGS_MESSAGES.SAVE_ERROR,
        type: "error",
      });
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          General
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
          Configurá la identidad de tu negocio, medios de contacto, redes y
          reglas de precios.
        </p>
      </div>

      <form onSubmit={handleSave} className="pb-24 lg:pb-12 space-y-6">
        {/* 1. Información del Negocio */}
        <Card className="p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Información del negocio
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Datos principales de la marca e imágenes institucionales.
            </p>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Nombre del negocio"
                value={settings.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                placeholder="Mi Tienda"
                required
              />
              <Input
                label="Slogan"
                value={settings.businessSlogan}
                onChange={(e) => handleChange("businessSlogan", e.target.value)}
                placeholder="Pastelería artesanal y diseño dulce"
              />
            </div>

            <Textarea
              label="Descripción"
              value={settings.businessDescription}
              onChange={(e) =>
                handleChange("businessDescription", e.target.value)
              }
              placeholder="Contale a tus clientes de qué se trata tu propuesta..."
              maxLength={1000}
              rows={3}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-[var(--color-border)]">
              <ImageUpload
                label="Logo"
                images={settings.logoUrl ? [settings.logoUrl] : []}
                onChange={(imgs) => handleChange("logoUrl", imgs[0] || "")}
                max={1}
                cols={2}
                folder="branding"
              />
              <ImageUpload
                label="Favicon"
                images={settings.faviconUrl ? [settings.faviconUrl] : []}
                onChange={(imgs) => handleChange("faviconUrl", imgs[0] || "")}
                max={1}
                cols={2}
                folder="branding"
              />
            </div>
          </div>
        </Card>

        {/* 2. Contacto */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Contacto principal
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Canal directo donde los compradores pueden comunicarse con tu
              tienda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email de atención"
              type="email"
              value={settings.email || ""}
              onChange={(e) => handleChange("email", e.target.value)}
              placeholder="hola@mitienda.com"
            />
          </div>
        </Card>

        {/* 3. Redes Sociales */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Redes sociales
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Perfiles públicos que se enlazarán en el encabezado y pie de
              página.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SOCIAL_NETWORK_KEYS.map((key) => {
              const { label, placeholder } = SOCIAL_NETWORKS_DICT[key];
              return (
                <Input
                  key={key}
                  label={label}
                  value={settings.socialLinks?.[key] || ""}
                  onChange={(e) => handleSocialChange(key, e.target.value)}
                  placeholder={placeholder}
                />
              );
            })}
          </div>
        </Card>

        {/* 4. Catálogo y Precios */}
        <Card className="p-6 space-y-4">
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
              Catálogo y precios
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              Control sobre el cálculo y sincronización de precios en productos
              fraccionables.
            </p>
          </div>

          <div className="pt-1">
            <label className="flex items-start gap-3 p-3.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)]/30 hover:bg-[var(--color-bg-elevated)]/60 transition-colors cursor-pointer select-none">
              <Checkbox
                checked={Boolean(settings.autoCalculateUnitPrices)}
                onChange={(e) =>
                  handleChange("autoCalculateUnitPrices", e.target.checked)
                }
                className="mt-0.5"
              />
              <div className="space-y-0.5">
                <span className="text-sm font-medium text-[var(--color-text-primary)] block">
                  Cálculo automático en productos por unidad / gramaje
                </span>
                <span className="text-xs text-[var(--color-text-secondary)] leading-relaxed block">
                  Al activarse, las presentaciones (ej: 250g, 500g) recalculan
                  su precio proporcionalmente a partir del valor base del kilo.
                  Si se desactiva, cada variante conservará su precio específico
                  sin ser sobreescrita.
                </span>
              </div>
            </label>
          </div>
        </Card>

        {/* Barra de Acciones */}
        <div className="fixed bottom-0 left-0 right-0 lg:static flex justify-end items-center px-4 py-4 lg:p-0 bg-[var(--color-bg-base)]/90 backdrop-blur-md border-t border-[var(--color-border)] lg:border-0 lg:bg-transparent z-20 transition-colors">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </div>
      </form>
    </div>
  );
}
