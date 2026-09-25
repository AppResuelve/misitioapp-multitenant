module.exports = (sequelize, DataTypes) => {
  const Discount = sequelize.define('Discount', {
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
    type: {
      type: DataTypes.ENUM('global', 'category', 'price_range', 'products', 'cart_total'),
      allowNull: false,
    },
    percentage: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
    },
    status: {
      type: DataTypes.ENUM('draft', 'active'),
      allowNull: false,
      defaultValue: 'draft',
    },
    startAt: { type: DataTypes.DATE, allowNull: false },
    endAt: { type: DataTypes.DATE, allowNull: true },
  }, {
    tableName: 'discounts',
    indexes: [{ fields: ['tenantId'] }],
  })

  Discount.associate = (models) => {
    Discount.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' })
  }

  return Discount
}
