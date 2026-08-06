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
