const {
  AttributeValue,
  Attribute,
  Service,
  ServiceVariant,
  ServiceVariantModifier,
} = require("../../models");

const variantInclude = {
  model: ServiceVariant,
  as: "variants",
  where: { status: "active" },
  required: false,
  include: [
    {
      model: ServiceVariantModifier,
      as: "modifiers",
      where: { status: "active" },
      required: false,
    },
    {
      model: AttributeValue,
      as: "attributeValues",
      through: { attributes: [] },
      include: [{ model: Attribute, as: "attribute" }],
    },
  ],
  order: [
    ["sort_order", "ASC"],
    ["modifiers", "sort_order", "ASC"],
  ],
};

const list = async (query = {}) => {
  const { page = 1, limit = 50 } = query;
  const offset = (page - 1) * limit;
  const where = { status: "active" };

  const { count, rows } = await Service.findAndCountAll({
    where,
    include: [variantInclude],
    order: [["name", "ASC"]],
    limit: Number(limit),
    offset,
  });

  return {
    services: rows,
    total: count,
    page: Number(page),
    totalPages: Math.ceil(count / limit),
  };
};

const getBySlug = async (slug) => {
  const service = await Service.findOne({
    where: { slug, status: "active" },
    include: [variantInclude],
  });
  if (!service)
    throw Object.assign(new Error("Servicio no encontrado"), { status: 404 });
  return service;
};

module.exports = { list, getBySlug };
