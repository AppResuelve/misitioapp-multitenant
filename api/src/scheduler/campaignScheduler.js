// src/scheduler/campaignScheduler.js
const schedule = require("node-schedule");
const { Op } = require("sequelize");
const { Campaign } = require("../models");
const campaignService = require("../services/admin/campaign.service");
const { invalidateBootstrapCache } = require("../utils/cache/bootstrapCache");
const { invalidateTenantProducts } = require("../utils/cache/productsCache");

const activeTimers = new Map();

const cancel = (campaignId) => {
  const startKey = `${campaignId}_start`;
  const endKey = `${campaignId}_end`;

  if (activeTimers.has(startKey)) {
    activeTimers.get(startKey).cancel();
    activeTimers.delete(startKey);
  }
  if (activeTimers.has(endKey)) {
    activeTimers.get(endKey).cancel();
    activeTimers.delete(endKey);
  }
};

const register = (campaign) => {
  if (!campaign || !campaign.id) return;
  cancel(campaign.id);

  // Si la campaña está en borrador o ya archivada, no se programan timers de ejecución
  if (campaign.status === "archived") return;

  const now = new Date();
  const start = new Date(campaign.startsAt);
  const end = new Date(campaign.endsAt);

  if (end <= now) return;

  // 1. Programar Inicio (solo si está aprobada/activa para arrancar a futuro)
  if (campaign.status === "active" && start > now) {
    const startJob = schedule.scheduleJob(start, async () => {
      try {
        await campaignService.activate(campaign.id);
        invalidateBootstrapCache(campaign.tenantId);
        invalidateTenantProducts(campaign.tenantId);
        console.log(
          `[CAMPAIGN_SCHEDULER] ✅ Iniciada vigencia campaña #${campaign.id}`,
        );
      } catch (err) {
        console.error(
          `[CAMPAIGN_SCHEDULER] ❌ Error activando #${campaign.id}:`,
          err.message,
        );
      } finally {
        activeTimers.delete(`${campaign.id}_start`);
      }
    });
    activeTimers.set(`${campaign.id}_start`, startJob);
  }

  // 2. Programar Fin (Archivado automático al minuto de corte)
  if (campaign.status === "active" && end > now) {
    const endJob = schedule.scheduleJob(end, async () => {
      try {
        await campaignService.archive(campaign.id);
        invalidateBootstrapCache(campaign.tenantId);
        invalidateTenantProducts(campaign.tenantId);
        console.log(
          `[CAMPAIGN_SCHEDULER] 🏁 Archivada campaña #${campaign.id}`,
        );
      } catch (err) {
        console.error(
          `[CAMPAIGN_SCHEDULER] ❌ Error archivando #${campaign.id}:`,
          err.message,
        );
      } finally {
        activeTimers.delete(`${campaign.id}_end`);
      }
    });
    activeTimers.set(`${campaign.id}_end`, endJob);
  }
};

/**
 * Rehidratación al boot del servidor
 */
const init = async () => {
  const now = new Date();

  // 1. Archivar campañas que vencieron durante downtime del server
  const missedEnds = await Campaign.findAll({
    where: {
      status: "active",
      endsAt: { [Op.lte]: now },
    },
  });

  for (const c of missedEnds) {
    try {
      await campaignService.archive(c.id);
      invalidateBootstrapCache(c.tenantId);
      invalidateTenantProducts(c.tenantId);
    } catch (err) {
      console.error(
        `[CAMPAIGN_SCHEDULER] Error archivando campaña vencida #${c.id}:`,
        err.message,
      );
    }
  }

  // 2. Programar campañas activas con fechas futuras
  const upcoming = await Campaign.findAll({
    where: {
      status: "active",
      endsAt: { [Op.gt]: now },
    },
  });

  for (const c of upcoming) {
    register(c);
  }

  console.log(
    `[CAMPAIGN_SCHEDULER] 📌 Campañas activas en memoria: ${upcoming.length} (${activeTimers.size} timers activos)`,
  );
};

const stopAll = () => {
  for (const [key, job] of activeTimers.entries()) {
    if (job && typeof job.cancel === "function") {
      job.cancel();
    }
  }
  activeTimers.clear();
  console.log(
    "[CAMPAIGN_SCHEDULER] 🛑 Todos los timers en memoria fueron cancelados.",
  );
};

module.exports = {
  init,
  register,
  cancel,
  stopAll,
};
