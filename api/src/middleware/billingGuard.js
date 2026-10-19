const { Billing } = require("../models");

const billingGuard = async (req, res, next) => {
  // 1. Super admin exento
  if (req.user?.role === "super_admin") {
    return next();
  }

  // 2. EXCEPCIÓN: Permitir siempre consultar y ver la pantalla de facturación
  // req.baseUrl o req.path para contemplar /api/admin/billing
  if (req.originalUrl && req.originalUrl.startsWith("/api/admin/billing")) {
    return next();
  }

  try {
    const tenantId = req.user?.tenantId || req.tenant?.id;
    if (!tenantId) return next();

    const billing = await Billing.findOne({
      where: { tenantId },
      attributes: ["status"],
    });

    if (billing?.status === "suspended") {
      return res.status(403).json({
        error: "store_suspended",
        message: "Tienda suspendida por falta de pago.",
      });
    }
  } catch (err) {
    // Ante fallo de lectura de DB no bloqueamos
  }

  next();
};

module.exports = billingGuard;
