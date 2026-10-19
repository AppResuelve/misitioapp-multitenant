// @ts-nocheck
"use client";
import { resolvePageTitle } from "@/data/metadata";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAdminStatus } from "@/context/AdminStatusContext";
import { Spinner, Skeleton } from "@/components/ui";
import BillingAlertBanner from "@/components/admin/BillingAlertBanner";

const Sidebar = dynamic(() => import("@/components/admin/Sidebar"), {
  ssr: false,
});
const Topbar = dynamic(() => import("@/components/admin/Topbar"), {
  ssr: false,
});

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isPublic } = useAuth();
  const { billing } = useAdminStatus();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const pageTitle = resolvePageTitle(pathname);
    document.title = `${pageTitle} — Admin`;
  }, [pathname]);

  if (loading)
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] flex">
        <Skeleton className="w-64 h-screen rounded-none hidden lg:block border-r border-[var(--color-border)]" />
        <div className="flex-1 flex items-center justify-center">
          <Spinner />
        </div>
      </div>
    );

  // Rutas públicas se renderizan sin layout de admin
  if (isPublic) return <>{children}</>;

  // Si no hay usuario y es ruta privada, AuthProvider ya está ejecutando router.replace('/login')
  if (!user) return null;

  const hasBillingAlert = billing && billing.status !== "active";

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] transition-colors flex flex-col">
      {/* 1. Banner fijo arriba de todo */}
      <BillingAlertBanner billing={billing} />

      {/* 2. Topbar y navegación */}
      <Topbar
        onMenuOpen={() => setSidebarOpen(true)}
        hasAlert={hasBillingAlert}
      />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        hasAlert={hasBillingAlert}
      />

      {/* 3. Área de contenido: si hay alerta sumamos margen para que no quede solapado */}
      <main
        className={`ml-0 lg:ml-64 p-4 lg:p-6 min-h-[calc(100vh-5rem)] ${
          hasBillingAlert ? "pt-28 lg:pt-28" : "pt-20 lg:pt-20"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
