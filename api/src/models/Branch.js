module.exports = (sequelize, DataTypes) => {
  const Branch = sequelize.define('Branch', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tenantId: { type: DataTypes.INTEGER, allowNull: false, field: 'tenant_id' },
    name: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(32), allowNull: false },
    address: { type: DataTypes.STRING(255), allowNull: true },
    hours: { type: DataTypes.TEXT, allowNull: true },
    sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sort_order' },
    isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  }, {
    tableName: 'branches',
    underscored: true,
  });

  Branch.associate = (models) => {
    Branch.belongsTo(models.Tenant, { foreignKey: 'tenantId', as: 'tenant' });
  };

  return Branch;
};