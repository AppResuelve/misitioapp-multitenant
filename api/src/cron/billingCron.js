// src/cron/billingCron.js
const { Op } = require("sequelize");
const cron = require("node-cron");
const { Billing, Tenant, User } = require("../models");
const { sendEmail, TYPES } = require("../modules/emails");
const { adminOriginFromTenant } = require("../utils/adminOrigin");
const { invalidateBootstrapCache } = require("../utils/cache/bootstrapCache");

const toDateKey = (date) => new Date(date).toISOString().slice(0, 10);

// Define su propia cadencia: Todos los días a las 03:00 hs UTC (00:00 hs Argentina)
const SCHEDULE = "0 3 * * *";

const task = async () => {
  const now = new Date();
  console.log(
    `[billingCron] 🚀 Iniciando chequeo diario: ${now.toISOString()}`,
  );

  try {
    // =========================================================================
    // REGLA 1: Active vencido -> Entra a past_due (Inicio de Gracia)
    // =========================================================================
    const expiredActives = await Billing.findAll({
      where: {
        status: "active",
        currentPeriodEnd: { [Op.lte]: now },
      },
      include: [{ model: Tenant, as: "tenant" }],
    });

    for (const billing of expiredActives) {
      try {
        const graceUntil =
          billing.graceUntil || new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
        billing.status = "past_due";
        billing.graceUntil = graceUntil;
        await billing.save();

        const admin = await User.findOne({
          where: {
            tenantId: billing.tenantId,
            role: "admin",
            status: "active",
          },
        });

        if (admin && billing.tenant) {
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
              tenantName: billing.tenant?.name,
              daysLeft,
              billingUrl: `${adminOriginFromTenant(billing.tenant)}/dashboard/settings/billing`,
            },
          }).catch((mailErr) =>
            console.error(
              `[billingCron] Error enviando mail a tenant ${billing.tenantId}:`,
              mailErr.message,
            ),
          );
        }
      } catch (err) {
        console.error(
          `[billingCron] Error procesando active vencido (Tenant ${billing.tenantId}):`,
          err,
        );
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
      include: [{ model: Tenant, as: "tenant" }],
    });

    for (const billing of imminentSuspensions) {
      try {
        const admin = await User.findOne({
          where: {
            tenantId: billing.tenantId,
            role: "admin",
            status: "active",
          },
        });

        if (admin && billing.tenant) {
          await sendEmail({
            tenantId: billing.tenantId,
            to: admin.email,
            type: TYPES.SUBSCRIPTION_EXPIRING_SOON,
            periodKey: `grace_last_day_${toDateKey(billing.graceUntil)}`,
            data: {
              recipientName: admin.name,
              tenantName: billing.tenant?.name,
              daysLeft: 1,
              billingUrl: `${adminOriginFromTenant(billing.tenant)}/dashboard/settings/billing`,
            },
          }).catch((mailErr) =>
            console.error(
              `[billingCron] Error enviando aviso final a tenant ${billing.tenantId}:`,
              mailErr.message,
            ),
          );
        }
      } catch (err) {
        console.error(
          `[billingCron] Error procesando aviso inminente (Tenant ${billing.tenantId}):`,
          err,
        );
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
      include: [{ model: Tenant, as: "tenant" }],
    });

    for (const billing of toSuspend) {
      try {
        billing.status = "suspended";
        billing.suspendedAt = now;
        await billing.save();

        // Limpiar RAM para reflejar la suspensión en la tienda en tiempo real
        invalidateBootstrapCache(billing.tenantId);

        const admin = await User.findOne({
          where: {
            tenantId: billing.tenantId,
            role: "admin",
            status: "active",
          },
        });

        if (admin && billing.tenant) {
          await sendEmail({
            tenantId: billing.tenantId,
            to: admin.email,
            type: TYPES.ACCOUNT_SUSPENDED,
            periodKey: `suspended_${toDateKey(billing.graceUntil)}`,
            data: {
              recipientName: admin.name,
              tenantName: billing.tenant?.name,
              billingUrl: `${adminOriginFromTenant(billing.tenant)}/dashboard/settings/billing`,
            },
          }).catch((mailErr) =>
            console.error(
              `[billingCron] Error enviando mail suspensión a tenant ${billing.tenantId}:`,
              mailErr.message,
            ),
          );
        }
      } catch (err) {
        console.error(
          `[billingCron] Error suspendiendo tenant ${billing.tenantId}:`,
          err,
        );
      }
    }

    console.log(
      `[billingCron] ✅ Finalizado: ${expiredActives.length} a past_due, ${imminentSuspensions.length} alertas de último día, ${toSuspend.length} suspendidos.`,
    );
  } catch (globalErr) {
    console.error(
      "[billingCron] Error fatal en la ejecución del cron:",
      globalErr,
    );
  }
};

let scheduledTask = null;

const start = () => {
  scheduledTask = cron.schedule(SCHEDULE, task);
  console.log(`[CRON] billingCron montado con cadencia: ${SCHEDULE}`);

  // Disparar inmediatamente al levantar la app para no tener que esperar a las 03:00 AM
  task().catch((err) => {
    console.error("[billingCron] Error en ejecución inicial:", err);
  });
};

const stop = () => {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[CRON] billingCron detenido.");
  }
};

module.exports = { start, stop, task };
