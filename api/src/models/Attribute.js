module.exports = (sequelize, DataTypes) => {
  const Attribute = sequelize.define('Attribute', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    unitType: { type: DataTypes.ENUM('kg', 'm', 'l'), allowNull: true, defaultValue: null, field: 'unit_type' },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'sort_order' },
  }, {
    tableName: 'attributes',
    underscored: true,
  })

  Attribute.associate = (models) => {
    Attribute.hasMany(models.AttributeValue, { foreignKey: 'attribute_id', as: 'values' })
  }

  return Attribute
}
