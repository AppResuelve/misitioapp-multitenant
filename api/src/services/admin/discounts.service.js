const { Discount, Product, Campaign } = require("../../models");
const { Op } = require("sequelize");
const { appliesToProduct } = require("../../utils/discountApplication");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");
const { invalidateTenantProducts } = require("../../utils/cache/productsCache");
const {
  assertCampaignAllowsActive,
} = require("../../utils/campaignValidation");

const validateConfig = (type, config) => {
  const cfg = config || {};
  if (type === "category") {
    const ids = cfg.categoryIds || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      throw Object.assign(new Error("Seleccioná al menos una categoría"), {
        status: 400,
      });
    }
  } else if (type === "price_range") {
    const min = Number(cfg.min);
    const max = Number(cfg.max);
    if (Number.isNaN(min) || Number.isNaN(max)) {
      throw Object.assign(new Error("El rango de precio necesita min y max"), {
        status: 400,
      });
    }
    if (min >= max) {
      throw Object.assign(new Error("El mínimo debe ser menor al máximo"), {
        status: 400,
      });
    }
  } else if (type === "products") {
    const ids = cfg.productIds || [];
    if (!Array.isArray(ids) || ids.length === 0) {
      throw Object.assign(new Error("Seleccioná al menos un producto"), {
        status: 400,
      });
    }
  } else if (type === "cart_total") {
    const minAmount = Number(cfg.minAmount);
    if (Number.isNaN(minAmount) || minAmount <= 0) {
      throw Object.assign(
        new Error("El monto mínimo es obligatorio y debe ser mayor a 0"),
        { status: 400 },
      );
    }
  }
  return cfg;
};

const list = async (tenantId, filters = {}) => {
  const where = { tenantId };

  if (filters.status) {
    where.status = filters.status;
  }
  // Si no hay filtro explícito, podés traer todos (incluidos archivados)
  // para que las 4 pestañas de la tabla funcionen y calculen los counts reales.

  return Discount.findAll({
    where,
    include: [
      {
        model: Campaign,
        as: "campaign",
        attributes: ["id", "name", "startsAt", "endsAt", "status", "color"],
        required: false,
      },
    ],
    order: [["created_at", "DESC"]],
  });
};

/**
 * Detecta colisiones solo entre descuentos que están REALMENTE corriendo hoy
 */
