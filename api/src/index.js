const app = require("./app");
const { sequelize } = require("./models");
const { validateEnv } = require("./config/env.schema");
const { initCrons, stopCrons } = require("./cron");
const { initSchedulers, stopSchedulers } = require("./scheduler");

const PORT = process.env.PORT || 3001;

validateEnv();

const start = async () => {
  try {
    await sequelize.authenticate();
    // ELIMINADO: await sequelize.sync() - La estructura la gestionan las migraciones

    const server = app.listen(PORT, () => {
      console.log(`Servidor corriendo en puerto ${PORT}`);
    });

    // 1. Levanta los timers específicos por fecha y resuelve atrasos
    await initSchedulers();

    // 2. Levanta los cron jobs periódicos
    initCrons();

    let isShuttingDown = false;

    const shutdown = async (signal) => {
      if (isShuttingDown) return;
      isShuttingDown = true;

      console.log(
        `\n🛑 Recibida señal ${signal}. Iniciando apagado ordenado...`,
      );

      // 1. Detenemos los cron jobs para que no inicien nuevas tareas
      try {
        stopCrons();
        stopSchedulers();
      } catch (err) {
        console.error("Error al detener crons/schedulers:", err);
      }

      // 2. Dejamos de recibir tráfico HTTP y esperamos que terminen las requests vivas
      server.close(async () => {
        console.log("🔒 Conexiones HTTP finalizadas.");

        // 3. Cerramos el pool de conexiones a la base de datos limpiamente
        try {
          await sequelize.close();
          console.log("💾 Conexión a base de datos cerrada.");
        } catch (err) {
          console.error("Error al cerrar base de datos:", err);
        }

        console.log("👋 Servidor apagado limpiamente.");
        process.exit(0);
      });

      // 4. Mecanismo de seguridad: si alguna request colgada tarda más de 10s, forzar salida
      setTimeout(() => {
        console.error("⚠️ Forzando cierre por timeout (10s excedidos).");
        process.exit(1);
      }, 10000).unref();
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
