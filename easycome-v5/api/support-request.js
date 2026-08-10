import crypto from 'node:crypto';
import { authenticatedUser } from './_auth.js';
import { json, readJson } from './_responses.js';
import { createSupportRequest, createSupportMessage } from './_supabase.js';
import { notifyAdmin } from './_notify.js';

const allowedKinds = new Set(['bug','support','feature','implementation','training','billing','consultation','custom_solution','managed_service','privacy']);
const allowedPriorities = new Set(['low','normal','high','urgent']);
const clean = (value, max = 4000) => String(value ?? '').trim().slice(0, max);

function cors(res) {
  res.setHeader('access-control-allow-origin', '*');
  res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
  res.setHeader('access-control-allow-headers', 'authorization, content-type');
}


export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return json(res, 200, { ok: true });
  if (req.method !== 'POST') return json(res, 405, { error: 'Metodo non consentito.' });
  try {
    const user = await authenticatedUser(req);
    const body = await readJson(req, 80_000);
    const kind = allowedKinds.has(body.kind) ? body.kind : 'support';
    const priority = allowedPriorities.has(body.priority) ? body.priority : 'normal';
    const subject = clean(body.subject, 240);
    const description = clean(body.description, 8000);
    if (!subject || !description) throw new Error('Oggetto e descrizione sono obbligatori.');
    const metadata = body.metadata && typeof body.metadata === 'object' && !Array.isArray(body.metadata) ? body.metadata : {};
    const ticket = {
      id: crypto.randomUUID(),
      user_id: user.id,
      organization_id: body.organization_id || null,
      company_name: clean(body.company_name || user.user_metadata?.company_name || '', 220),
      customer_email: clean(user.email || body.customer_email || '', 260).toLowerCase(),
      kind,
      subject,
      description,
      priority,
      status: 'received',
      metadata,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const saved = await createSupportRequest(ticket);
    const finalTicket = saved || ticket;
    await createSupportMessage({
      id: crypto.randomUUID(),
      request_id: finalTicket.id,
      user_id: user.id,
      sender_role: 'client',
      body: description,
      read_by_client: true,
      read_by_admin: false,
      created_at: new Date().toISOString(),
    });
    const special = ['consultation','custom_solution'].includes(kind);
    await notifyAdmin({
      eventKey: `support-request:${finalTicket.id}`,
      eventType: special ? 'meeting.created' : 'support.created',
      severity: priority === 'urgent' ? 'urgent' : special ? 'high' : 'normal',
      title: special ? 'Nuova richiesta di incontro / su misura' : `Nuova richiesta: ${subject}`,
      body: `${finalTicket.company_name || finalTicket.customer_email} · ${kind} · ${description.slice(0, 900)}`,
      userId: user.id,
      requestId: finalTicket.id,
      metadata: { kind, priority },
    });
    return json(res, 200, { ok: true, request: finalTicket });
  } catch (error) {
    console.error(error);
    return json(res, 400, { error: error?.message || 'Impossibile inviare la richiesta.' });
  }
}
