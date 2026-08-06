import crypto from 'node:crypto';
import { calculateServerPrice, compactProject } from './_pricing.js';
import { createOrder, updateOrderById } from './_supabase.js';
import { appOrigin, json, readJson } from './_responses.js';
import { stripePost } from './_stripe.js';
import { authenticatedUser } from './_auth.js';

const clean = (value, max = 200) => String(value || '').trim().slice(0, max);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Metodo non consentito.' });
  try {
    const user = await authenticatedUser(req);
    const body = await readJson(req);
    const project = compactProject(body.project || {});
    const customer = body.customer || {};
    const email = clean(user.email || customer.email || project.company.email, 220).toLowerCase();
    const customerName = clean(customer.customerName, 160);
    const companyName = clean(customer.companyName || project.company.name, 180);
    const phone = clean(customer.phone, 60);
    const taxId = clean(customer.taxId, 80);
    if (!project.delivery.previewApproved) throw new Error('L’anteprima deve essere approvata prima del pagamento.');
    if (project.company.name.length < 3) throw new Error('Nome azienda non valido.');
    if (!validEmail(email)) throw new Error('Email non valida.');
    if (!customerName) throw new Error('Inserisci nome e cognome.');

    const price = calculateServerPrice(project);
    if (price.totalCents < 50) throw new Error('Importo non valido.');
    const orderId = crypto.randomUUID();
    const origin = appOrigin(req);

    await createOrder({
      id: orderId, user_id: user.id, status: 'checkout_created', customer_email: email, customer_name: customerName,
      customer_phone: phone || null, tax_id: taxId || null, company_name: companyName,
      amount_cents: price.totalCents, currency: 'eur', price_breakdown: price, project,
      source_url: clean(body.sourceUrl, 700) || null, prepared_filename: clean(body.preparedFilename, 250) || null, delivery_status: 'not_ready', download_count: 0,
    });

    const params = new URLSearchParams();
    const add = (key, value) => { if (value !== undefined && value !== null && value !== '') params.append(key, String(value)); };
    add('mode', 'payment');
    add('customer_email', email);
    add('customer_creation', 'always');
    add('client_reference_id', orderId);
    add('billing_address_collection', 'required');
    add('phone_number_collection[enabled]', 'true');
    add('allow_promotion_codes', process.env.STRIPE_ALLOW_PROMOTION_CODES === 'true' ? 'true' : 'false');
    add('automatic_tax[enabled]', process.env.STRIPE_AUTOMATIC_TAX === 'true' ? 'true' : 'false');
    add('invoice_creation[enabled]', process.env.STRIPE_CREATE_INVOICE === 'true' ? 'true' : 'false');
    add('line_items[0][quantity]', '1');
    add('line_items[0][price_data][currency]', 'eur');
    add('line_items[0][price_data][unit_amount]', price.totalCents);
    add('line_items[0][price_data][tax_behavior]', process.env.STRIPE_TAX_BEHAVIOR || 'inclusive');
    add('line_items[0][price_data][product_data][name]', `Gestionale personalizzato — ${companyName}`);
    add('line_items[0][price_data][product_data][description]', project.delivery.implementationSelected
      ? 'Sistema digitale personalizzato con implementazione assistita Easy Come.'
      : 'Sistema digitale personalizzato Easy Come. Implementazione non inclusa.');
    add('metadata[order_id]', orderId);
    add('metadata[company_name]', companyName.slice(0, 480));
    add('metadata[price_version]', 'easycome-v7-2026-08');
    add('metadata[implementation]', project.delivery.implementationSelected ? 'included' : 'not_selected');
    add('payment_intent_data[metadata][order_id]', orderId);
    add('payment_intent_data[metadata][company_name]', companyName.slice(0, 480));
    add('success_url', `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
    add('cancel_url', `${origin}/cancel.html?order_id=${encodeURIComponent(orderId)}`);
    add('locale', 'it');
    add('submit_type', 'pay');

    const session = await stripePost('checkout/sessions', params);
    await updateOrderById(orderId, { stripe_session_id: session.id, checkout_url: session.url, updated_at: new Date().toISOString() });
    return json(res, 200, { url: session.url, orderId, amount: price.total, currency: 'EUR' });
  } catch (error) {
    console.error(error);
    return json(res, 400, { error: error.message || 'Errore durante la creazione del checkout.' });
  }
}
