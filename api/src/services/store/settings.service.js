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
};

const formatSettingsWithCdn = (settings) => {
  if (!settings) return null;
  const raw = settings.toJSON ? settings.toJSON() : settings;

  const logoUrl = proxyAssetUrl(raw.logoUrl);
  const faviconUrl = proxyAssetUrl(raw.faviconUrl);

  return {
    ...raw,
    logoUrl,
    faviconUrl,
  };
};

const ensureDefaults = async (tenantId) => {
  if (!tenantId) return null;

  const [settings] = await StoreSetting.findOrCreate({
    where: { tenantId },
    defaults: { tenantId, ...DEFAULTS },
  });

  return settings;
};

const getSettings = async (tenantId) => {
  if (!tenantId) return {};

  const cached = getCachedSettings(tenantId);
  if (cached) return cached;

  let settings = await StoreSetting.findOne({ where: { tenantId } });

  if (!settings) {
    settings = await ensureDefaults(tenantId);
  }

  const formatted = formatSettingsWithCdn(settings) || {};
  setCachedSettings(tenantId, formatted);

  return formatted;
};

const updateSettings = async (tenantId, payload) => {
  if (!tenantId) return null;

  const [settings] = await StoreSetting.findOrCreate({
    where: { tenantId },
    defaults: { tenantId, ...DEFAULTS, ...payload },
  });

  await settings.update(payload);
  invalidateSettingsCache(tenantId);

  return getSettings(tenantId);
};

module.exports = {
  getSettings,
  updateSettings,
  ensureDefaults,
  DEFAULTS,
};