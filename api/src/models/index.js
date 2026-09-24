const sequelize = require('../config/database')

const models = {
  Tenant: require('./Tenant')(sequelize, require('sequelize').DataTypes),
  User: require('./User')(sequelize, require('sequelize').DataTypes),
  Product: require('./Product')(sequelize, require('sequelize').DataTypes),
  Category: require('./Category')(sequelize, require('sequelize').DataTypes),
  Order: require('./Order')(sequelize, require('sequelize').DataTypes),
  Setting: require('./Setting')(sequelize, require('sequelize').DataTypes),
  Media: require('./Media')(sequelize, require('sequelize').DataTypes),
  ChangeRequest: require('./ChangeRequest')(sequelize, require('sequelize').DataTypes),
  Service: require('./Service')(sequelize, require('sequelize').DataTypes),
  Attribute: require('./Attribute')(sequelize, require('sequelize').DataTypes),
  AttributeValue: require('./AttributeValue')(sequelize, require('sequelize').DataTypes),
  ProductSku: require('./ProductSku')(sequelize, require('sequelize').DataTypes),
  SkuAttributeValue: require('./SkuAttributeValue')(sequelize, require('sequelize').DataTypes),
  ServiceVariant: require('./ServiceVariant')(sequelize, require('sequelize').DataTypes),
  ServiceVariantModifier: require('./ServiceVariantModifier')(sequelize, require('sequelize').DataTypes),
  Tag: require('./Tag')(sequelize, require('sequelize').DataTypes),
  TagValue: require('./TagValue')(sequelize, require('sequelize').DataTypes),
}

// Modelos que pertenecen a un tenant (todos menos Tenant)
const TENANTED_MODELS = [
  'User', 'Category', 'Product', 'Order', 'Setting', 'Media', 'ChangeRequest',
  'Service', 'Attribute', 'AttributeValue', 'ProductSku', 'SkuAttributeValue',
  'ServiceVariant', 'ServiceVariantModifier', 'Tag', 'TagValue',
]

Object.keys(models).forEach((modelName) => {
  if (models[modelName].associate) {
    models[modelName].associate(models)
  }
})

models.sequelize = sequelize

module.exports = models
