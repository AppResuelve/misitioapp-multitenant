module.exports = (sequelize, DataTypes) => {
  const SiteContent = sequelize.define(
    "SiteContent",
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
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      kind: {
        type: DataTypes.ENUM("banner", "carousel"),
        allowNull: false,
      },
      slotKey: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "slot_key",
      },
      status: {
        type: DataTypes.ENUM("draft", "active"),
        allowNull: false,
        defaultValue: "draft",
      },
      campaignId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "campaign_id",
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "starts_at",
      },
      endsAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "ends_at",
      },
      linkType: {
        type: DataTypes.ENUM("none", "category", "product", "external"),
        allowNull: false,
        defaultValue: "none",
        field: "link_type",
      },
      categoryId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "category_id",
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        field: "product_id",
      },
      externalUrl: {
        type: DataTypes.STRING(1000),
        allowNull: true,
        field: "external_url",
      },
      config: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "sort_order",
      },
    },
    {
      tableName: "site_contents",
      underscored: true,
      indexes: [
        { fields: ["tenant_id", "slot_key", "status"] },
        { fields: ["tenant_id", "campaign_id"] },
      ],
    },
  );

  SiteContent.associate = (models) => {
    SiteContent.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
    SiteContent.belongsTo(models.Campaign, {
      foreignKey: "campaignId",
      as: "campaign",
    });
    SiteContent.belongsTo(models.Category, {
      foreignKey: "categoryId",
      as: "category",
    });
    SiteContent.belongsTo(models.Product, {
      foreignKey: "productId",
      as: "product",
    });
  };

  return SiteContent;
};
