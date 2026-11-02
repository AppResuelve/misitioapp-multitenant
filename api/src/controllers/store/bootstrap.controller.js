const bootstrapService = require("../../services/store/bootstap.service");

const getBootstrap = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    const settings = req.storeSettings || {};
    const billingStatus = req.billingStatus || "active";

    const data = await bootstrapService.getBootstrap(
      tenantId,
      settings,
      billingStatus,
    );
    return res.json(data);
  } catch (err) {
    next(err);
  }
};

module.exports = { getBootstrap };
