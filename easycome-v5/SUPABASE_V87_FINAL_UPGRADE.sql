-- ============================================================
-- EASY COME V8.7 — FINAL LAUNCH UPGRADE
-- Cumulative upgrade: Control Room + notifications + legal + security.
-- Safe to re-run. Run in Supabase > SQL Editor.
-- ============================================================

begin;

create extension if not exists pgcrypto;

-- Core admin registry / helper. Kept here so this cumulative launch upgrade
-- also repairs installations where the earliest setup was only partially run.
create table if not exists public.easycome_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_easycome_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.easycome_admins
    where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_easycome_admin() from public;
grant execute on function public.is_easycome_admin() to authenticated;

-- ------------------------------------------------------------
-- Compatibility / columns used by V8.x
-- ------------------------------------------------------------
alter table public.easycome_profiles add column if not exists email text;

update public.easycome_profiles p
set email = u.email
from auth.users u
where p.user_id = u.id and (p.email is null or p.email = '');

alter table public.easycome_orders add column if not exists purchase_type text not null default 'one_time';
alter table public.easycome_orders add column if not exists managed_service_selected boolean not null default false;
alter table public.easycome_orders add column if not exists stripe_subscription_id text;
alter table public.easycome_orders add column if not exists legal_acceptance jsonb not null default '{}'::jsonb;

-- Keep support kinds aligned with the application.
alter table public.easycome_support_requests drop constraint if exists easycome_support_requests_kind_check;
alter table public.easycome_support_requests
  add constraint easycome_support_requests_kind_check
  check (kind in (
    'bug','support','feature','implementation','training','billing',
    'consultation','custom_solution','managed_service','privacy','withdrawal'
  ));

create or replace function public.handle_easycome_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.easycome_profiles(user_id, full_name, company_name, email)
  values(new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'company_name', new.email)
  on conflict(user_id) do update set
    full_name=excluded.full_name,
    company_name=excluded.company_name,
    email=excluded.email,
    updated_at=now();
  return new;
end;
$$;

drop trigger if exists on_easycome_auth_user_created on auth.users;
create trigger on_easycome_auth_user_created
after insert or update of raw_user_meta_data, email on auth.users
for each row execute function public.handle_easycome_user();

-- ------------------------------------------------------------
-- Managed subscriptions (creates it too if V8 upgrade was skipped)
-- ------------------------------------------------------------
create table if not exists public.easycome_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_id uuid references public.easycome_orders(id) on delete set null,
  plan_code text not null default 'managed_tech_30',
  plan_name text not null default 'Gestione tecnica Easy Come',
  amount_cents integer not null default 3000,
  currency text not null default 'eur',
  status text not null default 'incomplete',
  stripe_customer_id text,
  stripe_subscription_id text unique,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists easycome_subscriptions_user_idx on public.easycome_subscriptions(user_id, created_at desc);
create index if not exists easycome_subscriptions_status_idx on public.easycome_subscriptions(status, updated_at desc);

-- ------------------------------------------------------------
-- Real support conversations (creates it too if V8.4 was skipped)
-- ------------------------------------------------------------
create table if not exists public.easycome_support_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.easycome_support_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('client','admin','system')),
  body text not null check (char_length(body) between 1 and 12000),
  read_by_client boolean not null default false,
  read_by_admin boolean not null default false,
  message_key text unique,
  created_at timestamptz not null default now()
);
create index if not exists easycome_support_messages_request_idx on public.easycome_support_messages(request_id, created_at asc);
create index if not exists easycome_support_messages_unread_admin_idx on public.easycome_support_messages(read_by_admin, created_at desc);
create index if not exists easycome_support_messages_unread_client_idx on public.easycome_support_messages(read_by_client, created_at desc);

insert into public.easycome_support_messages(request_id,user_id,sender_role,body,read_by_client,read_by_admin,message_key,created_at)
select r.id,r.user_id,'client',r.description,true,false,'legacy-client:'||r.id::text,r.created_at
from public.easycome_support_requests r
where coalesce(trim(r.description),'')<>''
on conflict(message_key) do nothing;

insert into public.easycome_support_messages(request_id,user_id,sender_role,body,read_by_client,read_by_admin,message_key,created_at)
select r.id,null,'admin',r.admin_reply,false,true,'legacy-admin:'||r.id::text,coalesce(r.updated_at,r.created_at)
from public.easycome_support_requests r
where coalesce(trim(r.admin_reply),'')<>''
on conflict(message_key) do nothing;

