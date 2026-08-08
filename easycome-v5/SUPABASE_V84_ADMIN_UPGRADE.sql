-- Easy Come V8.4 — Control Room amministratore e conversazioni.
-- Esegui UNA VOLTA se hai già installato V8/V8.3.

-- Email nel profilo per una vera rubrica clienti amministrativa.
alter table public.easycome_profiles add column if not exists email text;
update public.easycome_profiles p
set email = u.email
from auth.users u
where p.user_id = u.id and (p.email is null or p.email = '');

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

-- L'amministratore può leggere profili e progetti, senza dare al cliente privilegi extra.
drop policy if exists "profiles_admin_read" on public.easycome_profiles;
create policy "profiles_admin_read" on public.easycome_profiles
for select to authenticated using (public.is_easycome_admin());

drop policy if exists "projects_admin_read" on public.easycome_projects;
create policy "projects_admin_read" on public.easycome_projects
for select to authenticated using (public.is_easycome_admin());

-- Messaggi veri dentro ogni richiesta: cliente <-> Easy Come.
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
alter table public.easycome_support_messages enable row level security;

drop policy if exists "support_messages_read" on public.easycome_support_messages;
create policy "support_messages_read" on public.easycome_support_messages
for select to authenticated using (
  public.is_easycome_admin()
  or exists (
    select 1 from public.easycome_support_requests r
    where r.id=request_id and r.user_id=auth.uid()
  )
);

drop policy if exists "support_messages_client_insert" on public.easycome_support_messages;
create policy "support_messages_client_insert" on public.easycome_support_messages
for insert to authenticated with check (
  sender_role='client' and user_id=auth.uid()
  and exists (
    select 1 from public.easycome_support_requests r
    where r.id=request_id and r.user_id=auth.uid()
  )
);

drop policy if exists "support_messages_admin_insert" on public.easycome_support_messages;
create policy "support_messages_admin_insert" on public.easycome_support_messages
for insert to authenticated with check (
  sender_role='admin' and public.is_easycome_admin()
);

drop policy if exists "support_messages_admin_update" on public.easycome_support_messages;
create policy "support_messages_admin_update" on public.easycome_support_messages
for update to authenticated using (public.is_easycome_admin()) with check (public.is_easycome_admin());


-- Trasforma le vecchie richieste/risposte in messaggi, senza duplicarle se rilanci lo script.
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

-- Scheda CRM privata del cliente, visibile solo agli admin.
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
alter table public.easycome_customer_admin enable row level security;
drop policy if exists "customer_admin_admin_all" on public.easycome_customer_admin;
create policy "customer_admin_admin_all" on public.easycome_customer_admin
for all to authenticated using (public.is_easycome_admin()) with check (public.is_easycome_admin());

-- Agenda privata Easy Come.
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
alter table public.easycome_admin_tasks enable row level security;
drop policy if exists "admin_tasks_admin_all" on public.easycome_admin_tasks;
create policy "admin_tasks_admin_all" on public.easycome_admin_tasks
for all to authenticated using (public.is_easycome_admin()) with check (public.is_easycome_admin());

-- Supporto: indici utili per inbox e ordinamento per ultima attività.
create index if not exists easycome_support_updated_idx on public.easycome_support_requests(updated_at desc);
create index if not exists easycome_support_status_priority_idx on public.easycome_support_requests(status,priority,updated_at desc);
