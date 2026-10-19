const crypto = require("crypto");
const {
  User,
  StoreSetting,
  Tenant,
  Billing,
  sequelize,
} = require("../../models");
const emailService = require("../../services/admin/email.service");
const billingService = require("../../services/admin/billing.service");

// Helper para asegurar que el adminDomain esté consistente
const ensureTenantDomain = async (tenant) => {
  if (!tenant.domain) {
    throw Object.assign(new Error("El tenant no tiene dominio configurado"), {
      status: 400,
    });
  }
  const adminDomain = `admin.${tenant.domain}`;
  if (tenant.adminDomain !== adminDomain) {
    await tenant.update({ adminDomain });
  }
  return tenant;
};

/**
 * 1. CREACIÓN DEL TENANT
 * Invocado por Platform al crear una invitación
 */
const createTenant = async (req, res, next) => {
  let transaction;
  try {
    const { slug, name, domain, adminDomain, folderPrefix, monthlyFee } =
      req.body;

    if (!slug || !name || !domain) {
      return res
        .status(400)
        .json({ error: "slug, name y domain son requeridos" });
    }

    const existingSlug = await Tenant.findOne({ where: { slug } });
    if (existingSlug) {
      return res
        .status(409)
        .json({ error: "Ya existe un tenant con ese slug" });
    }

    const existingDomain = await Tenant.findOne({ where: { domain } });
    if (existingDomain) {
      return res
        .status(409)
        .json({ error: "Ya existe un tenant con ese domain" });
    }

    transaction = await sequelize.transaction();

    // A. Crear Tenant
    const tenant = await Tenant.create(
      {
        slug,
        name,
        domain,
        adminDomain: adminDomain || `admin.${domain}`,
        folderPrefix: folderPrefix || null,
      },
      { transaction },
    );

    // B. Crear StoreSetting inicial (1 fila única)
    await StoreSetting.create(
      {
        tenantId: tenant.id,
        businessName: name,
        storeStatus: "active",
        currency: "ARS",
        logoUrl: "/logotipo.png",
        faviconUrl: "/favicon.ico",
        socialLinks: {
          instagram: "",
          facebook: "",
          tiktok: "",
          youtube: "",
          whatsapp: "",
        },
      },
      { transaction },
    );

    // C. Crear Ficha de Facturación inicial (30 días de ciclo + cuotas)
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(now.getDate() + 30);

    await Billing.create(
      {
        tenantId: tenant.id,
        planName: "Plan Comercio",
        status: "active",
        amount: monthlyFee || 0.0,
        currency: "ARS",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        graceDays: 4,
        monthlyChangesLimit: 2,
        changesThisMonth: 0,
      },
      { transaction },
    );

    await transaction.commit();

    return res.status(201).json({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      domain: tenant.domain,
      adminDomain: tenant.adminDomain,
    });
  } catch (err) {
    if (transaction) await transaction.rollback();
    next(err);
  }
};

/**
 * 2. ADMINISTRACIÓN DEL TENANT
 */
