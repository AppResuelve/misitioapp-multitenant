// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { paymentMethodsService } from "@/services/paymentMethods.service";

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMethods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await paymentMethodsService.getAll();
      setPaymentMethods(data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al cargar medios de pago",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const createPaymentMethod = async (payload: any) => {
    const created = await paymentMethodsService.create(payload);
    await fetchMethods();
    return created;
  };

  const updatePaymentMethod = async (id: number | string, payload: any) => {
    const updated = await paymentMethodsService.update(id, payload);
    await fetchMethods();
    return updated;
  };

  const deletePaymentMethod = async (id: number | string) => {
    await paymentMethodsService.remove(id);
    setPaymentMethods((prev) => prev.filter((m) => m.id !== id));
  };

  const togglePaymentMethodActive = async (item: any) => {
    const newStatus = !item.isActive;
    // Actualización optimista inmediata
    setPaymentMethods((prev) =>
      prev.map((m) => (m.id === item.id ? { ...m, isActive: newStatus } : m)),
    );
    try {
      await paymentMethodsService.update(item.id, { isActive: newStatus });
      return newStatus;
    } catch (err) {
      await fetchMethods();
      throw err;
    }
  };

  const reorderPaymentMethods = async (reorderedList: any[]) => {
    setPaymentMethods(reorderedList);
    try {
      const orders = reorderedList.map((m, idx) => ({
        id: m.id,
        sortOrder: idx,
      }));
      await paymentMethodsService.reorder(orders);
    } catch (err) {
      await fetchMethods();
      throw err;
    }
  };

  return {
    paymentMethods,
    loading,
    error,
    refetch: fetchMethods,
    createPaymentMethod,
    updatePaymentMethod,
    deletePaymentMethod,
    togglePaymentMethodActive,
    reorderPaymentMethods,
  };
}
