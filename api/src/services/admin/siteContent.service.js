const { Op } = require("sequelize");
const {
  SiteContent,
  Campaign,
  Category,
  Product,
  sequelize,
} = require("../../models");
const { contentScheduler } = require("../../scheduler");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");
const {
  assertCampaignAllowsActive,
} = require("../../utils/campaignValidation");

const MAX_ITEMS_PER_SLOT = 3;

/**
 * Función auxiliar: Desplaza solo a los contenidos en conflicto de su mismo ámbito
 * - Si es base (campaignId null): apaga otros base activos del mismo slot.
 * - Si es de campaña (campaignId X): apaga otros de ESA misma campaña en ese slot.
 */
const displaceConflictingItems = async (
  tenantId,
  slotKey,
  campaignId,
  excludeId = null,
  transaction = null,
) => {
  const normalizedCampaignId = campaignId ? Number(campaignId) : null;

  const where = {
    tenantId,
    slotKey,
    status: "active",
  };

  // 🔒 Aislamiento estricto de ámbito en SQL
  if (normalizedCampaignId === null) {
    where.campaignId = { [Op.is]: null };
  } else {
    where.campaignId = normalizedCampaignId;
  }

  if (excludeId) {
    where.id = { [Op.ne]: excludeId };
  }

  const conflictingItems = await SiteContent.findAll({
    attributes: ["id"],
    where,
    transaction,
  });

  if (conflictingItems.length > 0) {
    const conflictingIds = conflictingItems.map((item) => item.id);

    await SiteContent.update(
      { status: "draft" },
      { where: { tenantId, id: conflictingIds }, transaction },
    );

    conflictingIds.forEach((id) => contentScheduler.cancel(id));
  }
};

const getById = async (tenantId, id) => {
  const item = await SiteContent.findOne({
    where: { tenantId, id },
    include: [
      {
        model: Campaign,
        as: "campaign",
        attributes: ["id", "name", "startsAt", "endsAt", "status", "color"],
        required: false,
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name", "slug", "image"],
        required: false,
      },
      {
        model: Product,
        as: "product",
        attributes: ["id", "name", "slug"],
        required: false,
      },
    ],
  });

  if (!item) {
    throw Object.assign(new Error("Contenido no encontrado"), { status: 404 });
  }

  return item;
};

