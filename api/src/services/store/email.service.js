const { sendEmail, TYPES } = require("../../modules/emails");
const { Setting } = require("../../models");

/**
 * Helper para resolver el email de soporte/recepción configurado por el comercio
 */
const getStoreContactEmail = async (tenantId) => {
  if (!tenantId) return null;
  const row = await Setting.findOne({
    where: { tenantId, key: "support_email" },
  });
  return row?.value || null;
};

/**
 * Notifica al dueño del comercio que un cliente envió una consulta en la storefront
 */
const sendContactFormNotification = async ({ tenant, formData }) => {
  const { name, email, phone, subject, message } = formData;
  const targetEmail = (await getStoreContactEmail(tenant.id)) || tenant.email;

  return await sendEmail({
    tenantId: tenant.id,
    to: targetEmail,
    type: TYPES.CONTACT_FORM,
    data: {
      name,
      email,
      phone: phone || null,
      subject: subject || "Consulta desde la web",
      message,
    },
    branding: "tenant",
  });
};

module.exports = {
  sendContactFormNotification,
};
