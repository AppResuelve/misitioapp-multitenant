"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import CustomAlert from "@/components/ui/CustomAlert";
import { authService } from "@/services/auth.service";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string | undefined;

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setErrorMsg("Token de recuperación no válido o ausente.");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("La contraseña debe tener mínimo 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Las contraseñas no coinciden.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await authService.resetPasswordWithToken({ token, password });
      setDone(true);
      setTimeout(() => router.push("/dashboard"), 1800);
    } catch (err: any) {
      let msg = "Error al restablecer la contraseña";
      try {
        const b =
          typeof err.response?.data === "string"
            ? JSON.parse(err.response.data)
            : err.response?.data;
        msg = b?.error || b?.message || msg;
      } catch {}
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  // Caso: Sin token en la URL
  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4">
        <div className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 text-center shadow-xl">
          <p className="text-[var(--color-text-secondary)] text-sm mb-6">
            El enlace de recuperación es inválido o no contiene un token válido.
          </p>
          <Link href="/forgot">
            <Button variant="secondary" size="md">
              Volver a solicitar recuperación
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Caso: Contraseña restablecida con éxito
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4">
        <div className="w-full max-w-md bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-8 text-center shadow-xl">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            ¡Contraseña actualizada!
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Tu clave ha sido reestablecida. Redirigiendo al panel...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4 py-12">
      <div className="w-full max-w-md">
        {errorMsg && (
          <div className="mb-4">
            <CustomAlert
              type="error"
              variant="banner"
              title="Error"
              message={errorMsg}
              onClose={() => setErrorMsg(null)}
            />
          </div>
        )}

        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-2xl p-6 sm:p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center mx-auto mb-3.5">
              <KeyRound className="w-6 h-6 text-[var(--color-primary)]" />
            </div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
              Nueva contraseña
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
              Elegí una nueva contraseña para acceder a tu panel
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Contraseña con Toggle Eye */}
            <div className="w-full">
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-3.5 py-2 pr-10 rounded-xl text-sm transition-colors
                    bg-[var(--color-bg-base)] border border-[var(--color-border)]
                    text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]
                    focus:outline-none focus:ring-1 focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]"
                  required
                  autoFocus
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

            {/* Input Confirmar Contraseña */}
            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repetí la contraseña"
              required
            />

            <Button
              type="submit"
              size="md"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner size="sm" />
                  <span>Actualizando...</span>
                </>
              ) : (
                "Actualizar contraseña"
              )}
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-[var(--color-border)] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al login</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
