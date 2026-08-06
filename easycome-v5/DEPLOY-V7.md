# Deploy Easy Come Studio V7

## 1. Sostituisci i file su GitHub

Nel repository, sostituisci il contenuto della cartella `easycome-v5` con quello della cartella omonima contenuta nello ZIP V7. Mantieni su Vercel la Root Directory `easycome-v5`.

## 2. Aggiorna Supabase

Apri Supabase → SQL Editor, copia tutto `checkout/schema.sql` e premi Run. Lo script è ripetibile e aggiunge:

- profili account;
- progetti salvati;
- ordini collegati all’utente;
- richieste Easy Come Hub;
- RLS e permessi.

## 3. Variabili Vercel

Devono essere presenti:

```text
APP_URL=https://easy-come.it
SUPABASE_URL=https://TUO-PROGETTO.supabase.co
SUPABASE_ANON_KEY=LA-CHIAVE-PUBBLICABILE
SUPABASE_SERVICE_ROLE_KEY=LA-CHIAVE-SEGRETA-SERVER
STRIPE_SECRET_KEY=sk_...
STRIPE_WEBHOOK_SECRET=whsec_...
EASYCOME_BASE_PRICE=99
EASYCOME_IMPLEMENTATION_PRICE=150
```

Non inserire mai la service role o la secret key Stripe nel frontend o in GitHub.

## 4. Auth Supabase

In Authentication → URL Configuration:

- Site URL: `https://easy-come.it`
- Redirect URL: `https://easy-come.it/**`

Scegli se richiedere la conferma email. Per produzione è consigliata.

## 5. Amministratore Easy Come

Dopo aver creato il tuo account, esegui nel SQL Editor:

```sql
insert into public.easycome_admins(user_id)
select id from auth.users where email='LA-TUA-EMAIL'
on conflict do nothing;
```

## 6. Redeploy

Vercel esegue `node scripts/build-public.mjs`. Controlla che il deployment sia Ready.

## 7. Test completo

1. crea un account nuovo;
2. configura e ricarica la pagina: il progetto deve restare salvato;
3. completa un pagamento Stripe Sandbox;
4. scarica lo ZIP;
5. verifica che `js/config.js` contenga Easy Come ID;
6. accedi a `index.html` e `easycome-hub.html` con lo stesso account;
7. invia una richiesta dal Hub e controllala in `easycome_support_requests`.
