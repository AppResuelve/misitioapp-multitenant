module.exports = (sequelize, DataTypes) => {
  const SkuAttributeValue = sequelize.define('SkuAttributeValue', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    skuId: { type: DataTypes.INTEGER, allowNull: false, field: 'sku_id' },
    attributeValueId: { type: DataTypes.INTEGER, allowNull: false, field: 'attribute_value_id' },
  }, {
    tableName: 'sku_attribute_values',
    underscored: true,
  })

  return SkuAttributeValue
}
