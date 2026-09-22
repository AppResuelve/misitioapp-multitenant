module.exports = (sequelize, DataTypes) => {
  const Tenant = sequelize.define('Tenant', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    slug: { type: DataTypes.STRING(100), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    domain: { type: DataTypes.STRING(255), allowNull: true },
    adminDomain: { type: DataTypes.STRING(255), allowNull: true, field: 'admin_domain' },
    folderPrefix: { type: DataTypes.STRING(64), allowNull: true, field: 'folder_prefix' },
    billingStatus: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'active', field: 'billing_status' },
  }, {
    tableName: 'tenants',
    underscored: true,
  })

  Tenant.associate = () => {}

  return Tenant
}
