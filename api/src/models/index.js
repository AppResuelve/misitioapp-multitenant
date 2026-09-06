const sequelize = require('../config/database')
const { getTenantId } = require('../services/tenantContext')

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

// --- Scoping automático por tenant (AsyncLocalStorage + hooks) ---

const applyTenantWhere = (where, tenantId) => {
  if (where.tenantId === undefined && where.tenant_id === undefined) {
    where.tenantId = tenantId
  }
}

const scopeInclude = (include, tenantId) => {
  if (!include) return
  const arr = Array.isArray(include) ? include : [include]
  arr.forEach((inc) => {
    if (TENANTED_MODELS.includes(inc.model?.name)) {
      inc.where = inc.where || {}
      applyTenantWhere(inc.where, tenantId)
    }
    scopeInclude(inc.include, tenantId)
  })
}

TENANTED_MODELS.forEach((name) => {
  const model = models[name]
  if (!model) return

  model.addHook('beforeFind', (options) => {
    const tenantId = getTenantId()
    if (!tenantId) return
    options.where = options.where || {}
    applyTenantWhere(options.where, tenantId)
    scopeInclude(options.include, tenantId)
  })

  model.addHook('beforeCreate', (instance) => {
    const tenantId = getTenantId()
    if (!tenantId) return
    if (instance.tenantId === undefined) instance.tenantId = tenantId
  })

  model.addHook('beforeBulkCreate', (instances) => {
    const tenantId = getTenantId()
    if (!tenantId) return
    instances.forEach((i) => {
      if (i.tenantId === undefined) i.tenantId = tenantId
    })
  })

  model.addHook('beforeBulkUpdate', (options) => {
    const tenantId = getTenantId()
    if (!tenantId) return
    options.where = options.where || {}
    applyTenantWhere(options.where, tenantId)
  })

  model.addHook('beforeBulkDestroy', (options) => {
    const tenantId = getTenantId()
    if (!tenantId) return
    options.where = options.where || {}
    applyTenantWhere(options.where, tenantId)
  })
})

models.sequelize = sequelize

module.exports = models
