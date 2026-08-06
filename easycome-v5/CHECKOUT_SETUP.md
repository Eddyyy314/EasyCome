# Checkout e consegna automatica

## Architettura

Il prezzo viene calcolato nuovamente dal server. Il browser non può inviare un totale arbitrario. La configurazione viene salvata in `easycome_orders` prima di aprire Stripe.

Dopo il pagamento:

- Stripe reindirizza a `success.html?session_id=...`;
- `checkout-status` verifica la sessione direttamente su Stripe;
- `generate-delivery` richiede un pagamento confermato;
- il generatore server compone i file e restituisce lo ZIP;
- Supabase registra stato e numero di download.

## Configurazione minima

1. Esegui `checkout/schema.sql` su Supabase.
2. Inserisci su Vercel `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.
3. Mantieni `STRIPE_SECRET_KEY` solo su Vercel.
4. Imposta `APP_URL=https://easy-come.it`.
5. Crea il webhook Stripe e inserisci `STRIPE_WEBHOOK_SECRET`.

## Modalità test e live

Le chiavi test e live sono separate. Quando passi in produzione sostituisci `sk_test_...` con `sk_live_...` e crea un webhook live separato.
