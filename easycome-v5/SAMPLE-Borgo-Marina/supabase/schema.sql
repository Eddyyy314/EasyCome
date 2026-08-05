-- Easy Come Studio Masterpiece — schema Supabase
-- Progetto: Borgo Marina
-- Generato: 2026-08-03T11:33:46.793Z
-- Eseguibile più volte: policy, trigger e seed sono idempotenti.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.organizations (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  email text,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organization_members add column if not exists email text;

create table if not exists public.app_settings (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (organization_id, key)
);

create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity text not null,
  event_type text not null,
  record_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','done','error')),
  error_message text,
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.automation_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_name text,
  event_name text,
  status text not null default 'In attesa',
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internal_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  actor_id uuid references auth.users(id) on delete set null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.public_submission_limits (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_token text not null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.public_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null default 'request',
  name text,
  email text,
  phone text,
  message text,
  status text not null default 'Nuova',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.org_role(p_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.organization_members
  where organization_id = p_organization_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.org_can_read(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.org_role(p_organization_id) in ('owner','admin','member','viewer'); $$;

create or replace function public.org_can_write(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.org_role(p_organization_id) in ('owner','admin','member'); $$;

create or replace function public.org_can_admin(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.org_role(p_organization_id) in ('owner','admin'); $$;

create or replace function public.get_my_role(p_organization_id uuid)
returns text language sql stable security definer set search_path = public
as $$ select public.org_role(p_organization_id); $$;
grant execute on function public.get_my_role(uuid) to authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.claim_owner_by_email(p_organization_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_email text;
  current_email text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select lower(nullif(settings->'brand'->>'email','')) into expected_email
  from public.organizations where id = p_organization_id;
  current_email := lower(coalesce(auth.jwt()->>'email',''));
  if expected_email is null then raise exception 'Owner email not configured'; end if;
  if current_email <> expected_email then raise exception 'Email not authorized as owner'; end if;
  if exists (select 1 from public.organization_members where organization_id = p_organization_id) then return false; end if;
  insert into public.organization_members (organization_id, user_id, role, email)
  values (p_organization_id, auth.uid(), 'owner', current_email)
  on conflict do nothing;
  return true;
end;
$$;

grant execute on function public.claim_owner_by_email(uuid) to authenticated;

create or replace function public.submit_public_request(
  p_organization_id uuid,
  p_source text,
  p_payload jsonb,
  p_client_token text,
  p_website text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  recent_count integer;
begin
  if coalesce(trim(p_website),'') <> '' then raise exception 'Invalid request'; end if;
  if not exists (select 1 from public.organizations where id = p_organization_id) then raise exception 'Organization not found'; end if;
  if length(coalesce(p_client_token,'')) < 8 then raise exception 'Invalid client token'; end if;
  if octet_length(p_payload::text) > 25000 then raise exception 'Request too large'; end if;
  select count(*) into recent_count from public.public_submission_limits
  where organization_id = p_organization_id and client_token = p_client_token
    and submitted_at > now() - interval '10 minutes';
  if recent_count >= 5 then raise exception 'Troppe richieste. Riprova tra qualche minuto.'; end if;
  insert into public.public_submission_limits (organization_id, client_token) values (p_organization_id, p_client_token);
  delete from public.public_submission_limits where submitted_at < now() - interval '24 hours';
  insert into public.public_submissions (
    organization_id, source, name, email, phone, message, payload
  ) values (
    p_organization_id,
    coalesce(nullif(p_source, ''), 'request'),
    nullif(p_payload->>'name', ''),
    nullif(p_payload->>'email', ''),
    nullif(p_payload->>'phone', ''),
    nullif(p_payload->>'message', ''),
    p_payload
  ) returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.submit_public_request(uuid, text, jsonb, text, text) to anon, authenticated;

create or replace function public.queue_automation_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.automation_events (organization_id, entity, event_type, record_id, payload)
  values (
    new.organization_id,
    tg_table_name,
    case
      when tg_table_name = 'public_submissions' and tg_op = 'INSERT' then 'public_request'
      when tg_op = 'INSERT' then 'record_created'
      else 'record_updated'
    end,
    new.id,
    to_jsonb(new)
  );
  if tg_op = 'UPDATE' and (to_jsonb(old)->>'status') is distinct from (to_jsonb(new)->>'status') then
    insert into public.automation_events (organization_id, entity, event_type, record_id, payload)
    values (new.organization_id, tg_table_name, 'status_changed', new.id, to_jsonb(new));
  end if;
  return new;
end;
$$;

create or replace function public.audit_record_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid;
  rid uuid;
begin
  org := coalesce(new.organization_id, old.organization_id);
  rid := coalesce(new.id, old.id);
  insert into public.audit_log (organization_id, table_name, record_id, action, actor_id, old_data, new_data)
  values (org, tg_table_name, rid, tg_op, auth.uid(), case when tg_op <> 'INSERT' then to_jsonb(old) end, case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end;
$$;

insert into public.organizations (id, name, slug, settings)
values (
  '724cadc7-4799-4f21-aa24-008374af0eb2',
  'Borgo Marina',
  'borgo-marina',
  '{"brand":{"name":"Borgo Marina","slug":"borgo-marina","industry":"Ospitalità e servizi","description":"Gestione completa di clienti, prenotazioni, disponibilità delle risorse, preventivi, caparre, documenti, spese e attività operative in un unico ambiente.","email":"direzione@borgomarina.example","phone":"+39 0974 000000","primaryColor":"#e95d2a","accentColor":"#16332d","surfaceColor":"#ffffff","currency":"EUR","locale":"it-IT","logoData":"","style":"signature"},"modules":["crm","tasks","bookings","quotes","payments","expenses","documents","assets","reports","portal","dynamic_pricing","automations","multiuser"],"version":"2.0.0"}'::jsonb
)
on conflict (id) do update set name = excluded.name, slug = excluded.slug, settings = excluded.settings;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.app_settings enable row level security;
alter table public.automation_events enable row level security;
alter table public.automation_log enable row level security;
alter table public.internal_notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.public_submission_limits enable row level security;
alter table public.public_submissions enable row level security;

drop policy if exists "organizations_member_select" on public.organizations;
create policy "organizations_member_select" on public.organizations for select using (public.org_can_read(id));

drop policy if exists "members_member_select" on public.organization_members;
drop policy if exists "members_admin_insert" on public.organization_members;
drop policy if exists "members_admin_update" on public.organization_members;
drop policy if exists "members_admin_delete" on public.organization_members;
create policy "members_member_select" on public.organization_members for select using (user_id = auth.uid() or public.org_can_read(organization_id));
create policy "members_admin_insert" on public.organization_members for insert with check (public.org_can_admin(organization_id));
create policy "members_admin_update" on public.organization_members for update using (public.org_can_admin(organization_id)) with check (public.org_can_admin(organization_id));
create policy "members_admin_delete" on public.organization_members for delete using (public.org_can_admin(organization_id));

drop policy if exists "settings_member_select" on public.app_settings;
drop policy if exists "settings_admin_write" on public.app_settings;
create policy "settings_member_select" on public.app_settings for select using (public.org_can_read(organization_id));
create policy "settings_admin_write" on public.app_settings for all using (public.org_can_admin(organization_id)) with check (public.org_can_admin(organization_id));

drop policy if exists "automation_admin_select" on public.automation_events;
create policy "automation_admin_select" on public.automation_events for select using (public.org_can_admin(organization_id));

drop policy if exists "automation_log_member_select" on public.automation_log;
drop policy if exists "automation_log_admin_write" on public.automation_log;
create policy "automation_log_member_select" on public.automation_log for select using (public.org_can_read(organization_id));
create policy "automation_log_admin_write" on public.automation_log for all using (public.org_can_admin(organization_id)) with check (public.org_can_admin(organization_id));


drop policy if exists "notifications_member_all" on public.internal_notifications;
create policy "notifications_member_all" on public.internal_notifications for all using (public.org_can_read(organization_id)) with check (public.org_can_write(organization_id));

drop policy if exists "audit_admin_select" on public.audit_log;
create policy "audit_admin_select" on public.audit_log for select using (public.org_can_admin(organization_id));

drop policy if exists "submissions_member_select" on public.public_submissions;
drop policy if exists "submissions_member_update" on public.public_submissions;
drop policy if exists "submissions_admin_delete" on public.public_submissions;
create policy "submissions_member_select" on public.public_submissions for select using (public.org_can_read(organization_id));
create policy "submissions_member_update" on public.public_submissions for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "submissions_admin_delete" on public.public_submissions for delete using (public.org_can_admin(organization_id));

drop trigger if exists public_submissions_set_updated_at on public.public_submissions;
create trigger public_submissions_set_updated_at before update on public.public_submissions for each row execute function public.set_updated_at();
drop trigger if exists public_submissions_audit on public.public_submissions;
create trigger public_submissions_audit after insert or update or delete on public.public_submissions for each row execute function public.audit_record_change();
drop trigger if exists public_submissions_queue_automation on public.public_submissions;
create trigger public_submissions_queue_automation after insert or update on public.public_submissions for each row execute function public.queue_automation_event();

drop trigger if exists automation_log_set_updated_at on public.automation_log;
create trigger automation_log_set_updated_at before update on public.automation_log for each row execute function public.set_updated_at();

create index if not exists public_submissions_org_created_idx on public.public_submissions(organization_id, created_at desc);
create index if not exists automation_events_status_idx on public.automation_events(status, created_at);
create index if not exists automation_log_org_created_idx on public.automation_log(organization_id, created_at desc);
create index if not exists audit_log_org_created_idx on public.audit_log(organization_id, created_at desc);
create index if not exists public_submission_limits_idx on public.public_submission_limits(organization_id, client_token, submitted_at desc);


create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  email text,
  phone text,
  tax_code text,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.customers enable row level security;

drop policy if exists "customers_member_select" on public.customers;
drop policy if exists "customers_member_insert" on public.customers;
drop policy if exists "customers_member_update" on public.customers;
drop policy if exists "customers_admin_delete" on public.customers;
create policy "customers_member_select" on public.customers
for select using (public.org_can_read(organization_id));
create policy "customers_member_insert" on public.customers
for insert with check (public.org_can_write(organization_id));
create policy "customers_member_update" on public.customers
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "customers_admin_delete" on public.customers
for delete using (public.org_can_admin(organization_id));

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists customers_audit on public.customers;
create trigger customers_audit
after insert or update or delete on public.customers
for each row execute function public.audit_record_change();

create index if not exists customers_organization_idx on public.customers(organization_id);
create index if not exists customers_created_at_idx on public.customers(created_at desc);


create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  status text,
  priority text,
  due_date date,
  assignee text,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.tasks enable row level security;

drop policy if exists "tasks_member_select" on public.tasks;
drop policy if exists "tasks_member_insert" on public.tasks;
drop policy if exists "tasks_member_update" on public.tasks;
drop policy if exists "tasks_admin_delete" on public.tasks;
create policy "tasks_member_select" on public.tasks
for select using (public.org_can_read(organization_id));
create policy "tasks_member_insert" on public.tasks
for insert with check (public.org_can_write(organization_id));
create policy "tasks_member_update" on public.tasks
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "tasks_admin_delete" on public.tasks
for delete using (public.org_can_admin(organization_id));

drop trigger if exists tasks_set_updated_at on public.tasks;
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

drop trigger if exists tasks_audit on public.tasks;
create trigger tasks_audit
after insert or update or delete on public.tasks
for each row execute function public.audit_record_change();

create index if not exists tasks_organization_idx on public.tasks(organization_id);
create index if not exists tasks_created_at_idx on public.tasks(created_at desc);
create index if not exists tasks_status_idx on public.tasks(organization_id, status);
create index if not exists tasks_due_date_idx on public.tasks(organization_id, due_date);


create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_name text not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  resource_name text,
  people numeric,
  status text,
  total numeric(12,2),
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.bookings enable row level security;

drop policy if exists "bookings_member_select" on public.bookings;
drop policy if exists "bookings_member_insert" on public.bookings;
drop policy if exists "bookings_member_update" on public.bookings;
drop policy if exists "bookings_admin_delete" on public.bookings;
create policy "bookings_member_select" on public.bookings
for select using (public.org_can_read(organization_id));
create policy "bookings_member_insert" on public.bookings
for insert with check (public.org_can_write(organization_id));
create policy "bookings_member_update" on public.bookings
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "bookings_admin_delete" on public.bookings
for delete using (public.org_can_admin(organization_id));

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists bookings_audit on public.bookings;
create trigger bookings_audit
after insert or update or delete on public.bookings
for each row execute function public.audit_record_change();

create index if not exists bookings_organization_idx on public.bookings(organization_id);
create index if not exists bookings_created_at_idx on public.bookings(created_at desc);
create index if not exists bookings_status_idx on public.bookings(organization_id, status);
create index if not exists bookings_start_at_idx on public.bookings(organization_id, start_at);


create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text,
  capacity numeric,
  active boolean default false,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resources enable row level security;

drop policy if exists "resources_member_select" on public.resources;
drop policy if exists "resources_member_insert" on public.resources;
drop policy if exists "resources_member_update" on public.resources;
drop policy if exists "resources_admin_delete" on public.resources;
create policy "resources_member_select" on public.resources
for select using (public.org_can_read(organization_id));
create policy "resources_member_insert" on public.resources
for insert with check (public.org_can_write(organization_id));
create policy "resources_member_update" on public.resources
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "resources_admin_delete" on public.resources
for delete using (public.org_can_admin(organization_id));

drop trigger if exists resources_set_updated_at on public.resources;
create trigger resources_set_updated_at
before update on public.resources
for each row execute function public.set_updated_at();

drop trigger if exists resources_audit on public.resources;
create trigger resources_audit
after insert or update or delete on public.resources
for each row execute function public.audit_record_change();

create index if not exists resources_organization_idx on public.resources(organization_id);
create index if not exists resources_created_at_idx on public.resources(created_at desc);


create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  number text not null,
  customer_name text not null,
  issue_date date,
  valid_until date,
  status text,
  total numeric(12,2),
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quotes enable row level security;

drop policy if exists "quotes_member_select" on public.quotes;
drop policy if exists "quotes_member_insert" on public.quotes;
drop policy if exists "quotes_member_update" on public.quotes;
drop policy if exists "quotes_admin_delete" on public.quotes;
create policy "quotes_member_select" on public.quotes
for select using (public.org_can_read(organization_id));
create policy "quotes_member_insert" on public.quotes
for insert with check (public.org_can_write(organization_id));
create policy "quotes_member_update" on public.quotes
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "quotes_admin_delete" on public.quotes
for delete using (public.org_can_admin(organization_id));

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

drop trigger if exists quotes_audit on public.quotes;
create trigger quotes_audit
after insert or update or delete on public.quotes
for each row execute function public.audit_record_change();

create index if not exists quotes_organization_idx on public.quotes(organization_id);
create index if not exists quotes_created_at_idx on public.quotes(created_at desc);
create index if not exists quotes_status_idx on public.quotes(organization_id, status);
create index if not exists quotes_issue_date_idx on public.quotes(organization_id, issue_date);


create table if not exists public.quote_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  quote_number text not null,
  description text not null,
  quantity numeric not null,
  unit_price numeric(12,2) not null,
  total numeric(12,2),
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quote_items enable row level security;

drop policy if exists "quote_items_member_select" on public.quote_items;
drop policy if exists "quote_items_member_insert" on public.quote_items;
drop policy if exists "quote_items_member_update" on public.quote_items;
drop policy if exists "quote_items_admin_delete" on public.quote_items;
create policy "quote_items_member_select" on public.quote_items
for select using (public.org_can_read(organization_id));
create policy "quote_items_member_insert" on public.quote_items
for insert with check (public.org_can_write(organization_id));
create policy "quote_items_member_update" on public.quote_items
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "quote_items_admin_delete" on public.quote_items
for delete using (public.org_can_admin(organization_id));

drop trigger if exists quote_items_set_updated_at on public.quote_items;
create trigger quote_items_set_updated_at
before update on public.quote_items
for each row execute function public.set_updated_at();

drop trigger if exists quote_items_audit on public.quote_items;
create trigger quote_items_audit
after insert or update or delete on public.quote_items
for each row execute function public.audit_record_change();

create index if not exists quote_items_organization_idx on public.quote_items(organization_id);
create index if not exists quote_items_created_at_idx on public.quote_items(created_at desc);


create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  customer_name text,
  payment_date date,
  amount numeric(12,2) not null,
  method text,
  status text,
  reference text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "payments_member_select" on public.payments;
drop policy if exists "payments_member_insert" on public.payments;
drop policy if exists "payments_member_update" on public.payments;
drop policy if exists "payments_admin_delete" on public.payments;
create policy "payments_member_select" on public.payments
for select using (public.org_can_read(organization_id));
create policy "payments_member_insert" on public.payments
for insert with check (public.org_can_write(organization_id));
create policy "payments_member_update" on public.payments
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "payments_admin_delete" on public.payments
for delete using (public.org_can_admin(organization_id));

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

drop trigger if exists payments_audit on public.payments;
create trigger payments_audit
after insert or update or delete on public.payments
for each row execute function public.audit_record_change();

create index if not exists payments_organization_idx on public.payments(organization_id);
create index if not exists payments_created_at_idx on public.payments(created_at desc);
create index if not exists payments_status_idx on public.payments(organization_id, status);
create index if not exists payments_payment_date_idx on public.payments(organization_id, payment_date);


create table if not exists public.suppliers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.suppliers enable row level security;

drop policy if exists "suppliers_member_select" on public.suppliers;
drop policy if exists "suppliers_member_insert" on public.suppliers;
drop policy if exists "suppliers_member_update" on public.suppliers;
drop policy if exists "suppliers_admin_delete" on public.suppliers;
create policy "suppliers_member_select" on public.suppliers
for select using (public.org_can_read(organization_id));
create policy "suppliers_member_insert" on public.suppliers
for insert with check (public.org_can_write(organization_id));
create policy "suppliers_member_update" on public.suppliers
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "suppliers_admin_delete" on public.suppliers
for delete using (public.org_can_admin(organization_id));

drop trigger if exists suppliers_set_updated_at on public.suppliers;
create trigger suppliers_set_updated_at
before update on public.suppliers
for each row execute function public.set_updated_at();

drop trigger if exists suppliers_audit on public.suppliers;
create trigger suppliers_audit
after insert or update or delete on public.suppliers
for each row execute function public.audit_record_change();

create index if not exists suppliers_organization_idx on public.suppliers(organization_id);
create index if not exists suppliers_created_at_idx on public.suppliers(created_at desc);


create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  description text not null,
  supplier_name text,
  expense_date date,
  category text,
  amount numeric(12,2) not null,
  paid boolean default false,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.expenses enable row level security;

drop policy if exists "expenses_member_select" on public.expenses;
drop policy if exists "expenses_member_insert" on public.expenses;
drop policy if exists "expenses_member_update" on public.expenses;
drop policy if exists "expenses_admin_delete" on public.expenses;
create policy "expenses_member_select" on public.expenses
for select using (public.org_can_read(organization_id));
create policy "expenses_member_insert" on public.expenses
for insert with check (public.org_can_write(organization_id));
create policy "expenses_member_update" on public.expenses
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "expenses_admin_delete" on public.expenses
for delete using (public.org_can_admin(organization_id));

drop trigger if exists expenses_set_updated_at on public.expenses;
create trigger expenses_set_updated_at
before update on public.expenses
for each row execute function public.set_updated_at();

drop trigger if exists expenses_audit on public.expenses;
create trigger expenses_audit
after insert or update or delete on public.expenses
for each row execute function public.audit_record_change();

create index if not exists expenses_organization_idx on public.expenses(organization_id);
create index if not exists expenses_created_at_idx on public.expenses(created_at desc);
create index if not exists expenses_expense_date_idx on public.expenses(organization_id, expense_date);


create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text,
  expiry_date date,
  url text,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.documents enable row level security;

drop policy if exists "documents_member_select" on public.documents;
drop policy if exists "documents_member_insert" on public.documents;
drop policy if exists "documents_member_update" on public.documents;
drop policy if exists "documents_admin_delete" on public.documents;
create policy "documents_member_select" on public.documents
for select using (public.org_can_read(organization_id));
create policy "documents_member_insert" on public.documents
for insert with check (public.org_can_write(organization_id));
create policy "documents_member_update" on public.documents
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "documents_admin_delete" on public.documents
for delete using (public.org_can_admin(organization_id));

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

drop trigger if exists documents_audit on public.documents;
create trigger documents_audit
after insert or update or delete on public.documents
for each row execute function public.audit_record_change();

create index if not exists documents_organization_idx on public.documents(organization_id);
create index if not exists documents_created_at_idx on public.documents(created_at desc);
create index if not exists documents_expiry_date_idx on public.documents(organization_id, expiry_date);


create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text,
  category text,
  purchase_date date,
  status text,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.assets enable row level security;

drop policy if exists "assets_member_select" on public.assets;
drop policy if exists "assets_member_insert" on public.assets;
drop policy if exists "assets_member_update" on public.assets;
drop policy if exists "assets_admin_delete" on public.assets;
create policy "assets_member_select" on public.assets
for select using (public.org_can_read(organization_id));
create policy "assets_member_insert" on public.assets
for insert with check (public.org_can_write(organization_id));
create policy "assets_member_update" on public.assets
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "assets_admin_delete" on public.assets
for delete using (public.org_can_admin(organization_id));

drop trigger if exists assets_set_updated_at on public.assets;
create trigger assets_set_updated_at
before update on public.assets
for each row execute function public.set_updated_at();

drop trigger if exists assets_audit on public.assets;
create trigger assets_audit
after insert or update or delete on public.assets
for each row execute function public.audit_record_change();

create index if not exists assets_organization_idx on public.assets(organization_id);
create index if not exists assets_created_at_idx on public.assets(created_at desc);
create index if not exists assets_status_idx on public.assets(organization_id, status);
create index if not exists assets_purchase_date_idx on public.assets(organization_id, purchase_date);


create table if not exists public.maintenance (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  asset_name text not null,
  maintenance_date date,
  type text,
  status text,
  cost numeric(12,2),
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.maintenance enable row level security;

drop policy if exists "maintenance_member_select" on public.maintenance;
drop policy if exists "maintenance_member_insert" on public.maintenance;
drop policy if exists "maintenance_member_update" on public.maintenance;
drop policy if exists "maintenance_admin_delete" on public.maintenance;
create policy "maintenance_member_select" on public.maintenance
for select using (public.org_can_read(organization_id));
create policy "maintenance_member_insert" on public.maintenance
for insert with check (public.org_can_write(organization_id));
create policy "maintenance_member_update" on public.maintenance
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "maintenance_admin_delete" on public.maintenance
for delete using (public.org_can_admin(organization_id));

drop trigger if exists maintenance_set_updated_at on public.maintenance;
create trigger maintenance_set_updated_at
before update on public.maintenance
for each row execute function public.set_updated_at();

drop trigger if exists maintenance_audit on public.maintenance;
create trigger maintenance_audit
after insert or update or delete on public.maintenance
for each row execute function public.audit_record_change();

create index if not exists maintenance_organization_idx on public.maintenance(organization_id);
create index if not exists maintenance_created_at_idx on public.maintenance(created_at desc);
create index if not exists maintenance_status_idx on public.maintenance(organization_id, status);
create index if not exists maintenance_maintenance_date_idx on public.maintenance(organization_id, maintenance_date);


create table if not exists public.pricing_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  rule_type text,
  value numeric,
  active boolean default false,
  configuration text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pricing_rules enable row level security;

drop policy if exists "pricing_rules_member_select" on public.pricing_rules;
drop policy if exists "pricing_rules_member_insert" on public.pricing_rules;
drop policy if exists "pricing_rules_member_update" on public.pricing_rules;
drop policy if exists "pricing_rules_admin_delete" on public.pricing_rules;
create policy "pricing_rules_member_select" on public.pricing_rules
for select using (public.org_can_read(organization_id));
create policy "pricing_rules_member_insert" on public.pricing_rules
for insert with check (public.org_can_write(organization_id));
create policy "pricing_rules_member_update" on public.pricing_rules
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "pricing_rules_admin_delete" on public.pricing_rules
for delete using (public.org_can_admin(organization_id));

drop trigger if exists pricing_rules_set_updated_at on public.pricing_rules;
create trigger pricing_rules_set_updated_at
before update on public.pricing_rules
for each row execute function public.set_updated_at();

drop trigger if exists pricing_rules_audit on public.pricing_rules;
create trigger pricing_rules_audit
after insert or update or delete on public.pricing_rules
for each row execute function public.audit_record_change();

create index if not exists pricing_rules_organization_idx on public.pricing_rules(organization_id);
create index if not exists pricing_rules_created_at_idx on public.pricing_rules(created_at desc);


create table if not exists public.checkins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  guest_name text not null,
  booking_number text not null,
  arrival_date timestamptz not null,
  document_status text,
  payment_status text,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.checkins enable row level security;

drop policy if exists "checkins_member_select" on public.checkins;
drop policy if exists "checkins_member_insert" on public.checkins;
drop policy if exists "checkins_member_update" on public.checkins;
drop policy if exists "checkins_admin_delete" on public.checkins;
create policy "checkins_member_select" on public.checkins
for select using (public.org_can_read(organization_id));
create policy "checkins_member_insert" on public.checkins
for insert with check (public.org_can_write(organization_id));
create policy "checkins_member_update" on public.checkins
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "checkins_admin_delete" on public.checkins
for delete using (public.org_can_admin(organization_id));

drop trigger if exists checkins_set_updated_at on public.checkins;
create trigger checkins_set_updated_at
before update on public.checkins
for each row execute function public.set_updated_at();

drop trigger if exists checkins_audit on public.checkins;
create trigger checkins_audit
after insert or update or delete on public.checkins
for each row execute function public.audit_record_change();

create index if not exists checkins_organization_idx on public.checkins(organization_id);
create index if not exists checkins_created_at_idx on public.checkins(created_at desc);
create index if not exists checkins_arrival_date_idx on public.checkins(organization_id, arrival_date);


create table if not exists public.daily_cash (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  movement_date date not null,
  description text not null,
  category text,
  amount numeric(12,2) not null,
  method text,
  notes text,
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.daily_cash enable row level security;

drop policy if exists "daily_cash_member_select" on public.daily_cash;
drop policy if exists "daily_cash_member_insert" on public.daily_cash;
drop policy if exists "daily_cash_member_update" on public.daily_cash;
drop policy if exists "daily_cash_admin_delete" on public.daily_cash;
create policy "daily_cash_member_select" on public.daily_cash
for select using (public.org_can_read(organization_id));
create policy "daily_cash_member_insert" on public.daily_cash
for insert with check (public.org_can_write(organization_id));
create policy "daily_cash_member_update" on public.daily_cash
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "daily_cash_admin_delete" on public.daily_cash
for delete using (public.org_can_admin(organization_id));

drop trigger if exists daily_cash_set_updated_at on public.daily_cash;
create trigger daily_cash_set_updated_at
before update on public.daily_cash
for each row execute function public.set_updated_at();

drop trigger if exists daily_cash_audit on public.daily_cash;
create trigger daily_cash_audit
after insert or update or delete on public.daily_cash
for each row execute function public.audit_record_change();

create index if not exists daily_cash_organization_idx on public.daily_cash(organization_id);
create index if not exists daily_cash_created_at_idx on public.daily_cash(created_at desc);
create index if not exists daily_cash_movement_date_idx on public.daily_cash(organization_id, movement_date);


drop trigger if exists customers_queue_automation on public.customers;
create trigger customers_queue_automation
after insert or update on public.customers
for each row execute function public.queue_automation_event();

drop trigger if exists tasks_queue_automation on public.tasks;
create trigger tasks_queue_automation
after insert or update on public.tasks
for each row execute function public.queue_automation_event();

drop trigger if exists bookings_queue_automation on public.bookings;
create trigger bookings_queue_automation
after insert or update on public.bookings
for each row execute function public.queue_automation_event();

drop trigger if exists resources_queue_automation on public.resources;
create trigger resources_queue_automation
after insert or update on public.resources
for each row execute function public.queue_automation_event();

drop trigger if exists quotes_queue_automation on public.quotes;
create trigger quotes_queue_automation
after insert or update on public.quotes
for each row execute function public.queue_automation_event();

drop trigger if exists quote_items_queue_automation on public.quote_items;
create trigger quote_items_queue_automation
after insert or update on public.quote_items
for each row execute function public.queue_automation_event();

drop trigger if exists payments_queue_automation on public.payments;
create trigger payments_queue_automation
after insert or update on public.payments
for each row execute function public.queue_automation_event();

drop trigger if exists suppliers_queue_automation on public.suppliers;
create trigger suppliers_queue_automation
after insert or update on public.suppliers
for each row execute function public.queue_automation_event();

drop trigger if exists expenses_queue_automation on public.expenses;
create trigger expenses_queue_automation
after insert or update on public.expenses
for each row execute function public.queue_automation_event();

drop trigger if exists documents_queue_automation on public.documents;
create trigger documents_queue_automation
after insert or update on public.documents
for each row execute function public.queue_automation_event();

drop trigger if exists assets_queue_automation on public.assets;
create trigger assets_queue_automation
after insert or update on public.assets
for each row execute function public.queue_automation_event();

drop trigger if exists maintenance_queue_automation on public.maintenance;
create trigger maintenance_queue_automation
after insert or update on public.maintenance
for each row execute function public.queue_automation_event();

drop trigger if exists pricing_rules_queue_automation on public.pricing_rules;
create trigger pricing_rules_queue_automation
after insert or update on public.pricing_rules
for each row execute function public.queue_automation_event();

drop trigger if exists checkins_queue_automation on public.checkins;
create trigger checkins_queue_automation
after insert or update on public.checkins
for each row execute function public.queue_automation_event();

drop trigger if exists daily_cash_queue_automation on public.daily_cash;
create trigger daily_cash_queue_automation
after insert or update on public.daily_cash
for each row execute function public.queue_automation_event();

alter table public.bookings drop constraint if exists bookings_valid_range;
alter table public.bookings add constraint bookings_valid_range check (end_at > start_at);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_no_overlap') then
    alter table public.bookings add constraint bookings_no_overlap
    exclude using gist (
      organization_id with =,
      resource_name with =,
      tstzrange(start_at, end_at, '[)') with &&
    ) where (resource_name is not null and coalesce(status, '') not ilike '%annull%');
  end if;
end $$;

insert into public.app_settings (organization_id, key, value)
values ('724cadc7-4799-4f21-aa24-008374af0eb2', 'pricing', '{"enabled":true,"basePrice":35,"unit":"notte","taxPerPerson":1.8,"depositPercent":30,"rules":[{"type":"date_range","name":"Alta stagione","from":"2026-08-01","to":"2026-08-31","multiplier":1.35},{"type":"weekday_multiplier","name":"Weekend","days":[5,6],"multiplier":1.12},{"type":"duration_discount","name":"Settimana","min":7,"percent":8},{"type":"promo","name":"Promo ritorno","code":"TORNA10","percent":10}],"extras":[{"id":"late","name":"Check-in serale","price":15,"required":false},{"id":"pet","name":"Animale","price":8,"required":false}]}'::jsonb)
on conflict (organization_id, key) do update set value = excluded.value, updated_at = now();


insert into storage.buckets (id, name, public)
values ('easycome-documents', 'easycome-documents', false)
on conflict (id) do nothing;

drop policy if exists "easycome_documents_member_select" on storage.objects;
drop policy if exists "easycome_documents_member_insert" on storage.objects;
drop policy if exists "easycome_documents_member_update" on storage.objects;
drop policy if exists "easycome_documents_admin_delete" on storage.objects;
create policy "easycome_documents_member_select" on storage.objects for select
using (bucket_id = 'easycome-documents' and public.org_can_read((storage.foldername(name))[1]::uuid));
create policy "easycome_documents_member_insert" on storage.objects for insert
with check (bucket_id = 'easycome-documents' and public.org_can_write((storage.foldername(name))[1]::uuid));
create policy "easycome_documents_member_update" on storage.objects for update
using (bucket_id = 'easycome-documents' and public.org_can_write((storage.foldername(name))[1]::uuid));
create policy "easycome_documents_admin_delete" on storage.objects for delete
using (bucket_id = 'easycome-documents' and public.org_can_admin((storage.foldername(name))[1]::uuid));

-- Primo accesso sicuro:
-- 1) registrati con direzione@borgomarina.example;
-- 2) l'app chiama claim_owner_by_email e assegna il ruolo owner solo a quell'indirizzo;
-- 3) gli altri utenti vengono aggiunti dal titolare in organization_members.
