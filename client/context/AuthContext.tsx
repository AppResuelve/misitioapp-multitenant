// @ts-nocheck
"use client";
import { createContext, useContext, useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import api, { resetLogoutFlag } from "@/services/admin-api";

const AuthCtx = createContext(null);

const PUBLIC_ROUTES = ["/login", "/activate", "/forgot", "/reset"];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  // 1. Carga inicial del usuario
  useEffect(() => {
    api
      .get("/auth/me")
      .then(({ data }) => setUser(data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // 2. Escuchar evento global de logout
  useEffect(() => {
    const h = () => setUser(null);
    window.addEventListener("auth:logout", h);
    return () => window.removeEventListener("auth:logout", h);
  }, []);

  // 3. Control de rutas y protección
  useEffect(() => {
    if (loading) return;

    // Caso A: No está autenticado e intenta acceder a ruta privada
    if (!user && !isPublic) {
      router.replace("/login");
    }

    // Caso B: Ya está autenticado e intenta acceder a login o auth pública
    if (user && isPublic) {
      router.replace("/dashboard");
    }
  }, [loading, user, isPublic, router]);

  const login = async (email, password) => {
    resetLogoutFlag();
    const { data } = await api.post("/auth/login", { email, password });
    setUser(data.user);
    return data.user;
  };

  const logout = async () => {
    resetLogoutFlag();
    try {
      await api.post("/auth/logout");
    } catch {}
    setUser(null);
  };

  return (
    <AuthCtx.Provider value={{ user, loading, isPublic, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
