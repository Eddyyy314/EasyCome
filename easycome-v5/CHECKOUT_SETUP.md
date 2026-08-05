# Checkout Easy Come — configurazione

Il sito usa Stripe Checkout ospitato. Il browser non riceve mai la secret key e non decide l'importo: `/api/create-checkout-session` ricalcola il prezzo con il catalogo Easy Come.

## 1. Stripe

1. Crea o apri l'account Stripe.
2. Copia la chiave segreta di test in `STRIPE_SECRET_KEY` nelle variabili Vercel.
3. Pubblica il sito e crea un webhook verso:
   `https://TUO-DOMINIO/api/stripe-webhook`
4. Seleziona gli eventi:
   - `checkout.session.completed`
   - `checkout.session.async_payment_succeeded`
   - `checkout.session.async_payment_failed`
   - `checkout.session.expired`
5. Copia il signing secret in `STRIPE_WEBHOOK_SECRET`.
6. Prova in test mode prima di passare alle chiavi live.

## 2. Supabase per gestire gli ordini

1. Esegui `checkout/schema.sql` nel SQL Editor.
2. Aggiungi `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` alle variabili server di Vercel.
3. Crea un utente in Supabase Auth.
4. Esegui la riga finale del file SQL sostituendo la tua email.
5. Inserisci URL e publishable key in `js/admin-config.js` per usare `orders.html`.

La service role deve restare soltanto nelle variabili server. Non inserirla in file JavaScript pubblici.

## 3. Vercel

Carica il progetto su GitHub, importalo in Vercel e imposta le variabili contenute in `.env.example`.

Il cliente viene reindirizzato al Checkout Stripe. Dopo il pagamento torna su `success.html`; il webhook aggiorna l'ordine anche se il cliente chiude la pagina prima del ritorno.

## 4. Modalità interna

Per scaricare ZIP senza checkout nella tua copia privata modifica `js/sales-config.js`:

```js
mode: 'builder',
internalDownloadEnabled: true,
generationSeconds: 0,
```

Non pubblicare la copia interna con il download aperto.
