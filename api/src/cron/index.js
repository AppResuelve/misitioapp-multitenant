// src/cron/index.js
const billingCron = require("./billingCron");

const initCrons = () => {
  console.log("⏰ Registrando Crons del sistema...");
  billingCron.start();
  // El día de mañana sumás acá: otroCron.start();
};

const stopCrons = () => {
  console.log("⏰ Deteniendo Crons del sistema...");
  billingCron.stop();
};

module.exports = { initCrons, stopCrons };
