// src/modules/emails/utils/emailLimiter.js

const trackingMap = new Map();

// Configuración: ej. Máximo 5 correos cada 1 minuto por destinatario/tenant
const WINDOW_MS = 60 * 1000;
const MAX_EMAILS = 5;

const checkEmailRateLimit = (key) => {
  const now = Date.now();
  const record = trackingMap.get(key) || { count: 0, startTime: now };

  // Si pasó la ventana de tiempo, reiniciamos el contador
  if (now - record.startTime > WINDOW_MS) {
    trackingMap.set(key, { count: 1, startTime: now });
    return true; // Permitido
  }

  // Si está dentro de la ventana y superó el límite, bloqueamos
  if (record.count >= MAX_EMAILS) {
    return false; // Bloqueado por rate limit
  }

  // Incrementamos contador
  record.count += 1;
  trackingMap.set(key, record);
  return true; // Permitido
};

module.exports = { checkEmailRateLimit };
