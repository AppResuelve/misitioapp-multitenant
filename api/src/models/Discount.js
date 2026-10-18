module.exports = (sequelize, DataTypes) => {
  const Discount = sequelize.define(
    "Discount",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "tenant_id",
      },
      campaignId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "campaign_id",
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          "global",
          "category",
          "price_range",
          "products",
          "cart_total",
        ),
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
        type: DataTypes.ENUM("draft", "active"),
        allowNull: false,
        defaultValue: "draft",
      },
      startAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "start_at",
      },
      endAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "end_at",
      },
    },
    {
      tableName: "discounts",
      underscored: true,
      indexes: [
        { fields: ["tenant_id"] },
        { fields: ["tenant_id", "campaign_id"] },
      ],
    },
  );

  Discount.associate = (models) => {
    Discount.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
    Discount.belongsTo(models.Campaign, {
      foreignKey: "campaignId",
      as: "campaign",
    });
  };

  return Discount;
};
