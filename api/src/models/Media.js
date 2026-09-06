module.exports = (sequelize, DataTypes) => {
  const Media = sequelize.define('Media', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    tenantId: { type: DataTypes.INTEGER, allowNull: false },
    url: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    publicId: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    filename: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    size: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    mimeType: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    folder: {
      type: DataTypes.STRING(100),
      defaultValue: 'galeria',
      allowNull: false,
    },
    usage: {
      type: DataTypes.JSONB,
      defaultValue: [],
      allowNull: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  }, {
    tableName: 'media',
    paranoid: false,
  })

  Media.associate = () => {
    // Media es standalone. Las imágenes de productos se referencian por URL.
  }

  return Media
}
