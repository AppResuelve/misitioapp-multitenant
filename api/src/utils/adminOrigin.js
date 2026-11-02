// src/utils/adminOrigin.js

/**
 * Deriva la URL base del panel admin para un tenant específico.
 * Regla de negocio en producción: admin.{dominio}
 * En desarrollo local: apunta al puerto de desarrollo.
 */
function adminOriginFromTenant(tenant) {
  // 1. Si el tenant tiene configurado adminDomain explícito en la DB
  if (tenant?.adminDomain) {
    const clean = tenant.adminDomain
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    const protocol = clean.includes("localhost") ? "http" : "https";
    return `${protocol}://${clean}`;
  }

  // 2. Si tiene dominio principal asignado
  if (tenant?.domain) {
    const clean = tenant.domain.replace(/^https?:\/\//, "").replace(/\/$/, "");

    // Si estás testeando con un dominio local tipo "localhost:3000" o similar
    if (clean.includes("localhost")) {
      return `http://${clean}`;
    }

    // Producción: antepone 'admin.' si no lo tiene y fuerza HTTPS
    return clean.startsWith("admin.")
      ? `https://${clean}`
      : `https://admin.${clean}`;
  }

  // 3. Fallback estricto de desarrollo local si el tenant no tiene dominio seteado
  const localOrigin =
    process.env.CORS_ORIGIN?.split(",")[0] || "http://localhost:5173";
  return localOrigin.replace(/\/$/, "");
}

module.exports = { adminOriginFromTenant };
