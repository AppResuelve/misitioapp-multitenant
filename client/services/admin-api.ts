"use client";
// @ts-nocheck
import axios from "axios";

const api = axios.create({
  baseURL: "/api",
});

let isLoggingOut = false;

export const resetLogoutFlag = () => {
  isLoggingOut = false;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorType = error.response?.data?.error;

    // 1. Sesión vencida o inválida (401)
    if (status === 401 && !isLoggingOut) {
      isLoggingOut = true;
      window.dispatchEvent(new CustomEvent("auth:logout"));
      return Promise.reject(error);
    }

    // 2. Tienda suspendida por facturación (403 store_suspended)
    if (status === 403 && errorType === "store_suspended") {
      // Evitamos bucle si el error proviene de la misma pantalla o endpoint de facturación
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.startsWith("/dashboard/settings/billing")
      ) {
        window.location.href = "/dashboard/settings/billing";
      }
    }

    return Promise.reject(error);
  },
);

export default api;

export async function uploadImage(file: any, folder = "productos") {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("folder", folder);
  const { data } = await api.post("/admin/upload", formData);
  return data;
}
