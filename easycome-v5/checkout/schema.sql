create extension if not exists pgcrypto;

create table if not exists public.easycome_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.easycome_orders (
  id uuid primary key default gen_random_uuid(),
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists easycome_orders_created_idx on public.easycome_orders(created_at desc);
create index if not exists easycome_orders_status_idx on public.easycome_orders(status, created_at desc);
create index if not exists easycome_orders_email_idx on public.easycome_orders(customer_email);

alter table public.easycome_admins enable row level security;
alter table public.easycome_orders enable row level security;

create or replace function public.is_easycome_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.easycome_admins where user_id = auth.uid());
$$;

revoke all on function public.is_easycome_admin() from public;
grant execute on function public.is_easycome_admin() to authenticated;

create policy "admins_read_self" on public.easycome_admins
for select to authenticated using (user_id = auth.uid());

create policy "admins_read_orders" on public.easycome_orders
for select to authenticated using (public.is_easycome_admin());

-- Esegui questa riga dopo aver creato il tuo utente Supabase Auth:
-- insert into public.easycome_admins(user_id)
-- select id from auth.users where email = 'LA-TUA-EMAIL' on conflict do nothing;
