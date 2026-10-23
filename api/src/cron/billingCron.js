// src/cron/billingCron.js
const { Op } = require("sequelize");
const { Billing, Tenant, User } = require("../models");
const { sendEmail, TYPES } = require("../modules/emails");
const { adminOriginFromTenant } = require("../utils/adminOrigin");

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

const runBillingCron = async () => {
  const now = new Date();
  console.log(`[billingCron] Chequeo diario: ${now.toISOString()}`);

  // =========================================================================
  // REGLA 1: Active vencido -> Entra a past_due (Inicio de Gracia)
  // =========================================================================
  const expiredActives = await Billing.findAll({
    where: {
      status: "active",
      currentPeriodEnd: { [Op.lte]: now },
    },
    include: [{ model: Tenant }],
  });

  for (const billing of expiredActives) {
    const graceUntil =
      billing.graceUntil || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
    billing.status = "past_due";
    billing.graceUntil = graceUntil;
    await billing.save();

    const admin = await User.findOne({
      where: { tenantId: billing.tenantId, role: "admin", status: "active" },
    });

    if (admin) {
      const daysLeft = Math.max(
        1,
        Math.ceil((new Date(graceUntil) - now) / (1000 * 60 * 60 * 24)),
      );
      await sendEmail({
        tenantId: billing.tenantId,
        to: admin.email,
        type: TYPES.SUBSCRIPTION_EXPIRING_SOON,
        periodKey: `past_due_start_${toDateKey(billing.currentPeriodEnd)}`,
        data: {
          recipientName: admin.name,
          tenantName: billing.Tenant?.name,
          daysLeft,
          billingUrl: `${adminOriginFromTenant(billing.Tenant)}/dashboard/settings/billing`,
        },
      });
    }
  }

  // =========================================================================
  // REGLA 2: En past_due con 1 día (o menos) de gracia restante -> Último aviso
  // =========================================================================
  const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const imminentSuspensions = await Billing.findAll({
    where: {
      status: "past_due",
      graceUntil: {
        [Op.gt]: now,
        [Op.lte]: oneDayFromNow,
      },
    },
    include: [{ model: Tenant }],
  });

  for (const billing of imminentSuspensions) {
    const admin = await User.findOne({
      where: { tenantId: billing.tenantId, role: "admin", status: "active" },
    });

    if (admin) {
      await sendEmail({
        tenantId: billing.tenantId,
        to: admin.email,
        type: TYPES.SUBSCRIPTION_EXPIRING_SOON,
        periodKey: `grace_last_day_${toDateKey(billing.graceUntil)}`,
        data: {
          recipientName: admin.name,
          tenantName: billing.Tenant?.name,
          daysLeft: 1,
          billingUrl: `${adminOriginFromTenant(billing.Tenant)}/dashboard/settings/billing`,
        },
      });
    }
  }

  // =========================================================================
  // REGLA 3: Gracia vencida -> Suspender tienda y corte total
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

    const admin = await User.findOne({
      where: { tenantId: billing.tenantId, role: "admin", status: "active" },
    });

    if (admin) {
      await sendEmail({
        tenantId: billing.tenantId,
        to: admin.email,
        type: TYPES.ACCOUNT_SUSPENDED,
        periodKey: `suspended_${toDateKey(billing.graceUntil)}`,
        data: {
          recipientName: admin.name,
          tenantName: billing.Tenant?.name,
          billingUrl: `${adminOriginFromTenant(billing.Tenant)}/dashboard/settings/billing`,
        },
      });
    }
  }

  console.log(
    `[billingCron] Finalizado: ${expiredActives.length} a past_due, ${imminentSuspensions.length} alertas de último día, ${toSuspend.length} suspendidos.`,
  );
};

module.exports = { runBillingCron };
