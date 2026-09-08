-- EASY COME — RENDI AMMINISTRATORE UN ACCOUNT
-- 1) Registrati prima normalmente su Easy Come.
-- 2) Sostituisci INSERISCI_LA_TUA_EMAIL con la tua email.
-- 3) Esegui in Supabase > SQL Editor.

insert into public.easycome_admins(user_id)
select id
from auth.users
where lower(email) = lower('INSERISCI_LA_TUA_EMAIL')
on conflict (user_id) do nothing;

select
  u.email,
  a.created_at as admin_dal
from public.easycome_admins a
join auth.users u on u.id = a.user_id
where lower(u.email) = lower('INSERISCI_LA_TUA_EMAIL');
