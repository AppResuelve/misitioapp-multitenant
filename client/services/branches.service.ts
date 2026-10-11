// @ts-nocheck
import api from "@/services/admin-api";

const BASE_PATH = "/admin/branches";

export const branchesService = {
  getAll: async () => {
    const { data } = await api.get(BASE_PATH);
    return data;
  },

  create: async (payload: any) => {
    const { data } = await api.post(BASE_PATH, payload);
    return data;
  },

  update: async (id: number | string, payload: any) => {
    const { data } = await api.put(`${BASE_PATH}/${id}`, payload);
    return data;
  },

  delete: async (id: number | string) => {
    const { data } = await api.delete(`${BASE_PATH}/${id}`);
    return data;
  },

  toggleStatus: async (id: number | string) => {
    const { data } = await api.patch(`${BASE_PATH}/${id}/toggle-status`);
    return data;
  },

  reorder: async (orderedIds: (number | string)[]) => {
    const { data } = await api.put(`${BASE_PATH}/reorder`, { orderedIds });
    return data;
  },
};
