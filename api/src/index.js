const app = require('./app')
const { sequelize } = require('./models')
const { validateEnv } = require('./config/env.schema')

const PORT = process.env.PORT || 3001

validateEnv()

const start = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync()

    const server = app.listen(PORT, () => {})

    const shutdown = async (signal) => {
      server.close(() => {})
      try { await sequelize.close() } catch {}
      process.exit(0)
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'))
    process.on('SIGINT', () => shutdown('SIGINT'))
  } catch (err) {
    console.error('Error al iniciar el servidor:', err)
    try { await sequelize.close() } catch {}
    process.exit(1)
  }
}

start()
