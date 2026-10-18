const { Campaign, Discount, SiteContent } = require("../../models");
const { slugify } = require("../../utils/slugify");

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

  // Validación cruzada de fechas si se actualiza una o ambas
  const nextStart =
    data.startsAt !== undefined ? new Date(data.startsAt) : campaign.startsAt;
  const nextEnd =
    data.endsAt !== undefined ? new Date(data.endsAt) : campaign.endsAt;

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
    if (data.startsAt !== undefined) payload.startsAt = nextStart;
    if (data.endsAt !== undefined) payload.endsAt = nextEnd;
  }

  if (data.status !== undefined) {
    payload.status = data.status;
  }

  if (data.color !== undefined) {
    payload.color = data.color || "#6366f1";
  }

  await campaign.update(payload);

  const json = campaign.toJSON();
  return {
    ...json,
    timingStatus: getTimingStatus(json.startsAt, json.endsAt),
  };
};

const remove = async (tenantId, id) => {
  const campaign = await Campaign.findOne({ where: { tenantId, id } });
  if (!campaign) {
    throw Object.assign(new Error("Campaña no encontrada"), { status: 404 });
  }
  return campaign.destroy();
};

const toggleStatus = async (tenantId, id) => {
  const campaign = await Campaign.findOne({ where: { tenantId, id } });
  if (!campaign) {
    throw Object.assign(new Error("Campaña no encontrada"), { status: 404 });
  }

  const nextStatus = campaign.status === "active" ? "draft" : "active";
  await campaign.update({ status: nextStatus });

  const json = campaign.toJSON();
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
};
