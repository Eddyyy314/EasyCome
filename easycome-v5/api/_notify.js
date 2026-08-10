import crypto from 'node:crypto';
import { createAdminNotification } from './_supabase.js';

const clean = (value, max = 8000) => String(value ?? '').trim().slice(0, max);

export async function sendEmail({ to, subject, text, html }) {
  const apiKey = String(process.env.RESEND_API_KEY || '').trim();
  const from = String(process.env.EASYCOME_NOTIFICATION_FROM || '').trim();
  if (!apiKey || !from || !to) return { ok: false, skipped: true, reason: 'email_not_configured' };
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: Array.isArray(to) ? to : [to],
        subject: clean(subject, 240),
        text: clean(text, 12000),
        html: html ? String(html).slice(0, 30000) : undefined,
      }),
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error(`Email HTTP ${response.status}: ${await response.text()}`);
    return { ok: true, response: await response.json().catch(() => ({})) };
  } catch (error) {
    console.warn('Email notification failed:', error?.message || error);
    return { ok: false, error: error?.message || String(error) };
  }
}

async function sendWebhook(payload) {
  const url = String(process.env.EASYCOME_SUPPORT_WEBHOOK_URL || '').trim();
  if (!url) return { ok: false, skipped: true, reason: 'webhook_not_configured' };
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(6000),
    });
    if (!response.ok) throw new Error(`Webhook HTTP ${response.status}`);
    return { ok: true };
  } catch (error) {
    console.warn('Notification webhook failed:', error?.message || error);
    return { ok: false, error: error?.message || String(error) };
  }
}

export async function notifyAdmin({
  eventKey,
  eventType = 'general',
  severity = 'normal',
  title,
  body = '',
  userId = null,
  requestId = null,
  orderId = null,
  subscriptionId = null,
  metadata = {},
}) {
  const safe = {
    id: crypto.randomUUID(),
    event_key: clean(eventKey || `${eventType}:${crypto.randomUUID()}`, 300),
    event_type: clean(eventType, 120),
    severity: ['info','normal','high','urgent'].includes(severity) ? severity : 'normal',
    title: clean(title, 260),
    body: clean(body, 6000) || null,
    user_id: userId || null,
    request_id: requestId || null,
    order_id: orderId || null,
    subscription_id: subscriptionId || null,
    metadata: metadata && typeof metadata === 'object' && !Array.isArray(metadata) ? metadata : {},
    created_at: new Date().toISOString(),
  };

  let stored = null;
  let storeOk = false;
  try {
    stored = await createAdminNotification(safe);
    storeOk = true;
  } catch (error) {
    // Notifications must never break checkout/support flows.
    console.warn('Admin notification DB unavailable:', error?.message || error);
  }
  if (storeOk && !stored) return { stored: null, duplicate: true, email: { skipped: true }, webhook: { skipped: true } };

  const adminEmail = String(
    process.env.EASYCOME_NOTIFICATION_EMAIL ||
    process.env.LEGAL_SUPPORT_EMAIL ||
    process.env.LEGAL_PRIVACY_EMAIL ||
    ''
  ).trim();

  const email = await sendEmail({
    to: adminEmail,
    subject: `[Easy Come] ${safe.title}`,
    text: [
      safe.title,
      safe.body,
      '',
      `Tipo: ${safe.event_type}`,
      safe.order_id ? `Ordine: ${safe.order_id}` : '',
      safe.request_id ? `Richiesta: ${safe.request_id}` : '',
      '',
      `Control Room: ${(process.env.APP_URL || 'https://easy-come.it').replace(/\/$/, '')}/admin`,
    ].filter(Boolean).join('\n'),
  });

  const webhook = await sendWebhook({
    event: `easycome.${safe.event_type}`,
    notification: safe,
  });

  return { stored, email, webhook };
}

export async function sendWithdrawalAcknowledgement({ to, name, referenceCode, submittedAt }) {
  const appUrl = String(process.env.APP_URL || 'https://easy-come.it').replace(/\/$/, '');
  const subject = `Conferma ricezione recesso ${referenceCode}`;
  const text = [
    `Ciao ${name || ''},`,
    '',
    'abbiamo ricevuto la tua dichiarazione di recesso.',
    `Riferimento: ${referenceCode}`,
    `Data e ora: ${new Date(submittedAt).toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}`,
    '',
    'La ricezione della dichiarazione non anticipa l’esito della verifica dei presupposti applicabili al contratto.',
    `Informazioni: ${appUrl}/rimborsi`,
  ].join('\n');
  return sendEmail({ to, subject, text });
}
