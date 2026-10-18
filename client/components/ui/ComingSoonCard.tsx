"use client";

import { LucideIcon, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ComingSoonCardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

export function ComingSoonCard({
  title = "Próximamente",
  description = "Esta sección estará disponible en futuras actualizaciones.",
  icon: Icon = Clock,
}: ComingSoonCardProps) {
  return (
    <Card className="p-12 flex flex-col items-center justify-center text-center shadow-xs">
      <div className="w-12 h-12 rounded-full bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 flex items-center justify-center mb-4">
        <Icon className="w-6 h-6 text-[var(--color-primary-text)]" />
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-1.5">
        {title}
      </h2>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
        {description}
      </p>
    </Card>
  );
}
