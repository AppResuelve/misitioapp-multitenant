/**
 * Template: Bienvenida / Activación de cuenta en Admin (Dark Mode)
 */
const welcomeTemplate = ({ data, logo, storeName }) => {
  const { recipientName = "Comerciante", activationUrl, senderName } = data;
  const brand = storeName || senderName || "AppResuelve";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Activá tu panel de administración — ${brand}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#09090b; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#f4f4f5;">

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b; padding: 40px 16px;">
        <tr>
          <td align="center">
            
            <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px; width:100%; background-color:#121215; border:1px solid #27272a; border-radius:14px; overflow:hidden;">
              
              <!-- Brand Header -->
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
                        <span style="display:inline-block; font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px; background-color:#083344; color:#38bdf8; border:1px solid #0e7490;">
                          Acceso Admin
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Hero & Title -->
              <tr>
                <td style="padding: 36px 36px 0 36px;">
                  <h1 style="margin:0 0 12px 0; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:-0.5px; line-height:1.3;">
                    ¡Te damos la bienvenida, ${recipientName}!
                  </h1>
                  <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#a1a1aa;">
                    Tu tienda ha sido configurada y está lista para que comiences a gestionar tus productos, categorías y ventas desde el panel de control.
                  </p>

                  <div style="background-color:#18181b; border:1px solid #27272a; border-radius:10px; padding:16px 20px; margin-bottom:28px;">
                    <p style="margin:0; font-size:13px; color:#d4d4d8; line-height:1.5;">
                      🔒 Hacé clic en el botón de abajo para <strong>activar tu acceso y configurar tu contraseña</strong> de ingreso.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Action Button -->
              <tr>
                <td style="padding: 0 36px 32px 36px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <a href="${activationUrl}"
                           style="display:inline-block; background-color:#06b6d4; color:#09090b; font-size:14px; font-weight:700; text-decoration:none; padding:12px 28px; border-radius:8px; letter-spacing:0.1px;">
                          Activar mi panel de control →
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-top:16px;">
                        <p style="margin:0; font-size:12px; color:#71717a; line-height:1.5;">
                          Este enlace de activación expira en <strong>24 horas</strong>.<br/>
                          Si el botón no responde, copiá esta URL: <a href="${activationUrl}" style="color:#06b6d4; text-decoration:none; word-break:break-all;">${activationUrl}</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 36px; background-color:#0f0f12; border-top:1px solid #1f1f23; text-align:left;">
                  <p style="margin:0; font-size:12px; color:#52525b; line-height:1.7;">
                    © ${new Date().getFullYear()}${brand}. Todos los derechos reservados.<br/>
                    Mensaje del sistema automático. No responder directamente a esta casilla.
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

module.exports = welcomeTemplate;
