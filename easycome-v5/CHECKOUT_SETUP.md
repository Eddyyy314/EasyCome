# Checkout e abbonamenti — Easy Come V8

## Acquisto software

- Senza Easy Come Managed: Stripe Checkout usa `mode=payment`.
- Con Easy Come Managed: Stripe Checkout usa `mode=subscription`, con una voce software una tantum e una voce ricorrente da 30 €/mese.

## Attivazione successiva

Dal Profilo il cliente può attivare solo Easy Come Managed tramite `/api/create-managed-subscription`.

## Gestione e disdetta

Il pulsante “Gestisci pagamento o disdici” crea una sessione Stripe Customer Portal tramite `/api/create-billing-portal`.

## Variabili

```text
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
EASYCOME_MANAGED_MONTHLY_CENTS=3000
APP_URL=https://easy-come.it
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Webhook

Configura `https://easy-come.it/api/stripe-webhook` con gli eventi elencati in `DEPLOY-V8.md`.
