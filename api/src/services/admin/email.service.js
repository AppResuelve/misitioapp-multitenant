const { sendEmail, TYPES } = require("../../modules/emails");
const { adminOriginFromTenant } = require("../../utils/adminOrigin");

/**
 * Envía invitación y activación de cuenta de administrador
 */
const sendAdminActivation = async ({ to, token, tenant }) => {
  const activationUrl = `${adminOriginFromTenant(tenant)}/activate/${token}`;

  return await sendEmail({
    tenantId: tenant?.id || null,
    to,
    type: TYPES.WELCOME,
    data: {
      recipientName: "Administrador",
      activationUrl,
      senderName: tenant?.name || "AppResuelve",
    },
    branding: "appresuelve",
  });
};

/**
 * Envía código OTP de 6 dígitos y enlace directo de recuperación
 */
const sendPasswordReset = async ({ to, code, token, tenant }) => {
  const resetToken = code || token;
  const resetUrl = tenant
    ? `${adminOriginFromTenant(tenant)}/reset/${resetToken}`
    : null;

  return await sendEmail({
    tenantId: tenant?.id || null,
    to,
    type: TYPES.RECOVERY,
    data: {
      code,
      resetUrl,
      recipientName: "Administrador",
      senderName: tenant?.name || "AppResuelve",
    },
    branding: "appresuelve",
  });
};

/**
 * Aviso preventivo: período de gracia activo antes de la suspensión
 */
const sendBillingWarning = async ({ to, tenant, daysLeft }) => {
  const billingUrl = `${adminOriginFromTenant(tenant)}/dashboard/settings/billing`;

  return await sendEmail({
    tenantId: tenant?.id || null,
    to,
    type: TYPES.SUBSCRIPTION_EXPIRING_SOON,
    data: {
      recipientName: tenant?.name || "Comerciante",
      tenantName: tenant?.name,
      daysLeft,
      billingUrl,
    },
    branding: "appresuelve",
  });
};

/**
 * Notificación de corte: gracia vencida y tienda pausada
 */
const sendAccountSuspended = async ({ to, tenant }) => {
  const billingUrl = `${adminOriginFromTenant(tenant)}/dashboard/settings/billing`;

  return await sendEmail({
    tenantId: tenant?.id || null,
    to,
    type: TYPES.ACCOUNT_SUSPENDED,
    data: {
      recipientName: tenant?.name || "Comerciante",
      tenantName: tenant?.name,
      billingUrl,
    },
    branding: "appresuelve",
  });
};

module.exports = {
  sendAdminActivation,
  sendPasswordReset,
  sendBillingWarning,
  sendAccountSuspended,
};
