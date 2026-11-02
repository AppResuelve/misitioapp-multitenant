const { Op } = require("sequelize");
const { Campaign, Discount, SiteContent, sequelize } = require("../../models");
const { slugify } = require("../../utils/slugify");
const {
  invalidateBootstrapCache,
} = require("../../utils/cache/bootstrapCache");
const { invalidateTenantProducts } = require("../../utils/cache/productsCache");
// Se requiere de forma diferida o lazy si hay dependencia circular con scheduler
let campaignScheduler = null;
const getScheduler = () => {
  if (!campaignScheduler) {
    campaignScheduler = require("../../scheduler/campaignScheduler");
  }
  return campaignScheduler;
};

/**
 * Calcula el estado temporal en tiempo de ejecución
 */
const getTimingStatus = (startsAt, endsAt) => {
  const now = new Date();
  const start = new Date(startsAt);
  const end = new Date(endsAt);

  if (now < start) return "upcoming";
  if (now > end) return "ended";
  return "running";
};

const checkSlugAvailability = async (tenantId, slug, excludeId = null) => {
  const existing = await Campaign.findOne({ where: { tenantId, slug } });
  if (existing && existing.id !== excludeId) {
    throw Object.assign(new Error("Ya existe una campaña con ese slug"), {
      status: 400,
    });
  }
};

const list = async (tenantId, filters = {}) => {
  const where = { tenantId };
  if (filters.status) {
    where.status = filters.status;
  }

  const campaigns = await Campaign.findAll({
    where,
    order: [
      ["startsAt", "DESC"],
      ["createdAt", "DESC"],
    ],
  });

  return campaigns.map((c) => {
    const json = c.toJSON();
    return {
      ...json,
      timingStatus: getTimingStatus(json.startsAt, json.endsAt),
    };
  });
};

const getById = async (tenantId, id) => {
  const campaign = await Campaign.findOne({
    where: { tenantId, id },
    include: [
      {
        model: Discount,
        as: "discounts",
        attributes: ["id", "name", "type", "percentage", "status"],
        required: false,
      },
      {
        model: SiteContent,
        as: "contents",
        attributes: ["id", "name", "kind", "slotKey", "status"],
        required: false,
      },
    ],
  });

  if (!campaign) {
    throw Object.assign(new Error("Campaña no encontrada"), { status: 404 });
  }

  const json = campaign.toJSON();
  return {
    ...json,
    timingStatus: getTimingStatus(json.startsAt, json.endsAt),
  };
};

const create = async (tenantId, data) => {
  const name = data.name ? data.name.trim() : "";
  if (!name) {
    throw Object.assign(new Error("El nombre de la campaña es requerido"), {
      status: 400,
    });
  }

  if (!data.startsAt || !data.endsAt) {
    throw Object.assign(
      new Error("Las fechas de inicio y fin son obligatorias"),
      { status: 400 },
    );
  }

  const start = new Date(data.startsAt);
  const end = new Date(data.endsAt);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw Object.assign(new Error("Formato de fecha inválido"), {
      status: 400,
    });
  }

  if (end <= start) {
    throw Object.assign(
      new Error("La fecha de fin debe ser posterior a la fecha de inicio"),
      { status: 400 },
    );
  }

  const slug = (data.slug ? data.slug.trim() : slugify(name)) || slugify(name);
  await checkSlugAvailability(tenantId, slug);

  const campaign = await Campaign.create({
    tenantId,
    name,
    slug,
    description: data.description ? data.description.trim() : null,
    startsAt: start,
    endsAt: end,
    status: data.status || "draft",
    color: data.color || "#6366f1",
  });

  // Si se crea directamente como activa, registrar en scheduler
  if (campaign.status === "active") {
    getScheduler().register(campaign);
    invalidateBootstrapCache(tenantId);
    invalidateTenantProducts(tenantId);
  }

  const json = campaign.toJSON();
  return {
    ...json,
    timingStatus: getTimingStatus(json.startsAt, json.endsAt),
  };
};

