const { SiteContent, Campaign, Category, Product } = require("../../models");

const MAX_ITEMS_PER_SLOT = 3;

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
    where: { tenantId, slotKey },
    include: [
      {
        model: Campaign,
        as: "campaign",
        attributes: ["id", "name", "startsAt", "endsAt", "color"],
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
      ["status", "ASC"], // 'active' primero según ordenamiento o criterio de negocio
      ["sortOrder", "ASC"],
      ["createdAt", "DESC"],
    ],
  });
};

const listByKind = async (tenantId, kind) => {
  return SiteContent.findAll({
    where: { tenantId, kind },
    include: [
      {
        model: Campaign,
        as: "campaign",
        attributes: ["id", "name", "startsAt", "endsAt", "color"],
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

  // 1. Validar límite máximo de 3 por slot
  const currentCount = await SiteContent.count({
    where: { tenantId, slotKey },
  });

  if (currentCount >= MAX_ITEMS_PER_SLOT) {
    throw Object.assign(
      new Error(
        `Límite alcanzado: este espacio admite un máximo de ${MAX_ITEMS_PER_SLOT} elementos en total.`,
      ),
      { status: 400 },
    );
  }

  const status = data.status === "active" ? "active" : "draft";

  // 2. Si se crea como activo, pasar los demás a draft
  if (status === "active") {
    await SiteContent.update(
      { status: "draft" },
      { where: { tenantId, slotKey, status: "active" } },
    );
  }

  // Si se asocia a campaña y no se pasaron fechas explícitas, hereda de la campaña
  let startsAt = data.startsAt ? new Date(data.startsAt) : null;
  let endsAt = data.endsAt ? new Date(data.endsAt) : null;

  if (data.campaignId && (!startsAt || !endsAt)) {
    const campaign = await Campaign.findOne({
      where: { tenantId, id: data.campaignId },
    });
    if (campaign) {
      if (!startsAt) startsAt = campaign.startsAt;
      if (!endsAt) endsAt = campaign.endsAt;
    }
  }

  return SiteContent.create({
    tenantId,
    name: name.trim(),
    kind,
    slotKey,
    status,
    campaignId: data.campaignId || null,
    startsAt,
    endsAt,
    linkType: data.linkType || "none",
    categoryId: data.linkType === "category" ? data.categoryId : null,
    productId: data.linkType === "product" ? data.productId : null,
    externalUrl: data.linkType === "external" ? data.externalUrl : null,
    config: data.config || {},
    sortOrder: currentCount,
  });
};

const update = async (tenantId, id, data) => {
  const item = await getById(tenantId, id);

  const payload = {};

  if (data.name !== undefined) {
    payload.name = data.name.trim();
  }

  if (data.status !== undefined) {
    // Si se activa este registro, desactivar cualquier otro del mismo slot
    if (data.status === "active" && item.status !== "active") {
      await SiteContent.update(
        { status: "draft" },
        { where: { tenantId, slotKey: item.slotKey, status: "active" } },
      );
    }
    payload.status = data.status;
  }

  if (data.campaignId !== undefined) {
    payload.campaignId = data.campaignId || null;
  }

  if (data.startsAt !== undefined) {
    payload.startsAt = data.startsAt ? new Date(data.startsAt) : null;
  }

  if (data.endsAt !== undefined) {
    payload.endsAt = data.endsAt ? new Date(data.endsAt) : null;
  }

  if (data.linkType !== undefined) {
    payload.linkType = data.linkType;
    payload.categoryId = data.linkType === "category" ? data.categoryId : null;
    payload.productId = data.linkType === "product" ? data.productId : null;
    payload.externalUrl =
      data.linkType === "external" ? data.externalUrl : null;
  } else {
    if (data.categoryId !== undefined) payload.categoryId = data.categoryId;
    if (data.productId !== undefined) payload.productId = data.productId;
    if (data.externalUrl !== undefined) payload.externalUrl = data.externalUrl;
  }

  if (data.config !== undefined) {
    payload.config = data.config;
  }

  if (data.sortOrder !== undefined) {
    payload.sortOrder = Number(data.sortOrder);
  }

  return item.update(payload);
};

const remove = async (tenantId, id) => {
  const item = await getById(tenantId, id);
  return item.destroy();
};

const toggleStatus = async (tenantId, id) => {
  const item = await getById(tenantId, id);

  if (item.status === "draft") {
    // Pasar a activo y desactivar el activo actual del slot
    await SiteContent.update(
      { status: "draft" },
      { where: { tenantId, slotKey: item.slotKey, status: "active" } },
    );
    return item.update({ status: "active" });
  } else {
    return item.update({ status: "draft" });
  }
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
