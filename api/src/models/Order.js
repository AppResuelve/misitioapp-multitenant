module.exports = (sequelize, DataTypes) => {
  const Order = sequelize.define('Order', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    items: {
      type: DataTypes.JSONB,
      defaultValue: [],
      allowNull: false,
    },
    customerName: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    customerPhone: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    customerEmail: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    total: {
      type: DataTypes.DECIMAL(12, 2),
      defaultValue: 0,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('new', 'seen', 'confirmed', 'delivered', 'cancelled'),
      defaultValue: 'new',
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'orders',
  })

  Order.associate = () => {
    // Order no tiene FK a otros modelos. Los items son JSONB con { productId, name, price, qty }.
  }

  return Order
}
