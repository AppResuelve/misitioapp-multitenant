/**
 * Template: Cuenta Suspendida por Falta de Pago (Dark Mode)
 */
const accountSuspendedTemplate = ({ data, logo, storeName }) => {
  const { recipientName = "Comerciante", billingUrl, tenantName } = data;
  const brand = storeName || "AppResuelve";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Tienda suspendida — ${brand}</title>
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
                        <span style="display:inline-block; font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px; background-color:#450a0a; color:#f87171; border:1px solid #7f1d1d;">
                          Servicio Suspendido
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Warning Message -->
              <tr>
                <td style="padding: 36px 36px 0 36px;">
                  <h1 style="margin:0 0 12px 0; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:-0.5px; line-height:1.3;">
                    Tu tienda ha sido suspendida
                  </h1>
                  <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#a1a1aa;">
                    Hola ${recipientName}, el período de gracia para regularizar la suscripción de <strong>${tenantName || "tu negocio"}</strong> ha finalizado.
                  </p>

                  <div style="background-color:#1c1313; border:1px solid #7f1d1d; border-radius:10px; padding:18px 20px; margin-bottom:28px;">
                    <p style="margin:0 0 8px 0; font-size:13px; color:#fca5a5; font-weight:600;">
                      🚫 Impacto en tu operatoria:
                    </p>
                    <ul style="margin:0; padding-left:18px; font-size:13px; color:#d4d4d8; line-height:1.6;">
                      <li>Tu tienda online responde con pantalla de pausa (código 503).</li>
                      <li>La recepción y administración de pedidos se encuentra bloqueada.</li>
                    </ul>
                  </div>
                </td>
              </tr>

              <!-- Action Button -->
              <tr>
                <td style="padding: 0 36px 32px 36px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <a href="${billingUrl}"
                           style="display:inline-block; background-color:#ef4444; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; padding:12px 28px; border-radius:8px;">
                          Reactivar mi tienda ahora →
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top:16px;">
                        <p style="margin:0; font-size:12px; color:#71717a; line-height:1.5;">
                          Tus productos, clientes e información están a salvo. Al cancelar el saldo pendiente el servicio se reactiva en tiempo real.<br/>
                          Link de facturación: <a href="${billingUrl}" style="color:#ef4444; text-decoration:none;">${billingUrl}</a>
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
                    © ${new Date().getFullYear()} ${brand}. Soporte: <a href="mailto:soporte@appresuelve.com.ar" style="color:#71717a;">soporte@appresuelve.com.ar</a>
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

module.exports = accountSuspendedTemplate;
