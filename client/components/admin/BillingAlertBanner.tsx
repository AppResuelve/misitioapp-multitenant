// @ts-nocheck
"use client";

import Link from "next/link";
import { AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { formatDateLocale } from "@/utils/date";

interface BillingInfo {
  status: "active" | "past_due" | "suspended";
  currentPeriodEnd?: string;
  graceUntil?: string;
}

export default function BillingAlertBanner({
  billing,
}: {
  billing: BillingInfo | null;
}) {
  if (!billing || billing.status === "active") {
    return null;
  }

  const isSuspended = billing.status === "suspended";

  return (
    <div
      role="alert"
      className={`w-full px-4 py-2.5 text-xs sm:text-sm font-medium border-b transition-colors select-none ${
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

          <p className="truncate">
            {isSuspended ? (
              <span>
                <strong>Tienda suspendida:</strong> Tu período de gracia venció.
                Las funciones públicas y administrativas están pausadas.
              </span>
            ) : (
              <span>
                <strong>Pago pendiente:</strong> Tu ciclo venció{" "}
                {billing.currentPeriodEnd
                  ? formatDateLocale(billing.currentPeriodEnd)
                  : "recientemente"}
                .
                {billing.graceUntil && (
                  <span>
                    {" "}
                    Tenés gracia hasta el{" "}
                    <strong>{formatDateLocale(billing.graceUntil)}</strong>.
                  </span>
                )}
              </span>
            )}
          </p>
        </div>

        <Link
          href="/dashboard/settings/billing"
          className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold underline-offset-2 hover:underline transition-all ${
            isSuspended
              ? "bg-white/20 hover:bg-white/30 text-white"
              : "bg-amber-950/10 hover:bg-amber-950/20 text-amber-950 dark:text-amber-100 dark:bg-amber-900/40"
          }`}
        >
          <span>Ver estado</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
