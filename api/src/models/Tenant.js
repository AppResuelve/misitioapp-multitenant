module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define(
    "Tenant",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(255), allowNull: false },
      domain: { type: DataTypes.STRING(255), allowNull: false, unique: true }, // Obligatorio
      adminDomain: {
        type: DataTypes.STRING(255),
        allowNull: true,
        field: "admin_domain",
      },
      folderPrefix: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: "folder_prefix",
      },
    },
    {
      tableName: "tenants",
      underscored: true,
    },
  );

  Tenant.associate = (models) => {
    Tenant.hasOne(models.Billing, { foreignKey: "tenantId", as: "billing" });
    Tenant.hasMany(models.EmailLog, {
      foreignKey: "tenantId",
      as: "emailLogs",
    });
    Tenant.hasMany(models.Branch, { foreignKey: "tenantId", as: "branches" });
    Tenant.hasOne(models.StoreSetting, {
      foreignKey: "tenantId",
      as: "storeSetting", // o "settings", según el alias que prefieras usar en tus includes
      onDelete: "CASCADE",
    });
  };

  return Tenant;
};