const createAdmin = async (req, res, next) => {
  try {
    const { email, name } = req.body;
    const tenantId = req.tenant.id;

    if (!email || !name) {
      return res.status(400).json({ error: "email y name son requeridos" });
    }

    const tenant = await ensureTenantDomain(req.tenant);

    const existing = await User.findOne({ where: { tenantId, role: "admin" } });
    if (existing) {
      return res.status(409).json({ error: "Ya existe un administrador" });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24hs

    await User.create({
      tenantId,
      email,
      name,
      password: "",
      status: "pending",
      role: "admin",
      activationTokenHash: hash,
      activationExpires: expires,
      activationSentAt: new Date(),
    });

    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setDate(nextMonth.getDate() + 30);

    await Billing.update(
      {
        status: "active",
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
        changesThisMonth: 0,
      },
      { where: { tenantId: req.tenant.id } },
    );

    await emailService.sendAdminActivation({ to: email, token, tenant });

    res.status(201).json({ success: true });
  } catch (err) {
    next(err);
  }
};

const getAdminStatus = async (req, res, next) => {
  try {
    const admin = await User.findOne({
      where: { tenantId: req.tenant.id, role: "admin" },
      attributes: ["status", "activationSentAt", "activationExpires"],
    });

    if (!admin) {
      return res.json({ exists: false });
    }

    const now = new Date();
    const sentAt = admin.activationSentAt
      ? new Date(admin.activationSentAt)
      : null;
    const expires = admin.activationExpires
      ? new Date(admin.activationExpires)
      : null;
    const secondsSinceSent = sentAt
      ? Math.floor((now - sentAt) / 1000)
      : Infinity;

    const canResend = admin.status === "pending" && secondsSinceSent >= 60;

    return res.json({
      exists: true,
      status: admin.status,
      activationSentAt: sentAt?.toISOString() || null,
      activationExpiresAt: expires?.toISOString() || null,
      canResend,
    });
  } catch (err) {
    next(err);
  }
};

const resendActivation = async (req, res, next) => {
  try {
    const tenant = await ensureTenantDomain(req.tenant);

    const admin = await User.findOne({
      where: { tenantId: tenant.id, role: "admin" },
    });
    if (!admin) {
      return res.status(404).json({ error: "No hay administrador creado" });
    }

    if (admin.status === "active") {
      return res
        .status(409)
        .json({ error: "El administrador ya está activado" });
    }

    const now = new Date();
    const sentAt = admin.activationSentAt
      ? new Date(admin.activationSentAt)
      : null;
    const secondsSinceSent = sentAt
      ? Math.floor((now - sentAt) / 1000)
      : Infinity;

    if (secondsSinceSent < 60) {
      const waitSeconds = 60 - secondsSinceSent;
      return res.status(429).json({
        error: `Esperá ${waitSeconds} segundos antes de reenviar`,
        retryAfter: waitSeconds,
      });
    }

    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await admin.update({
      activationTokenHash: hash,
      activationExpires: expires,
      activationSentAt: now,
    });

    await emailService.sendAdminActivation({ to: admin.email, token, tenant });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

/**
 * 3. ACTUALIZACIÓN DE TENANT
 */
const updateTenant = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { name, domain, adminDomain, folderPrefix } = req.body;

    const tenant = await Tenant.findOne({ where: { slug } });
    if (!tenant) {
      return res.status(404).json({ error: "Tenant no encontrado" });
    }

    const updates = {};
    if (name !== undefined) updates.name = name || tenant.name;
    if (domain !== undefined) updates.domain = domain || tenant.domain;
    if (adminDomain !== undefined)
      updates.adminDomain = adminDomain || tenant.adminDomain;
    if (folderPrefix !== undefined) updates.folderPrefix = folderPrefix || null;

    await tenant.update(updates);

    res.json({
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      domain: tenant.domain,
      adminDomain: tenant.adminDomain,
      folderPrefix: tenant.folderPrefix,
    });
  } catch (err) {
    next(err);
  }
};

const listTenants = async (req, res, next) => {
  try {
    const tenants = await Tenant.findAll({
      order: [["id", "ASC"]],
      include: [
        {
          model: Billing,
          as: "billing",
          attributes: [
            "status",
            "planName",
            "currentPeriodStart",
            "currentPeriodEnd",
            "graceUntil",
            "suspendedAt",
            "monthlyChangesLimit",
            "changesThisMonth",
          ],
        },
      ],
    });
    res.json(tenants);
  } catch (err) {
    next(err);
  }
};

/**
 * 4. FACTURACIÓN Y PAGOS (Sincronización con Platform)
 */
const getBillingStatus = async (req, res, next) => {
  try {
    const billing = await billingService.getBillingByTenantId(req.tenant.id);
    res.json({
      status: billing.status,
      currentPeriodStart: billing.currentPeriodStart,
      currentPeriodEnd: billing.currentPeriodEnd,
      graceUntil: billing.graceUntil,
      monthlyChangesLimit: billing.monthlyChangesLimit,
      changesThisMonth: billing.changesThisMonth,
    });
  } catch (err) {
    next(err);
  }
};

const setBillingStatus = async (req, res, next) => {
  try {
    const { status, currentPeriodStart, currentPeriodEnd, graceUntil } =
      req.body;
    if (!status) {
      return res.status(400).json({ error: "status es requerido" });
    }

    const payload = { status };
    if (currentPeriodStart !== undefined)
      payload.currentPeriodStart = currentPeriodStart;
    if (currentPeriodEnd !== undefined)
      payload.currentPeriodEnd = currentPeriodEnd;
    if (graceUntil !== undefined) payload.graceUntil = graceUntil;

    if (status === "active") {
      payload.suspendedAt = null;
    } else if (status === "suspended") {
      payload.suspendedAt = new Date();
    }

    const updated = await billingService.updateBillingByTenantId(
      req.tenant.id,
      payload,
    );
    res.json({ success: true, billing: updated });
  } catch (err) {
    next(err);
  }
};

const registerTenantPayment = async (req, res, next) => {
  try {
    const tenantId = req.tenant.id;
    const billing = await billingService.getBillingByTenantId(tenantId);

    const now = new Date();
    // Si el período actual aún no venció, extendemos a partir de esa fecha; si venció, a partir de hoy
    const periodStart =
      billing?.currentPeriodEnd && new Date(billing.currentPeriodEnd) > now
        ? new Date(billing.currentPeriodEnd)
        : now;

    const periodEnd = new Date(periodStart);
    periodEnd.setDate(periodEnd.getDate() + 30);

    const updated = await billingService.updateBillingByTenantId(tenantId, {
      status: "active",
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      graceUntil: null,
      suspendedAt: null,
      changesThisMonth: 0, // Reset de cuota mensual
    });

    res.json({ success: true, billing: updated });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createTenant,
  listTenants,
  updateTenant,
  createAdmin,
  getAdminStatus,
  resendActivation,
  getBillingStatus,
  setBillingStatus,
  registerTenantPayment,
};
