const { Product, Category, StoreSetting, sequelize } = require("../../models");
const { QueryTypes } = require("sequelize");

const get = async (tenantId) => {
  // Store info
  const setting = await StoreSetting.findOne({
    where: { tenantId },
    attributes: [
      ["business_name", "businessName"],
      ["store_status", "storeStatus"],
    ],
  });

  const store = {
    name:
      setting?.businessName ||
      setting?.getDataValue?.("business_name") ||
      "Sin nombre",
    status:
      setting?.storeStatus ||
      setting?.getDataValue?.("store_status") ||
      "active",
  };

  // Products
  const [totalProducts, activeProducts, totalCategories] = await Promise.all([
    Product.count({ where: { tenantId } }),
    Product.count({ where: { tenantId, status: "active" } }),
    Category.count({ where: { tenantId } }),
  ]);

  // Top products from orders (usando bind params para evitar inyección)
  const tenantClause = tenantId ? `AND orders.tenant_id = :tenantId` : "";

  const topProducts = await sequelize.query(
    `SELECT
      item->>'name' as name,
      COUNT(*)::int as count
    FROM orders,
    jsonb_array_elements(items) AS item
    WHERE item->>'productId' IS NOT NULL
      ${tenantClause}
    GROUP BY item->>'productId', item->>'name'
    ORDER BY count DESC
    LIMIT 3`,
    {
      replacements: { tenantId },
      type: QueryTypes.SELECT,
    },
  );

  return {
    store,
    products: { total: totalProducts, active: activeProducts },
    categories: { total: totalCategories },
    topProducts,
  };
};

module.exports = { get };
