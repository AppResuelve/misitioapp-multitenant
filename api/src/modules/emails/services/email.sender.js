// src/modules/emails/services/email.sender.js
const brevo = require("../config/brevo");
const { Tenant, StoreSetting, EmailLog } = require("../../../models");
const { getSubject } = require("../utils/dinamicTexts");

const TEMPLATES = {
  ACCOUNT_SUSPENDED: require("../templates/account-suspended"),
  SUBSCRIPTION_EXPIRING_SOON: require("../templates/subscription-expiring-soon"),
  RECOVERY: require("../templates/recovery"),
  WELCOME: require("../templates/welcome"),
  CONTACT_FORM: require("../templates/contact-form"),
};

const DEFAULTS = {
  appName: "AppResuelve",
  supportEmail: "soporte@appresuelve.com.ar",
  senderEmail: process.env.BREVO_SENDER_EMAIL || "no-reply@appresuelve.com.ar",
  primaryColor: "#06b6d4",
};

const sendEmail = async ({
  tenantId,
  to,
  type,
  periodKey = null,
  data = {},
  branding = "appresuelve",
}) => {
  // 1. Si viene periodKey, garantizamos idempotencia antes de disparar a Brevo
  if (EmailLog && tenantId && periodKey) {
    const alreadySent = await EmailLog.findOne({
      where: { tenantId, type, periodKey, status: "sent" },
    });
    if (alreadySent) {
      console.log(
        `[EMAIL] Omitido por idempotencia: ${type} - Tenant: ${tenantId} (${periodKey})`,
      );
      return { skipped: true };
    }
  }

  let storeName = DEFAULTS.appName;
  let supportEmail = DEFAULTS.supportEmail;
  let logoNav = null;
  let primaryColor = DEFAULTS.primaryColor;

  if (tenantId && branding === "tenant") {
    const tenant = await Tenant.findByPk(tenantId);
    const settings = await StoreSetting.findOne({ where: { tenantId } });

    storeName = settings?.businessName || tenant?.name || DEFAULTS.appName;
    supportEmail = settings?.email || DEFAULTS.supportEmail;
    logoNav = settings?.logoUrl || null;
    primaryColor = DEFAULTS.primaryColor;
  }

  const templateFn = TEMPLATES[type];
  if (!templateFn) {
    throw new Error(`[EMAIL] Template type '${type}' no existe`);
  }

  const htmlContent = templateFn({
    data,
    logo: logoNav,
    storeName,
    palette: { primary: primaryColor },
  });

  const targetEmail = to || supportEmail;
  const emailPayload = {
    sender: {
      email: DEFAULTS.senderEmail,
      name: branding === "tenant" ? storeName : DEFAULTS.appName,
    },
    to: [{ email: targetEmail }],
    subject: getSubject(type, { ...data, storeName }),
    htmlContent,
  };

  let brevoResult = null;
  let sendError = null;

  try {
    brevoResult = await brevo.sendTransacEmail(emailPayload);
  } catch (err) {
    sendError = err;
    console.error(
      `[EMAIL-SENDER] Error Brevo (${type}) a ${targetEmail}:`,
      err.message,
    );
  }

  // 2. Registro de auditoría (Upsert si tiene periodKey, Create si es transaccional simple)
  if (EmailLog && tenantId) {
    const logData = {
      tenantId,
      recipient: targetEmail,
      type,
      periodKey,
      status: sendError || !brevoResult ? "failed" : "sent",
      error: sendError ? sendError.message : null,
      metadata: { messageId: brevoResult?.messageId, data },
      sentAt: sendError || !brevoResult ? null : new Date(),
    };

    try {
      if (periodKey) {
        await EmailLog.upsert(logData);
      } else {
        await EmailLog.create(logData);
      }
    } catch (dbErr) {
      console.error("[EMAIL-LOG] Error guardando log:", dbErr.message);
    }
  }

  return brevoResult;
};

module.exports = { sendEmail };
