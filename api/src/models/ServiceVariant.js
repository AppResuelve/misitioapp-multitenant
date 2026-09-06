module.exports = (sequelize, DataTypes) => {
  const ServiceVariant = sequelize.define('ServiceVariant', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    serviceId: { type: DataTypes.INTEGER, allowNull: false, field: 'service_id' },
    price: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    durationMinutes: { type: DataTypes.INTEGER, allowNull: true, field: 'duration_minutes' },
    images: { type: DataTypes.JSONB, defaultValue: [], allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'sort_order' },
    status: { type: DataTypes.ENUM('active', 'draft'), defaultValue: 'active', allowNull: false },
  }, {
    tableName: 'service_variants',
    underscored: true,
  })

  ServiceVariant.associate = (models) => {
    ServiceVariant.belongsTo(models.Service, { foreignKey: 'service_id', as: 'service' })
    ServiceVariant.hasMany(models.ServiceVariantModifier, { foreignKey: 'service_variant_id', as: 'modifiers' })
    ServiceVariant.belongsToMany(models.AttributeValue, {
      through: 'variant_attribute_values',
      foreignKey: 'service_variant_id',
      otherKey: 'attribute_value_id',
      as: 'attributeValues',
      timestamps: true,
    })
  }

  return ServiceVariant
}
