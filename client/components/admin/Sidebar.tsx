// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { PieChart, X, ChevronDown, Settings } from "lucide-react";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";
import { NAV_CONFIG, SETTINGS_ITEMS } from "@/data/admin/navigation";

export default function Sidebar({ open, onClose, logoUrl, hasBanner = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const { confirmLeave } = useUnsavedChanges();

  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // 1. Efecto: la ruta activa auto-cierra los demás grupos
  useEffect(() => {
    const isSettingsActive = SETTINGS_ITEMS.some((item) =>
      pathname.startsWith(item.to),
    );

    if (isSettingsActive) {
      setSettingsOpen(true);
      setOpenSubmenus([]);
      return;
    }

    let activeMenuLabel: string | null = null;
    for (const group of NAV_CONFIG) {
      for (const item of group.items) {
        if (item.children?.some((child) => pathname.startsWith(child.to))) {
          activeMenuLabel = item.label;
          break;
        }
      }
      if (activeMenuLabel) break;
    }

    if (activeMenuLabel) {
      setOpenSubmenus([activeMenuLabel]);
      setSettingsOpen(false);
    } else {
      // Rutas directas (ej: /dashboard o /dashboard/media)
      setOpenSubmenus([]);
      setSettingsOpen(false);
    }
  }, [pathname]);

  // 2. Toggle manual de submenús (permite varios abiertos mientras no se cambie de ruta)
  const toggleSubmenu = (label: string) => {
    if (settingsOpen) setSettingsOpen(false);
    setOpenSubmenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  // 3. Toggle manual de Configuración: siempre repliega los demás
  const handleSettingsToggle = () => {
    if (!settingsOpen) {
      setOpenSubmenus([]);
    }
    setSettingsOpen((prev) => !prev);
  };

  const navItemClass = (active: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? "bg-[var(--color-primary-light)] text-[var(--color-primary-text)] font-semibold"
        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]"
    }`;

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-[var(--color-border)] shrink-0">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="w-9 h-9 rounded-lg object-contain"
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-[var(--color-primary)] flex items-center justify-center text-white shadow-sm">
              <PieChart className="w-5 h-5" />
            </div>
          )}
          <span className="font-semibold text-[var(--color-text-primary)] text-sm">
            Administración
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navegación Principal */}
      <nav className="flex-1 px-3 py-3 space-y-3 overflow-y-auto">
        {NAV_CONFIG.map((group, gi) => (
          <div key={group.group}>
            {gi > 0 && (
              <div className="border-t border-[var(--color-border)] my-2" />
            )}
            <p className="px-3 pb-1 text-[11px] font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              {group.group}
            </p>
            {group.items.map((item) => {
              if (item.children) {
                const isOpen = openSubmenus.includes(item.label);
                const isActive = item.children.some((c) =>
                  pathname.startsWith(c.to),
                );

                return (
                  <div key={item.label}>
                    <button
                      onClick={() => toggleSubmenu(item.label)}
                      className={`w-full ${navItemClass(isActive)}`}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 transition-transform duration-200 ease-in-out ${
                          isOpen ? "rotate-0" : "-rotate-90"
                        }`}
                      />
                    </button>

                    {/* Contenedor animado con grid de 200ms */}
                    <div
                      className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
                        isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="ml-4 mt-1 pl-2 border-l border-[var(--color-border)] space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.to}
                              href={child.to}
                              onClick={async (e) => {
                                e.preventDefault();
                                if (await confirmLeave()) {
                                  onClose();
                                  router.push(child.to);
                                }
                              }}
                              className={navItemClass(
                                pathname.startsWith(child.to),
                              )}
                            >
                              <child.icon className="w-4 h-4 shrink-0" />
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (await confirmLeave()) {
                      onClose();
                      router.push(item.to);
                    }
                  }}
                  className={navItemClass(pathname === item.to)}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer del Sidebar: Configuración */}
      <div className="border-t border-[var(--color-border)] p-3 space-y-1">
        <button
          onClick={handleSettingsToggle}
          className={`w-full ${navItemClass(
            settingsOpen ||
              SETTINGS_ITEMS.some((i) => pathname.startsWith(i.to)),
          )}`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left">Configuración</span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform duration-200 ease-in-out ${
              settingsOpen ? "rotate-0" : "-rotate-90"
            }`}
          />
        </button>

        {/* Contenedor animado con grid de 200ms para Configuración */}
        <div
          className={`grid transition-[grid-template-rows] duration-200 ease-in-out ${
            settingsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          }`}
        >
          <div className="overflow-hidden">
            <div className="mt-1 ml-4 pl-2 border-l border-[var(--color-border)] space-y-1">
              {SETTINGS_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (await confirmLeave()) {
                      onClose();
                      router.push(item.to);
                    }
                  }}
                  className={navItemClass(pathname.startsWith(item.to))}
                >
                  <item.icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed left-0 bottom-0 w-64 bg-[var(--color-bg-surface)] border-r border-[var(--color-border)] flex flex-col z-50
          transition-all duration-300
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
          ${hasBanner ? "top-14" : "top-0"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
