import crypto from 'node:crypto';
import { authenticatedUser } from './_auth.js';
import { isAdminUser } from './_supabase.js';
import { json } from './_responses.js';

const enc = encodeURIComponent;

function env() {
  const url = String(process.env.SUPABASE_URL || '').replace(/\/$/, '');
  const service = String(process.env.SUPABASE_SERVICE_ROLE_KEY || '');
  const anon = String(process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || '');
  if (!url || !service || !anon) throw new Error('Supabase non configurato per l’audit.');
  return { url, service, anon };
}

async function serviceFetch(path, options = {}) {
  const { url, service } = env();
  const r = await fetch(`${url}${path}`, {
    ...options,
    headers: {
      apikey: service,
      authorization: `Bearer ${service}`,
      'content-type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!r.ok) throw new Error(`Supabase admin ${r.status}: ${typeof data === 'string' ? data : JSON.stringify(data)}`);
  return data;
}

async function restAs(token, path, options = {}) {
  const { url, anon } = env();
  const r = await fetch(`${url}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: anon,
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
      prefer: options.prefer || 'return=representation',
      ...(options.headers || {}),
    },
  });
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}


async function restAnon(path) {
  const { url, anon } = env();
  const r = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: anon, 'content-type': 'application/json' },
  });
  const text = await r.text();
  let data = null; try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { ok: r.ok, status: r.status, data };
}

async function createUser(email, password, label) {
  return serviceFetch('/auth/v1/admin/users', {
    method: 'POST',
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `Audit ${label}`, company_name: `Audit Company ${label}` },
    }),
  });
}

async function signIn(email, password) {
  const { url, anon } = env();
  const r = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anon, 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.access_token) throw new Error(`Login utente audit fallito: ${data.error_description || data.msg || r.status}`);
  return data.access_token;
}

function check(label, pass, detail) {
  return { label, pass: Boolean(pass), detail: String(detail || '') };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: 'Metodo non consentito.' });
  let a = null, b = null;
  const created = { orders: [], requests: [], tasks: [], notifications: [], withdrawals: [] };
  const results = [];
  const auditId = crypto.randomUUID();
  const suffix = auditId.slice(0, 8);
  const passwordA = `Ec!A-${crypto.randomBytes(12).toString('base64url')}`;
  const passwordB = `Ec!B-${crypto.randomBytes(12).toString('base64url')}`;
  const emailA = `audit+a-${suffix}@example.com`;
  const emailB = `audit+b-${suffix}@example.com`;

  try {
    const admin = await authenticatedUser(req);
    if (!(await isAdminUser(admin.id))) return json(res, 403, { error: 'Accesso amministratore richiesto.' });
    env();

    a = await createUser(emailA, passwordA, 'A');
    b = await createUser(emailB, passwordB, 'B');
    if (!a?.id || !b?.id) throw new Error('Creazione utenti temporanei non riuscita.');

    // Ensure profile rows exist even if a trigger is temporarily delayed.
    await serviceFetch('/rest/v1/easycome_profiles?on_conflict=user_id', {
      method: 'POST',
      headers: { prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify([
        { user_id: a.id, full_name: 'Audit A', company_name: 'Audit Company A', email: emailA },
        { user_id: b.id, full_name: 'Audit B', company_name: 'Audit Company B', email: emailB },
      ]),
    });

    const projectA = crypto.randomUUID(), projectB = crypto.randomUUID();
    await serviceFetch('/rest/v1/easycome_projects', {
      method: 'POST',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify([
        { id: projectA, user_id: a.id, name: `Audit Project A ${suffix}`, project: { audit_id: auditId } },
        { id: projectB, user_id: b.id, name: `Audit Project B ${suffix}`, project: { audit_id: auditId } },
      ]),
    });

    const orderA = crypto.randomUUID(), orderB = crypto.randomUUID();
    created.orders.push(orderA, orderB);
    await serviceFetch('/rest/v1/easycome_orders', {
      method: 'POST',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify([
        { id: orderA, user_id: a.id, status: 'checkout_created', customer_email: emailA, customer_name: 'Audit A', company_name: 'Audit Company A', amount_cents: 9900, currency: 'eur', price_breakdown: { audit_id: auditId }, project: { audit_id: auditId }, delivery_status: 'not_ready' },
        { id: orderB, user_id: b.id, status: 'checkout_created', customer_email: emailB, customer_name: 'Audit B', company_name: 'Audit Company B', amount_cents: 9900, currency: 'eur', price_breakdown: { audit_id: auditId }, project: { audit_id: auditId }, delivery_status: 'not_ready' },
      ]),
    });

    const requestA = crypto.randomUUID(), requestB = crypto.randomUUID();
    created.requests.push(requestA, requestB);
    await serviceFetch('/rest/v1/easycome_support_requests', {
      method: 'POST',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify([
        { id: requestA, user_id: a.id, company_name: 'Audit Company A', customer_email: emailA, kind: 'support', subject: `Audit request A ${suffix}`, description: 'tenant isolation A', priority: 'normal', status: 'received', metadata: { audit_id: auditId } },
        { id: requestB, user_id: b.id, company_name: 'Audit Company B', customer_email: emailB, kind: 'support', subject: `Audit request B ${suffix}`, description: 'tenant isolation B', priority: 'normal', status: 'received', metadata: { audit_id: auditId } },
      ]),
    });

    const messageA = crypto.randomUUID(), messageB = crypto.randomUUID();
    await serviceFetch('/rest/v1/easycome_support_messages', {
      method: 'POST',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify([
        { id: messageA, request_id: requestA, user_id: a.id, sender_role: 'client', body: 'audit A', read_by_client: true, read_by_admin: false, message_key: `audit:${auditId}:a` },
        { id: messageB, request_id: requestB, user_id: b.id, sender_role: 'client', body: 'audit B', read_by_client: true, read_by_admin: false, message_key: `audit:${auditId}:b` },
      ]),
    });

    const subA = crypto.randomUUID(), subB = crypto.randomUUID();
    await serviceFetch('/rest/v1/easycome_subscriptions', {
      method: 'POST',
      headers: { prefer: 'return=minimal' },
      body: JSON.stringify([
        { id: subA, user_id: a.id, order_id: orderA, plan_code: 'audit', plan_name: 'Audit Operativo A', amount_cents: 15000, currency: 'eur', status: 'active', stripe_subscription_id: `audit_sub_a_${suffix}`, metadata: { audit_id: auditId } },
        { id: subB, user_id: b.id, order_id: orderB, plan_code: 'audit', plan_name: 'Audit Operativo B', amount_cents: 15000, currency: 'eur', status: 'active', stripe_subscription_id: `audit_sub_b_${suffix}`, metadata: { audit_id: auditId } },
      ]),
    });

    await serviceFetch('/rest/v1/easycome_customer_admin', {
      method: 'POST', headers: { prefer: 'return=minimal' },
      body: JSON.stringify({ user_id: b.id, lifecycle: 'lead', tags: ['audit'], admin_notes: `private ${auditId}` }),
    });
    const taskId = crypto.randomUUID(); created.tasks.push(taskId);
    await serviceFetch('/rest/v1/easycome_admin_tasks', {
      method: 'POST', headers: { prefer: 'return=minimal' },
      body: JSON.stringify({ id: taskId, user_id: b.id, title: `Private audit task ${suffix}`, status: 'todo', priority: 'normal' }),
    });
    const notifId = crypto.randomUUID(); created.notifications.push(notifId);
    await serviceFetch('/rest/v1/easycome_admin_notifications', {
      method: 'POST', headers: { prefer: 'return=minimal' },
      body: JSON.stringify({ id: notifId, event_key: `audit:${auditId}`, event_type: 'audit.private', severity: 'info', title: 'Private audit notification', user_id: b.id, metadata: { audit_id: auditId } }),
    });
    const withdrawalId = crypto.randomUUID(); created.withdrawals.push(withdrawalId);
    await serviceFetch('/rest/v1/easycome_withdrawals', {
      method: 'POST', headers: { prefer: 'return=minimal' },
      body: JSON.stringify({ id: withdrawalId, reference_code: `AUDIT-${suffix}`, user_id: b.id, order_id: orderB, order_ref: orderB, customer_name: 'Audit B', customer_email: emailB, contract_type: 'software', status: 'received', metadata: { audit_id: auditId } }),
    });

    const tokenA = await signIn(emailA, passwordA);
    const tokenB = await signIn(emailB, passwordB);

    const anonCases = [
      ['Anon non legge profili', 'easycome_profiles?select=user_id&limit=1'],
      ['Anon non legge progetti', 'easycome_projects?select=id&limit=1'],
      ['Anon non legge ordini', 'easycome_orders?select=id&limit=1'],
      ['Anon non legge assistenza', 'easycome_support_requests?select=id&limit=1'],
      ['Anon non legge messaggi', 'easycome_support_messages?select=id&limit=1'],
      ['Anon non legge Managed', 'easycome_subscriptions?select=id&limit=1'],
    ];
    for (const [label, path] of anonCases) {
      const r = await restAnon(path);
      const blocked = [401,403].includes(r.status) || (r.ok && Array.isArray(r.data) && r.data.length === 0);
      results.push(check(label, blocked, `HTTP ${r.status}, righe ${Array.isArray(r.data) ? r.data.length : 'bloccato'}`));
    }

    const ownCases = [
      ['Profilo A visibile ad A', `easycome_profiles?user_id=eq.${enc(a.id)}&select=user_id`, a.id],
      ['Progetto A visibile ad A', `easycome_projects?id=eq.${enc(projectA)}&select=id`, projectA],
      ['Ordine A visibile ad A', `easycome_orders?id=eq.${enc(orderA)}&select=id`, orderA],
      ['Ticket A visibile ad A', `easycome_support_requests?id=eq.${enc(requestA)}&select=id`, requestA],
      ['Messaggio A visibile ad A', `easycome_support_messages?id=eq.${enc(messageA)}&select=id`, messageA],
      ['Managed A visibile ad A', `easycome_subscriptions?id=eq.${enc(subA)}&select=id`, subA],
    ];
    for (const [label, path, id] of ownCases) {
      const r = await restAs(tokenA, path);
      results.push(check(label, r.ok && Array.isArray(r.data) && r.data.some(x => Object.values(x).includes(id)), `HTTP ${r.status}, righe ${Array.isArray(r.data) ? r.data.length : 'n/a'}`));
    }

    const crossCasesA = [
      ['A non vede profilo B', `easycome_profiles?user_id=eq.${enc(b.id)}&select=user_id`],
      ['A non vede progetto B', `easycome_projects?id=eq.${enc(projectB)}&select=id`],
      ['A non vede ordine B', `easycome_orders?id=eq.${enc(orderB)}&select=id`],
      ['A non vede ticket B', `easycome_support_requests?id=eq.${enc(requestB)}&select=id`],
      ['A non vede messaggio B', `easycome_support_messages?id=eq.${enc(messageB)}&select=id`],
      ['A non vede Managed B', `easycome_subscriptions?id=eq.${enc(subB)}&select=id`],
      ['A non vede CRM privato', `easycome_customer_admin?user_id=eq.${enc(b.id)}&select=user_id`],
      ['A non vede agenda privata', `easycome_admin_tasks?id=eq.${enc(taskId)}&select=id`],
      ['A non vede notifiche admin', `easycome_admin_notifications?id=eq.${enc(notifId)}&select=id`],
      ['A non vede recessi admin', `easycome_withdrawals?id=eq.${enc(withdrawalId)}&select=id`],
    ];
    for (const [label, path] of crossCasesA) {
      const r = await restAs(tokenA, path);
      const blocked = (r.ok && Array.isArray(r.data) && r.data.length === 0) || [401,403].includes(r.status);
      results.push(check(label, blocked, `HTTP ${r.status}, righe ${Array.isArray(r.data) ? r.data.length : 'bloccato'}`));
    }

    const crossCasesB = [
      ['B non vede profilo A', `easycome_profiles?user_id=eq.${enc(a.id)}&select=user_id`],
      ['B non vede progetto A', `easycome_projects?id=eq.${enc(projectA)}&select=id`],
      ['B non vede ordine A', `easycome_orders?id=eq.${enc(orderA)}&select=id`],
      ['B non vede ticket A', `easycome_support_requests?id=eq.${enc(requestA)}&select=id`],
      ['B non vede messaggio A', `easycome_support_messages?id=eq.${enc(messageA)}&select=id`],
      ['B non vede Managed A', `easycome_subscriptions?id=eq.${enc(subA)}&select=id`],
      ['B non vede CRM privato', `easycome_customer_admin?user_id=eq.${enc(a.id)}&select=user_id`],
      ['B non vede agenda privata', `easycome_admin_tasks?id=eq.${enc(taskId)}&select=id`],
      ['B non vede notifiche admin', `easycome_admin_notifications?id=eq.${enc(notifId)}&select=id`],
      ['B non vede recessi admin', `easycome_withdrawals?id=eq.${enc(withdrawalId)}&select=id`],
    ];
    for (const [label, path] of crossCasesB) {
      const r = await restAs(tokenB, path);
      results.push(check(label, r.ok && Array.isArray(r.data) && r.data.length === 0, `HTTP ${r.status}, righe ${Array.isArray(r.data) ? r.data.length : 'n/a'}`));
    }

    // Malicious cross-account update must touch zero rows.
    const patch = await restAs(tokenA, `easycome_profiles?user_id=eq.${enc(b.id)}`, {
      method: 'PATCH',
      body: JSON.stringify({ company_name: 'SHOULD NEVER WRITE' }),
      prefer: 'return=representation',
    });
    results.push(check('A non può modificare il profilo B', patch.ok && Array.isArray(patch.data) && patch.data.length === 0, `HTTP ${patch.status}, righe ${Array.isArray(patch.data) ? patch.data.length : 'n/a'}`));

    const passed = results.filter(x => x.pass).length;
    const failed = results.length - passed;
    return json(res, failed ? 409 : 200, {
      ok: failed === 0,
      auditId,
      createdTemporaryUsers: 2,
      passed,
      failed,
      results,
      cleanup: 'scheduled_in_finally',
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error(error);
    return json(res, 400, { error: error?.message || 'Audit non disponibile.', auditId, results });
  } finally {
    // Best-effort cleanup. Avoid leaving test business data behind even if deleting auth users fails.
    try {
      if (a?.id || b?.id) {
        const ids = [a?.id,b?.id].filter(Boolean).join(',');
        await serviceFetch(`/rest/v1/easycome_subscriptions?user_id=in.(${ids})`, { method: 'DELETE' });
        await serviceFetch(`/rest/v1/easycome_projects?user_id=in.(${ids})`, { method: 'DELETE' });
        await serviceFetch(`/rest/v1/easycome_customer_admin?user_id=in.(${ids})`, { method: 'DELETE' });
      }
    } catch (_) {}
    try {
      if (created.notifications.length) await serviceFetch(`/rest/v1/easycome_admin_notifications?id=in.(${created.notifications.join(',')})`, { method: 'DELETE' });
    } catch (_) {}
    try {
      if (created.withdrawals.length) await serviceFetch(`/rest/v1/easycome_withdrawals?id=in.(${created.withdrawals.join(',')})`, { method: 'DELETE' });
    } catch (_) {}
    try {
      if (created.tasks.length) await serviceFetch(`/rest/v1/easycome_admin_tasks?id=in.(${created.tasks.join(',')})`, { method: 'DELETE' });
    } catch (_) {}
    try {
      if (created.requests.length) await serviceFetch(`/rest/v1/easycome_support_requests?id=in.(${created.requests.join(',')})`, { method: 'DELETE' });
    } catch (_) {}
    try {
      if (created.orders.length) await serviceFetch(`/rest/v1/easycome_orders?id=in.(${created.orders.join(',')})`, { method: 'DELETE' });
    } catch (_) {}
    try { if (a?.id) await serviceFetch(`/auth/v1/admin/users/${enc(a.id)}`, { method: 'DELETE' }); } catch (_) {}
    try { if (b?.id) await serviceFetch(`/auth/v1/admin/users/${enc(b.id)}`, { method: 'DELETE' }); } catch (_) {}
  }
}
