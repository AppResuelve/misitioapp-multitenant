const maskKey = (key) => {
  if (!key) return "(no seteada)";
  if (key.length <= 8) return "***";
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
};

const logBrevoError = (context, err) => {
  const brevoApiKey = process.env.BREVO_API_KEY;
  const brevoSender = process.env.BREVO_SENDER_EMAIL || "no-reply@appresuelve.com.ar";

  console.error("=== BREVO EMAIL ERROR ===");
  console.error("Contexto:", context);
  console.error("Mensaje:", err.message);
  console.error("Status:", err.status || err.statusCode);
  console.error("Response text:", err.response?.text);
  console.error("Response body:", err.response?.body);
  console.error("Response status:", err.response?.status);
  console.error("BREVO_API_KEY seteada:", brevoApiKey ? "SÍ" : "NO");
  console.error("BREVO_API_KEY (mascarada):", maskKey(brevoApiKey));
  console.error("BREVO_SENDER_EMAIL:", brevoSender);
  console.error("Stack:", err.stack);
  console.error("=========================");
};

const sendActivationEmail = async (to, link) => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  try {
    const Brevo = require("@getbrevo/brevo");
    const apiInstance = new Brevo.TransactionalEmailsApi();
    const apiKey = apiInstance.authentications["apiKey"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL || "no-reply@appresuelve.com.ar",
        name: "AppResuelve",
      },
      to: [{ email: to }],
      subject: "Activá tu panel de administración",
      htmlContent: `
        <h2>¡Bienvenido a AppResuelve!</h2>
        <p>Hacé click en el siguiente enlace para activar tu cuenta y elegir tu contraseña:</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#06b6d4;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Activar cuenta</a></p>
        <p style="margin-top:20px;color:#666;">Este enlace expira en 24 horas.</p>
      `,
    });
  } catch (err) {
    logBrevoError("sendActivationEmail", err);
  }
};

const sendResetPasswordEmail = async (to, link) => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  try {
    const Brevo = require("@getbrevo/brevo");
    const apiInstance = new Brevo.TransactionalEmailsApi();
    const apiKey = apiInstance.authentications["apiKey"];
    apiKey.apiKey = process.env.BREVO_API_KEY;

    await apiInstance.sendTransacEmail({
      sender: {
        email: process.env.BREVO_SENDER_EMAIL || "no-reply@appresuelve.com.ar",
        name: "AppResuelve",
      },
      to: [{ email: to }],
      subject: "Restablecé tu contraseña",
      htmlContent: `
        <h2>Restablecé tu contraseña</h2>
        <p>Hacé click en el siguiente enlace para crear una nueva contraseña:</p>
        <p><a href="${link}" style="display:inline-block;padding:12px 24px;background:#06b6d4;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold;">Restablecer contraseña</a></p>
        <p style="margin-top:20px;color:#666;">Este enlace expira en 1 hora.</p>
        <p style="color:#666;">Si no solicitaste este cambio, ignorá este email.</p>
      `,
    });
  } catch (err) {
    logBrevoError("sendResetPasswordEmail", err);
  }
};

module.exports = { sendActivationEmail, sendResetPasswordEmail };
