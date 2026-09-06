module.exports = (sequelize, DataTypes) => {
  const ChangeRequest = sequelize.define('ChangeRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    componentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'component_id',
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'category_id',
    },
    status: {
      type: DataTypes.ENUM('pending', 'in_progress', 'done', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    values: {
      type: DataTypes.JSONB,
      defaultValue: {},
      allowNull: false,
    },
    free: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    whatsappMessage: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'whatsapp_message',
    },
    adminNotes: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'admin_notes',
    },
  }, {
    tableName: 'change_requests',
  })

  return ChangeRequest
}
