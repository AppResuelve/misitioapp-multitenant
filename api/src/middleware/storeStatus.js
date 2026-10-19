const { Setting, Billing } = require("../models");

const storeStatus = async (req, res, next) => {
  try {
    const tenantId = req.tenant?.id;
    if (!tenantId) return next();

    // EXCEPCIÓN: Permitir siempre leer settings para que el frontend público
    // pueda mostrar logo, nombre y canales de contacto aun en pausa/mantenimiento
    if (req.originalUrl && req.originalUrl.includes("/store/settings")) {
      return next();
    }

    // 1. Chequeo de Facturación
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

    // 2. Chequeo de Estado Operativo de la Tienda (Draft, Maintenance, etc.)
    const row = await Setting.findOne({
      where: { tenantId, key: "store_status" },
    });
    const status = row?.value || "active";

    if (status === "draft") {
      return res.status(503).json({
        error: "store_draft",
        message: "Tienda en construcción. Volvé pronto.",
      });
    }

    if (status === "maintenance") {
      return res.status(503).json({
        error: "store_maintenance",
        message: "Tienda en mantenimiento. Disculpá las molestias.",
      });
    }

    next();
  } catch {
    next();
  }
};

module.exports = storeStatus;
