// @ts-nocheck
"use client";

import { Receipt } from "lucide-react";
import { ComingSoonCard } from "@/components/ui/ComingSoonCard";

export default function BillingSettings() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Facturación
      </h1>

      <ComingSoonCard
        title="Módulo de facturación en camino"
        description="Estamos trabajando para que puedas gestionar tus comprobantes fiscales, planes y suscripciones desde acá."
        icon={Receipt}
      />
    </div>
  );
}
