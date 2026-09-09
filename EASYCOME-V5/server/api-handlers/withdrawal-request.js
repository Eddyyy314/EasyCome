import crypto from 'node:crypto';
import { json, readJson } from '../_responses.js';
import { createWithdrawal, getOrderById, updateWithdrawalById } from '../_supabase.js';
import { notifyAdmin, sendWithdrawalAcknowledgement } from '../_notify.js';

const clean = (value, max = 3000) => String(value ?? '').trim().slice(0, max);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const allowedTypes = new Set(['software','implementation','managed','other']);

function referenceCode() {
  const stamp = new Date().toISOString().slice(0,10).replaceAll('-','');
  return `EC-R-${stamp}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Metodo non consentito.' });
  try {
    const body = await readJson(req, 30_000);
    if (clean(body.website, 200)) return json(res, 200, { ok: true }); // honeypot
    const name = clean(body.name, 160);
    const email = clean(body.email, 220).toLowerCase();
    const orderRef = clean(body.order_ref, 120);
    const contractType = allowedTypes.has(body.contract_type) ? body.contract_type : '';
    const notes = clean(body.notes, 3000);
    if (!name || !validEmail(email) || !orderRef || !contractType || body.confirm !== true) {
      throw new Error('Completa i campi obbligatori e conferma la dichiarazione.');
    }

    let order = null;
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderRef)) {
      try {
        const candidate = await getOrderById(orderRef);
        if (candidate && String(candidate.customer_email || '').toLowerCase() === email) order = candidate;
      } catch (_) {}
    }

    const submittedAt = new Date().toISOString();
    const ref = referenceCode();
    const row = await createWithdrawal({
      id: crypto.randomUUID(),
      reference_code: ref,
      user_id: order?.user_id || null,
      order_id: order?.id || null,
      order_ref: orderRef,
      customer_name: name,
      customer_email: email,
      contract_type: contractType,
      notes: notes || null,
      status: 'received',
      submitted_at: submittedAt,
      metadata: {
        matched_order: Boolean(order),
        user_agent: clean(req.headers['user-agent'], 500),
      },
    });

    const ack = await sendWithdrawalAcknowledgement({
      to: email,
      name,
      referenceCode: ref,
      submittedAt,
    });

    if (ack.ok && row?.id) {
      await updateWithdrawalById(row.id, {
        acknowledged_at: new Date().toISOString(),
        acknowledgement_channel: 'email',
        updated_at: new Date().toISOString(),
      });
    }

    await notifyAdmin({
      eventKey: `withdrawal:${row?.id || ref}`,
      eventType: 'withdrawal.created',
      severity: 'urgent',
      title: 'Nuova dichiarazione di recesso',
      body: `${name} · ${email} · ${contractType} · ordine ${orderRef}${ack.ok ? '' : ' · conferma email da verificare'}`,
      userId: order?.user_id || null,
      orderId: order?.id || null,
      metadata: { reference_code: ref, acknowledgement_email_sent: Boolean(ack.ok) },
    });

    return json(res, 200, {
      ok: true,
      referenceCode: ref,
      submittedAt,
      acknowledgementEmailSent: Boolean(ack.ok),
    });
  } catch (error) {
    console.error(error);
    return json(res, 400, { error: error?.message || 'Impossibile inviare la dichiarazione.' });
  }
}
