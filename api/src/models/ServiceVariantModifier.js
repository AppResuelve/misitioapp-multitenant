module.exports = (sequelize, DataTypes) => {
  const ServiceVariantModifier = sequelize.define('ServiceVariantModifier', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    serviceVariantId: { type: DataTypes.INTEGER, allowNull: false, field: 'service_variant_id' },
    name: { type: DataTypes.STRING(255), allowNull: false },
    price: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0 },
    maxSelection: { type: DataTypes.INTEGER, allowNull: true, field: 'max_selection' },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'sort_order' },
    status: { type: DataTypes.ENUM('active', 'draft'), defaultValue: 'active', allowNull: false },
  }, {
    tableName: 'service_variant_modifiers',
    underscored: true,
  })

  ServiceVariantModifier.associate = (models) => {
    ServiceVariantModifier.belongsTo(models.ServiceVariant, { foreignKey: 'service_variant_id', as: 'variant' })
  }

  return ServiceVariantModifier
}
