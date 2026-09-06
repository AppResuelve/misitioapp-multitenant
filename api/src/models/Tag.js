module.exports = (sequelize, DataTypes) => {
  const Tag = sequelize.define('Tag', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    name: { type: DataTypes.STRING(255), allowNull: false },
    color: { type: DataTypes.STRING(7), defaultValue: '#6366f1' },
    sortOrder: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false, field: 'sort_order' },
  }, {
    tableName: 'tags',
    underscored: true,
  })

  Tag.associate = (models) => {
    Tag.hasMany(models.TagValue, { foreignKey: 'tag_id', as: 'values' })
    Tag.belongsToMany(models.Product, {
      through: 'product_tags',
      foreignKey: 'tag_value_id',
      otherKey: 'product_id',
    })
  }

  return Tag
}
