# Pubblicazione V6 su easy-come.it

## 1. Aggiorna GitHub

Sostituisci il contenuto della cartella `easycome-v5` nel repository con i file della V6, mantenendo `easycome-v5` come Root Directory su Vercel oppure rinominando la cartella e aggiornando la Root Directory.

## 2. Crea l'archivio ordini

Apri Supabase > SQL Editor, incolla tutto `checkout/schema.sql` ed esegui.

## 3. Variabili Vercel

In Vercel > Easy Come > Environment Variables aggiungi:

```text
STRIPE_SECRET_KEY=sk_test_... oppure sk_live_...
APP_URL=https://easy-come.it
SUPABASE_URL=https://TUO-PROGETTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=chiave_server_supabase
```

Non inserire `SUPABASE_SERVICE_ROLE_KEY` nel frontend o in GitHub.

## 4. Redeploy

Dopo il salvataggio delle variabili esegui un nuovo deployment.

## 5. Webhook Stripe

Crea un endpoint Stripe:

```text
https://easy-come.it/api/stripe-webhook
```

Eventi:

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
```

Inserisci il signing secret su Vercel:

```text
STRIPE_WEBHOOK_SECRET=whsec_...
```

Esegui un altro redeploy.

## 6. Test

In Sandbox usa la carta Stripe di test `4242 4242 4242 4242`, una scadenza futura e un CVC qualsiasi. Dopo il pagamento devono avvenire:

1. ritorno a `success.html`;
2. verifica dell'ordine;
3. rotellina di preparazione;
4. download automatico dello ZIP;
5. ordine `paid` in Supabase;
6. incremento `download_count`.
