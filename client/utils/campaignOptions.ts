import type { Campaign } from "@/hooks/admin-useCampaigns";
import { formatDateShort } from "./formatData";

export interface CampaignSelectOption {
  value: string;
  label: string;
}

export const getCampaignSelectOptions = (
  campaigns: Campaign[] = [],
  currentCampaignId?: string | number | null,
): CampaignSelectOption[] => {
  const currentIdStr = currentCampaignId ? String(currentCampaignId) : "";

  // 1. Filtrar: mantener borradores, activas y solo la archivada si ya estaba asignada
  const validCampaigns = campaigns.filter(
    (c) => c.status !== "archived" || String(c.id) === currentIdStr,
  );

  // 2. Ordenar: activas primero, luego borradores, al final archivadas (y por fecha inicio)
  const statusPriority: Record<string, number> = {
    active: 1,
    draft: 2,
    archived: 3,
  };

  validCampaigns.sort((a, b) => {
    const diff =
      (statusPriority[a.status] ?? 99) - (statusPriority[b.status] ?? 99);
    if (diff !== 0) return diff;
    return new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime();
  });

  // 3. Mapear a opciones de dropdown
  const options = validCampaigns.map((c) => {
    const isCurrentArchived = c.status === "archived";
    const statusLabel = isCurrentArchived
      ? "Archivada"
      : c.status === "active"
        ? "Activa"
        : "Borrador";

    const dateInfo = c.startsAt
      ? ` • Inicia: ${formatDateShort(c.startsAt)}`
      : "";

    return {
      value: String(c.id),
      label: `${c.name} (${statusLabel}${dateInfo})`,
    };
  });

  return [{ value: "", label: "Ninguna (Permanente / Manual)" }, ...options];
};
