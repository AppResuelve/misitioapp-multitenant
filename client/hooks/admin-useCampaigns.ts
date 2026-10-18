// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import {
  campaignsService,
  CampaignPayload,
} from "@/services/campaigns.service";

export interface Campaign {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  startsAt: string;
  endsAt: string;
  status: "draft" | "active" | "archived";
  timingStatus: "upcoming" | "running" | "ended";
  color: string;
  createdAt: string;
  updatedAt: string;
}

export function useCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignsService.getAll();
      setCampaigns(data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al cargar campañas",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const createCampaign = async (payload: CampaignPayload) => {
    const created = await campaignsService.create(payload);
    // Inserta al principio de la lista sin refetch
    setCampaigns((prev) => [created, ...prev]);
    return created;
  };

  const updateCampaign = async (
    id: number | string,
    payload: Partial<CampaignPayload>,
  ) => {
    const updated = await campaignsService.update(id, payload);
    // Reemplaza el ítem editado manteniendo la posición
    setCampaigns((prev) =>
      prev.map((c) => (c.id === Number(id) ? updated : c)),
    );
    return updated;
  };

  const toggleCampaignStatus = async (id: number | string) => {
    const updated = await campaignsService.toggleStatus(id);
    // Aplica el nuevo status devuelto por el controller
    setCampaigns((prev) =>
      prev.map((c) => (c.id === Number(id) ? updated : c)),
    );
    return updated;
  };

  const deleteCampaign = async (id: number | string) => {
    await campaignsService.delete(id);
    // Remueve directamente de la lista
    setCampaigns((prev) => prev.filter((c) => c.id !== Number(id)));
  };

  return {
    campaigns,
    setCampaigns,
    loading,
    error,
    refetch: fetchCampaigns,
    createCampaign,
    updateCampaign,
    toggleCampaignStatus,
    deleteCampaign,
  };
}
