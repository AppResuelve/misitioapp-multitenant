const { StoreSetting } = require("../../models");
const { proxyAssetUrl } = require("../../utils/cdn");
const {
  getCachedSettings,
  setCachedSettings,
  invalidateSettingsCache,
} = require("../../utils/cache/settingsCache");

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
  autoCalculateUnitPrices: true,
  allowWholesale: false,
  hideOutOfStock: false,
  trackStock: false,
  minOrderAmount: 0,
  minWholesaleAmount: 0,
  showPriceWithTax: false,
};

const formatWithCdn = (settings) => {
  if (!settings) return null;
  const raw = settings.toJSON ? settings.toJSON() : { ...settings };

  if (raw.logoUrl) raw.logoUrl = proxyAssetUrl(raw.logoUrl);
  if (raw.faviconUrl) raw.faviconUrl = proxyAssetUrl(raw.faviconUrl);

  // Mezcla los defaults primero y sobreescribe con los valores reales no nulos de la DB
  return {
    ...DEFAULTS,
    ...raw,
  };
};

/**
 * Obtiene la fila completa del tenant
 */
const getAll = async (tenantId) => {
  if (!tenantId) return null;

  // 1. Si ya está en la memoria RAM, lo devuelve al instante
  const cached = getCachedSettings(tenantId);
  if (cached) return cached;

  // 2. Si no, va a Postgres
  let storeSetting = await StoreSetting.findOne({
    where: { tenantId },
  });

  if (!storeSetting) {
    const [created] = await StoreSetting.findOrCreate({
      where: { tenantId },
      defaults: { tenantId, ...DEFAULTS },
    });
    storeSetting = created;
  }

  const formatted = formatWithCdn(storeSetting);

  // 3. Lo guarda en RAM para la próxima
  setCachedSettings(tenantId, formatted);

  return formatted;
};

/**
 * Obtiene una columna específica (ej: get(tenantId, 'businessName'))
 */
const get = async (tenantId, propertyName) => {
  const settings = await getAll(tenantId);
  if (!settings) return null;
  return settings[propertyName] ?? null;
};

/**
 * Guarda los cambios que vienen del formulario del Admin
 */
const setBulk = async (tenantId, data) => {
  if (!tenantId) return null;

  if (!data || Object.keys(data).length === 0) {
    return getAll(tenantId);
  }

  const [storeSetting] = await StoreSetting.findOrCreate({
    where: { tenantId },
    defaults: { tenantId, ...DEFAULTS, ...data },
  });

  // 1. Guarda en Postgres
  await storeSetting.update(data);

  // 2. BORRA EL CACHÉ (acá se invalida para que no queden datos viejos en memoria)
  invalidateSettingsCache(tenantId);

  // 3. Devuelve los datos actualizados
  return getAll(tenantId);
};

const set = async (tenantId, propertyName, value) => {
  return setBulk(tenantId, { [propertyName]: value });
};

module.exports = {
  getAll,
  get,
  set,
  setBulk,
};
