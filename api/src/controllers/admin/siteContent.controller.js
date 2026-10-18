const siteContentService = require("../../services/admin/siteContent.service");

const getTenantId = (req) => {
  return req.tenant?.id || req.user?.tenantId || req.tenantId;
};

const list = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const { slotKey, kind } = req.query;

    let items = [];
    if (slotKey) {
      items = await siteContentService.listBySlot(tenantId, slotKey);
    } else if (kind) {
      items = await siteContentService.listByKind(tenantId, kind);
    } else {
      // Si no especifican filtro, listamos por kind banner por defecto o todos
      items = await siteContentService.listByKind(tenantId, "banner");
    }

    return res.json(items);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const item = await siteContentService.getById(tenantId, id);
    return res.json(item);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const created = await siteContentService.create(tenantId, req.body);
    return res.status(201).json(created);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const updated = await siteContentService.update(tenantId, id, req.body);
    return res.json(updated);
  } catch (err) {
    next(err);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const toggled = await siteContentService.toggleStatus(tenantId, id);
    return res.json(toggled);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    await siteContentService.remove(tenantId, id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  toggleStatus,
  remove,
};