-- ------------------------------------------------------------
-- Private CRM + internal agenda (creates them too if V8.4 was skipped)
-- ------------------------------------------------------------
create table if not exists public.easycome_customer_admin (
  user_id uuid primary key references auth.users(id) on delete cascade,
  lifecycle text not null default 'lead' check (lifecycle in ('lead','active','managed','at_risk','vip','archived')),
  tags text[] not null default '{}',
  admin_notes text,
  assigned_to text,
  follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.easycome_admin_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  request_id uuid references public.easycome_support_requests(id) on delete set null,
  title text not null,
  notes text,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'todo' check (status in ('todo','doing','done')),
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists easycome_admin_tasks_status_idx on public.easycome_admin_tasks(status,due_at);

-- ------------------------------------------------------------
-- Admin notification center
-- ------------------------------------------------------------
create table if not exists public.easycome_admin_notifications (
  id uuid primary key default gen_random_uuid(),
  event_key text unique,
  event_type text not null,
  severity text not null default 'normal' check (severity in ('info','normal','high','urgent')),
  title text not null,
  body text,
  user_id uuid references auth.users(id) on delete set null,
  request_id uuid references public.easycome_support_requests(id) on delete set null,
  order_id uuid references public.easycome_orders(id) on delete set null,
  subscription_id uuid references public.easycome_subscriptions(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists easycome_admin_notifications_unread_idx
  on public.easycome_admin_notifications(read_at, created_at desc);
create index if not exists easycome_admin_notifications_type_idx
  on public.easycome_admin_notifications(event_type, created_at desc);

-- ------------------------------------------------------------
-- Online withdrawal requests
-- Public page writes only through a server-side API using service role.
-- ------------------------------------------------------------
create table if not exists public.easycome_withdrawals (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  order_id uuid references public.easycome_orders(id) on delete set null,
  order_ref text,
  customer_name text not null,
  customer_email text not null,
  contract_type text not null check (contract_type in ('software','implementation','managed','other')),
  notes text,
  status text not null default 'received'
    check (status in ('received','reviewing','accepted','rejected','refunded','closed')),
  submitted_at timestamptz not null default now(),
  acknowledged_at timestamptz,
  acknowledgement_channel text,
  metadata jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create index if not exists easycome_withdrawals_status_idx
  on public.easycome_withdrawals(status, submitted_at desc);
create index if not exists easycome_withdrawals_email_idx
  on public.easycome_withdrawals(customer_email, submitted_at desc);

-- ------------------------------------------------------------
-- RLS hardening / tenant isolation
-- ------------------------------------------------------------
alter table public.easycome_admins enable row level security;
alter table public.easycome_profiles enable row level security;
alter table public.easycome_projects enable row level security;
alter table public.easycome_orders enable row level security;
alter table public.easycome_support_requests enable row level security;
alter table public.easycome_support_messages enable row level security;
alter table public.easycome_subscriptions enable row level security;
alter table public.easycome_customer_admin enable row level security;
alter table public.easycome_admin_tasks enable row level security;
alter table public.easycome_admin_notifications enable row level security;
alter table public.easycome_withdrawals enable row level security;

-- Admin registry is only readable by the matching admin account.
drop policy if exists "admins_read_self" on public.easycome_admins;
create policy "admins_read_self" on public.easycome_admins
for select to authenticated using (user_id=(select auth.uid()));

-- Users see only their own profiles/projects.
drop policy if exists "profiles_own" on public.easycome_profiles;
create policy "profiles_own" on public.easycome_profiles
for all to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

drop policy if exists "profiles_admin_read" on public.easycome_profiles;
create policy "profiles_admin_read" on public.easycome_profiles
for select to authenticated using (public.is_easycome_admin());

drop policy if exists "projects_own" on public.easycome_projects;
create policy "projects_own" on public.easycome_projects
for all to authenticated
using (user_id=(select auth.uid()))
with check (user_id=(select auth.uid()));

drop policy if exists "projects_admin_read" on public.easycome_projects;
create policy "projects_admin_read" on public.easycome_projects
for select to authenticated using (public.is_easycome_admin());

-- Orders and subscriptions are readable only by owner/admin.
drop policy if exists "orders_own_or_admin" on public.easycome_orders;
create policy "orders_own_or_admin" on public.easycome_orders
for select to authenticated
using (user_id=(select auth.uid()) or public.is_easycome_admin());

drop policy if exists "subscriptions_own_or_admin" on public.easycome_subscriptions;
create policy "subscriptions_own_or_admin" on public.easycome_subscriptions
for select to authenticated
using (user_id=(select auth.uid()) or public.is_easycome_admin());

-- Requests: own read/insert; only admin can update.
drop policy if exists "support_own_select" on public.easycome_support_requests;
create policy "support_own_select" on public.easycome_support_requests
for select to authenticated
using (user_id=(select auth.uid()) or public.is_easycome_admin());

drop policy if exists "support_own_insert" on public.easycome_support_requests;
create policy "support_own_insert" on public.easycome_support_requests
for insert to authenticated
with check (user_id=(select auth.uid()));

drop policy if exists "support_admin_update" on public.easycome_support_requests;
create policy "support_admin_update" on public.easycome_support_requests
for update to authenticated
using (public.is_easycome_admin())
with check (public.is_easycome_admin());

drop policy if exists "support_messages_read" on public.easycome_support_messages;
create policy "support_messages_read" on public.easycome_support_messages
for select to authenticated using (
  public.is_easycome_admin()
  or exists (
    select 1 from public.easycome_support_requests r
    where r.id=request_id and r.user_id=(select auth.uid())
  )
);

drop policy if exists "support_messages_client_insert" on public.easycome_support_messages;
create policy "support_messages_client_insert" on public.easycome_support_messages
for insert to authenticated with check (
  sender_role='client'
  and user_id=(select auth.uid())
  and exists (
    select 1 from public.easycome_support_requests r
    where r.id=request_id and r.user_id=(select auth.uid())
  )
);

drop policy if exists "support_messages_admin_insert" on public.easycome_support_messages;
create policy "support_messages_admin_insert" on public.easycome_support_messages
for insert to authenticated with check (
  sender_role='admin' and public.is_easycome_admin()
);

drop policy if exists "support_messages_admin_update" on public.easycome_support_messages;
create policy "support_messages_admin_update" on public.easycome_support_messages
for update to authenticated
using (public.is_easycome_admin())
with check (public.is_easycome_admin());

drop policy if exists "customer_admin_admin_all" on public.easycome_customer_admin;
create policy "customer_admin_admin_all" on public.easycome_customer_admin
for all to authenticated
using (public.is_easycome_admin())
with check (public.is_easycome_admin());

drop policy if exists "admin_tasks_admin_all" on public.easycome_admin_tasks;
create policy "admin_tasks_admin_all" on public.easycome_admin_tasks
for all to authenticated
using (public.is_easycome_admin())
with check (public.is_easycome_admin());

drop policy if exists "admin_notifications_admin_all" on public.easycome_admin_notifications;
create policy "admin_notifications_admin_all" on public.easycome_admin_notifications
for all to authenticated
using (public.is_easycome_admin())
with check (public.is_easycome_admin());

drop policy if exists "withdrawals_admin_all" on public.easycome_withdrawals;
create policy "withdrawals_admin_all" on public.easycome_withdrawals
for all to authenticated
using (public.is_easycome_admin())
with check (public.is_easycome_admin());

-- Explicit privileges. RLS still decides which rows are visible.
grant usage on schema public to authenticated;
grant select on public.easycome_admins to authenticated;
grant select,insert,update,delete on public.easycome_profiles to authenticated;
grant select,insert,update,delete on public.easycome_projects to authenticated;
grant select on public.easycome_orders to authenticated;
grant select,insert,update on public.easycome_support_requests to authenticated;
grant select,insert,update on public.easycome_support_messages to authenticated;
grant select on public.easycome_subscriptions to authenticated;
grant select,insert,update,delete on public.easycome_customer_admin to authenticated;
grant select,insert,update,delete on public.easycome_admin_tasks to authenticated;
grant select,insert,update,delete on public.easycome_admin_notifications to authenticated;
grant select,update on public.easycome_withdrawals to authenticated;

-- Anonymous browsers must not access business data directly.
revoke all on public.easycome_admins from anon;
revoke all on public.easycome_profiles from anon;
revoke all on public.easycome_projects from anon;
revoke all on public.easycome_orders from anon;
revoke all on public.easycome_support_requests from anon;
revoke all on public.easycome_support_messages from anon;
revoke all on public.easycome_subscriptions from anon;
revoke all on public.easycome_customer_admin from anon;
revoke all on public.easycome_admin_tasks from anon;
revoke all on public.easycome_admin_notifications from anon;
revoke all on public.easycome_withdrawals from anon;

-- Useful indexes.
create index if not exists easycome_support_updated_idx on public.easycome_support_requests(updated_at desc);
create index if not exists easycome_support_status_priority_idx on public.easycome_support_requests(status,priority,updated_at desc);

commit;

-- Final visibility check: all listed tables should have rls_enabled = true.
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public'
and c.relname in (
  'easycome_admins','easycome_profiles','easycome_projects','easycome_orders',
  'easycome_support_requests','easycome_support_messages',
  'easycome_subscriptions','easycome_customer_admin','easycome_admin_tasks',
  'easycome_admin_notifications','easycome_withdrawals'
)
order by c.relname;
