const { Billing, Tenant } = require("../../models");

const STATUSES = ["active", "past_due", "suspended"];

/**
 * Obtiene la ficha de billing del tenant.
 * Si aún no existe el registro en la tabla billings, lo inicializa con un ciclo de 30 días.
 */
async function getBillingByTenantId(tenantId) {
  if (!tenantId) {
    throw Object.assign(new Error("tenantId es requerido"), { status: 400 });
  }

  let billing = await Billing.findOne({ where: { tenantId } });

  if (!billing) {
    const tenant = await Tenant.findByPk(tenantId);
    const initialStatus = STATUSES.includes(tenant?.billingStatus)
      ? tenant.billingStatus
      : "active";

    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(now.getDate() + 30);

    billing = await Billing.create({
      tenantId,
      planName: "Plan Comercio",
      status: initialStatus,
      amount: 0.0,
      currency: "ARS",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    });
  }

  return billing;
}

/**
 * Actualiza el registro de facturación de un tenant y sincroniza el status en la tabla tenants.
 */
async function updateBillingByTenantId(tenantId, data) {
  const billing = await getBillingByTenantId(tenantId);

  const updates = {};

  if (data.status !== undefined) {
    if (!STATUSES.includes(data.status)) {
      throw Object.assign(new Error("Estado de billing inválido"), {
        status: 400,
      });
    }
    updates.status = data.status;
  }

  if (data.planName !== undefined) updates.planName = data.planName;
  if (data.amount !== undefined) updates.amount = data.amount;
  if (data.currency !== undefined) updates.currency = data.currency;
  if (data.currentPeriodStart !== undefined)
    updates.currentPeriodStart = data.currentPeriodStart;
  if (data.currentPeriodEnd !== undefined)
    updates.currentPeriodEnd = data.currentPeriodEnd;
  if (data.notes !== undefined) updates.notes = data.notes;

  await billing.update(updates);

  // Mantener retrocompatibilidad con la columna billing_status en tenants
  if (updates.status) {
    await Tenant.update(
      { billingStatus: updates.status },
      { where: { id: tenantId } },
    );
  }

  return billing;
}

module.exports = {
  getBillingByTenantId,
  updateBillingByTenantId,
  STATUSES,
};
