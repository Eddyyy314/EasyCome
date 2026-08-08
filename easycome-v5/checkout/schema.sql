create extension if not exists pgcrypto;

create table if not exists public.easycome_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.easycome_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.easycome_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null default 'Nuovo progetto',
  project jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.easycome_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'checkout_created' check (status in ('checkout_created','processing','paid','payment_failed','expired','cancelled','refunded')),
  customer_email text not null,
  customer_name text not null,
  customer_phone text,
  tax_id text,
  company_name text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'eur',
  price_breakdown jsonb not null default '{}'::jsonb,
  project jsonb not null default '{}'::jsonb,
  prepared_filename text,
  source_url text,
  stripe_session_id text unique,
  stripe_customer_id text,
  stripe_payment_intent_id text,
  checkout_url text,
  payment_status text,
  paid_at timestamptz,
  delivery_status text not null default 'not_ready',
  download_count integer not null default 0,
  last_downloaded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.easycome_orders add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.easycome_orders add column if not exists delivery_status text not null default 'not_ready';
alter table public.easycome_orders add column if not exists download_count integer not null default 0;
alter table public.easycome_orders add column if not exists last_downloaded_at timestamptz;

create table if not exists public.easycome_support_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid,
  company_name text,
  customer_email text,
  kind text not null check (kind in ('bug','support','feature','implementation','training','billing')),
  subject text not null,
  description text not null,
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  status text not null default 'received' check (status in ('received','reviewing','planned','answered','closed')),
  metadata jsonb not null default '{}'::jsonb,
  admin_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists easycome_orders_created_idx on public.easycome_orders(created_at desc);
create index if not exists easycome_orders_status_idx on public.easycome_orders(status, created_at desc);
create index if not exists easycome_orders_email_idx on public.easycome_orders(customer_email);
create index if not exists easycome_orders_user_idx on public.easycome_orders(user_id, created_at desc);
create index if not exists easycome_orders_delivery_idx on public.easycome_orders(delivery_status, created_at desc);
create index if not exists easycome_support_user_idx on public.easycome_support_requests(user_id, created_at desc);

alter table public.easycome_admins enable row level security;
alter table public.easycome_profiles enable row level security;
alter table public.easycome_projects enable row level security;
alter table public.easycome_orders enable row level security;
alter table public.easycome_support_requests enable row level security;

create or replace function public.is_easycome_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.easycome_admins where user_id = auth.uid());
$$;
revoke all on function public.is_easycome_admin() from public;
grant execute on function public.is_easycome_admin() to authenticated;

create or replace function public.handle_easycome_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.easycome_profiles(user_id, full_name, company_name)
  values(new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'company_name')
  on conflict(user_id) do update set
    full_name=excluded.full_name,
    company_name=excluded.company_name,
    updated_at=now();
  return new;
end;
$$;
drop trigger if exists on_easycome_auth_user_created on auth.users;
create trigger on_easycome_auth_user_created
after insert or update of raw_user_meta_data on auth.users
for each row execute function public.handle_easycome_user();

-- Policies are recreated to make this script repeatable.
drop policy if exists "admins_read_self" on public.easycome_admins;
create policy "admins_read_self" on public.easycome_admins for select to authenticated using (user_id=auth.uid());

drop policy if exists "profiles_own" on public.easycome_profiles;
create policy "profiles_own" on public.easycome_profiles for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "projects_own" on public.easycome_projects;
create policy "projects_own" on public.easycome_projects for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());

drop policy if exists "orders_own_or_admin" on public.easycome_orders;
create policy "orders_own_or_admin" on public.easycome_orders for select to authenticated using (user_id=auth.uid() or public.is_easycome_admin());

drop policy if exists "admins_read_orders" on public.easycome_orders;
create policy "admins_read_orders" on public.easycome_orders for select to authenticated using (public.is_easycome_admin());

drop policy if exists "support_own_select" on public.easycome_support_requests;
create policy "support_own_select" on public.easycome_support_requests for select to authenticated using (user_id=auth.uid() or public.is_easycome_admin());

drop policy if exists "support_own_insert" on public.easycome_support_requests;
create policy "support_own_insert" on public.easycome_support_requests for insert to authenticated with check (user_id=auth.uid());

drop policy if exists "support_admin_update" on public.easycome_support_requests;
create policy "support_admin_update" on public.easycome_support_requests for update to authenticated using (public.is_easycome_admin()) with check (public.is_easycome_admin());

-- Dopo avere creato il tuo account, rendilo amministratore Easy Come:
-- insert into public.easycome_admins(user_id)
-- select id from auth.users where email='LA-TUA-EMAIL' on conflict do nothing;

-- Easy Come V8: profilo, incontri e gestione tecnica mensile.
alter table public.easycome_orders add column if not exists purchase_type text not null default 'one_time';
alter table public.easycome_orders add column if not exists managed_service_selected boolean not null default false;
alter table public.easycome_orders add column if not exists stripe_subscription_id text;

alter table public.easycome_support_requests drop constraint if exists easycome_support_requests_kind_check;
alter table public.easycome_support_requests
  add constraint easycome_support_requests_kind_check
  check (kind in ('bug','support','feature','implementation','training','billing','consultation','custom_solution','managed_service'));

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
alter table public.easycome_subscriptions enable row level security;

