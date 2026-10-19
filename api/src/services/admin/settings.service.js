const { StoreSetting } = require("../../models");

/**
 * Obtiene la configuración completa de la tienda del tenant.
 */
const getAll = async (tenantId) => {
  const storeSetting = await StoreSetting.findOne({
    where: { tenantId },
  });

  return storeSetting ? storeSetting.toJSON() : null;
};

/**
 * Obtiene un campo específico de la configuración.
 */
const get = async (tenantId, key) => {
  const storeSetting = await StoreSetting.findOne({
    where: { tenantId },
  });

  if (!storeSetting) return null;

  // Permite acceder tanto en camelCase como en snake_case
  return storeSetting[key] ?? storeSetting.getDataValue?.(key) ?? null;
};

/**
 * Actualiza un único campo o propiedad.
 */
const set = async (tenantId, key, value) => {
  return setBulk(tenantId, { [key]: value });
};

/**
 * Actualiza múltiples campos de la configuración de la tienda en 1 sola consulta.
 * Hace upsert sobre la fila del tenant.
 */
const setBulk = async (tenantId, data) => {
  if (!data || Object.keys(data).length === 0) {
    return getAll(tenantId);
  }

  // Buscamos o creamos la fila del tenant
  const [storeSetting] = await StoreSetting.findOrCreate({
    where: { tenantId },
    defaults: { tenantId, ...data },
  });

  // Si ya existía, actualizamos únicamente los campos enviados
  await storeSetting.update(data);

  return storeSetting.toJSON();
};

/**
 * Alias de compatibilidad por si algún controlador aún invoca upsertSetting.
 */
const upsertSetting = async (tenantId, key, value) => {
  return set(tenantId, key, value);
};

module.exports = {
  getAll,
  get,
  set,
  setBulk,
  upsertSetting,
};
