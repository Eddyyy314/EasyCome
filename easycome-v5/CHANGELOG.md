# Easy Come 8.3

- Dati del builder separati per account.
- Profilo visibile anche da mobile.
- Ricerca stabile senza perdita del focus.
- Calendario/griglia rifiniti.
- Inbox centralizzata per assistenza e incontri.
- Admin panel collegato automaticamente alla configurazione pubblica Supabase.

# Changelog

## 8.0.0
- Nuovo profilo cliente con ordini, download, progetti, assistenza e account.
- Richiesta soluzione completamente personalizzata e incontro iniziale.
- Easy Come Hub ridisegnato con dashboard, manuale, ticket, feature request, incontri e onboarding.
- Servizio opzionale Easy Come Managed a 30 € al mese.
- Checkout Stripe misto: acquisto software una tantum + eventuale canone mensile.
- Customer Portal Stripe per modificare il metodo di pagamento o disdire.
- Nuova tabella Supabase `easycome_subscriptions` e campi ordine V8.
- Anteprima e documentazione aggiornate.


## 8.2.0 — Final polish
- Anteprima desktop/mobile ridimensionata con viewport interna.
- Easy Come Hub navigabile dentro l’anteprima.
- Builder campi e variazioni prezzo senza overflow.
- Card servizi facoltativi più compatte.
- Copy secondario ridotto e proporzioni uniformate.
- Migliorie responsive al gestionale e Hub generati.

## 8.4.0 — Control Room
- Nuova pagina `/admin` con overview operativa.
- Inbox conversazioni cliente ↔ Easy Come con non letti, priorità e stato.
- Rubrica clienti con note private, tag, lifecycle e follow-up.
- Viste Progetti, Ordini, Managed, Incontri, Agenda, Attività e Sistema.
- Thread messaggi persistenti in Supabase.
- Follow-up cliente dalla sezione Assistenza del Profilo.
- Endpoint `/api/support-message` e `/api/admin-health`.