drop policy if exists "subscriptions_own_or_admin" on public.easycome_subscriptions;
create policy "subscriptions_own_or_admin" on public.easycome_subscriptions
for select to authenticated
using (user_id=auth.uid() or public.is_easycome_admin());

-- Easy Come V8.4 — Control Room amministratore e conversazioni.
alter table public.easycome_profiles add column if not exists email text;
update public.easycome_profiles p set email=u.email from auth.users u where p.user_id=u.id and (p.email is null or p.email='');
create or replace function public.handle_easycome_user()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.easycome_profiles(user_id,full_name,company_name,email)
  values(new.id,new.raw_user_meta_data->>'full_name',new.raw_user_meta_data->>'company_name',new.email)
  on conflict(user_id) do update set full_name=excluded.full_name,company_name=excluded.company_name,email=excluded.email,updated_at=now();
  return new;
end;$$;
drop policy if exists "profiles_admin_read" on public.easycome_profiles;
create policy "profiles_admin_read" on public.easycome_profiles for select to authenticated using (public.is_easycome_admin());
drop policy if exists "projects_admin_read" on public.easycome_projects;
create policy "projects_admin_read" on public.easycome_projects for select to authenticated using (public.is_easycome_admin());
create table if not exists public.easycome_support_messages (
  id uuid primary key default gen_random_uuid(),request_id uuid not null references public.easycome_support_requests(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,sender_role text not null check(sender_role in('client','admin','system')),
  body text not null check(char_length(body) between 1 and 12000),read_by_client boolean not null default false,read_by_admin boolean not null default false,
  message_key text unique,created_at timestamptz not null default now());
create index if not exists easycome_support_messages_request_idx on public.easycome_support_messages(request_id,created_at asc);
create index if not exists easycome_support_messages_unread_admin_idx on public.easycome_support_messages(read_by_admin,created_at desc);
create index if not exists easycome_support_messages_unread_client_idx on public.easycome_support_messages(read_by_client,created_at desc);
alter table public.easycome_support_messages enable row level security;
drop policy if exists "support_messages_read" on public.easycome_support_messages;
create policy "support_messages_read" on public.easycome_support_messages for select to authenticated using(public.is_easycome_admin() or exists(select 1 from public.easycome_support_requests r where r.id=request_id and r.user_id=auth.uid()));
drop policy if exists "support_messages_client_insert" on public.easycome_support_messages;
create policy "support_messages_client_insert" on public.easycome_support_messages for insert to authenticated with check(sender_role='client' and user_id=auth.uid() and exists(select 1 from public.easycome_support_requests r where r.id=request_id and r.user_id=auth.uid()));
drop policy if exists "support_messages_admin_insert" on public.easycome_support_messages;
create policy "support_messages_admin_insert" on public.easycome_support_messages for insert to authenticated with check(sender_role='admin' and public.is_easycome_admin());
drop policy if exists "support_messages_admin_update" on public.easycome_support_messages;
create policy "support_messages_admin_update" on public.easycome_support_messages for update to authenticated using(public.is_easycome_admin()) with check(public.is_easycome_admin());
insert into public.easycome_support_messages(request_id,user_id,sender_role,body,read_by_client,read_by_admin,message_key,created_at)
select r.id,r.user_id,'client',r.description,true,false,'legacy-client:'||r.id::text,r.created_at from public.easycome_support_requests r where coalesce(trim(r.description),'')<>'' on conflict(message_key) do nothing;
insert into public.easycome_support_messages(request_id,user_id,sender_role,body,read_by_client,read_by_admin,message_key,created_at)
select r.id,null,'admin',r.admin_reply,false,true,'legacy-admin:'||r.id::text,coalesce(r.updated_at,r.created_at) from public.easycome_support_requests r where coalesce(trim(r.admin_reply),'')<>'' on conflict(message_key) do nothing;
create table if not exists public.easycome_customer_admin(user_id uuid primary key references auth.users(id) on delete cascade,lifecycle text not null default 'lead' check(lifecycle in('lead','active','managed','at_risk','vip','archived')),tags text[] not null default '{}',admin_notes text,assigned_to text,follow_up_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
alter table public.easycome_customer_admin enable row level security;
drop policy if exists "customer_admin_admin_all" on public.easycome_customer_admin;
create policy "customer_admin_admin_all" on public.easycome_customer_admin for all to authenticated using(public.is_easycome_admin()) with check(public.is_easycome_admin());
create table if not exists public.easycome_admin_tasks(id uuid primary key default gen_random_uuid(),user_id uuid references auth.users(id) on delete set null,request_id uuid references public.easycome_support_requests(id) on delete set null,title text not null,notes text,priority text not null default 'normal' check(priority in('low','normal','high','urgent')),status text not null default 'todo' check(status in('todo','doing','done')),due_at timestamptz,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create index if not exists easycome_admin_tasks_status_idx on public.easycome_admin_tasks(status,due_at);
alter table public.easycome_admin_tasks enable row level security;
drop policy if exists "admin_tasks_admin_all" on public.easycome_admin_tasks;
create policy "admin_tasks_admin_all" on public.easycome_admin_tasks for all to authenticated using(public.is_easycome_admin()) with check(public.is_easycome_admin());
create index if not exists easycome_support_updated_idx on public.easycome_support_requests(updated_at desc);
create index if not exists easycome_support_status_priority_idx on public.easycome_support_requests(status,priority,updated_at desc);
