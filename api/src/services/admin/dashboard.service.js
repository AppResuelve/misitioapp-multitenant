const { Product, Category, Order, Setting, sequelize } = require('../../models')
const { QueryTypes } = require('sequelize')

const get = async (tenantId) => {
  // Store info
  const settingRows = await Setting.findAll({ where: { tenantId } })
  const settings = {}
  settingRows.forEach((row) => {
    settings[row.key] = row.value
  })

  const store = {
    name: settings.business_name || 'Sin nombre',
    status: settings.store_status || 'active',
  }

  // Products
  const totalProducts = await Product.count({ where: { tenantId } })
  const activeProducts = await Product.count({ where: { tenantId, status: 'active' } })

  // Categories
  const totalCategories = await Category.count({ where: { tenantId } })

  // Top products from orders
  const tenantFilter = tenantId ? `AND orders.tenant_id = ${tenantId}` : ''

  const topProducts = await sequelize.query(
    `SELECT
      item->>'name' as name,
      COUNT(*)::int as count
    FROM orders,
    jsonb_array_elements(items) AS item
    WHERE item->>'productId' IS NOT NULL
      ${tenantFilter}
    GROUP BY item->>'productId', item->>'name'
    ORDER BY count DESC
    LIMIT 3`,
    { type: QueryTypes.SELECT }
  )

  return {
    store,
    products: { total: totalProducts, active: activeProducts },
    categories: { total: totalCategories },
    topProducts,
  }
}

module.exports = { get }
