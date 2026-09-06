require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') })

const { sequelize, User, Category } = require('../models')

const seed = async () => {
  try {
    await sequelize.authenticate()
    await sequelize.sync({ force: true })

    const adminEmail = process.env.ADMIN_EMAIL
    const adminPassword = process.env.ADMIN_PASSWORD
    if (adminEmail && adminPassword) {
      await User.create({
        name: 'Admin',
        email: adminEmail,
        password: adminPassword,
        status: 'active',
        role: 'admin',
      })
    }

    const defaultCategories = [
      { name: 'General', slug: 'general', order: 0 },
    ]
    await Category.bulkCreate(defaultCategories)

    process.exit(0)
  } catch (err) {
    console.error('Error en seed:', err)
    process.exit(1)
  }
}

seed()
