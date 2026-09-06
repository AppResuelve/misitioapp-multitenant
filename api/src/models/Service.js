module.exports = (sequelize, DataTypes) => {
  const Service = sequelize.define('Service', {
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
    slug: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    price: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      allowNull: true,
    },
    images: {
      type: DataTypes.JSONB,
      defaultValue: [],
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'draft'),
      defaultValue: 'active',
      allowNull: false,
    },
  }, {
    tableName: 'services',
    indexes: [{ unique: true, fields: ['tenantId', 'slug'] }],
  })

  Service.associate = (models) => {
    Service.hasMany(models.ServiceVariant, { foreignKey: 'service_id', as: 'variants' })
  }

  return Service
}
