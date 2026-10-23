/**
 * Template: Restablecer Contraseña (Dark Mode con OTP 6 Dígitos)
 */
const recoveryTemplate = ({ data, logo, storeName, palette }) => {
  const { code, resetUrl, senderName } = data;
  const brand = storeName || senderName || "AppResuelve";
  const primaryColor = palette?.primary || "#06b6d4";

  // Generamos los 6 casilleros con estilo similar al componente OtpInput
  const digits = (code || "").toString().slice(0, 6).split("");
  const otpCells = digits
    .map(
      (digit) => `
        <td align="center" valign="middle" style="width:48px; height:56px; background-color:#18181b; border:1px solid #3f3f46; border-radius:10px; font-family:'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace; font-size:24px; font-weight:700; color:#ffffff; padding:0;">
          ${digit}
        </td>
      `,
    )
    .join('<td style="width:8px;"></td>');

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Código de recuperación — ${brand}</title>
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
                        <span style="display:inline-block; font-size:11px; font-weight:600; padding:3px 8px; border-radius:6px; background-color:#18181b; color:#a1a1aa; border:1px solid #27272a;">
                          Seguridad
                        </span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Content -->
              <tr>
                <td style="padding: 36px 36px 0 36px;">
                  <h1 style="margin:0 0 12px 0; font-size:22px; font-weight:700; color:#ffffff; letter-spacing:-0.5px; line-height:1.3;">
                    Código de verificación
                  </h1>
                  <p style="margin:0 0 24px 0; font-size:14px; line-height:1.6; color:#a1a1aa;">
                    Ingresá el siguiente código de 6 dígitos en la pantalla de recuperación para definir tu nueva contraseña:
                  </p>

                  <!-- 6 Dígitos OTP UI -->
                  ${
                    digits.length > 0
                      ? `
                        <div style="margin: 0 auto 28px auto; text-align: center;">
                          <table cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                            <tr>
                              ${otpCells}
                            </tr>
                          </table>
                        </div>
                      `
                      : ""
                  }

                  <div style="background-color:#18181b; border:1px solid #27272a; border-radius:10px; padding:16px 20px; margin-bottom:28px;">
                    <p style="margin:0; font-size:13px; color:#d4d4d8; line-height:1.5;">
                      ⏱️ Este código de seguridad caduca en <strong>15 minutos</strong> y es de un solo uso.
                    </p>
                  </div>
                </td>
              </tr>

              <!-- Fallback Action Button (si viene resetUrl) -->
              ${
                resetUrl
                  ? `
                    <tr>
                      <td style="padding: 0 36px 28px 36px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td>
                              <p style="margin:0 0 12px 0; font-size:13px; color:#a1a1aa;">
                                O si preferís, podés ingresar directamente mediante el siguiente botón:
                              </p>
                              <a href="${resetUrl}"
                                 style="display:inline-block; background-color:${primaryColor}; color:#09090b; font-size:14px; font-weight:700; text-decoration:none; padding:12px 28px; border-radius:8px;">
                                Restablecer directamente →
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  `
                  : ""
              }

              <!-- Security Notice -->
              <tr>
                <td style="padding: 0 36px 32px 36px;">
                  <p style="margin:0; font-size:12px; color:#71717a; line-height:1.5;">
                    Si vos no solicitaste este cambio, podés ignorar este correo; tu cuenta continúa segura y no se realizarán modificaciones.
                  </p>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 24px 36px; background-color:#0f0f12; border-top:1px solid #1f1f23;">
                  <p style="margin:0; font-size:12px; color:#52525b; line-height:1.7;">
                    © ${new Date().getFullYear()} ${brand}. Mensaje generado automáticamente por el sistema.
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

module.exports = recoveryTemplate;
