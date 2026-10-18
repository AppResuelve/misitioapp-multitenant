const { Category, Product } = require("../../models");

const slugify = (text) => {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 255);
};

const list = async (tenantId) => {
  return Category.findAll({
    where: { tenantId },
    order: [
      ["order", "ASC"],
      ["name", "ASC"],
    ],
    include: [
      {
        model: Product,
        as: "products",
        attributes: ["id"],
        where: { status: "active" },
        required: false,
      },
    ],
  });
};

const getById = async (tenantId, id) => {
  const category = await Category.findOne({ where: { tenantId, id } });
  if (!category) {
    throw Object.assign(new Error("Categoría no encontrada"), { status: 404 });
  }
  return category;
};

const checkSlugAvailability = async (tenantId, slug, excludeId = null) => {
  const existing = await Category.findOne({ where: { tenantId, slug } });
  if (existing && existing.id !== excludeId) {
    throw Object.assign(new Error("Ya existe una categoría con ese slug"), {
      status: 400,
    });
  }
};

const create = async (tenantId, data) => {
  const name = data.name ? data.name.trim() : "";
  if (!name) {
    throw Object.assign(new Error("El nombre de la categoría es requerido"), {
      status: 400,
    });
  }

  const slug = (data.slug ? data.slug.trim() : slugify(name)) || slugify(name);
  await checkSlugAvailability(tenantId, slug);

  const count = await Category.count({ where: { tenantId } });

  return Category.create({
    tenantId,
    name,
    slug,
    image: data.image ? data.image.trim() : null,
    status: data.status || "active",
    order: data.order !== undefined ? Number(data.order) : count,
  });
};

const update = async (tenantId, id, data) => {
  const category = await getById(tenantId, id);

  const payload = {};

  if (data.name !== undefined) {
    payload.name = data.name.trim();
  }

  // Si envían slug explícito o si cambiaron el nombre sin enviar slug nuevo
  if (data.slug !== undefined || (data.name && !data.slug)) {
    const rawSlug = data.slug !== undefined ? data.slug : slugify(data.name);
    const nextSlug = rawSlug
      ? rawSlug.trim()
      : slugify(payload.name || category.name);

    if (nextSlug !== category.slug) {
      await checkSlugAvailability(tenantId, nextSlug, category.id);
      payload.slug = nextSlug;
    }
  }

  if (data.image !== undefined) {
    payload.image = data.image ? data.image.trim() : null;
  }

  if (data.status !== undefined) {
    payload.status = data.status;
  }

  if (data.order !== undefined) {
    payload.order = Number(data.order);
  }

  return category.update(payload);
};

const remove = async (tenantId, id) => {
  const category = await getById(tenantId, id);
  return category.destroy();
};

const reorder = async (tenantId, orderedIds) => {
  const updates = orderedIds.map((categoryId, index) =>
    Category.update({ order: index }, { where: { tenantId, id: categoryId } }),
  );
  await Promise.all(updates);
  return list(tenantId);
};

const toggleStatus = async (tenantId, id, status) => {
  const category = await getById(tenantId, id);
  await category.update({ status });
  return category;
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  reorder,
  toggleStatus,
};
