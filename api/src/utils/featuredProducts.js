// src/utils/featuredProducts.js
const { Op } = require("sequelize");
const {
  Product,
  Category,
  TagValue,
  Tag,
  ProductSku,
  AttributeValue,
  Attribute,
} = require("../models");
const { applyUnitPricing } = require("./unitPricing");
const { proxyProductImages } = require("./cdn");
const {
  getActiveDiscounts,
  resolveProductPricing,
} = require("../services/store/discounts.service");

const skuInclude = {
  model: ProductSku,
  as: "skus",
  where: { status: "active" },
  required: false,
  include: [
    {
      model: AttributeValue,
      as: "attributeValues",
      through: { attributes: [] },
      include: [{ model: Attribute, as: "attribute" }],
    },
  ],
  order: [["sort_order", "ASC"]],
};

const defaultProductIncludes = [
  {
    model: Category,
    as: "category",
    attributes: ["id", "name", "slug"],
    required: false,
  },
  skuInclude,
  {
    model: TagValue,
    as: "tagValues",
    required: false,
    include: [
      {
        model: Tag,
        as: "tag",
        attributes: ["id", "name", "color"],
      },
    ],
  },
];

const resolveFeaturedProducts = async (
  tenantId,
  config = {},
  storeSettings = {},
) => {
  const mode = config.mode || "auto";
  const limit = Math.max(1, Number(config.limit) || 8);
  let products = [];

  // 1. MODO MANUAL: Respeta exactamente los productos activos elegidos
  if (mode === "manual") {
    const rawIds = Array.isArray(config.productIds) ? config.productIds : [];
    const productIds = rawIds.map(Number).filter(Boolean);

    if (productIds.length > 0) {
      products = await Product.findAll({
        where: {
          tenantId,
          id: { [Op.in]: productIds },
          status: "active",
        },
        include: defaultProductIncludes,
      });
    }
  }

  // 2. MODO TAG: Busca productos con el valor de etiqueta seleccionado
  else if (mode === "tag") {
    const tagName = config.tagName?.trim();

    if (tagName) {
      products = await Product.findAll({
        where: {
          tenantId,
          status: "active",
        },
        include: [
          ...defaultProductIncludes,
          {
            model: TagValue,
            as: "tagValues",
            where: { value: tagName },
            attributes: [],
            required: true,
            through: { attributes: [] },
          },
        ],
        limit,
        order: [["createdAt", "DESC"]],
      });
    }

    // Fallback de seguridad: SOLO si el tag tiene 0 productos activos
    if (products.length === 0) {
      products = await getRecentFallback(tenantId, limit);
    }
  }

  // 3. MODO AUTO: Recientes activos
  else {
    products = await getRecentFallback(tenantId, limit);
  }

  // Si no hay productos, salimos rápido
  if (!products || products.length === 0) return [];

  // --- Procesamiento de precios, descuentos y CDN (igual que list / getBySlug) ---
  const autoCalculate = storeSettings?.autoCalculateUnitPrices ?? true;
  products.forEach((p) => applyUnitPricing(p, autoCalculate));

  const discounts = await getActiveDiscounts(tenantId);
  const productDiscounts = (discounts || []).filter(
    (d) => d.type !== "cart_total",
  );
  products.forEach((p) => resolveProductPricing(p, productDiscounts));

  products.forEach(proxyProductImages);

  return products;
};

const getRecentFallback = async (tenantId, limit) => {
  return Product.findAll({
    where: {
      tenantId,
      status: "active",
    },
    include: defaultProductIncludes,
    order: [["createdAt", "DESC"]],
    limit,
  });
};

module.exports = {
  resolveFeaturedProducts,
};
