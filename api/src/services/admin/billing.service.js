const { Billing, Tenant } = require("../../models");

const STATUSES = ["active", "past_due", "suspended"];

/**
 * Obtiene el registro de facturación de un tenant
 */
const getBillingByTenantId = async (tenantId) => {
  if (!tenantId) return null;

  let billing = await Billing.findOne({
    where: { tenantId },
    include: [
      {
        model: Tenant,
        as: "tenant",
        attributes: ["id", "name", "domain", "slug"],
      },
    ],
  });

  // Si el tenant no tiene fila creada todavía, devolvemos un estado fallback activo
  if (!billing) {
    return {
      status: "active",
      planName: "Plan Inicial",
      amount: 0,
      currency: "ARS",
      currentPeriodStart: new Date(),
      currentPeriodEnd: null,
      graceUntil: null,
    };
  }

  return billing;
};

/**
 * Actualiza fechas o estado de facturación de un tenant
 */
const updateBillingByTenantId = async (tenantId, payload) => {
  if (!tenantId) {
    throw Object.assign(new Error("tenantId es requerido"), { status: 400 });
  }

  if (payload.status && !STATUSES.includes(payload.status)) {
    throw Object.assign(
      new Error(`Estado inválido. Debe ser uno de: ${STATUSES.join(", ")}`),
      { status: 400 },
    );
  }

  let billing = await Billing.findOne({ where: { tenantId } });

  if (!billing) {
    billing = await Billing.create({
      tenantId,
      status: payload.status || "active",
      planName: payload.planName || "Plan Comercio",
      amount: payload.amount || 0,
      currency: payload.currency || "ARS",
      currentPeriodStart: payload.currentPeriodStart || new Date(),
      currentPeriodEnd: payload.currentPeriodEnd || null,
      graceUntil: payload.graceUntil || null,
    });
    return billing;
  }

  const updates = {};
  if (payload.status !== undefined) updates.status = payload.status;
  if (payload.planName !== undefined) updates.planName = payload.planName;
  if (payload.amount !== undefined) updates.amount = payload.amount;
  if (payload.currency !== undefined) updates.currency = payload.currency;
  if (payload.currentPeriodStart !== undefined)
    updates.currentPeriodStart = payload.currentPeriodStart;
  if (payload.currentPeriodEnd !== undefined)
    updates.currentPeriodEnd = payload.currentPeriodEnd;
  if (payload.graceUntil !== undefined) updates.graceUntil = payload.graceUntil;
  if (payload.suspendedAt !== undefined)
    updates.suspendedAt = payload.suspendedAt;

  await billing.update(updates);
  return billing;
};

/**
 * Consulta rápida de estado para guardias y middleware
 */
const getStatus = async (tenantId) => {
  const billing = await getBillingByTenantId(tenantId);
  return billing?.status || "active";
};

module.exports = {
  getBillingByTenantId,
  updateBillingByTenantId,
  getStatus,
  STATUSES,
};
