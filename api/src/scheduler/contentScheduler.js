// src/scheduler/contentScheduler.js
const schedule = require("node-schedule");
const { Op } = require("sequelize");
const { SiteContent } = require("../models");
const { invalidateBootstrapCache } = require("../utils/cache/bootstrapCache");

const activeTimers = new Map();

const cancel = (contentId) => {
  const startKey = `content_${contentId}_start`;
  const endKey = `content_${contentId}_end`;

  if (activeTimers.has(startKey)) {
    activeTimers.get(startKey).cancel();
    activeTimers.delete(startKey);
  }
  if (activeTimers.has(endKey)) {
    activeTimers.get(endKey).cancel();
    activeTimers.delete(endKey);
  }
};

const register = (content) => {
  // Los contenidos vinculados a una campaña se rigen por el ciclo de la campaña
  if (!content || !content.id || content.campaignId) return;

  cancel(content.id);

  if (content.status !== "active") return;

  const now = new Date();
  const start = content.startsAt ? new Date(content.startsAt) : null;
  const end = content.endsAt ? new Date(content.endsAt) : null;

  // 1. Programar Inicio
  if (start && start > now) {
    const startJob = schedule.scheduleJob(start, () => {
      invalidateBootstrapCache(content.tenantId);
      console.log(
        `[CONTENT_SCHEDULER] 🚀 Banner #${content.id} entró en vigencia para tenant #${content.tenantId}`,
      );
      activeTimers.delete(`content_${content.id}_start`);
    });
    activeTimers.set(`content_${content.id}_start`, startJob);
  }

  // 2. Programar Fin (Pasa a 'archived' en BD e invalida caché)
  if (end && end > now) {
    const endJob = schedule.scheduleJob(end, async () => {
      try {
        await SiteContent.update(
          { status: "archived" },
          { where: { id: content.id, tenantId: content.tenantId } },
        );
        invalidateBootstrapCache(content.tenantId);
        console.log(
          `[CONTENT_SCHEDULER] 🛑 Banner #${content.id} expiró y pasó a 'archived' para tenant #${content.tenantId}`,
        );
      } catch (err) {
        console.error(
          `[CONTENT_SCHEDULER] ❌ Error archivando banner expirado #${content.id}:`,
          err.message,
        );
      } finally {
        activeTimers.delete(`content_${content.id}_end`);
      }
    });
    activeTimers.set(`content_${content.id}_end`, endJob);
  }
};

/**
 * Rehidratación al boot del servidor
 */
const init = async () => {
  const now = new Date();

  // 1. Archivar contenidos sin campaña que vencieron durante downtime
  const [archivedCount] = await SiteContent.update(
    { status: "archived" },
    {
      where: {
        status: "active",
        campaignId: null,
        endsAt: { [Op.ne]: null, [Op.lte]: now },
      },
    },
  );

  if (archivedCount > 0) {
    console.log(
      `[CONTENT_SCHEDULER] 🧹 ${archivedCount} contenidos expirados pasaron a 'archived'`,
    );
  }

  // 2. Rehidratar timers de los vigentes futuros
  const upcomingContents = await SiteContent.findAll({
    where: {
      status: "active",
      campaignId: null,
      [Op.or]: [{ startsAt: { [Op.gt]: now } }, { endsAt: { [Op.gt]: now } }],
    },
  });

  for (const item of upcomingContents) {
    register(item);
  }

  console.log(
    `[CONTENT_SCHEDULER] 📌 Contenidos independientes en memoria: ${upcomingContents.length}`,
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
    "[CONTENT_SCHEDULER] 🛑 Todos los timers de contenido fueron cancelados.",
  );
};

module.exports = {
  init,
  register,
  cancel,
  stopAll,
};
