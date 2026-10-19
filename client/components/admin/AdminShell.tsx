// @ts-nocheck
"use client";
import { resolvePageTitle } from "@/data/metadata";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAdminStatus } from "@/context/AdminStatusContext";
import { Spinner, Skeleton } from "@/components/ui";
import BillingAlertBanner from "@/components/admin/BillingAlertBanner";
import AdminBlocked from "@/components/admin/AdminBlocked";
import { LogOut } from "lucide-react";

const Sidebar = dynamic(() => import("@/components/admin/Sidebar"), {
  ssr: false,
});
const Topbar = dynamic(() => import("@/components/admin/Topbar"), {
  ssr: false,
});

// Rutas declarativas que se consideran de "recuperación" o rescate de cuenta
const RESCUE_ROUTES = ["/dashboard/settings/billing"];

export default function AdminShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isPublic, logout } = useAuth();
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

  if (isPublic) return <>{children}</>;
  if (!user) return null;

  // 1. Bloqueo por suspensión: si no está en la ruta de facturación, mostramos AdminBlocked
  const isSuspended = billing?.status === "suspended";
  const isRescueRoute = RESCUE_ROUTES.some((route) =>
    pathname.startsWith(route),
  );
  if (isSuspended && !isRescueRoute) {
    return <AdminBlocked reason="suspended" />;
  }

  // 2. MODO FOCUS / RESCATE: Si está suspendido pero está en /billing,
  // NO montamos Sidebar ni Topbar normales. Damos un contenedor limpio sin navegación lateral.
  if (isSuspended && isRescueRoute) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] transition-colors flex flex-col">
        {/* Barra superior de rescate: Solo branding y salida */}
        <header className="h-16 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)] px-6 flex items-center justify-between">
          <span className="font-bold text-sm tracking-tight">
            Panel de Facturación
          </span>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-red-500 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>
        </header>

        {/* Contenido centrado, sin márgenes de sidebar */}
        <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    );
  }

  // 3. MODO NORMAL (Active o Past Due)
  const hasBanner = Boolean(billing && billing.status !== "active");

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] text-[var(--color-text-primary)] transition-colors">
      <BillingAlertBanner billing={billing} />
      <Topbar onMenuOpen={() => setSidebarOpen(true)} hasBanner />
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        hasBanner
      />
      <main
        className={`ml-0 lg:ml-64 p-4 lg:p-6 transition-[padding-top] duration-200 min-h-screen ${
          hasBanner ? "mt-28" : "mt-16"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
