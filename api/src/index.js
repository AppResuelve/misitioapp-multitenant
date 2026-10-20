const cron = require("node-cron");
const app = require("./app");
const { sequelize } = require("./models");
const { validateEnv } = require("./config/env.schema");
const { runBillingCron } = require("./cron/billingCron");
const { fillMissingSkusOnce } = require("./utils/onlyOnceFunction");

const PORT = process.env.PORT || 3001;

validateEnv();

const start = async () => {
  try {
    await sequelize.authenticate();
    // ELIMINADO: await sequelize.sync() - La estructura la gestionan las migraciones

    const server = app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });

    // Ejecutamos la migración en segundo plano al iniciar
    await fillMissingSkusOnce();
    // Programar el control nocturno de facturación a las 03:00 AM
    const billingTask = cron.schedule("0 3 * * *", async () => {
      console.log("[cron] Iniciando control de facturación diario...");
      try {
        await runBillingCron();
      } catch (err) {
        console.error("[cron] Error ejecutando runBillingCron:", err);
      }
    });

    const shutdown = async (signal) => {
      console.log(`Recibida señal ${signal}, cerrando servidor...`);
      if (billingTask) billingTask.stop();
      server.close(() => {});
      try {
        await sequelize.close();
      } catch {}
      process.exit(0);
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (err) {
    console.error("Error al iniciar el servidor:", err);
    try {
      await sequelize.close();
    } catch {}
    process.exit(1);
  }
};

start();
