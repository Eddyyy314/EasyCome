function config() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  return { url, key, ready: Boolean(url && key) };
}

export function assertOrderStore() {
  const current = config();
  if (!current.ready) throw new Error('Archivio ordini non configurato: aggiungi SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY su Vercel.');
  return current;
}

async function request(path, options = {}) {
  const { url, key } = assertOrderStore();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      prefer: options.prefer || 'return=representation',
      ...(options.headers || {}),
    },
  });
  if (!response.ok) throw new Error(`Supabase ${response.status}: ${await response.text()}`);
  if (response.status === 204) return null;
  return response.json();
}

export async function createOrder(order) {
  const result = await request('easycome_orders', { method: 'POST', body: JSON.stringify(order) });
  return Array.isArray(result) ? result[0] : result;
}

export async function updateOrderById(id, patch) {
  return request(`easycome_orders?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' });
}

export async function updateOrderBySession(sessionId, patch) {
  return request(`easycome_orders?stripe_session_id=eq.${encodeURIComponent(sessionId)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' });
}

export async function getOrderById(id) {
  const result = await request(`easycome_orders?id=eq.${encodeURIComponent(id)}&select=*`);
  return Array.isArray(result) ? result[0] || null : null;
}

export async function getOrderBySession(sessionId) {
  const result = await request(`easycome_orders?stripe_session_id=eq.${encodeURIComponent(sessionId)}&select=*`);
  return Array.isArray(result) ? result[0] || null : null;
}

export async function upsertSubscription(subscription) {
  const result = await request('easycome_subscriptions?on_conflict=stripe_subscription_id', {
    method: 'POST',
    body: JSON.stringify(subscription),
    headers: { prefer: 'resolution=merge-duplicates,return=representation' },
  });
  return Array.isArray(result) ? result[0] || null : result;
}

export async function updateSubscriptionByStripeId(subscriptionId, patch) {
  return request(`easycome_subscriptions?stripe_subscription_id=eq.${encodeURIComponent(subscriptionId)}`, {
    method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal',
  });
}

export async function getSubscriptionByUser(userId) {
  const result = await request(`easycome_subscriptions?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc&limit=1&select=*`);
  return Array.isArray(result) ? result[0] || null : null;
}

export async function createSupportRequest(ticket) {
  const result = await request('easycome_support_requests', {
    method: 'POST',
    body: JSON.stringify(ticket),
  });
  return Array.isArray(result) ? result[0] || null : result;
}

export async function getSupportRequestById(id) {
  const result = await request(`easycome_support_requests?id=eq.${encodeURIComponent(id)}&select=*`);
  return Array.isArray(result) ? result[0] || null : null;
}

export async function updateSupportRequestById(id, patch) {
  return request(`easycome_support_requests?id=eq.${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(patch), prefer: 'return=minimal' });
}

export async function createSupportMessage(message) {
  const result = await request('easycome_support_messages', { method: 'POST', body: JSON.stringify(message) });
  return Array.isArray(result) ? result[0] || null : result;
}

export async function isAdminUser(userId) {
  const result = await request(`easycome_admins?user_id=eq.${encodeURIComponent(userId)}&select=user_id&limit=1`);
  return Array.isArray(result) && result.length > 0;
}
