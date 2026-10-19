const { StoreSetting } = require("../../models");

const DEFAULTS = {
  storeStatus: "active",
  businessName: "",
  businessSlogan: "",
  businessDescription: "",
  logoUrl: "/logotipo.png",
  faviconUrl: "/logotipo.png",
  socialLinks: {
    instagram: "",
    facebook: "",
    tiktok: "",
    youtube: "",
  },
};

/**
 * Garantiza que exista la fila de StoreSetting para el tenant con valores iniciales
 */
const ensureDefaults = async (tenantId) => {
  if (!tenantId) return null;

  const [settings] = await StoreSetting.findOrCreate({
    where: { tenantId },
    defaults: {
      tenantId,
      ...DEFAULTS,
    },
  });

  return settings;
};

/**
 * Obtiene el registro de configuración del tenant en formato plano
 */
const getSettings = async (tenantId) => {
  if (!tenantId) return {};

  let settings = await StoreSetting.findOne({ where: { tenantId } });

  if (!settings) {
    settings = await ensureDefaults(tenantId);
  }

  return settings ? settings.toJSON() : {};
};

module.exports = { ensureDefaults, getSettings, DEFAULTS };
