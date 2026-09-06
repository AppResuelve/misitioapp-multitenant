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
  Key,
  LogOut,
  X,
  Wrench,
  PieChart,
  MoreHorizontal,
  Eye,
  SlidersHorizontal,
  Tag,
  ChevronDown,
  ChevronRight,
  FolderOpen,
  Percent,
} from "lucide-react";
import { useAuth } from "@/components/admin/context/AuthContext";
import { useAlert } from "@/components/admin/ui/AlertContext";
import { Modal } from "@/components/admin/ui/Modal";
import api from "@/services/admin-api";
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
      { to: "/dashboard/settings", icon: Settings, label: "Configuración" },
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

export default function Sidebar({ open, onClose, logoUrl }) {
  const { user, logout } = useAuth();
  const Alert = useAlert();
  const pathname = usePathname();
  const router = useRouter();
  const { isDirty, confirmLeave } = useUnsavedChanges();

  const handleSidebarNav = async (to: string) => {
    if (!await confirmLeave()) return
    onClose?.()
    router.push(to)
  }

  const [pwOpen, setPwOpen] = useState(false);
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openSubmenus, setOpenSubmenus] = useState<string[]>([]);

  const toggleSubmenu = (label: string) => {
    setOpenSubmenus(prev =>
      prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label]
    )
  }

  useEffect(() => {
    if (!open) setMenuOpen(false);
  }, [open]);

  useEffect(() => {
    NAV_CONFIG.forEach(group => {
      group.items.forEach(item => {
        if (item.children?.some(child => pathname.startsWith(child.to))) {
          setOpenSubmenus(prev => prev.includes(item.label) ? prev : [...prev, item.label])
        }
      })
    })
  }, [pathname])

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwNew || pwNew.length < 6) {
      setPwError("Mínimo 6 caracteres");
      return;
    }
    if (pwNew !== pwConfirm) {
      setPwError("Las contraseñas no coinciden");
      return;
    }
    setPwError("");
    setPwSaving(true);
    try {
      await api.put("/auth/change-password", { newPassword: pwNew });
      Alert.fire({ message: "Contraseña actualizada", type: "success" });
      setPwOpen(false);
      setPwNew("");
      setPwConfirm("");
    } catch (err) {
      let msg = "Error al cambiar contraseña";
      try {
        const body =
          typeof err.response?.data === "string"
            ? JSON.parse(err.response.data)
            : err.response?.data;
        msg = body?.error || body?.message || msg;
      } catch {}
      setPwError(msg);
    } finally {
      setPwSaving(false);
    }
  };

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
                      onClick={() => toggleSubmenu(item.label)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-md font-medium transition-colors ${
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
                    if (await confirmLeave()) { onClose(); router.push(item.to) }
                  }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-md font-medium transition-colors ${
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

      {/* User + dropdown */}
      <div className="border-t border-zinc-800 px-4 pt-4 pb-8 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
            {user?.name?.[0]?.toUpperCase() || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-zinc-200 truncate">
              {user?.name}
            </p>
            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
          </div>
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
              title="Menú"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-2 bottom-full mb-2 w-52 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 p-1">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setPwOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-md text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Cambiar contraseña
                  </button>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-md text-zinc-300 hover:bg-zinc-700 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
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

      {/* Change password modal */}
      <Modal
        open={pwOpen}
        onClose={() => {
          setPwOpen(false);
          setPwError("");
          setPwNew("");
          setPwConfirm("");
        }}
        title="Cambiar contraseña"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          {pwError && (
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {pwError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                className="w-full px-3 py-2 pr-10 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-500 text-sm"
                placeholder="Mínimo 6 caracteres"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1.5">
              Confirmar nueva
            </label>
            <input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 focus:outline-none focus:border-cyan-500 text-sm"
              required
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={() => {
                setPwOpen(false);
                setPwError("");
                setPwNew("");
                setPwConfirm("");
              }}
              className="px-4 py-2 rounded-lg text-sm text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-cyan-500 text-white hover:bg-cyan-600 transition-colors disabled:opacity-50"
              disabled={pwSaving}
            >
              {pwSaving ? "Guardando..." : "Actualizar"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
