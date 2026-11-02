// @/components/admin/content/CampaignScheduleFields.tsx
"use client";

import { useMemo } from "react";
import { Calendar, Layers } from "lucide-react";
import { DropdownSelect, Input } from "@/components/ui";
import { useAlert } from "@/context/AlertContext";
import { SITE_CONTENT_MESSAGES } from "@/constants/siteContent";
import { getCampaignSelectOptions } from "@/utils/campaignOptions";
import { toLocalDatetimeInput } from "@/utils/date";

interface CampaignScheduleFieldsProps {
  campaignId: string;
  startAt: string;
  endAt: string;
  campaigns: any[];
  disabled?: boolean;
  onChange: (updates: {
    campaignId?: string;
    startAt?: string;
    endAt?: string;
  }) => void;
}

export default function CampaignScheduleFields({
  campaignId,
  startAt,
  endAt,
  campaigns,
  disabled = false,
  onChange,
}: CampaignScheduleFieldsProps) {
  const Alert = useAlert();

  const campaignOptions = useMemo(
    () => getCampaignSelectOptions(campaigns, campaignId),
    [campaigns, campaignId],
  );

  const currentCampaign = useMemo(() => {
    if (!campaignId) return null;
    return campaigns.find((c) => String(c.id) === String(campaignId));
  }, [campaigns, campaignId]);

  const handleCampaignChange = (newCampIdStr: string) => {
    if (newCampIdStr === campaignId || disabled) return;

    if (!newCampIdStr) {
      // Pasa a ser Evergreen (sin fechas forzadas)
      onChange({ campaignId: "", startAt: "", endAt: "" });
      return;
    }

    const selectedCamp = campaigns.find(
      (c) => String(c.id) === String(newCampIdStr),
    );
    if (selectedCamp) {
      onChange({
        campaignId: newCampIdStr,
        startAt: selectedCamp.startsAt
          ? toLocalDatetimeInput(selectedCamp.startsAt)
          : "",
        endAt: selectedCamp.endsAt
          ? toLocalDatetimeInput(selectedCamp.endsAt)
          : "",
      });
    }
  };

  const handleDateChange = async (
    field: "startAt" | "endAt",
    newValue: string,
  ) => {
    if (disabled) return;

    if (!currentCampaign) {
      onChange({ [field]: newValue });
      return;
    }

    const campDate =
      field === "startAt"
        ? currentCampaign.startsAt
          ? toLocalDatetimeInput(currentCampaign.startsAt)
          : ""
        : currentCampaign.endsAt
          ? toLocalDatetimeInput(currentCampaign.endsAt)
          : "";

    if (newValue === campDate) {
      onChange({ [field]: newValue });
      return;
    }

    const result = await Alert.fire({
      title: SITE_CONTENT_MESSAGES.UNLINK_CAMPAIGN_TITLE,
      message: SITE_CONTENT_MESSAGES.UNLINK_CAMPAIGN_WARNING(
        currentCampaign.name,
      ),
      type: "warning",
      variant: "modal",
      showCancelButton: true,
      confirmButtonText: SITE_CONTENT_MESSAGES.CONFIRM_UNLINK_BTN,
      cancelButtonText: SITE_CONTENT_MESSAGES.CANCEL_UNLINK_BTN,
    });

    if (result.isConfirmed) {
      onChange({ campaignId: "", [field]: newValue });
    }
  };

  return (
    <div className="space-y-4">
      <DropdownSelect
        label="Campaña asociada (opcional)"
        value={campaignId || ""}
        onChange={handleCampaignChange}
        options={campaignOptions}
        disabled={disabled}
        placeholder="Sin campaña — Contenido Base (Evergreen)"
      />

      {currentCampaign ? (
        <div className="flex items-center gap-2 p-3 text-sm font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <Calendar className="w-4 h-4 shrink-0" />
          <span>
            Sincronizado con la campaña <strong>{currentCampaign.name}</strong>.
            Las fechas y activación se gestionan automáticamente por cronómetro.
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-3 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)]/40 border border-[var(--color-border)] rounded-xl">
          <Layers className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" />
          <span>
            <strong>Contenido Base (Evergreen):</strong> Estará siempre visible
            en la tienda pública a menos que una campaña temporal tome el
            control del espacio.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Fecha de inicio (opcional si es base)"
          type="datetime-local"
          value={startAt}
          onChange={(e) => handleDateChange("startAt", e.target.value)}
          disabled={disabled || Boolean(campaignId)}
        />
        <Input
          label="Fecha de fin (opcional)"
          type="datetime-local"
          value={endAt}
          onChange={(e) => handleDateChange("endAt", e.target.value)}
          disabled={disabled || Boolean(campaignId)}
        />
      </div>
    </div>
  );
}
