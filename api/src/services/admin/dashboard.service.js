const { Product, Category, sequelize } = require("../../models");
const { QueryTypes } = require("sequelize");
const settingsService = require("../store/settings.service"); // Usamos el servicio con caché

const get = async (tenantId) => {
  // 1. Obtenemos datos de la tienda directo desde la memoria (0 ms)
  const settingsPromise = settingsService.getSettings(tenantId);

  // 2. Ejecutamos las métricas de DB en paralelo
  const tenantClause = tenantId ? `AND orders.tenant_id = :tenantId` : "";

  const [
    settings,
    totalProducts,
    activeProducts,
    totalCategories,
    topProducts,
  ] = await Promise.all([
    settingsPromise,
    Product.count({ where: { tenantId } }),
    Product.count({ where: { tenantId, status: "active" } }),
    Category.count({ where: { tenantId } }),
    sequelize.query(
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
    ),
  ]);

  const store = {
    name: settings?.businessName || "Sin nombre",
    status: settings?.storeStatus || "active",
  };

  return {
    store,
    products: { total: totalProducts, active: activeProducts },
    categories: { total: totalCategories },
    topProducts,
  };
};

module.exports = { get };