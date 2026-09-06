module.exports = (sequelize, DataTypes) => {
  const TagValue = sequelize.define('TagValue', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    tagId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'tags', key: 'id' },
      field: 'tag_id',
    },
    value: { type: DataTypes.STRING(255), allowNull: false },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'sort_order' },
  }, {
    tableName: 'tag_values',
    underscored: true,
  })

  TagValue.associate = (models) => {
    TagValue.belongsTo(models.Tag, { foreignKey: 'tag_id', as: 'tag' })
    TagValue.belongsToMany(models.Product, {
      through: 'product_tags',
      foreignKey: 'tag_value_id',
      otherKey: 'product_id',
    })
  }

  return TagValue
}
