import { readRaw, json } from './_responses.js';
import { updateOrderById, updateOrderBySession } from './_supabase.js';
import { verifyStripeSignature } from './_stripe.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Metodo non consentito.' });
  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('Webhook Stripe non configurato.');
    const raw = await readRaw(req);
    verifyStripeSignature(raw, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
    const event = JSON.parse(raw.toString('utf8'));
    const session = event.data?.object;
    const orderId = session?.metadata?.order_id || session?.client_reference_id;
    const common = {
      stripe_session_id: session?.id || null,
      payment_status: session?.payment_status || null,
      stripe_customer_id: typeof session?.customer === 'string' ? session.customer : session?.customer?.id || null,
      stripe_payment_intent_id: typeof session?.payment_intent === 'string' ? session.payment_intent : session?.payment_intent?.id || null,
      updated_at: new Date().toISOString(),
    };
    let patch = null;
    if (event.type === 'checkout.session.completed') patch = { ...common, status: session.payment_status === 'paid' ? 'paid' : 'processing', paid_at: session.payment_status === 'paid' ? new Date().toISOString() : null };
    if (event.type === 'checkout.session.async_payment_succeeded') patch = { ...common, status: 'paid', paid_at: new Date().toISOString() };
    if (event.type === 'checkout.session.async_payment_failed') patch = { ...common, status: 'payment_failed' };
    if (event.type === 'checkout.session.expired') patch = { ...common, status: 'expired' };
    if (patch) {
      if (orderId) await updateOrderById(orderId, patch);
      else if (session?.id) await updateOrderBySession(session.id, patch);
    }
    return json(res, 200, { received: true });
  } catch (error) {
    console.error(error);
    return json(res, 400, { error: error.message || 'Webhook non valido.' });
  }
}
