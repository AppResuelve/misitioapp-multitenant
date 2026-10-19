// @ts-nocheck
"use client";

import Link from "next/link";
import { AlertTriangle, XCircle, ArrowRight } from "lucide-react";

interface BillingInfo {
  status: "active" | "past_due" | "suspended";
  currentPeriodEnd?: string;
  graceUntil?: string;
}

const getRemainingDays = (dateStr?: string): number => {
  if (!dateStr) return 0;
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diffMs = target - now;
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
};

const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "short",
    });
  } catch {
    return dateStr;
  }
};

export default function BillingAlertBanner({
  billing,
}: {
  billing: BillingInfo | null;
}) {
  if (!billing || billing.status === "active") {
    return null;
  }

  const isSuspended = billing.status === "suspended";
  const remainingDays = getRemainingDays(
    billing.graceUntil || billing.currentPeriodEnd,
  );

  return (
    <aside
      role="alert"
      className={`fixed top-0 left-0 right-0 h-14 z-50 px-4 flex items-center justify-between text-xs sm:text-sm font-medium border-b select-none transition-colors ${
        isSuspended
          ? "bg-red-600 text-white border-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-100"
          : "bg-amber-500 text-amber-950 border-amber-600 dark:bg-amber-950 dark:border-amber-800 dark:text-amber-100"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {isSuspended ? (
            <XCircle className="w-4 h-4 shrink-0 text-white dark:text-red-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-950 dark:text-amber-400" />
          )}

          <div>
            {isSuspended ? (
              <span>
                <strong>Tienda suspendida:</strong> Período de gracia vencido.
                Funciones pausadas.
              </span>
            ) : (
              <span>
                <strong>Pago pendiente:</strong> Ciclo vencido{" "}
                {billing.currentPeriodEnd
                  ? formatDate(billing.currentPeriodEnd)
                  : ""}
                .{" "}
                {remainingDays > 0 ? (
                  <span>
                    Quedan{" "}
                    <strong>
                      {remainingDays} {remainingDays === 1 ? "día" : "días"} de
                      gracia
                    </strong>
                    .
                  </span>
                ) : (
                  <span>
                    <strong>¡Atención! Hoy vence la gracia</strong> antes de la
                    suspensión.
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        <Link
          href="/dashboard/settings/billing"
          className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold underline-offset-2 hover:underline transition-all ${
            isSuspended
              ? "bg-white/20 hover:bg-white/30 text-white"
              : "bg-amber-950/15 hover:bg-amber-950/25 text-amber-950 dark:text-amber-100 dark:bg-amber-900/50"
          }`}
        >
          <span>Regularizar</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </aside>
  );
}
