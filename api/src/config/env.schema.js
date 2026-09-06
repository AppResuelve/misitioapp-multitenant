const { z } = require('zod')

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL debe ser una URL válida'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  CORS_ORIGIN: z.string().optional(),
  PORT: z.coerce.number().optional(),
  APPRESUELVE_SECRET: z.string().optional(),
})

function validateEnv() {
  const result = envSchema.safeParse(process.env)
  if (!result.success) {
    const errors = result.error.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join('\n  ')
    console.error(`❌ Configuración de entorno inválida:\n  ${errors}`)
    process.exit(1)
  }
}

module.exports = { envSchema, validateEnv }
