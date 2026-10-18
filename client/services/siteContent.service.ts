import api from "@/services/admin-api";

export type ContentKind = "banner" | "carousel";
export type ContentStatus = "draft" | "active";
export type LinkType = "none" | "category" | "product" | "external";

export interface SiteContentPayload {
  name: string;
  kind: ContentKind;
  slotKey: string;
  status?: ContentStatus;
  campaignId?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  linkType?: LinkType;
  categoryId?: number | null;
  productId?: number | null;
  externalUrl?: string | null;
  config?: Record<string, any>;
  sortOrder?: number;
}

export interface SiteContentItem extends SiteContentPayload {
  id: number;
  tenantId: number;
  status: ContentStatus;
  config: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  campaign?: {
    id: number;
    name: string;
    startsAt: string;
    endsAt: string;
    color?: string;
  } | null;
  category?: {
    id: number;
    name: string;
    slug: string;
    image?: string | null;
  } | null;
  product?: {
    id: number;
    name: string;
    slug: string;
  } | null;
}

export const siteContentService = {
  getBySlot: async (slotKey: string): Promise<SiteContentItem[]> => {
    const { data } = await api.get("/admin/site-contents", {
      params: { slotKey },
    });
    return data;
  },

  getByKind: async (kind: ContentKind): Promise<SiteContentItem[]> => {
    const { data } = await api.get("/admin/site-contents", {
      params: { kind },
    });
    return data;
  },

  getById: async (id: number | string): Promise<SiteContentItem> => {
    const { data } = await api.get(`/admin/site-contents/${id}`);
    return data;
  },

  create: async (payload: SiteContentPayload): Promise<SiteContentItem> => {
    const { data } = await api.post("/admin/site-contents", payload);
    return data;
  },

  update: async (
    id: number | string,
    payload: Partial<SiteContentPayload>,
  ): Promise<SiteContentItem> => {
    const { data } = await api.put(`/admin/site-contents/${id}`, payload);
    return data;
  },

  toggleStatus: async (id: number | string): Promise<SiteContentItem> => {
    const { data } = await api.patch(`/admin/site-contents/${id}/status`);
    return data;
  },

  delete: async (id: number | string): Promise<void> => {
    await api.delete(`/admin/site-contents/${id}`);
  },
};
