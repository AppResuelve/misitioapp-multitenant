// @ts-nocheck
import api from "@/services/admin-api";

const BASE_PATH = "/admin/payment";

export const paymentMethodsService = {
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

  remove: async (id: number | string) => {
    const { data } = await api.delete(`${BASE_PATH}/${id}`);
    return data;
  },

  reorder: async (orders: { id: number | string; sortOrder: number }[]) => {
    const { data } = await api.put(`${BASE_PATH}/reorder`, { orders });
    return data;
  },
};
