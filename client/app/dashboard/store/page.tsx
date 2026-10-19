// @ts-nocheck
"use client";

import { useState, useEffect, useRef } from "react";
import { ExternalLink, Copy, Check } from "lucide-react";
import { Button, Spinner, DropdownSelect, Card } from "@/components/ui";
import { useAlert } from "@/context/AlertContext";
import api from "@/services/admin-api";
import {
  STORE_STATUS_OPTIONS,
  IFRAME_DIMENSIONS,
  STORE_MESSAGES,
} from "@/constants/store";

export default function Store() {
  const Alert = useAlert();
  const [status, setStatus] = useState("active");
  const [saving, setSaving] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [iframeKey, setIframeKey] = useState(0);
  const [domain, setDomain] = useState(null);
  const [copied, setCopied] = useState(false);

  const containerRef = useRef(null);
  const copyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentStatus =
    STORE_STATUS_OPTIONS.find((s) => s.value === status) ||
    STORE_STATUS_OPTIONS[0];

  useEffect(() => {
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    api
      .get("/admin/settings")
      .then(({ data }) => {
        if (data.storeStatus) setStatus(data.storeStatus);
        if (data.domain) setDomain(data.domain);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateScale = () => {
      const w = el.clientWidth;
      if (w > 0) {
        setScale(w / IFRAME_DIMENSIONS.WIDTH);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);

    return () => observer.disconnect();
  }, []);

  const handleStatusChange = async (newStatus: string) => {
    const prevStatus = status;
    setStatus(newStatus);
    setSaving(true);

    try {
      await api.put("/admin/settings", { storeStatus: newStatus });
      setIframeKey((k) => k + 1);
      Alert.fire({
        message: STORE_MESSAGES.STATUS_UPDATED,
        type: "success",
        duration: 1500,
      });
    } catch {
      setStatus(prevStatus);
      Alert.fire({ message: STORE_MESSAGES.STATUS_ERROR, type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const storeUrl = domain ? `https://${domain}` : null;

  const handleCopyUrl = () => {
    if (!storeUrl) return;
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);

    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Tienda
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">
            Vista previa y configuración de tu sitio público
          </p>
        </div>

        {storeUrl && (
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyUrl}
              className="gap-2"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
              <span>{copied ? "Copiado" : "Copiar URL"}</span>
            </Button>

            <a
              href={storeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary-light)] text-[var(--color-primary-text)] border border-[var(--color-primary)]/20 hover:opacity-90 transition-opacity"
            >
              <span>Ver tienda</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
      </div>

      {/* Vista previa Iframe (Mockup Responsivo Desktop) */}
      <div
        ref={containerRef}
        className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-base)] shadow-md transition-colors"
        style={{
          height: `${Math.min(
            Math.ceil(IFRAME_DIMENSIONS.HEIGHT * scale),
            IFRAME_DIMENSIONS.MAX_HEIGHT,
          )}px`,
        }}
      >
        {storeUrl ? (
          <iframe
            key={iframeKey}
            src={storeUrl}
            inert={true}
            className="pointer-events-none absolute top-0 left-0 border-0"
            style={{
              width: `${IFRAME_DIMENSIONS.WIDTH}px`,
              height: `${IFRAME_DIMENSIONS.HEIGHT}px`,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
            title="Vista previa de la tienda"
            sandbox="allow-scripts allow-same-origin"
          />
        ) : (
          <div className="flex items-center justify-center h-full min-h-[300px] text-center p-6">
            <div className="space-y-2">
              <p className="font-semibold text-sm text-[var(--color-text-primary)]">
                Dominio no configurado
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-sm">
                Configurá el dominio público de tu tienda para previsualizar los
                cambios en tiempo real.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controles de Estado */}
      <Card className="p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                Estado de publicación:
              </span>
              <span
                className={`w-2.5 h-2.5 rounded-full ${currentStatus.dot}`}
              />
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {currentStatus.description}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {saving && <Spinner size="sm" />}
            <DropdownSelect
              options={STORE_STATUS_OPTIONS.map((s) => ({
                value: s.value,
                label: s.label,
              }))}
              value={status}
              onChange={(v) => handleStatusChange(v as string)}
              disabled={saving}
              className="w-44"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}
