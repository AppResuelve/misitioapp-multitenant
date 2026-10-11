// @ts-nocheck
import { useState, useEffect, useCallback } from "react";
import { branchesService } from "@/services/branches.service";

export function useBranches() {
  const [branches, setBranches] = useState([]);
  const [ordered, setOrdered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await branchesService.getAll();
      setBranches(data);
      setOrdered(data);
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          "Error al cargar sucursales",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const createBranch = async (payload: any) => {
    const created = await branchesService.create(payload);
    await fetchBranches();
    return created;
  };

  const updateBranch = async (id: number | string, payload: any) => {
    const updated = await branchesService.update(id, payload);
    await fetchBranches();
    return updated;
  };

  const deleteBranch = async (id: number | string) => {
    await branchesService.delete(id);
    setBranches((prev) => prev.filter((b) => b.id !== id));
    setOrdered((prev) => prev.filter((b) => b.id !== id));
  };

  const toggleBranchStatus = async (id: number | string) => {
    await branchesService.toggleStatus(id);
    await fetchBranches();
  };

  const reorderBranches = async (newOrderedList: any[]) => {
    setOrdered(newOrderedList);
    try {
      await branchesService.reorder(newOrderedList.map((b) => b.id));
    } catch (err) {
      await fetchBranches();
      throw err;
    }
  };

  return {
    branches,
    ordered,
    setOrdered,
    loading,
    error,
    refetch: fetchBranches,
    createBranch,
    updateBranch,
    deleteBranch,
    toggleBranchStatus,
    reorderBranches,
  };
}
