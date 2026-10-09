// services/store/discounts.service.js
const { Discount, Category } = require("../../models");
const { Op } = require("sequelize");
const {
  appliesToProduct,
  computeProductDiscount,
  resolveProductPricing,
} = require("../../utils/discountApplication");

// Devuelve los descuentos activos (status active + dentro de la ventana temporal).
const getActiveDiscounts = async (tenantId) => {
  try {
    const now = new Date();
    const discounts = await Discount.findAll({
      where: {
        tenantId,
        status: "active",
        startAt: { [Op.lte]: now },
        [Op.or]: [{ endAt: null }, { endAt: { [Op.gte]: now } }],
      },
      order: [["createdAt", "ASC"]],
    });
    return discounts;
  } catch (err) {
    console.error(
      "[DISCOUNTS SVC getActiveDiscounts] ERROR:",
      err.message,
      err.stack,
    );
    throw err;
  }
};

/**
 * Mapea los descuentos activos a un DTO listo para el storefront
 */
const formatActivePromotions = async (tenantId, discounts) => {
  if (!discounts || discounts.length === 0) return [];

  // Buscamos categorías si hay descuentos por categoría para obtener nombres/slugs
  const categoryIds = discounts
    .filter(
      (d) => d.type === "category" && Array.isArray(d.config?.categoryIds),
    )
    .flatMap((d) => d.config.categoryIds);

  let categoriesMap = new Map();
  if (categoryIds.length > 0) {
    const categories = await Category.findAll({
      where: {
        tenantId,
        id: { [Op.in]: categoryIds },
      },
      attributes: ["id", "name", "slug"],
    });
    categoriesMap = new Map(categories.map((c) => [c.id, c]));
  }

  const promotions = [];

  for (const d of discounts) {
    if (d.type === "cart_total") {
      const minAmount = Number(d.config?.minAmount) || 0;
      promotions.push({
        id: String(d.id),
        type: "wholesale",
        title: d.name,
        description: `Superando $${minAmount.toLocaleString("es-AR")} obtené ${d.percentage}% OFF en tu compra`,
        badgeText: `${d.percentage}% OFF`,
        iconName: "flame",
        actionType: "open_cart",
        minAmount,
      });
    } else if (d.type === "category") {
      const firstCatId = d.config?.categoryIds?.[0];
      const cat = categoriesMap.get(firstCatId);
      const targetParam = cat ? cat.slug || cat.name : "";

      promotions.push({
        id: String(d.id),
        type: "category",
        title: d.name,
        description: `Aprovechá ${d.percentage}% OFF en productos seleccionados`,
        badgeText: `${d.percentage}% OFF`,
        iconName: "tag",
        actionType: "navigate",
        targetHref: targetParam
          ? `/productos?cat=${encodeURIComponent(targetParam)}`
          : "/productos",
      });
    } else if (d.type === "global") {
      promotions.push({
        id: String(d.id),
        type: "general",
        title: d.name,
        description: `${d.percentage}% OFF en toda la tienda por tiempo limitado`,
        badgeText: `${d.percentage}% OFF`,
        iconName: "sparkles",
        actionType: "navigate",
        targetHref: "/productos",
      });
    } else if (d.type === "price_range") {
      const min = Number(d.config?.min) || 0;
      const max = Number(d.config?.max) || 0;
      promotions.push({
        id: String(d.id),
        type: "general",
        title: d.name,
        description: `${d.percentage}% OFF en artículos de $${min.toLocaleString("es-AR")} a $${max.toLocaleString("es-AR")}`,
        badgeText: `${d.percentage}% OFF`,
        iconName: "gift",
        actionType: "navigate",
        targetHref: "/productos",
      });
    }
  }

  return promotions;
};

module.exports = {
  getActiveDiscounts,
  formatActivePromotions,
  appliesToProduct,
  computeProductDiscount,
  resolveProductPricing,
};
