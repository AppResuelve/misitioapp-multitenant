module.exports = (sequelize, DataTypes) => {
  const Campaign = sequelize.define(
    "Campaign",
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
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "starts_at",
      },
      endsAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "ends_at",
        validate: {
          isAfterStartsAt(value) {
            if (this.startsAt && new Date(value) <= new Date(this.startsAt)) {
              throw new Error(
                "La fecha de fin debe ser posterior a la fecha de inicio.",
              );
            }
          },
        },
      },
      status: {
        type: DataTypes.ENUM("draft", "active", "archived"),
        allowNull: false,
        defaultValue: "draft",
      },
      color: {
        type: DataTypes.STRING(32),
        allowNull: true,
        defaultValue: "#6366f1",
      },
    },
    {
      tableName: "campaigns",
      underscored: true,
      indexes: [{ unique: true, fields: ["tenant_id", "slug"] }],
    },
  );

  Campaign.associate = (models) => {
    Campaign.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
    Campaign.hasMany(models.Discount, {
      foreignKey: "campaignId",
      as: "discounts",
    });
    Campaign.hasMany(models.SiteContent, {
      foreignKey: "campaignId",
      as: "contents",
    });
  };

  return Campaign;
};
