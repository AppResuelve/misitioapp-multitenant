module.exports = (sequelize, DataTypes) => {
  const ProductSku = sequelize.define('ProductSku', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false, field: 'product_id' },
    retailPrice: { type: DataTypes.DECIMAL(12, 2), defaultValue: 0, field: 'retail_price' },
    wholesalePrice: { type: DataTypes.DECIMAL(12, 2), allowNull: true, field: 'wholesale_price' },
    wholesaleMinQty: { type: DataTypes.INTEGER, allowNull: true, field: 'wholesale_min_qty' },
    stock: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
    sku: { type: DataTypes.STRING(100), allowNull: true },
    images: { type: DataTypes.JSONB, defaultValue: [], allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'sort_order' },
    status: { type: DataTypes.ENUM('active', 'draft'), defaultValue: 'active', allowNull: false },
  }, {
    tableName: 'product_skus',
    underscored: true,
  })

  ProductSku.associate = (models) => {
    ProductSku.belongsTo(models.Product, { foreignKey: 'product_id', as: 'product' })
    ProductSku.belongsToMany(models.AttributeValue, {
      through: 'sku_attribute_values',
      foreignKey: 'sku_id',
      otherKey: 'attribute_value_id',
      as: 'attributeValues',
      timestamps: true,
    })
  }

  return ProductSku
}
