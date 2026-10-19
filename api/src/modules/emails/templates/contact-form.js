/**
 * Template: Notificación de Contacto desde la Storefront (Light Mode Admin)
 */
const contactFormTemplate = ({ data, logo, storeName }) => {
  const { name, email, message, subject, phone } = data;
  const brand = storeName || "Tu Tienda";
  const issueSubject = subject || "Consulta general";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Nueva consulta web — ${brand}</title>
    </head>
    <body style="margin:0; padding:0; background-color:#f4f4f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#18181b;">

      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5; padding: 40px 16px;">
        <tr>
          <td align="center">

            <table width="580" cellpadding="0" cellspacing="0" style="max-width:580px; width:100%; background-color:#ffffff; border:1px solid #e4e4e7; border-radius:12px; overflow:hidden; box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);">

              <!-- Brand Header -->
              <tr>
                <td style="padding: 24px 32px; border-bottom: 1px solid #f4f4f5; background-color:#fafafa;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="left" style="vertical-align:middle;">
                        ${
                          logo
                            ? `<img src="${logo}" alt="${brand}" style="max-height:30px; display:block;" />`
                            : `<span style="font-size:16px; font-weight:700; letter-spacing:-0.3px; color:#09090b;">${brand}</span>`
                        }
                      </td>
                      <td align="right" style="vertical-align:middle;">
                        <span style="display:inline-block; font-size:11px; font-weight:600; padding:4px 10px; border-radius:9999px; background-color:#ecfdf5; color:#047857; border:1px solid #a7f3d0; text-transform:uppercase; letter-spacing:0.5px;">
                          Mensaje Web
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Title & Context -->
              <tr>
                <td style="padding: 28px 32px 16px 32px;">
                  <h1 style="margin:0 0 6px 0; font-size:20px; font-weight:700; color:#09090b; letter-spacing:-0.4px;">
                    Nueva consulta recibida
                  </h1>
                  <p style="margin:0; font-size:13px; color:#71717a; line-height:1.5;">
                    Un cliente envió el siguiente mensaje a través del formulario de contacto de tu tienda online:
                  </p>
                </td>
              </tr>

              <!-- Customer Details Card -->
              <tr>
                <td style="padding: 0 32px 24px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; padding:16px 20px;">
                    <tr>
                      <td style="padding-bottom:10px;">
                        <span style="font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.3px;">Remitente</span>
                        <div style="font-size:14px; font-weight:600; color:#0f172a; margin-top:2px;">
                          ${name}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding-bottom:10px;">
                        <span style="font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.3px;">Email de contacto</span>
                        <div style="font-size:14px; margin-top:2px;">
                          <a href="mailto:${email}" style="color:#0284c7; text-decoration:none; font-weight:500;">${email}</a>
                        </div>
                      </td>
                    </tr>
                    ${
                      phone
                        ? `
                        <tr>
                          <td style="padding-bottom:10px;">
                            <span style="font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.3px;">Teléfono / WhatsApp</span>
                            <div style="font-size:14px; font-weight:500; color:#0f172a; margin-top:2px;">
                              ${phone}
                            </div>
                          </td>
                        </tr>
                        `
                        : ""
                    }
                    <tr>
                      <td>
                        <span style="font-size:12px; font-weight:600; color:#64748b; text-transform:uppercase; letter-spacing:0.3px;">Asunto</span>
                        <div style="font-size:14px; font-weight:500; color:#0f172a; margin-top:2px;">
                          ${issueSubject}
                        </div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Message Body -->
              <tr>
                <td style="padding: 0 32px 28px 32px;">
                  <div style="margin-bottom:8px;">
                    <span style="font-size:12px; font-weight:600; color:#71717a; text-transform:uppercase; letter-spacing:0.3px;">Mensaje del cliente</span>
                  </div>
                  <div style="background-color:#ffffff; border:1px solid #e4e4e7; border-left:3px solid #0284c7; border-radius:6px; padding:18px; font-size:14px; line-height:1.6; color:#27272a; white-space:pre-wrap;">
${message}
                  </div>
                </td>
              </tr>

              <!-- Quick Reply Action -->
              <tr>
                <td style="padding: 0 32px 32px 32px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td>
                        <a href="mailto:${email}?subject=Re:%20${encodeURIComponent(issueSubject)}&body=%0A%0A---%0AEn%20respuesta%20a%20tu%20consulta%20en%20${encodeURIComponent(brand)}:"
                           style="display:inline-block; background-color:#0f172a; color:#ffffff; font-size:13px; font-weight:600; text-decoration:none; padding:11px 22px; border-radius:7px; letter-spacing:0.1px;">
                          Responder a ${email} →
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 20px 32px; background-color:#fafafa; border-top:1px solid #f4f4f5; text-align:left;">
                  <p style="margin:0; font-size:12px; color:#a1a1aa; line-height:1.6;">
                    Notificación automática enviada desde el formulario de contacto web de <strong>${brand}</strong>.<br/>
                    Al hacer clic en responder, se abrirá tu cliente de correo con la dirección de ${name}.
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

module.exports = contactFormTemplate;
