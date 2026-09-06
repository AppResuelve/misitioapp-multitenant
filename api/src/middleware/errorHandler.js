const errorHandler = (err, req, res, _next) => {
  console.error(err.stack)

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'El archivo supera los 10MB. Reducí el tamaño.' })
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({ error: 'Demasiados archivos. Subí de a uno.' })
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ error: 'Campo de archivo inesperado.' })
    }
    return res.status(400).json({ error: err.message })
  }

  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message)
    return res.status(400).json({ error: 'Error de validación', details: messages })
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    const fields = err.errors.map((e) => e.path)
    return res.status(409).json({ error: 'Ya existe un registro con esos datos', fields })
  }

  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({ error: 'Token inválido o expirado' })
  }

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
  })
}

module.exports = errorHandler
