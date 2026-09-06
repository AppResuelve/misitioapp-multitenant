require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const { Sequelize } = require('sequelize')

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: { require: true, rejectUnauthorized: false },
    decimalNumbers: true,
  } : {
    decimalNumbers: true,
  },
  define: {
    timestamps: true,
    underscored: true,
  },
  pool: {
    max: 10,
    min: 2,
    acquire: 30000,
    idle: 10000,
  },
})

module.exports = sequelize
