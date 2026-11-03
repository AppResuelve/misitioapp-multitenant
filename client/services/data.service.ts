// @ts-nocheck
import api from "@/services/admin-api";

const BASE_PATH = "/admin/products";

export const dataService = {
  // Descarga la planilla de productos existentes (Blob Excel)
  exportProducts: async (): Promise<Blob> => {
    const response = await api.get(`${BASE_PATH}/export`, {
      responseType: "blob",
    });
    return new Blob([response.data], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  },

  // Acción crítica: vaciado total del catálogo del tenant
  deleteAllProducts: async () => {
    const { data } = await api.delete(`${BASE_PATH}/critical/remove-all`);
    return data;
  },
};
