// @ts-nocheck
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/services/admin-api";

interface BillingData {
  planName: string;
  status: "active" | "past_due" | "suspended";
  amount: number | string;
  currency: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  graceUntil?: string;
}

interface AdminStatusContextValue {
  billing: BillingData | null;
  loadingBilling: boolean;
  isSuspended: boolean;
  isPastDue: boolean;
  refetchBilling: () => Promise<void>;
}

const AdminStatusContext = createContext<AdminStatusContextValue | undefined>(
  undefined,
);

export function AdminStatusProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);

  const fetchBilling = useCallback(async () => {
    if (!user) {
      setBilling(null);
      return;
    }

    try {
      setLoadingBilling(true);
      const { data } = await api.get("/admin/billing");
      setBilling(data);
    } catch (err) {
      // Si falla por 403 u otro error de red, no rompemos el árbol
    } finally {
      setLoadingBilling(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBilling();
  }, [fetchBilling]);

  const isSuspended = billing?.status === "suspended";
  const isPastDue = billing?.status === "past_due";

  return (
    <AdminStatusContext.Provider
      value={{
        billing,
        loadingBilling,
        isSuspended,
        isPastDue,
        refetchBilling: fetchBilling,
      }}
    >
      {children}
    </AdminStatusContext.Provider>
  );
}

export function useAdminStatus() {
  const context = useContext(AdminStatusContext);
  if (!context) {
    throw new Error(
      "useAdminStatus debe usarse dentro de un AdminStatusProvider",
    );
  }
  return context;
}
