-- Easy Come V9 · Demo Factory
-- Esegui questo file una sola volta nel SQL Editor del progetto Supabase Easy Come.
create extension if not exists pgcrypto;

create table if not exists public.easycome_demo_campaigns (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'google_places',
  requested_count integer not null default 100,
  generated_count integer not null default 0,
  queries_run integer not null default 0,
  status text not null default 'running' check (status in ('running','completed','partial','failed')),
  error_message text,
  created_at timestamptz not null default now(),
  finished_at timestamptz
);

create table if not exists public.easycome_demo_targets (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.easycome_demo_campaigns(id) on delete cascade,
  place_id text not null unique,
  demo_slug text not null unique,
  template_id text not null default 'custom',
  demo_config jsonb not null default '{}'::jsonb,
  status text not null default 'generated' check (status in ('generated','contacted','opened','clicked','won','lost','archived')),
  expires_at timestamptz not null default (now() + interval '7 days'),
  view_count integer not null default 0,
  cta_click_count integer not null default 0,
  contact_copy_count integer not null default 0,
  last_viewed_at timestamptz,
  last_cta_at timestamptz,
  contacted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists easycome_demo_targets_campaign_idx on public.easycome_demo_targets(campaign_id);
create index if not exists easycome_demo_targets_created_idx on public.easycome_demo_targets(created_at desc);
create index if not exists easycome_demo_targets_slug_idx on public.easycome_demo_targets(demo_slug);

alter table public.easycome_demo_campaigns enable row level security;
alter table public.easycome_demo_targets enable row level security;
-- Nessuna policy pubblica: le API Vercel accedono tramite SUPABASE_SERVICE_ROLE_KEY.
