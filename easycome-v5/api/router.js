import adminTools from '../server/api-handlers/admin-tools.js';
import checkoutStatus from '../server/api-handlers/checkout-status.js';
import createBillingPortal from '../server/api-handlers/create-billing-portal.js';
import createCheckoutSession from '../server/api-handlers/create-checkout-session.js';
import createManagedSubscription from '../server/api-handlers/create-managed-subscription.js';
import createAuditSubscription from '../server/api-handlers/create-audit-subscription.js';
import demoEvent from '../server/api-handlers/demo-event.js';
import demoFactory from '../server/api-handlers/demo-factory.js';
import demoPublic from '../server/api-handlers/demo-public.js';
import downloadOrder from '../server/api-handlers/download-order.js';
import generateDelivery from '../server/api-handlers/generate-delivery.js';
import publicConfig from '../server/api-handlers/public-config.js';
import stripeWebhook from '../server/api-handlers/stripe-webhook.js';
import supportMessage from '../server/api-handlers/support-message.js';
import supportRequest from '../server/api-handlers/support-request.js';
import withdrawalRequest from '../server/api-handlers/withdrawal-request.js';
import { json } from '../server/_responses.js';

const handlers = {
  'admin-tools': adminTools,
  'checkout-status': checkoutStatus,
  'create-billing-portal': createBillingPortal,
  'create-checkout-session': createCheckoutSession,
  'create-managed-subscription': createManagedSubscription,
  'create-audit-subscription': createAuditSubscription,
  'demo-event': demoEvent,
  'demo-factory': demoFactory,
  'demo-public': demoPublic,
  'download-order': downloadOrder,
  'generate-delivery': generateDelivery,
  'public-config': publicConfig,
  'stripe-webhook': stripeWebhook,
  'support-message': supportMessage,
  'support-request': supportRequest,
  'withdrawal-request': withdrawalRequest,
};

export default async function handler(req, res) {
  const url = new URL(req.url || '/api/router', 'http://localhost');
  const route = String(req.query?.route || url.searchParams.get('route') || '').trim();
  const target = handlers[route];
  if (!target) return json(res, 404, { error: 'Endpoint API non riconosciuto.' });
  return target(req, res);
}
