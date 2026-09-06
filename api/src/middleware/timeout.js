const TIMEOUT_MS = 30_000

const timeout = (req, res, next) => {
  res.setTimeout(TIMEOUT_MS, () => {
    if (!res.headersSent) {
      res.status(408).json({ error: 'Request timeout' })
    }
  })
  next()
}

module.exports = timeout
