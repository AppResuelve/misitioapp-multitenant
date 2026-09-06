const jwt = require('jsonwebtoken')
const { generateToken } = require('../services/auth.service')

const REFRESH_THRESHOLD = 24 * 60 * 60 // 24h en segundos

const shouldRefreshToken = (decoded) => {
  const expiresIn = decoded.exp - Math.floor(Date.now() / 1000)
  return expiresIn < REFRESH_THRESHOLD
}

const authMiddleware = (req, res, next) => {
  if (req.path.startsWith('/auth')) {
    return next()
  }

  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded

    // El token debe corresponder al tenant resuelto en la request
    if (req.tenant && decoded.tenantId && decoded.tenantId !== req.tenant.id) {
      return res.status(403).json({ error: 'Token no corresponde a este tenant' })
    }

    if (shouldRefreshToken(decoded)) {
      const newToken = generateToken(req.user)
      res.setHeader('X-New-Token', newToken)
    }

    next()
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }
}

module.exports = authMiddleware
