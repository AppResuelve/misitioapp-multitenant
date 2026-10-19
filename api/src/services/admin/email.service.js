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
 * Envía enlace de recuperación de contraseña de acceso al panel
 */
const sendPasswordReset = async ({ to, token, tenant }) => {
  const resetUrl = `${adminOriginFromTenant(tenant)}/reset/${token}`;

  return await sendEmail({
    tenantId: tenant?.id || null,
    to,
    type: TYPES.RECOVERY,
    data: {
      resetUrl,
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
