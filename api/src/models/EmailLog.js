module.exports = (sequelize, DataTypes) => {
  const EmailLog = sequelize.define(
    "EmailLog",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        field: "tenant_id",
        references: { model: "tenants", key: "id" },
        onDelete: "CASCADE",
      },
      type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      periodKey: {
        type: DataTypes.STRING(64),
        allowNull: true,
        field: "period_key",
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: "sent",
      },
      error: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "sent_at",
      },
    },
    {
      tableName: "email_logs",
      underscored: true,
      timestamps: true,
      updatedAt: false, // Evita buscar la columna updated_at
      createdAt: "created_at",
      indexes: [
        {
          unique: true,
          fields: ["tenant_id", "type", "period_key"],
          name: "email_logs_tenant_type_period_unique",
        },
      ],
    },
  );

  EmailLog.associate = (models) => {
    EmailLog.belongsTo(models.Tenant, { foreignKey: "tenantId", as: "tenant" });
  };

  return EmailLog;
};
