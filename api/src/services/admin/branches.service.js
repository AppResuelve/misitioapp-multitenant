const { Branch } = require("../../models");

const list = async (tenantId) => {
  return Branch.findAll({
    where: { tenantId },
    order: [
      ["sortOrder", "ASC"],
      ["name", "ASC"],
    ],
  });
};

const getById = async (tenantId, id) => {
  const branch = await Branch.findOne({ where: { tenantId, id } });
  if (!branch) {
    throw Object.assign(new Error("Sucursal no encontrada"), { status: 404 });
  }
  return branch;
};

const create = async (tenantId, data) => {
  const { name, phone, address, city, country, hours, isActive } = data;
  const count = await Branch.count({ where: { tenantId } });

  return Branch.create({
    tenantId,
    name,
    phone,
    address: address || null,
    city: city || null,
    country: country || null,
    hours: typeof hours === "string" ? hours : JSON.stringify(hours || []),
    isActive: isActive ?? true,
    sortOrder: count,
  });
};

const update = async (tenantId, id, data) => {
  const branch = await getById(tenantId, id);
  const { name, phone, address, city, country, hours, isActive } = data;

  return branch.update({
    ...(name !== undefined && { name }),
    ...(phone !== undefined && { phone }),
    ...(address !== undefined && { address: address || null }),
    ...(city !== undefined && { city: city || null }),
    ...(country !== undefined && { country: country || null }),
    ...(hours !== undefined && {
      hours: typeof hours === "string" ? hours : JSON.stringify(hours),
    }),
    ...(isActive !== undefined && { isActive }),
  });
};

const remove = async (tenantId, id) => {
  const branch = await getById(tenantId, id);
  return branch.destroy();
};

const reorder = async (tenantId, orderedIds = []) => {
  if (!Array.isArray(orderedIds) || orderedIds.length === 0) {
    return list(tenantId);
  }

  const updates = orderedIds.map((branchId, index) =>
    Branch.update({ sortOrder: index }, { where: { tenantId, id: branchId } }),
  );
  await Promise.all(updates);
  return list(tenantId);
};

const toggleStatus = async (tenantId, id) => {
  const branch = await getById(tenantId, id);
  return branch.update({ isActive: !branch.isActive });
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
