import api from "@/services/admin-api";

export interface CampaignPayload {
  name: string;
  slug?: string;
  description?: string | null;
  startsAt: string;
  endsAt: string;
  status?: "draft" | "active" | "archived";
  color?: string;
}

export const campaignsService = {
  getAll: async (status?: string) => {
    const params = status ? { status } : {};
    const { data } = await api.get("/admin/campaigns", { params });
    return data;
  },

  getById: async (id: number | string) => {
    const { data } = await api.get(`/admin/campaigns/${id}`);
    return data;
  },

  create: async (payload: CampaignPayload) => {
    const { data } = await api.post("/admin/campaigns", payload);
    return data;
  },

  update: async (id: number | string, payload: Partial<CampaignPayload>) => {
    const { data } = await api.put(`/admin/campaigns/${id}`, payload);
    return data;
  },

  toggleStatus: async (id: number | string) => {
    const { data } = await api.patch(`/admin/campaigns/${id}/status`);
    return data;
  },

  delete: async (id: number | string) => {
    await api.delete(`/admin/campaigns/${id}`);
  },
};
