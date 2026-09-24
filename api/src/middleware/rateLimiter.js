const rateLimit = require('express-rate-limit')

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 12,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Esperá un minuto.' },
})

const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes de recuperación. Esperá 15 minutos.' },
})

// Límite por tenant + IP (evita que un cliente consuma la cuota de otro)
const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const tenant = req.headers['x-tenant-slug'] || 'unknown'
    return `${tenant}:${req.ip}`
  },
  message: { error: 'Demasiadas solicitudes. Esperá un minuto.' },
})

// Backstop global por IP (evita buckets infinitos con slugs inventados)
const globalIpLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  message: { error: 'Demasiadas solicitudes. Esperá un minuto.' },
})

module.exports = { authLimiter, emailLimiter, generalLimiter, globalIpLimiter }
