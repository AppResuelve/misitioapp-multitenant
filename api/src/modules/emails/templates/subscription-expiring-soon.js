/**
 * Template: Suscripción por vencer / Gracia activa (Dark Mode)
 */
const subscriptionExpiringSoonTemplate = ({ data, logo, storeName }) => {
  const { recipientName = "Comerciante", daysLeft = 3, billingUrl } = data;
  const brand = storeName || "AppResuelve";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Pago pendiente — ${brand}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#09090b; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f4f4f5;">

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b; padding: 40px 16px;">
        <tr>
          <td align="center">
            
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background-color:#121215; border:1px solid #27272a; border-radius:14px; overflow:hidden;">
              
              <!-- Header -->
              <tr>
                <td style="padding: 32px 36px 24px 36px; border-bottom: 1px solid #1f1f23;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        ${
                          logo
                            ? `<img src="${logo}" alt="${brand}" style="max-height:32px; display:block;" />`
                            : `<span style="font-size:16px; font-weight:700; letter-spacing:-0.4px; color:#ffffff;">${brand}</span>`
                        }
                      </td>
                      <td align="right">
                        <span style="display:inline-block; font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px; background-color:#451a03; color:#f59e0b; border:1px solid #78350f;">
                          Período de Gracia
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Notice Box -->
              <tr>
                <td style="padding: 36px 36px 0 36px;">
                  <h1 style="margin:0 0 12px 0; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:-0.5px; line-height:1.3;">
                    Tu ciclo de suscripción ha vencido
                  </h1>
                  <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#a1a1aa;">
                    Hola ${recipientName}, tu suscripción se encuentra actualmente con saldo pendiente. Tu tienda pública sigue en línea gracias al período de gracia activo.
                  </p>

                  <div style="background-color:#1c1917; border:1px solid #451a03; border-radius:10px; padding:18px 20px; margin-bottom:28px;">
                    <p style="margin:0; font-size:14px; color:#fbbf24; font-weight:600;">
                      ⚠️ Restan ${daysLeft} ${daysLeft === 1 ? "día" : "días"} de gracia antes de la suspensión del servicio.
                    </p>
                    <p style="margin:8px 0 0 0; font-size:13px; color:#a1a1aa; line-height:1.5;">
                      Regularizá tu facturación para evitar que la tienda pública pase a modo mantenimiento y el catálogo quede pausado.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Button -->
              <tr>
                <td style="padding: 0 36px 32px 36px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <a href="${billingUrl}"
                           style="display:inline-block; background-color:#f59e0b; color:#18181b; font-size:14px; font-weight:700; text-decoration:none; padding:12px 28px; border-radius:8px;">
                          Gestionar suscripción y regularizar →
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top:16px;">
                        <p style="margin:0; font-size:12px; color:#71717a; line-height:1.5;">
                          El proceso es inmediato: una vez registrado el pago, tu cuenta se normaliza en el momento.<br/>
                          Link directo: <a href="${billingUrl}" style="color:#f59e0b; text-decoration:none;">${billingUrl}</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 36px; background-color:#0f0f12; border-top:1px solid #1f1f23;">
                  <p style="margin:0; font-size:12px; color:#52525b; line-height:1.7;">
                    © ${new Date().getFullYear()} ${brand}. Notificación preventiva de cobro recurrente.
                  </p>
                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
    </html>
  `;
};

module.exports = subscriptionExpiringSoonTemplate;
