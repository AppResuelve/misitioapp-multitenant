module.exports = (sequelize, DataTypes) => {
  const Setting = sequelize.define('Setting', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    key: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    value: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  }, {
    tableName: 'settings',
    indexes: [{ unique: true, fields: ['tenantId', 'key'] }],
  })

  Setting.associate = () => {
    // Setting es key-value standalone.
  }

  return Setting
}
