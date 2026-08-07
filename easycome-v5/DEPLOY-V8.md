# Deploy Easy Come V8

## Supabase

- Da V7: esegui una volta `SUPABASE_V8_UPGRADE.sql`.
- Progetto vuoto: esegui `SUPABASE_V8_COMPLETO.sql`.

## Variabili Vercel

```text
APP_URL=https://easy-come.it
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
STRIPE_SECRET_KEY=...
STRIPE_WEBHOOK_SECRET=...
EASYCOME_MANAGED_MONTHLY_CENTS=3000
```

## Eventi webhook Stripe

```text
checkout.session.completed
checkout.session.async_payment_succeeded
checkout.session.async_payment_failed
checkout.session.expired
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.paid
invoice.payment_failed
```

Endpoint: `https://easy-come.it/api/stripe-webhook`

## Customer Portal

Attiva il portale clienti nella dashboard Stripe. Serve al pulsante “Gestisci pagamento o disdici” nel Profilo.

## Pubblicazione

Carica la cartella `easycome-v5` del pacchetto drop-in nel repository, attendi il deploy automatico e verifica: registrazione, profilo, incontro, acquisto una tantum, acquisto con gestione mensile, webhook e download.
