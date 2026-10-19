const { Op } = require("sequelize");
const { Billing, Tenant, EmailLog } = require("../models");
const emailService = require("../services/email.service");

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function periodKeyOf(billing) {
  if (!billing.currentPeriodEnd) return null;
  return new Date(billing.currentPeriodEnd).toISOString().slice(0, 10);
}

// Envío con idempotencia garantizada por (tenant_id, type, period_key)
async function notifyTenant(billing, tenant, type) {
  const periodKey = periodKeyOf(billing);

  const existing = await EmailLog.findOne({
    where: { tenantId: tenant.id, type, periodKey },
  });
  if (existing) return { sent: false, reason: "already_sent" };

  try {
    await emailService.sendBillingEmail(tenant, type, billing);
    await EmailLog.create({
      tenantId: tenant.id,
      type,
      periodKey,
      status: "sent",
      sentAt: new Date(),
    });
    return { sent: true };
  } catch (err) {
    console.error(
      `[email] Error enviando "${type}" al tenant ${tenant.slug}:`,
      err.message,
    );
    try {
      await EmailLog.create({
        tenantId: tenant.id,
        type,
        periodKey,
        status: "failed",
        error: err.message,
        sentAt: new Date(),
      });
    } catch {}
    return { sent: false, reason: "error" };
  }
}

async function runBillingCron() {
  const now = new Date();
  const results = {
    past_due: 0,
    suspended: 0,
    reminder: 0,
    suspend_warning: 0,
  };

  // 1. Vencidos de active -> past_due (con fecha límite graceUntil)
  const expiredBillings = await Billing.findAll({
    where: {
      status: "active",
      currentPeriodEnd: { [Op.lte]: now },
    },
    include: [{ model: Tenant, as: "tenant" }],
  });

  for (const billing of expiredBillings) {
    try {
      const graceDays = billing.graceDays || 4;
      const graceUntil = addDays(billing.currentPeriodEnd, graceDays);

      await billing.update({
        status: "past_due",
        graceUntil,
        lastCronAt: now,
      });

      if (billing.tenant) {
        await notifyTenant(billing, billing.tenant, "billing_past_due");
      }
      results.past_due++;
    } catch (err) {
      console.error(
        `[billing-cron] Error en past_due tenant ${billing.tenantId}:`,
        err.message,
      );
    }
  }

  // 2. Gracia vencida de past_due -> suspended
  const pastDueBillings = await Billing.findAll({
    where: {
      status: "past_due",
      graceUntil: { [Op.lte]: now },
    },
    include: [{ model: Tenant, as: "tenant" }],
  });

  for (const billing of pastDueBillings) {
    try {
      await billing.update({
        status: "suspended",
        suspendedAt: now,
        graceUntil: null,
        lastCronAt: now,
      });

      if (billing.tenant) {
        await notifyTenant(billing, billing.tenant, "billing_suspended");
      }
      results.suspended++;
    } catch (err) {
      console.error(
        `[billing-cron] Error al suspender tenant ${billing.tenantId}:`,
        err.message,
      );
    }
  }

  // 3. Recordatorios preventivos (vence en los próximos 3 días)
  const reminderThreshold = addDays(now, 3);
  const reminderBillings = await Billing.findAll({
    where: {
      status: "active",
      currentPeriodEnd: { [Op.gt]: now, [Op.lte]: reminderThreshold },
    },
    include: [{ model: Tenant, as: "tenant" }],
  });

  for (const billing of reminderBillings) {
    if (billing.tenant) {
      const r = await notifyTenant(billing, billing.tenant, "billing_reminder");
      if (r.sent) results.reminder++;
    }
  }

  // 4. Advertencia de suspensión (la gracia vence en las próximas 24hs)
  const warningThreshold = addDays(now, 1);
  const warningBillings = await Billing.findAll({
    where: {
      status: "past_due",
      graceUntil: { [Op.gt]: now, [Op.lte]: warningThreshold },
    },
    include: [{ model: Tenant, as: "tenant" }],
  });

  for (const billing of warningBillings) {
    if (billing.tenant) {
      const r = await notifyTenant(
        billing,
        billing.tenant,
        "billing_suspend_warning",
      );
      if (r.sent) results.suspend_warning++;
    }
  }

  console.log(`[billing-cron] Finalizado:`, results);
  return results;
}

module.exports = { runBillingCron };
