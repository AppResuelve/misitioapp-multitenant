const { Op } = require("sequelize");
const { Billing, Tenant, User, EmailLog } = require("../models");
const { sendEmail, TYPES } = require("../modules/emails");
const { adminOriginFromTenant } = require("../utils/adminOrigin");

// Helper para armar la clave única por ciclo
const getPeriodKey = (dateStr, prefix = "") => {
  if (!dateStr) return null;
  const dateFormatted = new Date(dateStr).toISOString().slice(0, 10); // YYYY-MM-DD
  return prefix ? `${prefix}_${dateFormatted}` : dateFormatted;
};

// Intenta registrar en email_logs garantizando idempotencia a nivel DB
const dispatchEmailSafely = async ({ tenantId, to, type, periodKey, data }) => {
  // 1. Verificación previa
  const existing = await EmailLog.findOne({
    where: { tenantId, type, periodKey, status: "sent" },
  });
  if (existing) {
    console.log(
      `[billingCron] Email omitido (ya enviado): ${type} para tenant ${tenantId} (${periodKey})`,
    );
    return false;
  }

  // 2. Despachar correo vía Brevo
  let sendError = null;
  let result = null;
  try {
    result = await sendEmail({
      tenantId,
      to,
      type,
      data,
      branding: "appresuelve",
    });
  } catch (err) {
    sendError = err;
    console.error(
      `[billingCron] Error enviando email ${type} a ${to}:`,
      err.message,
    );
  }

  // 3. Registrar auditoría con upsert usando el índice único compuesto
  try {
    await EmailLog.upsert({
      tenantId,
      type,
      periodKey,
      status: sendError || !result ? "failed" : "sent",
      error: sendError
        ? sendError.message
        : !result
          ? "Fallo de respuesta de Brevo"
          : null,
      sentAt: sendError || !result ? null : new Date(),
    });
  } catch (dbErr) {
    console.error(
      `[billingCron] Error al guardar EmailLog para tenant ${tenantId}:`,
      dbErr.message,
    );
  }

  return Boolean(result);
};

const runBillingCron = async () => {
  const now = new Date();
  console.log(
    `[billingCron] Corriendo chequeo nocturno a fecha: ${now.toISOString()}`,
  );

  // =========================================================================
  // CASO 1: Tiendas activas cuyo período vence hoy o venció recientemente
  // Pasan a past_due (se activa el período de gracia)
  // =========================================================================
  const expiredActives = await Billing.findAll({
    where: {
      status: "active",
      currentPeriodEnd: { [Op.lte]: now },
    },
    include: [{ model: Tenant }],
  });

  for (const billing of expiredActives) {
    // Si no tiene graceUntil seteado, le damos 5 días de gracia por defecto
    const graceUntil =
      billing.graceUntil || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

    billing.status = "past_due";
    billing.graceUntil = graceUntil;
    await billing.save();

    const adminUser = await User.findOne({
      where: { tenantId: billing.tenantId, role: "admin", status: "active" },
    });

    if (adminUser) {
      const periodKey = getPeriodKey(billing.currentPeriodEnd);
      const daysLeft = Math.max(
        1,
        Math.ceil((new Date(graceUntil) - now) / (1000 * 60 * 60 * 24)),
      );
      const billingUrl = `${adminOriginFromTenant(billing.Tenant)}/dashboard/settings/billing`;

      await dispatchEmailSafely({
        tenantId: billing.tenantId,
        to: adminUser.email,
        type: TYPES.SUBSCRIPTION_EXPIRING_SOON,
        periodKey,
        data: {
          recipientName: adminUser.name,
          tenantName: billing.Tenant?.name,
          daysLeft,
          billingUrl,
        },
      });
    }
  }

  // =========================================================================
  // CASO 2: Tiendas en past_due cuya fecha límite de gracia ya venció
  // Pasan a suspended (bloqueo total) y se envía el mail de corte
  // =========================================================================
  const toSuspend = await Billing.findAll({
    where: {
      status: "past_due",
      graceUntil: { [Op.lte]: now },
    },
    include: [{ model: Tenant }],
  });

  for (const billing of toSuspend) {
    billing.status = "suspended";
    billing.suspendedAt = now;
    await billing.save();

    const adminUser = await User.findOne({
      where: { tenantId: billing.tenantId, role: "admin", status: "active" },
    });

    if (adminUser) {
      const periodKey = getPeriodKey(billing.graceUntil, "suspended");
      const billingUrl = `${adminOriginFromTenant(billing.Tenant)}/dashboard/settings/billing`;

      await dispatchEmailSafely({
        tenantId: billing.tenantId,
        to: adminUser.email,
        type: TYPES.ACCOUNT_SUSPENDED,
        periodKey,
        data: {
          recipientName: adminUser.name,
          tenantName: billing.Tenant?.name,
          billingUrl,
        },
      });
    }
  }

  console.log(
    `[billingCron] Finalizado: ${expiredActives.length} pasaron a past_due, ${toSuspend.length} suspendidos.`,
  );
};

module.exports = { runBillingCron };
