import nodemailer from 'nodemailer';

const DEFAULT_USER = 'infoeasycome@libero.it';
let transporter = null;

function smtpConfig() {
  const user = String(process.env.LIBERO_SMTP_USER || DEFAULT_USER).trim().toLowerCase();
  const pass = String(process.env.LIBERO_SMTP_PASSWORD || '');
  if (!pass) throw new Error('LIBERO_SMTP_PASSWORD mancante su Vercel. Aggiungila nelle Environment Variables e fai Redeploy.');
  return { user, pass };
}

function cleanEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Indirizzo email destinatario non valido.');
  return email;
}

function getTransport() {
  const { user, pass } = smtpConfig();
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: 'smtp.libero.it',
      port: 465,
      secure: true,
      auth: { user, pass },
      connectionTimeout: 12000,
      greetingTimeout: 12000,
      socketTimeout: 20000,
    });
  }
  return { transport: transporter, user };
}

export async function sendLiberoOutreach({ to, subject, message }) {
  const recipient = cleanEmail(to);
  const safeSubject = String(subject || 'Demo Easy Come').replace(/[\r\n]+/g, ' ').trim().slice(0, 180) || 'Demo Easy Come';
  const text = String(message || '').trim().slice(0, 12000);
  if (!text) throw new Error('Messaggio email vuoto.');

  const { transport, user } = getTransport();
  const result = await transport.sendMail({
    from: `"Edoardo | Easy Come" <${user}>`,
    replyTo: user,
    to: recipient,
    subject: safeSubject,
    text,
  });

  return {
    ok: true,
    from: user,
    to: recipient,
    messageId: result?.messageId || '',
  };
}
