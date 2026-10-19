// src/modules/emails/services/email.sender.js
const brevo = require("../config/brevo");
const { Tenant, Setting, EmailLog } = require("../../../models");
const { getSubject } = require("../utils/dinamicTexts");

// Importamos los templates necesarios
const accountSuspendedTemplate = require("../templates/account-suspended");
const subscriptionExpiringSoonTemplate = require("../templates/subscription-expiring-soon");
const recoveryTemplate = require("../templates/recovery");
const welcomeTemplate = require("../templates/welcome");
const contactFormTemplate = require("../templates/contact-form");

const TEMPLATES = {
  ACCOUNT_SUSPENDED: accountSuspendedTemplate,
  SUBSCRIPTION_EXPIRING_SOON: subscriptionExpiringSoonTemplate,
  RECOVERY: recoveryTemplate,
  WELCOME: welcomeTemplate,
  CONTACT_FORM: contactFormTemplate,
};

const DEFAULTS = {
  appName: "AppResuelve",
  supportEmail: process.env.SUPPORT_EMAIL || "soporte@appresuelve.com.ar",
  senderEmail: process.env.BREVO_SENDER_EMAIL || "no-reply@appresuelve.com.ar",
  primaryColor: "#06b6d4",
};

const sendEmail = async ({
  tenantId,
  to,
  type,
  data = {},
  branding = "appresuelve",
}) => {
  try {
    let storeName = DEFAULTS.appName;
    let supportEmail = DEFAULTS.supportEmail;
    let logoNav = null;
    let primaryColor = DEFAULTS.primaryColor;

    if (tenantId && branding === "tenant") {
      const tenant = await Tenant.findByPk(tenantId);
      const settings = await Setting.findAll({ where: { tenantId } });
      const configMap = settings.reduce((acc, row) => {
        acc[row.key] = row.value;
        return acc;
      }, {});

      storeName = configMap.business_name || tenant?.name || DEFAULTS.appName;
      supportEmail = configMap.support_email || DEFAULTS.supportEmail;
      logoNav = configMap.store_logo || null;
      primaryColor = configMap.primary_color || DEFAULTS.primaryColor;
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

    const sender = {
      email: DEFAULTS.senderEmail,
      name: branding === "tenant" ? storeName : DEFAULTS.appName,
    };

    const targetEmail = to || supportEmail;

    const emailPayload = {
      sender,
      to: [{ email: targetEmail }],
      subject: getSubject(type, { ...data, storeName }),
      htmlContent,
    };

    // Enviar a través de la API v3 de Brevo con fetch nativo
    const result = await brevo.sendTransacEmail(emailPayload);

    // Auditoría en email_logs para prevenir duplicados en crons
    if (EmailLog && tenantId) {
      await EmailLog.create({
        tenantId,
        recipient: targetEmail,
        type,
        status: "sent",
        metadata: { messageId: result.messageId, data },
      }).catch((err) =>
        console.error("[EMAIL-LOG] Error guardando log:", err.message),
      );
    }

    return result;
  } catch (error) {
    console.error(
      `[EMAIL-SENDER] Error enviando email (${type}) a ${to}:`,
      error.message,
    );
    if (error.response?.body) {
      console.error(
        "[EMAIL-SENDER] Detalle Brevo:",
        JSON.stringify(error.response.body, null, 2),
      );
    }
    return null;
  }
};

module.exports = { sendEmail };
