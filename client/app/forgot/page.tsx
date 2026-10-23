// app/forgot/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Spinner } from "@/components/ui/Spinner";
import { OtpInput } from "@/components/ui/OtpInput";
import CustomAlert from "@/components/ui/CustomAlert";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<"request" | "verify">("request");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // Paso 1: Pedir código OTP al correo
  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMsg("Ingresá tu correo electrónico");
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await authService.requestResetCode({ email: email.trim().toLowerCase() });
      setStep("verify");
    } catch (err: any) {
      const b =
        typeof err.response?.data === "string"
          ? JSON.parse(err.response.data)
          : err.response?.data;
      setErrorMsg(
        b?.error || b?.message || "No se pudo enviar el código de recuperación",
      );
    } finally {
      setLoading(false);
    }
  };

  // Paso 2: Validar código y cambiar contraseña
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setErrorMsg("Completá los 6 dígitos del código");
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (password !== confirm) {
      setErrorMsg("Las contraseñas no coinciden");
      return;
    }

    setErrorMsg(null);
    setLoading(true);
    try {
      await authService.resetPasswordWithCode({
        email: email.trim().toLowerCase(),
        code,
        password,
      });
      setDone(true);
      setTimeout(() => router.push("/login"), 1800);
    } catch (err: any) {
      const b =
        typeof err.response?.data === "string"
          ? JSON.parse(err.response.data)
          : err.response?.data;
      setErrorMsg(b?.error || b?.message || "Código inválido o expirado");
    } finally {
      setLoading(false);
    }
  };

  // Estado completado exitosamente
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
            Tu clave se cambió correctamente. Redirigiendo al inicio de
            sesión...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Banner de error flotante si ocurre algún fallo */}
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
          {step === "request" ? (
            /* ══ PASO 1: SOLICITAR CÓDIGO ══ */
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center mx-auto mb-3.5">
                  <Mail className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Recuperar contraseña
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                  Ingresá el correo asociado a tu cuenta para recibir un código
                  de seguridad
                </p>
              </div>

              <form onSubmit={handleRequestCode} className="space-y-4">
                <Input
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@comercio.com"
                  required
                  autoFocus
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
                      <span>Enviando código...</span>
                    </>
                  ) : (
                    "Enviar código de recuperación"
                  )}
                </Button>
              </form>
            </>
          ) : (
            /* ══ PASO 2: VERIFICAR OTP + NUEVA PASS ══ */
            <>
              <div className="text-center mb-6">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 flex items-center justify-center mx-auto mb-3.5">
                  <KeyRound className="w-6 h-6 text-[var(--color-primary)]" />
                </div>
                <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Verificá tu código
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                  Enviamos 6 dígitos a{" "}
                  <span className="font-semibold text-[var(--color-text-primary)]">
                    {email}
                  </span>
                </p>
              </div>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-[var(--color-text-secondary)]">
                      Código de verificación
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMsg(null);
                        setStep("request");
                      }}
                      className="text-xs font-semibold text-[var(--color-primary)] hover:underline cursor-pointer"
                    >
                      Cambiar correo
                    </button>
                  </div>
                  <OtpInput
                    value={code}
                    onChange={(val) => {
                      setCode(val);
                      setErrorMsg(null);
                    }}
                    error={Boolean(errorMsg && code.length < 6)}
                  />
                </div>

                {/* Contraseña con botón de visualización integrado */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
                    Nueva contraseña
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
                    "Restablecer contraseña"
                  )}
                </Button>
              </form>
            </>
          )}

          <div className="mt-6 pt-5 border-t border-[var(--color-border)] text-center">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver al inicio de sesión</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
