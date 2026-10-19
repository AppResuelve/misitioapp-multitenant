// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import {
  CreditCard,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageCircle,
  Mail,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Button, Spinner } from "@/components/ui";
import api from "@/services/admin-api";
import { formatDateLocale } from "@/utils/date";

const BILLING_STATUS_CONFIG = {
  active: {
    label: "Suscripción activa",
    sublabel: "Al día",
    cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    icon: CheckCircle2,
  },
  past_due: {
    label: "Pago pendiente",
    sublabel: "Renovación requerida",
    cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    icon: AlertTriangle,
  },
  suspended: {
    label: "Servicio pausado",
    sublabel: "Suspendido",
    cls: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
    icon: XCircle,
  },
};

export default function BillingPage() {
  const [billing, setBilling] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/billing")
      .then(({ data }) => setBilling(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Spinner size="lg" />
      </div>
    );
  }

  const currentStatus =
    BILLING_STATUS_CONFIG[billing?.status] || BILLING_STATUS_CONFIG.active;
  const StatusIcon = currentStatus.icon;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Facturación y Suscripción
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] mt-1">
          Consultá los datos de tu ciclo mensual y el estado del servicio
        </p>
      </div>

      {/* 1. Resumen del Plan Actual y Ciclo */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-light)]/30 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary-text)] shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  {billing?.planName || "Plan Comercio"}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-[var(--color-bg-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)]">
                  Mensual
                </span>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                Acceso completo al catálogo, contenido y panel de administración
              </p>
            </div>
          </div>

          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold self-start sm:self-center ${currentStatus.cls}`}
          >
            <StatusIcon className="w-4 h-4 shrink-0" />
            <span>{currentStatus.label}</span>
          </div>
        </div>

        {/* Fechas de ciclo */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-1">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-medium">
              <Calendar className="w-3.5 h-3.5" />
              <span>Inicio del período actual</span>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {billing?.currentPeriodStart
                ? formatDateLocale(billing.currentPeriodStart)
                : "No especificado"}
            </p>
          </div>

          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-base)] space-y-1">
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] font-medium">
              <Clock className="w-3.5 h-3.5 text-[var(--color-primary-text)]" />
              <span>Próximo vencimiento / renovación</span>
            </div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              {billing?.currentPeriodEnd
                ? formatDateLocale(billing.currentPeriodEnd)
                : "No especificado"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)] pt-1">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>
            Tu tienda pública y servicios se encuentran funcionando bajo este
            ciclo.
          </span>
        </div>
      </div>

      {/* 3. Canal de Contacto y Soporte para Pagos */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-card)] p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
            Avisos de pago y soporte
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
            Para registrar tu transferencia, enviar el comprobante mensual o
            consultar dudas sobre tu cuenta, comunicate con el equipo de
            soporte.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <a
            href="https://wa.me/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1"
          >
            <Button variant="secondary" className="w-full justify-center">
              <MessageCircle className="w-4 h-4 mr-2 text-emerald-600 dark:text-emerald-400" />
              Informar por WhatsApp
            </Button>
          </a>
          <a href="mailto:soporte@tudominio.com" className="flex-1">
            <Button variant="secondary" className="w-full justify-center">
              <Mail className="w-4 h-4 mr-2" />
              Enviar comprobante por Email
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}
