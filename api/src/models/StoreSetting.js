module.exports = (sequelize, DataTypes) => {
  const StoreSetting = sequelize.define(
    "StoreSetting",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: "tenant_id",
        references: {
          model: "tenants",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      storeStatus: {
        type: DataTypes.ENUM("active", "paused", "maintenance"),
        allowNull: false,
        defaultValue: "active",
        field: "store_status",
      },
      businessName: {
        type: DataTypes.STRING(255),
        allowNull: false,
        defaultValue: "",
        field: "business_name",
      },
      businessSlogan: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: "",
        field: "business_slogan",
      },
      businessDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: "",
        field: "business_description",
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "email",
        validate: {
          isEmail: true,
        },
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "ARS",
        field: "currency",
      },
      logoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: "/logotipo.png",
        field: "logo_url",
      },
      faviconUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: "/favicon.ico",
        field: "favicon_url",
      },
      socialLinks: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: {
          instagram: "",
          facebook: "",
          tiktok: "",
          youtube: "",
          whatsapp: "",
        },
        field: "social_links",
      },
      // --- Configuración de Catálogo, Precios y Checkout ---
      autoCalculateUnitPrices: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "auto_calculate_unit_prices",
      },
      allowWholesale: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "allow_wholesale",
      },
      hideOutOfStock: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "hide_out_of_stock",
      },
      trackStock: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: "track_stock",
      },
      minOrderAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        field: "min_order_amount",
      },
      minWholesaleAmount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: true,
        defaultValue: 0,
        field: "min_wholesale_amount",
      },
      showPriceWithTax: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: "show_price_with_tax",
      },
    },
    {
      tableName: "store_settings",
      underscored: true,
      timestamps: true,
      indexes: [
        {
          unique: true,
          fields: ["tenant_id"],
          name: "store_settings_tenant_id_unique",
        },
      ],
    },
  );

  StoreSetting.associate = (models) => {
    StoreSetting.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
  };

  return StoreSetting;
};
