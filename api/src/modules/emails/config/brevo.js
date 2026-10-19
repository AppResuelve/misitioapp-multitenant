// src/modules/emails/config/brevo.js

// 🚀 Creamos nuestro propio cliente usando fetch nativo.
// Cero librerías = Cero problemas de versiones o cachés.
const apiInstance = {
  sendTransacEmail: async (emailPayload) => {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      // Si Brevo rechaza el correo (ej: email no verificado), capturamos el error exacto
      const errorData = await response.json();
      const error = new Error('Error en Brevo API');
      error.response = { body: errorData }; // Simulamos la estructura para tu catch en email.sender.js
      throw error;
    }

    return await response.json();
  },
};

module.exports = apiInstance;
