-- Esegui questo file se hai già installato lo schema V7.
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
