const campaignScheduler = require("./campaignScheduler");
const contentScheduler = require("./contentScheduler");

const initSchedulers = async () => {
  console.log("⏱️  Iniciando Schedulers en memoria...");
  try {
    await campaignScheduler.init();
    await contentScheduler.init();
    console.log("✅ Schedulers rehidratados y listos.");
  } catch (err) {
    console.error("❌ Error inicializando Schedulers:", err.message);
  }
};

const stopSchedulers = () => {
  campaignScheduler.stopAll();
  contentScheduler.stopAll();
};

module.exports = {
  initSchedulers,
  stopSchedulers,
  campaignScheduler,
  contentScheduler,
};
