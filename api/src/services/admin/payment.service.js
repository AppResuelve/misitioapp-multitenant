const { PaymentMethod } = require("../../models");

const list = async (tenantId) => {
  return PaymentMethod.findAll({
    where: { tenantId },
    order: [
      ["sortOrder", "ASC"],
      ["createdAt", "ASC"],
    ],
  });
};

const getById = async (tenantId, id) => {
  return PaymentMethod.findOne({
    where: { id, tenantId },
  });
};

const create = async (tenantId, data) => {
  const { type, title, badge, description, isActive, brands, sortOrder } = data;
  return PaymentMethod.create({
    tenantId,
    type: type || "credit",
    title,
    badge: badge || null,
    description: description || null,
    isActive: isActive ?? true,
    brands: Array.isArray(brands) ? brands : [],
    sortOrder: sortOrder ?? 0,
  });
};

const update = async (tenantId, id, data) => {
  const item = await paymentService.getById(tenantId, id);
  if (!item) return null;

  const { type, title, badge, description, isActive, brands, sortOrder } = data;
  return item.update({
    ...(type !== undefined && { type }),
    ...(title !== undefined && { title }),
    ...(badge !== undefined && { badge }),
    ...(description !== undefined && { description }),
    ...(isActive !== undefined && { isActive }),
    ...(brands !== undefined && { brands }),
    ...(sortOrder !== undefined && { sortOrder }),
  });
};

const remove = async (tenantId, id) => {
  const item = await paymentService.getById(tenantId, id);
  if (!item) return null;

  await item.destroy();
  return true;
};

const reorder = async (tenantId, orders = []) => {
  if (!Array.isArray(orders) || orders.length === 0) return true;

  await Promise.all(
    orders.map(({ id, sortOrder }) =>
      PaymentMethod.update({ sortOrder }, { where: { id, tenantId } }),
    ),
  );
  return true;
};

module.exports = { getById, list, create, update, remove, reorder };
