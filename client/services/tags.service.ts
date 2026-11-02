// @ts-nocheck
import api from "./admin-api";

export interface TagValueItem {
  id: number;
  name: string;
  value: string;
  slug: string;
}

export interface ActiveTagItem {
  id: number;
  name: string;
  slug: string;
  values: TagValueItem[];
}

export const tagService = {
  /**
   * Obtiene todos los tags y sus valores asociados a al menos un producto activo
   * GET /api/admin/tags/active
   */
  async getActive(): Promise<ActiveTagItem[]> {
    const { data } = await api.get("/admin/tags/active");
    // Extrae el array directamente para que en el componente recibas la lista limpia
    return data?.data || data || [];
  },
};
