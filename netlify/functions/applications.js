const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'zelestia.sts@gmail.com';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'Zelestia Studios <onboarding@resend.dev>';

function json(statusCode, payload) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify(payload),
  };
}

function sanitizeApplication(input) {
  const allowedRoles = new Set(['Programador', 'Animador', 'Ilustrador', 'Doblaje de voz']);
  const app = {
    role: String(input.Rol || '').trim(),
    name: String(input.Nombre || '').trim(),
    email: String(input.Correo || '').trim(),
    fields: input,
  };

  if (!allowedRoles.has(app.role)) app.role = 'Postulación';
  if (!app.name || !app.email) {
    throw new Error('Nombre y correo son obligatorios.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(app.email)) {
    throw new Error('El correo no tiene un formato válido.');
  }

  return app;
}

function formatApplicationEmail(app) {
  return Object.entries(app.fields)
    .filter(([key]) => !key.startsWith('_'))
    .map(([key, value]) => `${key}: ${value || 'No especificado'}`)
    .join('\n');
}

async function sendApplicationEmail(app) {
  if (!RESEND_API_KEY) {
    throw new Error('Falta configurar RESEND_API_KEY en Netlify.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [CONTACT_EMAIL],
      reply_to: app.email,
      subject: `Postulación Zelestia - ${app.role}`,
      text: formatApplicationEmail(app),
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    if (response.status === 403 && detail.includes('verify a domain')) {
      throw new Error('El correo de postulaciones necesita un dominio verificado en Resend.');
    }
    throw new Error('No se pudo enviar el correo de postulación.');
  }
}

exports.handler = async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { ok: false, message: 'Método no permitido.' });
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const application = sanitizeApplication(payload);
    await sendApplicationEmail(application);

    return json(200, { ok: true, message: 'Postulación enviada.' });
  } catch (error) {
    return json(400, {
      ok: false,
      message: error.message || 'No se pudo procesar la postulación.',
    });
  }
};
