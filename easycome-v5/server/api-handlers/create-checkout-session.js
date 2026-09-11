import crypto from 'node:crypto';
import { calculateServerPrice, compactProject } from '../_pricing.js';
import { createOrder, updateOrderById, getSubscriptionByUser } from '../_supabase.js';
import { appOrigin, json, readJson } from '../_responses.js';
import { stripePost } from '../_stripe.js';
import { authenticatedUser } from '../_auth.js';

const clean = (value, max = 200) => String(value || '').trim().slice(0, max);
const validEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Metodo non consentito.' });
  try {
    const user = await authenticatedUser(req);
    const body = await readJson(req);
    const project = compactProject(body.project || {});
    const customer = body.customer || {};
    const legal = body.legal || {};
    const email = clean(user.email || customer.email || project.company.email, 220).toLowerCase();
    const customerName = clean(customer.customerName, 160);
    const companyName = clean(customer.companyName || project.company.name, 180);
    const phone = clean(customer.phone, 60);
    const taxId = clean(customer.taxId, 80);
    if (!project.delivery.previewApproved) throw new Error('L’anteprima deve essere approvata prima del pagamento.');
    if (project.company.name.length < 3) throw new Error('Nome azienda non valido.');
    if (!validEmail(email)) throw new Error('Email non valida.');
    if (!customerName) throw new Error('Inserisci nome e cognome.');
    if (legal.termsAccepted !== true) throw new Error('Devi accettare i Termini e condizioni prima del pagamento.');
    if (legal.immediatePerformance !== true) throw new Error('Per la consegna immediata devi richiedere espressamente l’avvio della fornitura digitale.');
    const legalAcceptance = {
      terms_accepted: true,
      immediate_performance_requested: true,
      terms_version: clean(legal.termsVersion || 'EC-TOS-2026-08-29-v2', 80),
      refund_policy_version: clean(legal.refundPolicyVersion || 'EC-REF-2026-08-29-v2', 80),
      client_accepted_at: clean(legal.acceptedAt, 80) || null,
      server_recorded_at: new Date().toISOString(),
      user_id: user.id,
      email,
    };

    const price = calculateServerPrice(project);
    if (price.totalCents < 50) throw new Error('Importo non valido.');
    const orderId = crypto.randomUUID();
    const origin = appOrigin(req);

    const managedServiceSelected = true;
    project.delivery.implementationSelected = true;
    project.delivery.managedServiceSelected = true;
    project.delivery.managedServicePrice = 150;
    const existing = await getSubscriptionByUser(user.id);
    const existingManagedActive = Boolean(existing && !['canceled','incomplete_expired'].includes(existing.status));
    const createManagedSubscription = !existingManagedActive;
    const managedMonthlyCents = Number(process.env.EASYCOME_MANAGED_MONTHLY_CENTS || 15000);
    await createOrder({
      id: orderId, user_id: user.id, status: 'checkout_created', customer_email: email, customer_name: customerName,
      customer_phone: phone || null, tax_id: taxId || null, company_name: companyName,
      amount_cents: price.totalCents, currency: 'eur', price_breakdown: { ...price, managedMonthly: managedMonthlyCents / 100 }, project,
      source_url: clean(body.sourceUrl, 700) || null, prepared_filename: clean(body.preparedFilename, 250) || null, delivery_status: 'not_ready', download_count: 0,
      purchase_type: createManagedSubscription ? 'software_plus_operativo' : 'software_with_existing_operativo', managed_service_selected: true,
      legal_acceptance: legalAcceptance,
    });

    const params = new URLSearchParams();
    const add = (key, value) => { if (value !== undefined && value !== null && value !== '') params.append(key, String(value)); };
    add('mode', createManagedSubscription ? 'subscription' : 'payment');
    add('customer_email', email);
    if (!createManagedSubscription) add('customer_creation', 'always');
    add('client_reference_id', orderId);
    add('billing_address_collection', 'required');
    add('phone_number_collection[enabled]', 'true');
    add('allow_promotion_codes', process.env.STRIPE_ALLOW_PROMOTION_CODES === 'true' ? 'true' : 'false');
    add('automatic_tax[enabled]', process.env.STRIPE_AUTOMATIC_TAX === 'true' ? 'true' : 'false');
    if (!createManagedSubscription) add('invoice_creation[enabled]', process.env.STRIPE_CREATE_INVOICE === 'true' ? 'true' : 'false');
    const implementationCents = Math.round(Number(price.implementation || 150) * 100);
    const softwareCents = Math.max(50, price.totalCents - implementationCents);
    add('line_items[0][quantity]', '1');
    add('line_items[0][price_data][currency]', 'eur');
    add('line_items[0][price_data][unit_amount]', softwareCents);
    add('line_items[0][price_data][tax_behavior]', process.env.STRIPE_TAX_BEHAVIOR || 'inclusive');
    add('line_items[0][price_data][product_data][name]', `Software Easy Come — ${companyName}`);
    add('line_items[0][price_data][product_data][description]', 'Software base, moduli e personalizzazioni configurati e approvati in anteprima.');
    add('line_items[1][quantity]', '1');
    add('line_items[1][price_data][currency]', 'eur');
    add('line_items[1][price_data][unit_amount]', implementationCents);
    add('line_items[1][price_data][tax_behavior]', process.env.STRIPE_TAX_BEHAVIOR || 'inclusive');
    add('line_items[1][price_data][product_data][name]', 'Implementazione Easy Come');
    add('line_items[1][price_data][product_data][description]', 'Implementazione obbligatoria: configurazione, controlli e avvio del sistema nel perimetro dell’ordine.');
    add('metadata[order_id]', orderId);
    add('metadata[company_name]', companyName.slice(0, 480));
    add('metadata[price_version]', 'easycome-v10.2-2026-08');
    add('metadata[implementation]', 'included_required');
    add('metadata[managed_service]', createManagedSubscription ? 'operativo_new' : 'operativo_existing');
    add('metadata[user_id]', user.id);
    add('metadata[terms_version]', legalAcceptance.terms_version);
    add('metadata[immediate_performance]', 'requested');
    if (createManagedSubscription) {
      add('line_items[2][quantity]', '1');
      add('line_items[2][price_data][currency]', 'eur');
      add('line_items[2][price_data][unit_amount]', managedMonthlyCents);
      add('line_items[2][price_data][recurring][interval]', 'month');
      add('line_items[2][price_data][tax_behavior]', process.env.STRIPE_TAX_BEHAVIOR || 'inclusive');
      add('line_items[2][price_data][product_data][name]', 'Easy Come Operativo');
      add('line_items[2][price_data][product_data][description]', 'Funzionamento continuativo Easy Come: gestione tecnica, manutenzione, aggiornamenti compatibili e assistenza.');
      add('subscription_data[metadata][order_id]', orderId);
      add('subscription_data[metadata][user_id]', user.id);
      add('subscription_data[metadata][plan_code]', 'easycome_operativo_150');
    } else {
      add('payment_intent_data[metadata][order_id]', orderId);
      add('payment_intent_data[metadata][company_name]', companyName.slice(0, 480));
    }
    add('success_url', `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`);
    add('cancel_url', `${origin}/cancel.html?order_id=${encodeURIComponent(orderId)}`);
    add('locale', 'it');
    // Some Stripe API versions reject submit_type='pay' for subscription mode.
    // Let Stripe choose the correct recurring CTA in subscription mode.
    if (!createManagedSubscription) add('submit_type', 'pay');

    const session = await stripePost('checkout/sessions', params);
    await updateOrderById(orderId, { stripe_session_id: session.id, checkout_url: session.url, updated_at: new Date().toISOString() });
    return json(res, 200, { url: session.url, orderId, amount: price.total, currency: 'EUR', managedMonthly: managedMonthlyCents / 100 });
  } catch (error) {
    console.error(error);
    return json(res, 400, { error: error.message || 'Errore durante la creazione del checkout.' });
  }
}
