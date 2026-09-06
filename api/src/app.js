require('dotenv').config()

const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
const path = require('path')
const mountRoutes = require('./routes')
const errorHandler = require('./middleware/errorHandler')
const timeout = require('./middleware/timeout')
const { sequelize } = require('./models')

const app = express()

app.set('trust proxy', 1)

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)

app.use(cors({
  origin: allowedOrigins.length > 0
    ? (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, true)
        } else {
          cb(new Error('Origen no permitido por CORS'))
        }
      }
    : '*',
  credentials: true,
  exposedHeaders: ['X-New-Token'],
}))

app.use(helmet())
app.use(morgan('dev'))
app.use(express.json({ limit: '5mb' }))
app.use(timeout)

// API routes
mountRoutes(app)

// Servir dashboard en producción
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')))
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'))
    }
  })
}

// Error handler
app.use(errorHandler)

module.exports = app