const listBySlot = async (tenantId, slotKey) => {
  return SiteContent.findAll({
    where: {
      tenantId,
      slotKey,
      status: { [Op.ne]: "archived" }, // Por defecto no satura el admin con históricos
    },
    include: [
      {
        model: Campaign,
        as: "campaign",
        attributes: ["id", "name", "startsAt", "endsAt", "color", "status"],
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
      ["status", "ASC"], // 'active' antes que 'draft'
      ["sortOrder", "ASC"],
      ["createdAt", "DESC"],
    ],
  });
};

const listByKind = async (tenantId, kind) => {
  return SiteContent.findAll({
    where: {
      tenantId,
      kind,
      status: { [Op.ne]: "archived" },
    },
    include: [
      {
        model: Campaign,
        as: "campaign",
        attributes: ["id", "name", "startsAt", "endsAt", "color", "status"],
        required: false,
      },
    ],
    order: [
      ["slotKey", "ASC"],
      ["sortOrder", "ASC"],
      ["createdAt", "DESC"],
    ],
  });
};

const create = async (tenantId, data) => {
  const { name, kind, slotKey } = data;

  if (!name || !name.trim()) {
    throw Object.assign(new Error("El nombre del contenido es requerido"), {
      status: 400,
    });
  }

  if (!kind || !["banner", "carousel"].includes(kind)) {
    throw Object.assign(new Error("Tipo de contenido inválido"), {
      status: 400,
    });
  }

  if (!slotKey || !slotKey.trim()) {
    throw Object.assign(new Error("El slot es requerido"), { status: 400 });
  }

  // 1. Contar solo items vigentes/borradores (no archivados) para el límite
  const activeAndDraftCount = await SiteContent.count({
    where: {
      tenantId,
      slotKey,
      status: { [Op.in]: ["active", "draft"] },
    },
  });

  if (activeAndDraftCount >= MAX_ITEMS_PER_SLOT) {
    throw Object.assign(
      new Error(
        `Límite alcanzado: este espacio admite un máximo de ${MAX_ITEMS_PER_SLOT} elementos activos/borradores. Archiva o elimina los antiguos.`,
      ),
      { status: 400 },
    );
  }

  const status = ["active", "draft", "archived"].includes(data.status)
    ? data.status
    : "draft";

  const campaignId = data.campaignId ? Number(data.campaignId) : null;

  // 🔒 Validación: No permitir nacer en 'active' si la campaña padre está en borrador o archivada
  if (status === "active" && campaignId) {
    await assertCampaignAllowsActive(tenantId, campaignId);
  }

  // Heredar fechas de la campaña si no vinieron explícitas
  let startsAt = data.startsAt ? new Date(data.startsAt) : null;
  let endsAt = data.endsAt ? new Date(data.endsAt) : null;

  if (campaignId && (!startsAt || !endsAt)) {
    const campaign = await Campaign.findOne({
      where: { tenantId, id: campaignId },
      attributes: ["startsAt", "endsAt"],
    });
    if (campaign) {
      if (!startsAt) startsAt = campaign.startsAt;
      if (!endsAt) endsAt = campaign.endsAt;
    }
  }

  const isCarouselCustom = kind === "carousel" && data.config?.customPerSlide;
  const linkType = isCarouselCustom ? "none" : data.linkType || "none";
  const categoryId =
    !isCarouselCustom && linkType === "category" ? data.categoryId : null;
  const productId =
    !isCarouselCustom && linkType === "product" ? data.productId : null;
  const externalUrl =
    !isCarouselCustom && linkType === "external" ? data.externalUrl : null;

  const transaction = await sequelize.transaction();
  let createdContent = null;

  try {
    // 2. Si se crea como activo, desplazar solo a los que colisionan en su propio ámbito
    if (status === "active") {
      await displaceConflictingItems(
        tenantId,
        slotKey,
        campaignId,
        null,
        transaction,
      );
    }

    createdContent = await SiteContent.create(
      {
        tenantId,
        name: name.trim(),
        kind,
        slotKey,
        status,
        campaignId,
        startsAt,
        endsAt,
        linkType,
        categoryId,
        productId,
        externalUrl,
        config: data.config || {},
        sortOrder: activeAndDraftCount,
      },
      { transaction },
    );

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  // 3. Registrar en scheduler si es activo
  if (createdContent.status === "active") {
    contentScheduler.register(createdContent);
  }

  invalidateBootstrapCache(tenantId);
  return createdContent;
};

const update = async (tenantId, id, data) => {
  // getById ya incluye { model: Campaign, as: 'campaign' }
  const item = await getById(tenantId, id);

  const payload = {};

  if (data.name !== undefined) {
    payload.name = data.name.trim();
  }

  const nextCampaignId =
    "campaignId" in data
      ? data.campaignId
        ? Number(data.campaignId)
        : null
      : item.campaignId;

  if ("campaignId" in data) {
    payload.campaignId = nextCampaignId;
  }

  const nextStatus = data.status !== undefined ? data.status : item.status;
  if (data.status !== undefined) {
    payload.status = nextStatus;
  }

  // 🔒 Validación: No permitir quedar en 'active' si la campaña está en borrador o archivada
  if (nextStatus === "active" && nextCampaignId) {
    await assertCampaignAllowsActive(
      tenantId,
      nextCampaignId,
      nextCampaignId === item.campaignId ? item.campaign : null,
    );
  }

  if (data.startsAt !== undefined) {
    payload.startsAt = data.startsAt ? new Date(data.startsAt) : null;
  }

  if (data.endsAt !== undefined) {
    payload.endsAt = data.endsAt ? new Date(data.endsAt) : null;
  }

  // Si se vinculó o cambió de campaña sin mandar fechas propias:
  if (
    nextCampaignId &&
    (data.startsAt === undefined || data.endsAt === undefined)
  ) {
    const campaign =
      nextCampaignId === item.campaignId && item.campaign
        ? item.campaign
        : await Campaign.findOne({
            where: { tenantId, id: nextCampaignId },
            attributes: ["startsAt", "endsAt"],
          });

    if (campaign) {
      if (data.startsAt === undefined) payload.startsAt = campaign.startsAt;
      if (data.endsAt === undefined) payload.endsAt = campaign.endsAt;
    }
  }

  if (data.config !== undefined) {
    payload.config = data.config;
  }

  const isCustomPerSlide =
    item.kind === "carousel" &&
    Boolean(
      data.config !== undefined
        ? data.config?.customPerSlide
        : item.config?.customPerSlide,
    );

  if (isCustomPerSlide) {
    payload.linkType = "none";
    payload.categoryId = null;
    payload.productId = null;
    payload.externalUrl = null;
  } else if (data.linkType !== undefined) {
    payload.linkType = data.linkType;
    payload.categoryId = data.linkType === "category" ? data.categoryId : null;
    payload.productId = data.linkType === "product" ? data.productId : null;
    payload.externalUrl =
      data.linkType === "external" ? data.externalUrl : null;
  }

  if (data.sortOrder !== undefined) {
    payload.sortOrder = Number(data.sortOrder);
  }

  const transaction = await sequelize.transaction();

  try {
    // Si pasa a activo, desplaza únicamente dentro de su ámbito
    if (nextStatus === "active" && item.status !== "active") {
      await displaceConflictingItems(
        tenantId,
        item.slotKey,
        nextCampaignId,
        item.id,
        transaction,
      );
    }

    await item.update(payload, { transaction });
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  // Traer el item con la relación actualizada de campaña
  const refreshedItem = await getById(tenantId, id);

  // Sincronizar scheduler
  if (refreshedItem.status === "active") {
    contentScheduler.register(refreshedItem);
  } else {
    contentScheduler.cancel(refreshedItem.id);
  }

  invalidateBootstrapCache(tenantId);
  return refreshedItem;
};

const remove = async (tenantId, id) => {
  const item = await getById(tenantId, id);

  contentScheduler.cancel(item.id);
  await item.destroy();

  invalidateBootstrapCache(tenantId);
  return true;
};

const toggleStatus = async (tenantId, id) => {
  const item = await getById(tenantId, id);

  if (item.status === "archived") {
    throw Object.assign(
      new Error("No se puede conmutar un contenido archivado"),
      { status: 400 },
    );
  }

  let updated;

  if (item.status === "draft") {
    // 🔒 Validación: reutiliza item.campaign si ya la trajo getById
    await assertCampaignAllowsActive(tenantId, item.campaignId, item.campaign);
    const transaction = await sequelize.transaction();
    try {
      // Al pasar a activo, desplaza solo a su competencia directa (en su mismo ámbito)
      await displaceConflictingItems(
        tenantId,
        item.slotKey,
        item.campaignId,
        item.id,
        transaction,
      );
      updated = await item.update({ status: "active" }, { transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    contentScheduler.register(updated);
  } else {
    contentScheduler.cancel(item.id);
    updated = await item.update({ status: "draft" });
  }

  invalidateBootstrapCache(tenantId);
  return updated;
};

module.exports = {
  getById,
  listBySlot,
  listByKind,
  create,
  update,
  remove,
  toggleStatus,
};
