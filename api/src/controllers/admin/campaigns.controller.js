const campaignService = require("../../services/admin/campaign.service");

const getTenantId = (req) => {
  return req.tenant?.id || req.user?.tenantId || req.tenantId;
};

const list = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const { status } = req.query;
    const campaigns = await campaignService.list(tenantId, { status });
    return res.json(campaigns);
  } catch (err) {
    next(err);
  }
};

const getById = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const campaign = await campaignService.getById(tenantId, id);
    return res.json(campaign);
  } catch (err) {
    next(err);
  }
};

const create = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const campaign = await campaignService.create(tenantId, req.body);
    return res.status(201).json(campaign);
  } catch (err) {
    next(err);
  }
};

const update = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const campaign = await campaignService.update(tenantId, id, req.body);
    return res.json(campaign);
  } catch (err) {
    next(err);
  }
};

const remove = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    await campaignService.remove(tenantId, id);
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
};

const toggleStatus = async (req, res, next) => {
  try {
    const tenantId = getTenantId(req);
    const { id } = req.params;
    const campaign = await campaignService.toggleStatus(tenantId, id);
    return res.json(campaign);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  list,
  getById,
  create,
  update,
  remove,
  toggleStatus,
};
