module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    "Category",
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
      image: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: null,
      },
      order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM("active", "draft"),
        allowNull: false,
        defaultValue: "active",
      },
    },
    {
      tableName: "categories",
      underscored: true,
      indexes: [{ unique: true, fields: ["tenant_id", "slug"] }],
    },
  );

  Category.associate = (models) => {
    Category.belongsTo(models.Tenant, {
      foreignKey: "tenantId",
      as: "tenant",
    });
    Category.hasMany(models.Product, {
      foreignKey: "categoryId",
      as: "products",
    });
  };

  return Category;
};
