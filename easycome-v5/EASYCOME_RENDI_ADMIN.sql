-- EASY COME CREATIVE AGENCY — AUTORIZZA UN ADMIN
-- Metodo database. La v4 supporta anche EASYCOME_ADMIN_EMAIL su Vercel.
-- Prima crea/registrati con l'account Supabase, poi sostituisci TUA_EMAIL.

insert into public.easycome_admins(user_id)
select id
from auth.users
where lower(email) = lower('TUA_EMAIL')
on conflict (user_id) do nothing;

select
  u.id,
  u.email,
  a.created_at as admin_dal
from public.easycome_admins a
join auth.users u on u.id = a.user_id
where lower(u.email) = lower('TUA_EMAIL');
