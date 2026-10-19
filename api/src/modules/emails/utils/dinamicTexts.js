// src/modules/emails/utils/dinamicTexts.js
const getSubject = (type, data = {}) => {
  switch (type) {
    case "WELCOME":
      return "Activá tu panel de administración — AppResuelve";
    case "RECOVERY":
      return "Restablecer tu contraseña de acceso";
    case "SUBSCRIPTION_EXPIRING_SOON":
      return `⏰ Pago pendiente: Quedan ${data.daysLeft || 3} días de gracia`;
    case "ACCOUNT_SUSPENDED":
      return "🚫 Tu tienda se encuentra suspendida por falta de pago";
    case "CONTACT_FORM":
      return `📬 [Contacto Web] ${data.subject || "Nueva consulta de " + (data.name || "cliente")}`;
    default:
      return "Notificación de AppResuelve";
  }
};

module.exports = { getSubject };
