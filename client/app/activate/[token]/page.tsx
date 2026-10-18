"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Button, Spinner, Input } from "@/components/ui";
import { AUTH_MESSAGES, AUTH_CONFIG } from "@/constants/auth";
import api from "@/services/admin-api";

export default function Activate() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!token) {
      setError(AUTH_MESSAGES.TOKEN_MISSING);
      setTokenInvalid(true);
      setLoading(false);
      return;
    }

    api
      .post("/auth/validate-token", { token })
      .then(({ data }) => setEmail(data.email))
      .catch((err) => {
        const msg =
          err.response?.data?.error ||
          err.response?.data?.message ||
          AUTH_MESSAGES.TOKEN_INVALID;
        setError(msg);
        setTokenInvalid(true);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < AUTH_CONFIG.MIN_PASSWORD_LENGTH) {
      setError(AUTH_MESSAGES.PASSWORD_MIN_LENGTH);
      return;
    }
    if (password !== confirm) {
      setError(AUTH_MESSAGES.PASSWORDS_DONT_MATCH);
      return;
    }

    setError("");
    setSubmitting(true);
    try {
      await api.post("/auth/activate", { token, password });
      setDone(true);
      redirectTimerRef.current = setTimeout(() => {
        router.push(AUTH_CONFIG.LOGIN_ROUTE);
      }, AUTH_CONFIG.REDIRECT_DELAY_MS);
    } catch (err: any) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.message ||
        AUTH_MESSAGES.ACTIVATION_ERROR;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Estado de Carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)]">
        <Spinner size="lg" />
      </div>
    );
  }

  // 2. Estado de Cuenta Activada
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4">
        <div className="text-center max-w-sm w-full p-8 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            ¡Cuenta activada!
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Redirigiendo al inicio de sesión...
          </p>
        </div>
      </div>
    );
  }

  // 3. Estado de Token Inválido o Expirado
  if (tokenInvalid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4">
        <div className="text-center max-w-sm w-full p-8 rounded-2xl bg-[var(--color-bg-card)] border border-[var(--color-border)] shadow-xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4 border border-red-500/20">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            Enlace inválido
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6">
            {error}
          </p>
          <Link
            href={AUTH_CONFIG.LOGIN_ROUTE}
            className="inline-flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg text-sm font-medium bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:bg-[var(--color-border)] transition-colors"
          >
            Ir al login
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // 4. Formulario de Activación
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-base)] px-4 py-12 transition-colors">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary-light)] border border-[var(--color-primary)]/20 flex items-center justify-center mx-auto mb-4">
            <Key className="w-8 h-8 text-[var(--color-primary-text)]" />
          </div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Activá tu cuenta
          </h1>
          {email && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-1.5 font-medium">
              {email}
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-[var(--color-bg-card)] p-6 rounded-2xl border border-[var(--color-border)] shadow-xl"
        >
          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5">
              Contraseña
            </label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3 py-2 pr-10 bg-[var(--color-bg-base)] border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)] transition-colors"
                required
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
                title={showPw ? "Ocultar contraseña" : "Ver contraseña"}
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setConfirm(e.target.value)
            }
            placeholder="Repetí la contraseña"
            required
          />

          <Button type="submit" className="w-full mt-2" disabled={submitting}>
            {submitting ? "Activando..." : "Activar cuenta"}
          </Button>

          <div className="pt-2 text-center">
            <Link
              href={AUTH_CONFIG.LOGIN_ROUTE}
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors"
            >
              ¿Ya te activaste? Ir al login
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
