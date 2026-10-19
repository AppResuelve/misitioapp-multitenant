/**
 * Template: Trial Vencido
 * Versión profesional — línea estética consistente con las demás templates
 */
const trialExpiredTemplate = ({ data, palette, colors, typography, logo, storeName }) => {
  const { recipientName, tenantName, planName, billingUrl } = data;

  const fontHeading = typography?.heading || 'Georgia, serif';
  const fontBody = typography?.body || 'Arial, sans-serif';
  const primaryColor = palette?.primary || colors?.primary || '#C08279';
  const textHeading = palette?.textHeading || colors?.dark || '#1a1a1a';
  const textBody = palette?.textBody || colors?.surface || '#4a4a4a';
  const surfaceBg = palette?.surface || '#ffffff';
  const mutedColor = palette?.muted || '#f5f5f5';
  const borderColor = palette?.border || '#e8e8e8';
  const store = storeName || tenantName || 'FlavourLab';

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Tu período de prueba venció — ${store}</title>
      <style>
        @media only screen and (max-width: 600px) {
          .wrapper-table { padding: 0 !important; }
          .card-table    { border-radius: 0 !important; }
        }
      </style>
    </head>
    <body style="margin:0; padding:0; background-color:#f0f0f0; font-family:'${fontBody}', Arial, sans-serif;">

      <!-- Wrapper -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0f0f0; padding: 40px 0;">
        <tr>
          <td align="center" class="wrapper-table" style="padding: 40px 0;">

            <!-- Card -->
            <table class="card-table" width="600" cellpadding="0" cellspacing="0" style="max-width:600px; width:100%; background-color:${surfaceBg}; border-radius:12px; overflow:hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">

              <!-- Header -->
              <tr>
                <td style="background-color:${primaryColor}; padding: 36px 40px; text-align:center;">
                  ${
                    logo
                      ? `<img src="${logo}" alt="${store}" style="height:40px; display:inline-block; margin-bottom:20px;" /><br/>`
                      : `<p style="margin:0 0 16px 0; font-family:'${fontHeading}', Georgia, serif; font-size:18px; font-weight:700; color:#ffffff; letter-spacing:0.5px;">${store}</p>`
                  }
                  <div style="display:inline-block; background-color:rgba(255,255,255,0.20); border-radius:50%; width:64px; height:64px; text-align:center; line-height:64px; font-size:32px; margin-bottom:16px;">
                    ⏰
                  </div>
                  <h1 style="margin:0; font-family:'${fontHeading}', Georgia, serif; font-size:26px; font-weight:700; color:#ffffff; line-height:1.3;">
                    Tu período de prueba venció
                  </h1>
                  <p style="margin:8px 0 0 0; font-size:14px; color:rgba(255,255,255,0.80);">
                    Activá tu plan para seguir usando ${store}
                  </p>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 36px 40px 0 40px;">
                  <p style="margin:0 0 24px 0; font-size:15px; color:${textBody}; line-height:1.7;">
                    Hola, <strong style="color:${textHeading};">${recipientName}</strong>. Tu período de prueba de <strong style="color:${textHeading};">${store}</strong> ha finalizado. Activá tu suscripción para seguir usando la plataforma y no perder tu configuración.
                  </p>

                  <!-- Bloque de alerta -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#fef3c7; border-radius:8px; border:1px solid #fde68a; margin-bottom:16px;">
                    <tr>
                      <td style="padding: 16px 20px;">
                        <table cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-size:20px; padding-right:12px; vertical-align:middle;">⚠️</td>
                            <td style="font-size:13px; color:#92400e; font-family:'${fontBody}', Arial, sans-serif; line-height:1.6;">
                              <strong>Tu tienda está inactiva.</strong> Tus clientes no pueden hacer pedidos hasta que actives un plan.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>

                  <!-- Detalle -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:${mutedColor}; border-radius:8px; overflow:hidden; border:1px solid ${borderColor};">
                    <tr>
                      <td style="padding:14px 20px; border-bottom:1px solid ${borderColor};">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-size:12px; text-transform:uppercase; letter-spacing:0.8px; color:#999; font-family:'${fontBody}', Arial, sans-serif;">Estado</td>
                            <td align="right">
                              <span style="display:inline-block; background-color:#fef2f2; color:#dc2626; font-size:11px; font-weight:700; padding:3px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.5px;">
                                Trial vencido
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    ${
                      planName
                        ? `
                    <tr>
                      <td style="padding:14px 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td style="font-size:12px; text-transform:uppercase; letter-spacing:0.8px; color:#999; font-family:'${fontBody}', Arial, sans-serif;">Plan recomendado</td>
                            <td align="right" style="font-size:15px; font-weight:600; color:${textHeading}; font-family:'${fontBody}', Arial, sans-serif;">${planName}</td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                    `
                        : ''
                    }
                  </table>
                </td>
              </tr>

              <!-- CTA -->
              <tr>
                <td style="padding: 32px 40px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${billingUrl}"
                           style="display:inline-block; background-color:${primaryColor}; color:#ffffff; font-family:'${fontBody}', Arial, sans-serif; font-size:15px; font-weight:700; text-decoration:none; padding:14px 36px; border-radius:8px; letter-spacing:0.3px;">
                          Activar mi plan →
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td align="center" style="padding-top:12px;">
                        <p style="margin:0; font-size:12px; color:#aaa; font-family:'${fontBody}', Arial, sans-serif;">
                          ¿Tenés dudas? Escribinos a <a href="mailto:soporte@flavourlab.com" style="color:${primaryColor}; text-decoration:none;">soporte@flavourlab.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Divider -->
              <tr>
                <td style="padding: 0 40px;">
                  <hr style="border:none; border-top:1px solid ${borderColor}; margin:0;" />
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 40px; text-align:center;">
                  <p style="margin:0; font-size:12px; color:#bbb; font-family:'${fontBody}', Arial, sans-serif; line-height:1.8;">
                    © ${new Date().getFullYear()} <strong style="color:#999;">${store}</strong> — Tu aliado estratégico.<br/>
                    Este correo fue generado automáticamente. Por favor, no respondas este mensaje.
                  </p>
                </td>
              </tr>

            </table>
            <!-- /Card -->

          </td>
        </tr>
      </table>
      <!-- /Wrapper -->

    </body>
    </html>
  `;
};

module.exports = trialExpiredTemplate;
