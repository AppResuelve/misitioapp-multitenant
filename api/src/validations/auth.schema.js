const { z } = require('zod')

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
})

const emailSchema = z.object({
  email: z.string().email('Email inválido').max(255),
})

const tokenAndPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(128),
})

const changePasswordSchema = z.object({
  newPassword: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres').max(128),
})

module.exports = { loginSchema, emailSchema, tokenAndPasswordSchema, changePasswordSchema }
