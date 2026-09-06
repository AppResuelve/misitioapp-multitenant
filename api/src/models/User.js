const bcrypt = require('bcryptjs')

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'active'),
      defaultValue: 'pending',
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('admin'),
      defaultValue: 'admin',
      allowNull: false,
    },
    activationTokenHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    activationExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    activationSentAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resetTokenHash: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    resetExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'users',
    indexes: [{ unique: true, fields: ['tenantId', 'email'] }],
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          user.password = await bcrypt.hash(user.password, 10)
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password') && user.password) {
          user.password = await bcrypt.hash(user.password, 10)
        }
      },
    },
  })

  User.prototype.comparePassword = function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password)
  }

  User.associate = () => {
    // User no tiene relaciones directas por ahora.
    // A futuro podría relacionarse con Order (atendido por) o ActivityLog.
  }

  return User
}