const overlaps = async (tenantId) => {
  const now = new Date();

  const discounts = await Discount.findAll({
    where: {
      tenantId,
      status: "active",
      type: { [Op.ne]: "cart_total" },
      [Op.or]: [
        // Con campaña activa vigente
        {
          campaignId: { [Op.ne]: null },
          "$campaign.status$": "active",
          "$campaign.starts_at$": { [Op.lte]: now },
          "$campaign.ends_at$": { [Op.gte]: now },
        },
        // Sin campaña con fechas vigentes
        {
          campaignId: null,
          startAt: { [Op.lte]: now },
          [Op.or]: [{ endAt: null }, { endAt: { [Op.gte]: now } }],
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
    ],
  });

  if (discounts.length === 0) return [];

  const products = await Product.findAll({
    where: { tenantId, status: "active" },
    attributes: ["id", "name", "retailPrice", "categoryId"],
  });

  const result = [];
  for (const p of products) {
    const applied = discounts.filter((d) => appliesToProduct(d, p));
    if (applied.length > 1) {
      result.push({
        productId: p.id,
        name: p.name,
        discounts: applied.map((d) => ({
          id: d.id,
          name: d.name,
          percentage: d.percentage,
        })),
      });
    }
  }
  return result;
};

const create = async (tenantId, data) => {
  const config = validateConfig(data.type, data.config);
  const campaignId = data.campaignId || null;

  // Normalizamos el estado objetivo evaluando data.status explícitamente:
  const targetStatus = ["active", "draft", "archived"].includes(data.status)
    ? data.status
    : "draft";

  // 🔒 Validación: no permitir nacer activo si la campaña está en borrador o archivada
  if (targetStatus === "active" && campaignId) {
    await assertCampaignAllowsActive(tenantId, campaignId);
  }

  let startAt = data.startAt ? new Date(data.startAt) : new Date();
  let endAt = data.endAt ? new Date(data.endAt) : null;
  let campaign;
  // Si se asocia a campaña y no se pasaron fechas explícitas, hereda las de la campaña
  if (campaignId && (!data.startAt || !data.endAt)) {
    campaign = await Campaign.findOne({
      where: { tenantId, id: campaignId },
    });
    if (campaign) {
      if (!data.startAt) startAt = campaign.startsAt;
      if (!data.endAt) endAt = campaign.endsAt;
    }
  }

  const discount = await Discount.create({
    tenantId,
    campaignId,
    name: data.name,
    type: data.type,
    percentage: data.percentage,
    config,
    status: targetStatus,
    startAt,
    endAt,
  });

  invalidateBootstrapCache(tenantId);
  invalidateTenantProducts(tenantId);

  const result = discount.toJSON();
  result.campaign = campaign ? campaign.toJSON() : null;

  return result;
};

const update = async (tenantId, id, data) => {
  // 1. Buscamos el descuento trayendo su campaña actual
  const discount = await Discount.findOne({
    where: { tenantId, id },
    include: [
      {
        model: Campaign,
        as: "campaign",
        attributes: ["id", "name", "status", "startsAt", "endsAt"],
        required: false,
      },
    ],
  });

  if (!discount) {
    throw Object.assign(new Error("Descuento no encontrado"), { status: 404 });
  }

  // 2. Determinamos los valores resultantes de estado y campaña
  const targetStatus =
    data.status !== undefined ? data.status : discount.status;

  const targetCampaignId =
    "campaignId" in data
      ? data.campaignId
        ? Number(data.campaignId)
        : null
      : discount.campaignId;

  // 3. Validación: si queda activo y atado a campaña, la campaña debe permitirlo
  if (targetStatus === "active" && targetCampaignId) {
    await assertCampaignAllowsActive(
      tenantId,
      targetCampaignId,
      targetCampaignId === discount.campaignId ? discount.campaign : null,
    );
  }

  // 4. Validación y asignación de configuración según el tipo resultante
  const finalType = data.type || discount.type;
  let finalConfig = discount.config;

  if (data.config !== undefined) {
    // Se valida siempre que venga config nuevo, use el type nuevo o el existente
    finalConfig = validateConfig(finalType, data.config);
  } else if (data.type) {
    // Si solo cambió el type, validamos contra el config que ya tenía
    finalConfig = validateConfig(finalType, discount.config);
  }

  // 5. Armado del payload a actualizar
  const payload = {};
  if (data.name !== undefined) payload.name = data.name.trim();
  if (data.type !== undefined) payload.type = data.type;
  if (data.percentage !== undefined)
    payload.percentage = Number(data.percentage);
  if (data.status !== undefined) payload.status = data.status;

  // Asignamos el config validado y forzamos a Sequelize a marcarlo como modificado
  if (data.config !== undefined || data.type !== undefined) {
    payload.config = finalConfig;
    discount.set("config", finalConfig);
    discount.changed("config", true); // 👈 Forzar a Sequelize a escribir el JSON en la BD
  }

  // Asignamos la campaña normalizada
  if ("campaignId" in data) {
    payload.campaignId = targetCampaignId;
  }

  if (data.startAt !== undefined) {
    payload.startAt = data.startAt ? new Date(data.startAt) : discount.startAt;
  }
  if (data.endAt !== undefined) {
    payload.endAt = data.endAt ? new Date(data.endAt) : null;
  }

  // 6. Si se asoció a una campaña y no se enviaron fechas explícitas, hereda las de la campaña
  if (
    targetCampaignId &&
    (data.startAt === undefined || data.endAt === undefined)
  ) {
    const camp =
      targetCampaignId === discount.campaignId && discount.campaign
        ? discount.campaign
        : await Campaign.findOne({
            where: { tenantId, id: targetCampaignId },
            attributes: ["startsAt", "endsAt"],
          });

    if (camp) {
      if (data.startAt === undefined) payload.startAt = camp.startsAt;
      if (data.endAt === undefined) payload.endAt = camp.endsAt;
    }
  }

  // 7. Persistir cambios
  await discount.update(payload);

  // 8. Re-consultar con la relación fresca para devolver la data completa al frontend
  const updatedDiscount = await Discount.findOne({
    where: { tenantId, id },
    include: [
      {
        model: Campaign,
        as: "campaign",
        attributes: ["id", "name", "startsAt", "endsAt", "status", "color"],
        required: false,
      },
    ],
  });

  // 9. Invalidación de caches
  invalidateBootstrapCache(tenantId);
  invalidateTenantProducts(tenantId);

  return updatedDiscount;
};

const remove = async (tenantId, id) => {
  const discount = await Discount.findOne({ where: { tenantId, id } });
  if (!discount)
    throw Object.assign(new Error("Descuento no encontrado"), { status: 404 });

  await discount.destroy();

  invalidateBootstrapCache(tenantId);
  invalidateTenantProducts(tenantId);
  return true;
};

const setStatus = async (tenantId, id, status) => {
  const discount = await Discount.findOne({
    where: { tenantId, id },
    include: [
      {
        model: Campaign,
        as: "campaign",
        attributes: ["id", "name", "status"],
        required: false,
      },
    ],
  });

  if (!discount)
    throw Object.assign(new Error("Descuento no encontrado"), { status: 404 });

  if (!["active", "draft", "archived"].includes(status)) {
    throw Object.assign(new Error("Estado de descuento inválido"), {
      status: 400,
    });
  }

  if (discount.status === "archived") {
    throw Object.assign(
      new Error("No se puede reactivar un descuento archivado"),
      { status: 400 },
    );
  }

  // 🔒 Validación: Si pasa a activo, la campaña padre debe estar activa
  if (status === "active" && discount.campaignId) {
    await assertCampaignAllowsActive(
      tenantId,
      discount.campaignId,
      discount.campaign,
    );
  }

  await discount.update({ status });

  invalidateBootstrapCache(tenantId);
  invalidateTenantProducts(tenantId);
  return discount;
};

module.exports = { list, overlaps, create, update, remove, setStatus };
