module.exports = (sequelize, DataTypes) => {
  const AttributeValue = sequelize.define('AttributeValue', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    attributeId: { type: DataTypes.INTEGER, allowNull: false, field: 'attribute_id' },
    value: { type: DataTypes.STRING(255), allowNull: false },
    images: { type: DataTypes.JSONB, defaultValue: [], allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'sort_order' },
  }, {
    tableName: 'attribute_values',
    underscored: true,
  })

  AttributeValue.associate = (models) => {
    AttributeValue.belongsTo(models.Attribute, { foreignKey: 'attribute_id', as: 'attribute' })
  }

  return AttributeValue
}
