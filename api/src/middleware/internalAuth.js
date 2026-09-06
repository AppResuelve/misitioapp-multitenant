const internalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization
  const secret = process.env.APPRESUELVE_SECRET

  if (!secret) {
    return res.status(500).json({ error: 'APPRESUELVE_SECRET no configurado' })
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de plataforma requerido' })
  }

  if (authHeader.split(' ')[1] !== secret) {
    return res.status(401).json({ error: 'Token de plataforma inválido' })
  }

  next()
}

module.exports = internalAuth
