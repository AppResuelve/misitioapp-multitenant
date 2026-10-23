"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, PieChart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import CustomAlert from "@/components/ui/CustomAlert";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login(email.trim().toLowerCase(), password);
      router.push("/dashboard");
    } catch (err: any) {
      const b =
        typeof err.response?.data === "string"
          ? JSON.parse(err.response.data)
          : err.response?.data;
      setErrorMsg(
        b?.error || b?.message || "Credenciales inválidas o error de conexión",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Banner de error flotante */}
        {errorMsg && (
          <div className="mb-4">
            <CustomAlert
              type="error"
              variant="banner"
              title="Error al ingresar"
              message={errorMsg}
              onClose={() => setErrorMsg(null)}
            />
          </div>
        )}

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 shadow-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center text-[var(--color-primary)] mx-auto mb-3.5 shadow-sm">
              <PieChart className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Panel Admin
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
              Ingresá tus credenciales para administrar tu tienda
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Email con el componente reutilizable */}
            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@comercio.com"
              required
              autoFocus
            />

            {/* Input Password con botón toggle */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                  Contraseña
                </label>
                <Link
                  href="/forgot"
                  className="text-xs font-semibold text-[var(--color-primary)] hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-3.5 py-2 pr-10 rounded-xl text-sm transition-colors
                    bg-[var(--color-bg-base)] border border-[var(--color-border)]
                    text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                    focus:outline-none focus:ring-1 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de Submit con Spinner */}
            <Button
              type="submit"
              size="md"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>Ingresando...</span>
                </>
              ) : (
                "Ingresar al panel"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
