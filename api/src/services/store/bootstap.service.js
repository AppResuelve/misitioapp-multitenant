// src/services/store/bootstrap.service.js
const { Category, Product, Branch, PaymentMethod } = require("../../models");
const discountsService = require("./discounts.service");
const siteContentService = require("./siteContent.service");
const { formatBranchHours } = require("../../utils/branchFormatter");
const { formatSettingsWithCdn } = require("../../utils/cdn");
const {
  getCachedBootstrap,
  setCachedBootstrap,
} = require("../../utils/cache/bootstrapCache");

const getBootstrap = async (
  tenantId,
  baseSettings = {},
  billingStatus = "active",
) => {
  if (!tenantId) return null;

  // 1. Revisar memoria RAM (15 min)
  const cached = getCachedBootstrap(tenantId);
  if (cached) return cached;

  // 2. Aplicar proxy CDN solo a logo y favicon (mantiene exactamente los campos reales de StoreSetting)
  const cleanSettings = formatSettingsWithCdn(baseSettings) || {};

  // 3. Determinar estado operativo
  const isSuspended = billingStatus === "suspended";
  const rawStatus = cleanSettings.storeStatus || "active";
  const isMaintenance = isSuspended || rawStatus === "maintenance";

  // Retorno liviano si la tienda no está operativa
  if (isMaintenance) {
    const payload = {
      status: "maintenance",
      settings: {
        ...cleanSettings,
        billingStatus,
      },
      categories: [],
      branches: [],
      paymentMethods: [],
      cartTotals: [],
      activePromotions: [],
    };
    setCachedBootstrap(tenantId, payload);
    return payload;
  }

  // 4. Consultas paralelas para tienda activa
  const [branches, discounts, paymentMethods, categories, content] =
    await Promise.all([
      Branch.findAll({
        where: { tenantId, isActive: true },
        attributes: [
          "id",
          "name",
          "phone",
          "address",
          "city",
          "state",
          "country",
          "hours",
        ],
        order: [
          ["sortOrder", "ASC"],
          ["name", "ASC"],
        ],
      }),

      discountsService.getActiveDiscounts(tenantId),

      PaymentMethod.findAll({
        where: { tenantId, isActive: true },
        order: [
          ["sortOrder", "ASC"],
          ["title", "ASC"],
        ],
      }),

      Category.findAll({
        where: { tenantId, status: "active" },
        attributes: ["id", "name", "slug", "order"],
        include: [
          {
            model: Product,
            as: "products",
            attributes: [],
            where: { tenantId, status: "active" },
            required: true,
          },
        ],
        distinct: true,
        order: [
          ["order", "ASC"],
          ["name", "ASC"],
        ],
      }),

      siteContentService.getActiveContentBySlots(tenantId),
    ]);

  const formattedBranches = branches.map((b) => ({
    ...b.toJSON(),
    hours: formatBranchHours(b.hours),
  }));

  const cartTotals = (discounts || [])
    .filter((d) => d.type === "cart_total")
    .map((d) => ({
      id: d.id,
      name: d.name,
      percentage: d.percentage,
      minAmount: d.config?.minAmount ?? 0,
      countDiscounted: d.config?.countDiscounted ?? false,
    }));

  const activePromotions = await discountsService.formatActivePromotions(
    tenantId,
    discounts || [],
  );

  const formattedPaymentMethods = paymentMethods.map((pm) => ({
    id: pm.id,
    type: pm.type,
    title: pm.title,
    badge: pm.badge || null,
    description: pm.description || null,
    sortOrder: pm.sortOrder,
    brands: Array.isArray(pm.brands) ? pm.brands : [],
  }));

  const response = {
    status: "active",
    settings: {
      ...cleanSettings,
      billingStatus,
    },
    categories: categories || [],
    branches: formattedBranches,
    paymentMethods: formattedPaymentMethods,
    cartTotals,
    activePromotions,
    marketingContent: content,
  };

  setCachedBootstrap(tenantId, response);
  return response;
};

module.exports = { getBootstrap };
