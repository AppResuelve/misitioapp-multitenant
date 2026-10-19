// @ts-nocheck
"use client";

import Link from "next/link";
import { ShieldAlert, ArrowRight, LifeBuoy } from "lucide-react";

interface AdminBlockedProps {
  reason?: "suspended" | "maintenance" | "inactive";
  message?: string;
  supportEmail?: string;
}

export default function AdminBlocked({
  reason = "suspended",
  message,
  supportEmail = "soporte@tudominio.com",
}: AdminBlockedProps) {
  const isSuspended = reason === "suspended";

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] flex flex-col justify-center items-center p-4 sm:p-6 transition-colors">
      <div className="max-w-md w-full bg-[var(--color-bg-surface)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-200">
        {/* Ícono de alerta */}
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center mb-6 border border-red-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        {/* Badge de estado */}
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 mb-3 uppercase tracking-wider">
          {isSuspended ? "Servicio Suspendido" : "Acceso Pausado"}
        </span>

        {/* Título */}
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
          {isSuspended
            ? "Tu tienda se encuentra pausada"
            : "Acceso no disponible"}
        </h1>

        {/* Mensaje descriptivo */}
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          {message ||
            (isSuspended
              ? "El período de gracia para regularizar la suscripción ha vencido. Tanto tu tienda pública como la administración de productos y pedidos están temporalmente bloqueadas."
              : "Este espacio de trabajo no se encuentra disponible momentáneamente.")}
        </p>

        {/* Acciones principales */}
        <div className="w-full space-y-3">
          {isSuspended && (
            <Link
              href="/dashboard/settings/billing"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-md shadow-red-500/20 cursor-pointer"
            >
              <span>Ir a Facturación y regularizar</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}

          <a
            href={`mailto:${supportEmail}`}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
          >
            <LifeBuoy className="w-3.5 h-3.5" />
            <span>Contactar al equipo de soporte</span>
          </a>
        </div>
      </div>
    </div>
  );
}
