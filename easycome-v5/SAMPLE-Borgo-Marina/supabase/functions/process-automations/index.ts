// Supabase Edge Function: process-automations
// Deploy: supabase functions deploy process-automations --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const workflows = [
  {
    "id": "1e137f30-d6d0-451a-b681-f82cbc311d4a",
    "name": "Nuova richiesta al team",
    "trigger": "record_created",
    "entity": "public_submissions",
    "action": "email",
    "target": "direzione@borgomarina.example",
    "message": "Nuova richiesta ricevuta dal portale.",
    "enabled": true
  },
  {
    "id": "e71b0683-3e00-4c13-88b7-99aca5120ff1",
    "name": "Task pre-arrivo",
    "trigger": "record_created",
    "entity": "bookings",
    "action": "create_task",
    "target": "",
    "message": "Verifica documenti e saldo prima dell’arrivo.",
    "enabled": true
  },
  {
    "id": "1df53b3e-33be-44b5-a68d-2a21588b6a52",
    "name": "Conferma webhook",
    "trigger": "status_changed",
    "entity": "bookings",
    "action": "webhook",
    "target": "https://example.com/make-webhook",
    "message": "Prenotazione confermata.",
    "enabled": true
  }
];
const dateFlows = [];

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('AUTOMATION_CRON_SECRET');
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(url, serviceKey);
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  // Genera eventi per le scadenze configurate. La deduplica impedisce doppie esecuzioni.
  for (const dateFlow of dateFlows) {
    const { data: dueRows, error: dueError } = await db
      .from(dateFlow.entity)
      .select('*')
      .gte(dateFlow.dateField, now.toISOString())
      .lt(dateFlow.dateField, nextHour.toISOString())
      .limit(100);
    if (dueError) continue;
    for (const row of dueRows || []) {
      const dueValue = String(row[dateFlow.dateField] || '');
      const dedupeKey = [dateFlow.workflowName, row.id, dueValue].join(':');
      await db.from('automation_events').upsert({
        organization_id: row.organization_id,
        entity: dateFlow.entity,
        event_type: 'date_reached',
        record_id: row.id,
        payload: row,
        dedupe_key: dedupeKey,
      }, { onConflict: 'dedupe_key', ignoreDuplicates: true });
    }
  }

  const { data: events, error } = await db
    .from('automation_events')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const event of events || []) {
    const { data: claimed } = await db.from('automation_events')
      .update({ status: 'processing' })
      .eq('id', event.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (!claimed) continue;

    const matched = workflows.filter((flow) => flow.enabled !== false
      && flow.trigger === event.event_type
      && (!flow.entity || flow.entity === event.entity));

    try {
      for (const flow of matched) {
        try {
          if (flow.action === 'webhook' && flow.target) {
            const response = await fetch(flow.target, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ flow, event }),
            });
            if (!response.ok) throw new Error('Webhook HTTP ' + response.status);
          }

          if (flow.action === 'email') {
            const apiKey = Deno.env.get('RESEND_API_KEY');
            const from = Deno.env.get('EMAIL_FROM');
            const to = flow.target || event.payload?.email;
            if (!apiKey || !from || !to) throw new Error('Configura RESEND_API_KEY, EMAIL_FROM e destinatario');
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
              body: JSON.stringify({
                from, to,
                subject: flow.subject || flow.name || 'Aggiornamento dal gestionale',
                html: flow.message || '<p>Nuovo evento nel gestionale.</p>',
              }),
            });
            if (!response.ok) throw new Error('Email non inviata: ' + await response.text());
          }

          if (flow.action === 'notify') {
            const { error: notifyError } = await db.from('internal_notifications').insert({
              organization_id: event.organization_id,
              title: flow.name || 'Nuova notifica',
              message: flow.message || JSON.stringify(event.payload),
            });
            if (notifyError) throw notifyError;
          }

          if (flow.action === 'create_task') {
            const { error: taskError } = await db.from('tasks').insert({
              organization_id: event.organization_id,
              title: flow.message || flow.name || 'Attività automatica',
              status: 'Da fare',
              priority: 'Media',
            });
            if (taskError) throw taskError;
          }

          if (flow.action === 'update_status' && flow.entity && flow.target) {
            const { error: updateError } = await db.from(flow.entity)
              .update({ status: flow.target })
              .eq('id', event.record_id)
              .eq('organization_id', event.organization_id);
            if (updateError) throw updateError;
          }

          if (flow.action === 'ai') {
            const endpoint = Deno.env.get('AI_WEBHOOK_URL');
            if (!endpoint) throw new Error('Configura AI_WEBHOOK_URL');
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ flow, event }),
            });
            if (!response.ok) throw new Error('AI webhook HTTP ' + response.status);
          }

          await db.from('automation_log').insert({
            organization_id: event.organization_id,
            workflow_name: flow.name || flow.action,
            event_name: event.event_type,
            status: 'Eseguita',
            details: 'Record ' + (event.record_id || 'n/a'),
          });
        } catch (flowError) {
          await db.from('automation_log').insert({
            organization_id: event.organization_id,
            workflow_name: flow.name || flow.action,
            event_name: event.event_type,
            status: 'Errore',
            details: String(flowError),
          });
          throw flowError;
        }
      }

      await db.from('automation_events').update({ status: 'done', processed_at: new Date().toISOString() }).eq('id', event.id);
      results.push({ id: event.id, ok: true, workflows: matched.length });
    } catch (automationError) {
      await db.from('automation_events').update({ status: 'error', error_message: String(automationError), processed_at: new Date().toISOString() }).eq('id', event.id);
      results.push({ id: event.id, ok: false, error: String(automationError) });
    }
  }

  return Response.json({ processed: results.length, results });
});
