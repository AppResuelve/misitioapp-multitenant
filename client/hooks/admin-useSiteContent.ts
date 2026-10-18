// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import {
  siteContentService,
  SiteContentItem,
  SiteContentPayload,
  ContentKind,
} from "@/services/siteContent.service";

interface UseSiteContentOptions {
  kind?: ContentKind;
  slotKey?: string;
}

export function useSiteContent(options: UseSiteContentOptions = {}) {
  const { kind, slotKey } = options;

  const [items, setItems] = useState<SiteContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let data: SiteContentItem[] = [];
      if (slotKey) {
        data = await siteContentService.getBySlot(slotKey);
      } else if (kind) {
        data = await siteContentService.getByKind(kind);
      } else {
        data = await siteContentService.getByKind("banner");
      }
      setItems(data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al cargar el contenido del sitio",
      );
    } finally {
      setLoading(false);
    }
  }, [kind, slotKey]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const createItem = async (payload: SiteContentPayload) => {
    const created = await siteContentService.create(payload);

    setItems((prev) => {
      // Si el nuevo se crea activo, pasamos a draft los del mismo slot
      const updatedList =
        created.status === "active"
          ? prev.map((item) =>
              item.slotKey === created.slotKey
                ? { ...item, status: "draft" }
                : item,
            )
          : [...prev];

      return [created, ...updatedList];
    });

    return created;
  };

  const updateItem = async (
    id: number | string,
    payload: Partial<SiteContentPayload>,
  ) => {
    const updated = await siteContentService.update(id, payload);

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === Number(id)) {
          return updated;
        }
        // Si el actualizado pasó a 'active', cualquier otro del mismo slot pasa a 'draft'
        if (updated.status === "active" && item.slotKey === updated.slotKey) {
          return { ...item, status: "draft" };
        }
        return item;
      }),
    );

    return updated;
  };

  const toggleItemStatus = async (id: number | string) => {
    const updated = await siteContentService.toggleStatus(id);

    setItems((prev) =>
      prev.map((item) => {
        if (item.id === Number(id)) {
          return updated;
        }
        if (updated.status === "active" && item.slotKey === updated.slotKey) {
          return { ...item, status: "draft" };
        }
        return item;
      }),
    );

    return updated;
  };

  const deleteItem = async (id: number | string) => {
    await siteContentService.delete(id);
    setItems((prev) => prev.filter((item) => item.id !== Number(id)));
  };

  return {
    items,
    setItems,
    loading,
    error,
    refetch: fetchItems,
    createItem,
    updateItem,
    toggleItemStatus,
    deleteItem,
  };
}
