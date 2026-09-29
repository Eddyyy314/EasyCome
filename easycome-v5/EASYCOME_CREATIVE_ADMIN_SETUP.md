# Easy Come Creative Agency — accesso Admin / Factory

## Obiettivo
Dopo il login da `/admin`, un account amministratore viene verificato lato server e portato automaticamente a `/factory`.

## Variabili Vercel necessarie
Configura in Vercel > Project > Settings > Environment Variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (oppure `SUPABASE_PUBLISHABLE_KEY`)
- `SUPABASE_SERVICE_ROLE_KEY`
- `EASYCOME_ADMIN_EMAIL` = l'email del tuo account Supabase
- `APP_URL` = URL pubblico del progetto (es. https://easy-come.vercel.app)

In alternativa a `EASYCOME_ADMIN_EMAIL`, puoi usare `EASYCOME_ADMIN_EMAILS` con più email separate da virgola.

## Metodo database (opzionale ma supportato)
Puoi continuare anche a usare `easycome_admins`:

```sql
insert into public.easycome_admins(user_id)
select id
from auth.users
where lower(email) = lower('TUA_EMAIL')
on conflict (user_id) do nothing;
```

La nuova versione accetta un admin se è presente **almeno in uno** dei due sistemi:
1. email configurata su Vercel;
2. user_id presente in `easycome_admins`.

## Accesso
1. Apri `/admin?next=/factory`
2. Inserisci email/password Supabase.
3. Il browser effettua il login Supabase.
4. `/api/admin-session` valida l'account lato server.
5. Se autorizzato, redirect automatico a `/factory`.

La Factory ripete la verifica server-side prima di mostrare gli strumenti.
