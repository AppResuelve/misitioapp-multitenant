module.exports = (sequelize, DataTypes) => {
  const PaymentMethod = sequelize.define(
    "PaymentMethod",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "tenant_id",
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "credit",
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      badge: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "sort_order",
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "is_active",
      },
      brands: {
        type: DataTypes.JSON,
        allowNull: false,
        defaultValue: [],
      },
    },
    {
      tableName: "payment_methods",
      underscored: true,
      timestamps: true,
    },
  );

  PaymentMethod.associate = (models) => {
    PaymentMethod.belongsTo(models.Tenant, {
      foreignKey: "tenant_id",
      as: "tenant",
      onDelete: "CASCADE",
    });
  };

  return PaymentMethod;
};
