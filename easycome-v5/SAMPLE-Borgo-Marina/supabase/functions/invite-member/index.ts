// Supabase Edge Function: invite-member
// Deploy: supabase functions deploy invite-member
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const userDb = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const adminDb = createClient(url, service);

  const body = await req.json().catch(() => ({}));
  const organizationId = String(body.organizationId || '');
  const email = String(body.email || '').trim().toLowerCase();
  const role = ['admin','member','viewer'].includes(body.role) ? body.role : 'member';
  const redirectTo = String(body.redirectTo || '');
  if (!organizationId || !email.includes('@')) return Response.json({ error: 'Dati invito non validi' }, { status: 400 });

  const { data: roleData, error: roleError } = await userDb.rpc('get_my_role', { p_organization_id: organizationId });
  if (roleError || !['owner','admin'].includes(roleData)) return new Response('Forbidden', { status: 403 });

  const { data: invited, error: inviteError } = await adminDb.auth.admin.inviteUserByEmail(email, redirectTo ? { redirectTo } : undefined);
  if (inviteError) {
    // L'utente potrebbe esistere già: prova a trovarlo per email.
    const { data: listed, error: listError } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return Response.json({ error: inviteError.message }, { status: 400 });
    const existing = listed.users.find((user) => String(user.email || '').toLowerCase() === email);
    if (!existing) return Response.json({ error: inviteError.message }, { status: 400 });
    const { error: memberError } = await adminDb.from('organization_members').upsert({ organization_id: organizationId, user_id: existing.id, role, email });
    if (memberError) return Response.json({ error: memberError.message }, { status: 400 });
    return Response.json({ ok: true, userId: existing.id, existing: true });
  }

  const userId = invited.user?.id;
  if (!userId) return Response.json({ error: 'Invito creato senza user id' }, { status: 500 });
  const { error: memberError } = await adminDb.from('organization_members').upsert({ organization_id: organizationId, user_id: userId, role, email });
  if (memberError) return Response.json({ error: memberError.message }, { status: 400 });
  return Response.json({ ok: true, userId, invited: true });
});