const update = async (tenantId, id, data) => {
  const campaign = await Campaign.findOne({ where: { tenantId, id } });
  if (!campaign) {
    throw Object.assign(new Error("Campaña no encontrada"), { status: 404 });
  }

  if (campaign.status === "archived") {
    throw Object.assign(
      new Error("No se puede editar una campaña archivada."),
      { status: 400 },
    );
  }

  const payload = {};

  if (data.name !== undefined) {
    payload.name = data.name.trim();
  }

  if (data.slug !== undefined || (data.name && !data.slug)) {
    const rawSlug = data.slug !== undefined ? data.slug : slugify(data.name);
    const nextSlug = rawSlug
      ? rawSlug.trim()
      : slugify(payload.name || campaign.name);

    if (nextSlug !== campaign.slug) {
      await checkSlugAvailability(tenantId, nextSlug, campaign.id);
      payload.slug = nextSlug;
    }
  }

  if (data.description !== undefined) {
    payload.description = data.description ? data.description.trim() : null;
  }

  const nextStart =
    data.startsAt !== undefined ? new Date(data.startsAt) : campaign.startsAt;
  const nextEnd =
    data.endsAt !== undefined ? new Date(data.endsAt) : campaign.endsAt;

  let datesChanged = false;
  if (data.startsAt !== undefined || data.endsAt !== undefined) {
    if (isNaN(nextStart.getTime()) || isNaN(nextEnd.getTime())) {
      throw Object.assign(new Error("Formato de fecha inválido"), {
        status: 400,
      });
    }
    if (nextEnd <= nextStart) {
      throw Object.assign(
        new Error("La fecha de fin debe ser posterior a la fecha de inicio"),
        { status: 400 },
      );
    }
    payload.startsAt = nextStart;
    payload.endsAt = nextEnd;
    datesChanged = true;
  }

  if (data.color !== undefined) {
    payload.color = data.color || "#6366f1";
  }

  const statusChanged =
    data.status !== undefined && data.status !== campaign.status;

  const transaction = await sequelize.transaction();
  try {
    if (data.status !== undefined) {
      payload.status = data.status;
    }

    await campaign.update(payload, { transaction });

    // Si cambió el status vía update general, propagar a los hijos
    if (statusChanged) {
      if (data.status === "active") {
        await Discount.update(
          { status: "active" },
          { where: { campaignId: id, tenantId, status: "draft" }, transaction },
        );
        await SiteContent.update(
          { status: "active" },
          { where: { campaignId: id, tenantId, status: "draft" }, transaction },
        );
      } else if (data.status === "draft") {
        await Discount.update(
          { status: "draft" },
          {
            where: { campaignId: id, tenantId, status: "active" },
            transaction,
          },
        );
        await SiteContent.update(
          { status: "draft" },
          {
            where: { campaignId: id, tenantId, status: "active" },
            transaction,
          },
        );
      } else if (data.status === "archived") {
        await Discount.update(
          { status: "archived" },
          { where: { campaignId: id, tenantId }, transaction },
        );
        await SiteContent.update(
          { status: "archived" },
          { where: { campaignId: id, tenantId }, transaction },
        );
      }
    }

    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  // Sincronizar scheduler y caché según los cambios
  if (campaign.status === "archived") {
    getScheduler().cancel(campaign.id);
  } else if (statusChanged || datesChanged) {
    if (campaign.status === "active") {
      getScheduler().register(campaign);
    } else {
      getScheduler().cancel(campaign.id);
    }
  }

  invalidateBootstrapCache(tenantId);
  invalidateTenantProducts(tenantId);

  const json = campaign.toJSON();
  return {
    ...json,
    timingStatus: getTimingStatus(json.startsAt, json.endsAt),
  };
};

const remove = async (tenantId, id) => {
  const transaction = await sequelize.transaction();
  try {
    const campaign = await Campaign.findOne({
      where: { tenantId, id },
      transaction,
    });

    if (!campaign) {
      throw Object.assign(new Error("Campaña no encontrada"), { status: 404 });
    }

    // 1. Apagar y desvincular descuentos dependientes
    await Discount.update(
      { status: "draft", campaignId: null },
      { where: { campaignId: id, tenantId }, transaction },
    );

    // 2. Apagar y desvincular contenidos dependientes
    await SiteContent.update(
      { status: "draft", campaignId: null },
      { where: { campaignId: id, tenantId }, transaction },
    );

    // 3. Eliminar la campaña
    await campaign.destroy({ transaction });

    await transaction.commit();

    getScheduler().cancel(id);
    invalidateBootstrapCache(tenantId);
    invalidateTenantProducts(tenantId);

    return true;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

/**
 * Activa la campaña y sus recursos hijos
 */
const activate = async (campaignId) => {
  const transaction = await sequelize.transaction();
  let updatedCampaign = null;
  try {
    const campaign = await Campaign.findByPk(campaignId, { transaction });
    if (!campaign || campaign.status === "archived") {
      await transaction.rollback();
      return null;
    }

    await campaign.update({ status: "active" }, { transaction });

    // Pasan a active los hijos en draft
    await Discount.update(
      { status: "active" },
      {
        where: {
          campaignId,
          tenantId: campaign.tenantId,
          status: "draft",
        },
        transaction,
      },
    );

    await SiteContent.update(
      { status: "active" },
      {
        where: {
          campaignId,
          tenantId: campaign.tenantId,
          status: "draft",
        },
        transaction,
      },
    );

    await transaction.commit();
    updatedCampaign = campaign;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  getScheduler().register(updatedCampaign);
  invalidateBootstrapCache(updatedCampaign.tenantId);
  invalidateTenantProducts(updatedCampaign.tenantId);

  return updatedCampaign;
};

/**
 * Archiva la campaña y archiva sus recursos hijos
 */
const archive = async (campaignId) => {
  const transaction = await sequelize.transaction();
  let updatedCampaign = null;
  try {
    const campaign = await Campaign.findByPk(campaignId, { transaction });
    if (!campaign || campaign.status === "archived") {
      await transaction.rollback();
      return null;
    }

    await campaign.update({ status: "archived" }, { transaction });

    // Se archivan los recursos dependientes
    await Discount.update(
      { status: "archived" },
      {
        where: {
          campaignId,
          tenantId: campaign.tenantId,
          status: { [Op.in]: ["active", "draft"] },
        },
        transaction,
      },
    );

    await SiteContent.update(
      { status: "archived" },
      {
        where: {
          campaignId,
          tenantId: campaign.tenantId,
          status: { [Op.in]: ["active", "draft"] },
        },
        transaction,
      },
    );

    await transaction.commit();
    updatedCampaign = campaign;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }

  getScheduler().cancel(campaignId);
  invalidateBootstrapCache(updatedCampaign.tenantId);
  invalidateTenantProducts(updatedCampaign.tenantId);

  return updatedCampaign;
};

const toggleStatus = async (tenantId, id) => {
  const campaign = await Campaign.findOne({ where: { tenantId, id } });
  if (!campaign) {
    throw Object.assign(new Error("Campaña no encontrada"), { status: 404 });
  }

  if (campaign.status === "archived") {
    throw Object.assign(
      new Error("Una campaña archivada no puede conmutarse directamente."),
      { status: 400 },
    );
  }

  let updated;
  if (campaign.status === "active") {
    const transaction = await sequelize.transaction();
    try {
      await campaign.update({ status: "draft" }, { transaction });

      await Discount.update(
        { status: "draft" },
        { where: { campaignId: id, tenantId, status: "active" }, transaction },
      );

      await SiteContent.update(
        { status: "draft" },
        { where: { campaignId: id, tenantId, status: "active" }, transaction },
      );

      await transaction.commit();
      updated = campaign;
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    getScheduler().cancel(id);
    invalidateBootstrapCache(tenantId);
    invalidateTenantProducts(tenantId);
  } else {
    updated = await activate(id);
  }

  const json = updated.toJSON();
  return {
    ...json,
    timingStatus: getTimingStatus(json.startsAt, json.endsAt),
  };
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  toggleStatus,
  activate,
  archive,
};
