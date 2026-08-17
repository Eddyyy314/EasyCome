import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer/index.js';
import { ImapFlow } from 'imapflow';

const DEFAULT_USER = 'infoeasycome@libero.it';
let transporter = null;

function mailConfig() {
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
  const { user, pass } = mailConfig();
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
  return { transport: transporter, user, pass };
}

async function buildRawMessage({ user, recipient, subject, text, messageId, date }) {
  const composer = new MailComposer({
    from: `"Edoardo | Easy Come" <${user}>`,
    replyTo: user,
    to: recipient,
    subject,
    text,
    messageId,
    date,
  });
  return composer.compile().build();
}

async function saveSentCopy(raw, { user, pass, date }) {
  const client = new ImapFlow({
    host: 'imapmail.libero.it',
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
    connectionTimeout: 12000,
    greetingTimeout: 12000,
    socketTimeout: 20000,
  });
  try {
    await client.connect();
    const mailboxes = await client.list();
    let sent = mailboxes.find(box => box.specialUse === '\\Sent');
    if (!sent) {
      sent = mailboxes.find(box => /(^|[\/\.])(sent|inviat|posta inviata|sent items)$/i.test(String(box.path || '')))
        || mailboxes.find(box => /sent|inviat/i.test(String(box.name || box.path || '')));
    }
    if (!sent?.path) throw new Error('Cartella Posta inviata non individuata via IMAP.');
    const appended = await client.append(sent.path, raw, ['\\Seen'], date);
    return {
      saved: true,
      folder: sent.path,
      uid: appended?.uid ? String(appended.uid) : '',
    };
  } catch (error) {
    return { saved: false, folder: '', uid: '', error: String(error?.message || error).slice(0, 300) };
  } finally {
    try { if (client.usable) await client.logout(); } catch {}
  }
}

export async function sendLiberoOutreach({ to, subject, message }) {
  const recipient = cleanEmail(to);
  const safeSubject = String(subject || 'Demo Easy Come').replace(/[\r\n]+/g, ' ').trim().slice(0, 180) || 'Demo Easy Come';
  const text = String(message || '').trim().slice(0, 12000);
  if (!text) throw new Error('Messaggio email vuoto.');

  const { transport, user, pass } = getTransport();
  const date = new Date();
  const messageId = `<easycome-${crypto.randomUUID()}@libero.it>`;
  const raw = await buildRawMessage({ user, recipient, subject: safeSubject, text, messageId, date });

  const result = await transport.sendMail({
    envelope: { from: user, to: [recipient] },
    raw,
  });

  const accepted = Array.isArray(result?.accepted) ? result.accepted.map(String) : [];
  const rejected = Array.isArray(result?.rejected) ? result.rejected.map(String) : [];
  if (!accepted.length && rejected.length) throw new Error(`Libero SMTP ha rifiutato il destinatario: ${rejected.join(', ')}`);

  // Best effort: SMTP delivery must not be turned into a false failure only because
  // the IMAP copy cannot be appended. The response reports the two states separately.
  const sentCopy = await saveSentCopy(raw, { user, pass, date });

  return {
    ok: true,
    status: 'accepted_by_smtp',
    statusLabel: 'Accettata da Libero SMTP',
    from: user,
    to: recipient,
    accepted,
    rejected,
    pending: Array.isArray(result?.pending) ? result.pending.map(String) : [],
    response: String(result?.response || '').slice(0, 500),
    messageId,
    sentAt: date.toISOString(),
    sentCopy,
  };
}
