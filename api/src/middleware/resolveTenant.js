const { Op } = require("sequelize");
const { Tenant } = require("../models");
const {
  getCachedTenant,
  setCachedTenant,
} = require("../utils/cache/tenantCache");
const settingsService = require("../services/admin/settings.service"); // Asegurar la ruta relativa a settings.service

const resolveTenant = async (req, res, next) => {
  try {
    const value =
      req.headers["x-tenant-slug"] || req.body?.slug || req.params?.slug;

    if (!value) {
      return res.status(400).json({ error: "X-Tenant-Slug requerido" });
    }

    const lookupKey = String(value).toLowerCase().trim();

    // 1. Resolver Tenant (desde RAM o PostgreSQL)
    let tenant = getCachedTenant(lookupKey);

    if (!tenant) {
      const dbTenant = await Tenant.findOne({
        where: {
          [Op.or]: [{ slug: value }, { domain: value }, { adminDomain: value }],
        },
      });

      if (!dbTenant) {
        return res.status(404).json({ error: "Tenant no encontrado" });
      }

      tenant = dbTenant.toJSON ? dbTenant.toJSON() : dbTenant;
      setCachedTenant(tenant);
    }

    req.tenant = tenant;

    // 2. Resolver Settings (Usa el caché de settingsService, que se invalida al guardar)
    const settings = await settingsService.getAll(tenant.id);
    req.storeSettings = settings || {};

    next();
  } catch (err) {
    console.error("[resolveTenant] ERROR:", err.message, err.stack);
    next(err);
  }
};

module.exports = resolveTenant;
