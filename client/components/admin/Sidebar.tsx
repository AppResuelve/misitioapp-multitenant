// @ts-nocheck
'use client'
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  Tags,
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
          { to: "/dashboard/products", icon: Package, label: "Productos" },
          { to: "/dashboard/categories", icon: Tags, label: "Categorías" },
          { to: "/dashboard/tags", icon: Tag, label: "Etiquetas" },
          { to: "/dashboard/discounts", icon: Percent, label: "Descuentos" },
          { to: "/dashboard/attributes", icon: SlidersHorizontal, label: "Atributos" },
        ],
      },
      { to: "/dashboard/media", icon: Image, label: "Galería" },
    ],
  },
  {
    group: "Sitio público",
    items: [
      { to: "/dashboard/store", icon: Store, label: "Tienda" },
    ],
  },
  {
    group: "Desarrollador",
    items: [
      { to: "/dashboard/change-requests", icon: Wrench, label: "Solicitar cambio" },
    ],
  },
]

const SETTINGS_ITEMS = [
  { to: "/dashboard/settings/general", label: "General" },
  { to: "/dashboard/settings/contact", label: "Contacto" },
  { to: "/dashboard/settings/billing", label: "Facturación" },
  { to: "/dashboard/settings/data", label: "Datos" },
  { to: "/dashboard/settings/help", label: "Ayuda" },
]

export default function Sidebar({ open, onClose, logoUrl }) {
  const pathname = usePathname();
  const router = useRouter();
  const { confirmLeave } = useUnsavedChanges();

  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  const handleSettingsToggle = () => {
    setSettingsOpen(!settingsOpen);
  }

  useEffect(() => {
    NAV_CONFIG.forEach(group => {
      group.items.forEach(item => {
        if (item.children?.some(child => pathname.startsWith(child.to))) {
          setOpenSubmenus(prev => prev.includes(item.label) ? prev : [...prev, item.label])
        }
      })
    })
  }, [pathname])

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt=""
              className="w-10 h-10 rounded-lg object-contain"
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white">
              <PieChart className="w-5 h-5" />
            </div>
          )}
          <span className="font-semibold text-zinc-100 text-sm">
            Administración
          </span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_CONFIG.map((group, gi) => (
          <div key={group.group}>
            {gi > 0 && <div className="border-t border-zinc-800/50" />}
            <p className="px-3 pt-2 text-[12px] font-semibold text-zinc-600 uppercase tracking-wider">
              {group.group}
            </p>
            {group.items.map((item) => {
              if (item.children) {
                const isOpen = openSubmenus.includes(item.label)
                const isActive = item.children.some(c => pathname.startsWith(c.to))
                return (
                  <div key={item.label}>
                    <button
                      onClick={() => {
                        if (settingsOpen) setSettingsOpen(false);
                        toggleSubmenu(item.label);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-cyan-500/10 text-cyan-400"
                          : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span className="flex-1 text-left">{item.label}</span>
                      {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {isOpen && (
                      <div className="ml-4">
                        {item.children.map((child) => (
                          <Link
                            key={child.to}
                            href={child.to}
                            onClick={async (e) => {
                              e.preventDefault()
                              if (await confirmLeave()) { onClose(); router.push(child.to) }
                            }}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              pathname.startsWith(child.to)
                                ? "bg-cyan-500/10 text-cyan-400"
                                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                            }`}
                          >
                            <child.icon className="w-3.5 h-3.5" />
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              }
              return (
                <Link
                  key={item.to}
                  href={item.to}
                  onClick={async (e) => {
                    e.preventDefault()
                    if (settingsOpen) setSettingsOpen(false);
                    if (await confirmLeave()) { onClose(); router.push(item.to) }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    pathname === item.to
                      ? "bg-cyan-500/10 text-cyan-400"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Settings expandable */}
      <div className="border-t border-zinc-800 shrink-0">
        <button
          onClick={() => {
            if (openSubmenus.length > 0) setOpenSubmenus([]);
            handleSettingsToggle();
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
            settingsOpen || pathname.startsWith("/dashboard/settings")
              ? "bg-cyan-500/10 text-cyan-400"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          }`}
        >
          <Settings className="w-4 h-4" />
          <span className="flex-1 text-left">Configuración</span>
          {settingsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
        {settingsOpen && (
          <div className="pb-2">
            {SETTINGS_ITEMS.map((item) => (
              <Link
                key={item.to}
                href={item.to}
                onClick={async (e) => {
                  e.preventDefault()
                  if (await confirmLeave()) { onClose(); setSettingsOpen(false); router.push(item.to) }
                }}
                className={`flex items-center gap-3 pl-10 pr-4 py-2 text-sm transition-colors ${
                  pathname.startsWith(item.to)
                    ? "text-cyan-400"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
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
      {/* Overlay mobile */}
      {open && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-full w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col z-50
          transition-transform duration-300
          lg:translate-x-0
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {sidebarContent}
      </aside>
    </>
  );
}