module.exports = (sequelize, DataTypes) => {
  const Billing = sequelize.define(
    "Billing",
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        field: "tenant_id",
        references: { model: "tenants", key: "id" },
        onDelete: "CASCADE",
      },
      planName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        defaultValue: "Plan Comercio",
        field: "plan_name",
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: "active", // 'active' | 'past_due' | 'suspended'
      },
      amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      currency: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: "ARS",
      },
      currentPeriodStart: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "current_period_start",
      },
      currentPeriodEnd: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "current_period_end",
      },
      graceDays: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 4,
        field: "grace_days",
      },
      graceUntil: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "grace_until",
      },
      suspendedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "suspended_at",
      },
      lastCronAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "last_cron_at",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      monthlyChangesLimit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 2,
        field: "monthly_changes_limit",
      },
      changesThisMonth: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        field: "changes_this_month",
      },
    },
    {
      tableName: "billings",
      underscored: true,
    },
  );

  Billing.associate = (models) => {
    Billing.belongsTo(models.Tenant, { foreignKey: "tenantId", as: "tenant" });
  };

  return Billing;
};
