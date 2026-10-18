export const AUTH_MESSAGES = {
  TOKEN_MISSING: "Token no proporcionado.",
  TOKEN_INVALID: "Token inválido o expirado.",
  PASSWORD_MIN_LENGTH: "La contraseña debe tener al menos 6 caracteres.",
  PASSWORDS_DONT_MATCH: "Las contraseñas no coinciden.",
  ACTIVATION_ERROR: "Error al activar cuenta.",
} as const;

export const AUTH_CONFIG = {
  MIN_PASSWORD_LENGTH: 6,
  REDIRECT_DELAY_MS: 2000,
  LOGIN_ROUTE: "/login",
} as const;
