// @ts-nocheck
"use client";

import { HelpCircle } from "lucide-react";
import { ComingSoonCard } from "@/components/ui/ComingSoonCard";

export default function HelpSettings() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
        Ayuda
      </h1>

      <ComingSoonCard
        title="Centro de ayuda en construcción"
        description="Pronto vas a encontrar tutoriales, preguntas frecuentes y canales de soporte directo para tu tienda."
        icon={HelpCircle}
      />
    </div>
  );
}
