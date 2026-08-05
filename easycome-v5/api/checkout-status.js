import { getOrderById } from './_supabase.js';
import { json } from './_responses.js';
import { stripeGet } from './_stripe.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Metodo non consentito.' });
  try {
    const sessionId = String(req.query?.session_id || '').trim();
    if (!sessionId.startsWith('cs_')) throw new Error('Sessione non valida.');
    const session = await stripeGet(`checkout/sessions/${encodeURIComponent(sessionId)}`);
    const orderId = session.metadata?.order_id || session.client_reference_id;
    const order = orderId ? await getOrderById(orderId) : null;
    return json(res, 200, {
      paid: session.payment_status === 'paid', status: session.payment_status, orderId,
      customerEmail: session.customer_details?.email || order?.customer_email || '',
      customerName: session.customer_details?.name || order?.customer_name || '',
      companyName: order?.company_name || session.metadata?.company_name || '',
      amountTotal: session.amount_total, currency: session.currency,
    });
  } catch (error) {
    console.error(error);
    return json(res, 400, { error: error.message || 'Impossibile verificare il pagamento.' });
  }
}
