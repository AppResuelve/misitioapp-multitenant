const { Billing } = require("../models");
const settingsService = require("../services/admin/settings.service");

const storeStatus = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) return next();

    // 1. Excepción: permitir leer settings públicos siempre (para logo, redes y aviso)
    if (req.originalUrl && req.originalUrl.includes("/store/settings")) {
      return next();
    }

    // 2. Facturación de plataforma (Suspensión comercial)
    const billing = await Billing.findOne({
      where: { tenantId },
      attributes: ["status"],
    });

    if (billing?.status === "suspended") {
      return res.status(503).json({
        error: "store_suspended",
        message: "Tienda suspendida por falta de pago. Contactanos.",
      });
    }

    // 3. Estado operativo del Tenant
    const settings = await settingsService.getAll(tenantId);
    const status = settings?.storeStatus || "active";

    // Si está en mantenimiento: bloqueo total de navegación de catálogo y checkout
    if (status === "maintenance") {
      return res.status(503).json({
        error: "store_maintenance",
        message: "Tienda en mantenimiento. Disculpá las molestias.",
      });
    }

    // Si está en pausa: solo bloqueamos la creación de pedidos (checkout)
    // El catálogo sigue respondiendo para que los clientes puedan mirar productos
    if (
      status === "paused" &&
      req.method === "POST" &&
      req.originalUrl.includes("/store/orders")
    ) {
      return res.status(403).json({
        error: "store_paused",
        message: "La tienda no está aceptando nuevos pedidos en este momento.",
      });
    }

    next();
  } catch (err) {
    console.error("[middleware storeStatus] ERROR:", err.message);
    next();
  }
};

module.exports = storeStatus;
