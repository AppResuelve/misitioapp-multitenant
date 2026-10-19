const billingService = require("../../services/admin/billing.service");

/**
 * GET /api/admin/billing
 * Devuelve la suscripción y ciclo del tenant autenticado en el dashboard.
 */
async function getTenantBilling(req, res, next) {
  try {
    const tenantId = req.user?.tenantId || req.tenant?.id;
    const billing = await billingService.getBillingByTenantId(tenantId);

    return res.json({
      planName: billing.planName,
      status: billing.status,
      amount: billing.amount,
      currency: billing.currency,
      currentPeriodStart: billing.currentPeriodStart,
      currentPeriodEnd: billing.currentPeriodEnd,
      graceUntil: billing.graceUntil,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getTenantBilling,
};
