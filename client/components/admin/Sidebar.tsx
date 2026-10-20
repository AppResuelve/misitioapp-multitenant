// @ts-nocheck
"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  FileBox,
  Folder,
  Settings,
  Image,
  Store,
  X,
  Wrench,
  PieChart,
  SlidersHorizontal,
  Tag,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Percent,
  Globe,
  CreditCard,
  Wallet,
  Database,
  HelpCircle,
  Megaphone,
  CalendarDays,
  LayoutTemplate,
  Images,
  Layers,
} from "lucide-react";
import { useUnsavedChanges } from "@/context/UnsavedChangesContext";

const NAV_CONFIG = [
  {
    group: "General",
    items: [
      { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      {
        label: "Catálogo",
        icon: FolderOpen,
        children: [
          { to: "/dashboard/products", icon: FileBox, label: "Productos" },
          { to: "/dashboard/categories", icon: Folder, label: "Categorías" },
          { to: "/dashboard/tags", icon: Tag, label: "Etiquetas" },
          {
            to: "/dashboard/attributes",
            icon: SlidersHorizontal,
            label: "Atributos",
          },
        ],
      },
      {
        label: "Marketing",
        icon: Megaphone,
        children: [
          {
            to: "/dashboard/marketing/campaigns",
            icon: CalendarDays,
            label: "Campañas",
          },
          {
            to: "/dashboard/marketing/discounts",
            icon: Percent,
            label: "Descuentos",
          },
        ],
      },
      { to: "/dashboard/media", icon: Image, label: "Galería" },
    ],
  },
  {
    group: "Sitio público",
    items: [
      { to: "/dashboard/store", icon: Store, label: "Tienda" },
      {
        label: "Contenido",
        icon: Layers,
        children: [
          {
            to: "/dashboard/content/banners",
            icon: LayoutTemplate,
            label: "Banners",
          },
          {
            to: "/dashboard/content/carousels",
            icon: Images,
            label: "Carruseles",
          },
        ],
      },
    ],
  },
  {
    group: "Desarrollador",
    items: [
      {
        to: "/dashboard/change-requests",
        icon: Wrench,
        label: "Solicitar cambio",
      },
    ],
  },
];

const SETTINGS_ITEMS = [
  { to: "/dashboard/settings/general", label: "General", icon: Globe },
  { to: "/dashboard/settings/contact", label: "Contacto", icon: Settings },
  {
    to: "/dashboard/settings/payment",
    label: "Medios de pago",
    icon: Wallet,
  },
  { to: "/dashboard/settings/billing", label: "Facturación", icon: CreditCard },
  { to: "/dashboard/settings/data", label: "Datos", icon: Database },
  { to: "/dashboard/settings/help", label: "Ayuda", icon: HelpCircle },
];

export default function Sidebar({ open, onClose, logoUrl, hasBanner = false }) {
  const pathname = usePathname();
  const router = useRouter();
  const { confirmLeave } = useUnsavedChanges();

  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleSubmenu = (label: string) => {
    if (settingsOpen) setSettingsOpen(false);
    setOpenSubmenus((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label],
    );
  };

  const handleSettingsToggle = () => {
    if (openSubmenus.length > 0) setOpenSubmenus([]);
    setSettingsOpen((prev) => !prev);
  };

  useEffect(() => {
    NAV_CONFIG.forEach((group) => {
      group.items.forEach((item) => {
        if (item.children?.some((child) => pathname.startsWith(child.to))) {
          setOpenSubmenus((prev) =>
            prev.includes(item.label) ? prev : [...prev, item.label],
          );
        }
      });
    });
  }, [pathname]);

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

      {/* Nav */}
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
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isOpen ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>
                    {isOpen && (
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
                            <child.icon className="w-4 h-4" />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={async (e) => {
                    e.preventDefault();
                    if (settingsOpen) setSettingsOpen(false);
                    if (await confirmLeave()) {
                      onClose();
                      router.push(item.to);
                    }
                  }}
                  className={navItemClass(pathname === item.to)}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer del Sidebar */}
      <div className="border-t border-[var(--color-border)] p-3 space-y-1">
        <button
          onClick={handleSettingsToggle}
          className={`w-full ${navItemClass(settingsOpen)}`}
        >
          <Settings className="w-4 h-4" />
          <span className="flex-1 text-left">Configuración</span>
          {settingsOpen ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>

        {settingsOpen && (
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
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            ))}
          </div>
        )}
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
