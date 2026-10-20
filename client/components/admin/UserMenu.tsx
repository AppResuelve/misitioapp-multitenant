// @ts-nocheck
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAlert } from "@/context/AlertContext";
import { LogOut, Key, Download, Check } from "lucide-react";
import ThemeToggle from "../ui/ThemeToggle"; // Ajustar la ruta relativa según corresponda

export function UserMenu({ onOpenChangePassword }) {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const Alert = useAlert();

  useEffect(() => {
    // 1. Detectar si la app ya está corriendo como PWA instalada
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsStandalone(checkStandalone);

    // 2. Escuchar evento de instalación
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      setMenuOpen(false);
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      if (outcome === "accepted") {
        setInstallPrompt(null);
      }
    } else {
      setMenuOpen(false);
      Alert.fire({
        type: "info",
        duration: 3000,
        message: isStandalone
          ? "La aplicación ya está instalada."
          : "Para instalarla, tocá el ícono de instalación en la barra de direcciones del navegador.",
      });
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen((prev) => !prev);
        }}
        className="flex items-center gap-2 sm:px-2 sm:py-1 rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors border border-transparent hover:border-[var(--color-border)]"
        title="Menú de usuario"
      >
        <div className="w-8 h-8 rounded-lg bg-[var(--color-bg-elevated)] border border-[var(--color-border)] flex items-center justify-center text-sm font-semibold text-[var(--color-text-primary)]">
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
          <div className="absolute right-0 top-full mt-7 w-60 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl shadow-xl z-20 p-1.5 transition-all">
            {/* Header usuario */}
            <div className="px-3 py-2 border-b border-[var(--color-border)] mb-1">
              <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {user?.name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)] truncate">
                {user?.email}
              </p>
            </div>

            {/* Selector de Tema (Sistema / Claro / Oscuro) */}
            <div className="my-1">
              <ThemeToggle />
            </div>

            {/* Botón Instalar Aplicación SIEMPRE VISIBLE */}
            <button
              type="button"
              onClick={handleInstallClick}
              disabled={isStandalone}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors text-left font-medium ${
                isStandalone
                  ? "opacity-50 cursor-not-allowed text-[var(--color-text-muted)]"
                  : "text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 cursor-pointer"
              }`}
            >
              <div className="flex items-center gap-2.5">
                {isStandalone ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <Download className="w-4 h-4 shrink-0" />
                )}
                <span>
                  {isStandalone ? "App instalada" : "Instalar aplicación"}
                </span>
              </div>
              {!isStandalone && !installPrompt && (
                <span className="text-[10px] text-[var(--color-text-muted)] border border-[var(--color-border)] px-1 py-0.5 rounded">
                  PWA
                </span>
              )}
            </button>

            {/* Cambiar contraseña */}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onOpenChangePassword();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] transition-colors text-left"
            >
              <Key className="w-4 h-4 shrink-0 text-[var(--color-text-muted)]" />
              <span>Cambiar contraseña</span>
            </button>

            <div className="my-1 border-t border-[var(--color-border)]" />

            {/* Cerrar sesión */}
            <button
              type="button"
              onClick={logout}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 dark:text-red-400 hover:bg-red-500/10 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
