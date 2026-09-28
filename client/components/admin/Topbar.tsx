// @ts-nocheck
'use client'
import { useState } from "react";
import { Menu, MoreHorizontal, LogOut, Key, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/components/admin/context/AuthContext";
import { useAlert } from "@/components/admin/ui/AlertContext";
import { Modal } from "@/components/admin/ui/Modal";
import api from "@/services/admin-api";

export default function Topbar({ onMenuOpen }) {
  const { user, logout } = useAuth();
  const Alert = useAlert();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [pwNew, setPwNew] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

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

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-zinc-900 border-b border-zinc-800 flex items-center justify-between px-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuOpen}
          className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-2 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            title="Menú"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <span className="hidden sm:block text-sm text-zinc-300">{user?.name}</span>
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-52 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 p-1">
                <div className="px-3 py-2 border-b border-zinc-700 mb-1">
                  <p className="text-sm font-medium text-zinc-200 truncate">{user?.name}</p>
                  <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setPwOpen(true);
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Cambiar contraseña
                </button>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md text-sm text-zinc-300 hover:bg-zinc-700 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar sesión
                </button>
              </div>
            </>
          )}
        </div>
      </header>

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
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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