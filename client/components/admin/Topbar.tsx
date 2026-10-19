// @ts-nocheck
"use client";
import { useState } from "react";
import { Menu, LogOut, Key, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { Modal } from "@/components/ui";
import api from "@/services/admin-api";

export default function Topbar({ onMenuOpen, hasBanner = false }) {
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
      <header
        className={`fixed left-0 right-0 z-40 h-16 bg-[var(--color-bg-surface)] border-b border-[var(--color-border)] flex items-center justify-between px-4 transition-[top] duration-200 ${
          hasBanner ? "top-10" : "top-0"
        }`}
      >
        {/* Mobile hamburger */}
        <button
          type="button"
          onClick={onMenuOpen}
          className="lg:hidden p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Spacer for desktop */}
        <div className="hidden lg:block" />

        {/* User menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors border border-transparent hover:border-[var(--color-border)]"
            title="Menú"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-xs font-semibold text-[var(--color-text-primary)]">
              {user?.name?.[0]?.toUpperCase() || "A"}
            </div>
            <span className="hidden sm:block text-sm font-medium text-[var(--color-text-primary)]">
              {user?.name}
            </span>
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-xl z-20 p-1.5 transition-all">
                <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
                  <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {user?.name}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)] truncate">
                    {user?.email}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setPwOpen(true);
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors text-left"
                >
                  <Key className="w-4 h-4 text-[var(--color-text-muted)]" />
                  Cambiar contraseña
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-left"
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
            <div className="px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
              {pwError}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={pwNew}
                onChange={(e) => setPwNew(e.target.value)}
                className="w-full px-3 py-2 pr-10 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] text-sm transition-colors"
                placeholder="Mínimo 6 caracteres"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
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
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Confirmar nueva
            </label>
            <input
              type="password"
              value={pwConfirm}
              onChange={(e) => setPwConfirm(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] text-sm transition-colors"
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
              className="px-4 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition-colors shadow-md shadow-[var(--color-primary)]/20 disabled:opacity-50"
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
