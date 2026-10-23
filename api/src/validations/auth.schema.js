const { z } = require("zod");

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "La contraseña es requerida"),
});

const emailSchema = z.object({
  email: z.string().email("Email inválido").max(255),
});

const tokenSchema = z.object({
  token: z.string().min(1, "Token requerido"),
});

const tokenAndPasswordSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128),
});

const changePasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128),
});

// Vía A: Por código de 6 dígitos (Nuevo flujo OTP)
const resetWithCodeSchema = z.object({
  email: z.string().email("Email inválido").max(255),
  code: z
    .string()
    .length(6, "El código debe tener exactamente 6 dígitos")
    .regex(/^\d{6}$/, "El código solo puede contener números"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128),
});

// Vía B: Por token largo (Flujo por link /reset/[token])
const resetWithTokenSchema = z.object({
  token: z.string().min(1, "Token requerido"),
  password: z
    .string()
    .min(6, "La contraseña debe tener al menos 6 caracteres")
    .max(128),
});

// Esquema polimórfico: Acepta cualquiera de las dos vías
const resetPasswordSchema = z.union([
  resetWithCodeSchema,
  resetWithTokenSchema,
]);

module.exports = {
  loginSchema,
  emailSchema,
  tokenSchema,
  tokenAndPasswordSchema,
  changePasswordSchema,
  resetPasswordSchema,
};
