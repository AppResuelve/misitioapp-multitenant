// src/services/store/siteContent.service.js
const { Op } = require("sequelize");
const { SiteContent, Category, Product, Campaign } = require("../../models");
const { resolveFeaturedProducts } = require("../../utils/featuredProducts");

const getActiveContentBySlots = async (tenantId, storeSettings = {}) => {
  const now = new Date();

  // 1. Buscamos todos los contenidos potencialmente activos
  const items = await SiteContent.findAll({
    where: {
      tenantId,
      status: "active",
      [Op.or]: [
        // Caso A: Con campaña activa vigente en fecha
        {
          campaignId: { [Op.ne]: null },
          "$campaign.status$": "active",
          "$campaign.starts_at$": { [Op.lte]: now },
          "$campaign.ends_at$": { [Op.gte]: now },
        },
        // Caso B: Sin campaña (evergreen) con fechas propias vigentes
        {
          campaignId: null,
          [Op.and]: [
            {
              [Op.or]: [{ startsAt: null }, { startsAt: { [Op.lte]: now } }],
            },
            {
              [Op.or]: [{ endsAt: null }, { endsAt: { [Op.gte]: now } }],
            },
          ],
        },
      ],
    },
    include: [
      {
        model: Campaign,
        as: "campaign",
        attributes: ["id", "status", "startsAt", "endsAt"],
        required: false,
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug"],
        required: false,
      },
      {
        model: Product,
        as: "product",
        attributes: ["id", "name", "slug"],
        required: false,
      },
    ],
    order: [
      // Prioridad 1: Los que tienen campaña van primero
      ["campaignId", "DESC NULLS LAST"],
      ["sortOrder", "ASC"],
      ["createdAt", "DESC"],
    ],
  });

  // 2. Agrupar y resolver el ganador por slot: Campaña vigente > Evergreen
  const slotWinners = new Map();

  for (const item of items) {
    const slot = item.slotKey;
    const existing = slotWinners.get(slot);

    if (!existing) {
      slotWinners.set(slot, item);
    } else {
      // Si el que ya guardamos era base (sin campaña) y este tiene campaña activa, lo reemplaza
      if (!existing.campaignId && item.campaignId) {
        slotWinners.set(slot, item);
      }
    }
  }

  const selectedItems = Array.from(slotWinners.values());

  // 3. Resolver productos destacados solo para los ganadores
  const resolvedItems = await Promise.all(
    selectedItems.map(async (item) => {
      let resolvedProducts = null;

      if (item.slotKey === "featured_products") {
        resolvedProducts = await resolveFeaturedProducts(
          tenantId,
          item.config,
          storeSettings,
        );
      }

      return {
        id: item.id,
        kind: item.kind,
        slotKey: item.slotKey,
        linkType: item.linkType,
        campaignId: item.campaignId,
        category: item.category
          ? {
              id: item.category.id,
              name: item.category.name,
              slug: item.category.slug,
            }
          : null,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              slug: item.product.slug,
            }
          : null,
        externalUrl: item.externalUrl,
        config: item.config || {},
        ...(resolvedProducts !== null && { products: resolvedProducts }),
      };
    }),
  );

  // 4. Retornar en el formato de contentMap esperado: { [slotKey]: [item] }
  return resolvedItems.reduce((acc, item) => {
    const slot = item.slotKey;
    if (!acc[slot]) {
      acc[slot] = [];
    }
    acc[slot].push(item);
    return acc;
  }, {});
};

module.exports = {
  getActiveContentBySlots,
};
