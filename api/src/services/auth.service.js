const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const { User, Billing } = require("../models");
const emailService = require("./admin/email.service");
const settingsService = require("./store/settings.service");
const { adminOriginFromTenant } = require("../utils/adminOrigin");

// Helper para obtener el estado de facturación desde la tabla billings
const getBillingInfo = async (tenantId) => {
  if (!tenantId) {
    return { status: "active", planName: "Plan Inicial" };
  }

  try {
    const billing = await Billing.findOne({
      where: { tenantId },
      attributes: [
        "status",
        "planName",
        "amount",
        "currency",
        "currentPeriodStart",
        "currentPeriodEnd",
        "graceUntil",
      ],
    });

    if (!billing) {
      return { status: "active", planName: "Plan Inicial" };
    }

    return billing.toJSON ? billing.toJSON() : billing;
  } catch (err) {
    console.error("[auth.service] Error al consultar billing:", err.message);
    return { status: "active", planName: "Plan Inicial" };
  }
};

// Resuelve el nombre del negocio desde el caché en memoria
const getBusinessName = async (tenantId) => {
  if (!tenantId) return "";
  const settings = await settingsService.getSettings(tenantId);
  return settings?.businessName || "";
};

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role || "admin",
      tenantId: user.tenantId,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

const login = async (email, password, tenantId) => {
  const [billing, businessName] = await Promise.all([
    getBillingInfo(tenantId),
    getBusinessName(tenantId),
  ]);

  // Super Admin Bypass
  if (
    process.env.SUPER_ADMIN_EMAIL &&
    process.env.SUPER_ADMIN_PASSWORD &&
    email === process.env.SUPER_ADMIN_EMAIL &&
    password === process.env.SUPER_ADMIN_PASSWORD
  ) {
    const superUser = {
      id: 0,
      name: "Super Admin",
      email,
      role: "super_admin",
      tenantId,
    };
    const token = generateToken(superUser);
    return {
      token,
      user: {
        name: superUser.name,
        email: superUser.email,
        role: "super_admin",
        tenantId,
        billing,
        businessName,
      },
    };
  }

  const user = await User.findOne({
    where: { email, status: "active", tenantId },
  });
  if (!user) {
    throw Object.assign(new Error("Credenciales inválidas"), { status: 401 });
  }

  const valid = await user.comparePassword(password);
  if (!valid) {
    throw Object.assign(new Error("Credenciales inválidas"), { status: 401 });
  }

  const token = generateToken(user);
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      billing,
      businessName,
    },
  };
};

const validateToken = async (token) => {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    where: {
      activationTokenHash: hash,
      activationExpires: { [Op.gt]: new Date() },
    },
  });
  if (!user) {
    throw Object.assign(new Error("Token inválido o expirado"), {
      status: 400,
    });
  }
  return { email: user.email, valid: true };
};

const activate = async (token, password) => {
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  const user = await User.findOne({
    where: {
      activationTokenHash: hash,
      activationExpires: { [Op.gt]: new Date() },
    },
  });
  if (!user) {
    throw Object.assign(new Error("Token inválido o expirado"), {
      status: 400,
    });
  }
  if (!password || password.length < 6) {
    throw Object.assign(
      new Error("La contraseña debe tener al menos 6 caracteres"),
      { status: 400 },
    );
  }

  user.password = password;
  user.status = "active";
  user.activationTokenHash = null;
  user.activationExpires = null;
  await user.save();

  return { success: true };
};

const changePassword = async (userId, newPassword) => {
  if (!userId) {
    throw Object.assign(
      new Error("El super admin no puede cambiar contraseña desde acá"),
      { status: 400 },
    );
  }

  const user = await User.findByPk(userId);
  if (!user) {
    throw Object.assign(new Error("Usuario no encontrado"), { status: 404 });
  }

  if (!newPassword || newPassword.length < 6) {
    throw Object.assign(
      new Error("La nueva contraseña debe tener al menos 6 caracteres"),
      { status: 400 },
    );
  }

  user.password = newPassword;
  await user.save();

  return { success: true };
};

const forgotPassword = async (tenantId, email, tenant) => {
  const user = await User.findOne({
    where: { tenantId, email, status: "active" },
  });

  // Retorno temprano para mitigar enumeración de usuarios
  if (!user) {
    return { success: true };
  }

  // 1. Generamos los 6 dígitos numéricos criptoseguros
  const code = crypto.randomInt(100000, 1000000).toString();

  // 2. Hash SHA-256 para almacenamiento en DB
  const codeHash = crypto.createHash("sha256").update(code).digest("hex");

  // 3. Ventana de expiración de 15 minutos para código OTP
  const expires = new Date(Date.now() + 15 * 60 * 1000);

  await user.update({
    resetTokenHash: codeHash,
    resetExpires: expires,
  });

  // 4. Se despacha a través de admin/email.service
  await emailService.sendPasswordReset({
    to: user.email,
    code,
    tenant,
  });

  return { success: true };
};

const resetPassword = async ({ token, code, email, password, tenantId }) => {
  if (!password || password.length < 6) {
    throw Object.assign(
      new Error("La nueva contraseña debe tener al menos 6 caracteres"),
      { status: 400 },
    );
  }

  let user = null;

  if (code && email) {
    // ── VÍA A: Validación por código OTP de 6 dígitos + Email ──
    const codeHash = crypto
      .createHash("sha256")
      .update(code.trim())
      .digest("hex");

    const whereClause = {
      email: email.trim().toLowerCase(),
      resetTokenHash: codeHash,
      resetExpires: { [Op.gt]: new Date() },
      status: "active",
    };

    if (tenantId) {
      whereClause.tenantId = tenantId;
    }

    user = await User.findOne({ where: whereClause });
  } else if (token) {
    // ── VÍA B: Validación por token (fallback URL /reset/[token]) ──
    const tokenHash = crypto
      .createHash("sha256")
      .update(token.trim())
      .digest("hex");

    user = await User.findOne({
      where: {
        resetTokenHash: tokenHash,
        resetExpires: { [Op.gt]: new Date() },
        status: "active",
      },
    });
  }

  if (!user) {
    throw Object.assign(new Error("Código o token inválido o expirado"), {
      status: 400,
    });
  }

  // Actualización de clave y limpieza de tokens
  user.password = password;
  user.resetTokenHash = null;
  user.resetExpires = null;
  await user.save();

  const token_jwt = generateToken(user);

  return {
    success: true,
    token: token_jwt,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    },
  };
};

const me = async (userId, tenantId) => {
  const [billing, businessName] = await Promise.all([
    getBillingInfo(tenantId),
    getBusinessName(tenantId),
  ]);

  if (!userId) {
    return {
      id: 0,
      name: "Super Admin",
      email: "",
      role: "super_admin",
      tenantId,
      billing,
      businessName,
    };
  }

  const user = await User.findByPk(userId, {
    attributes: ["id", "name", "email", "role", "tenantId"],
  });
  if (!user) {
    throw Object.assign(new Error("Usuario no encontrado"), { status: 404 });
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    tenantId: user.tenantId,
    billing,
    businessName,
  };
};

module.exports = {
  generateToken,
  login,
  validateToken,
  activate,
  changePassword,
  forgotPassword,
  resetPassword,
  me,
};
