# Easy Come Control Room — V8.4

URL consigliato dopo il deploy: `https://easy-come.it/admin`

## Cosa contiene

- Panoramica con incassi, MRR, clienti, chat aperte, urgenze e Managed attivi.
- Inbox a conversazioni con ricerca, filtri, non letti, priorità, stato e risposte.
- Rubrica clienti con spesa, ordini, richieste, progetto, Managed, tag, note private e follow-up.
- Progetti salvati e loro stato.
- Ordini, consegne e download.
- Abbonamenti Easy Come Managed e pagamenti da recuperare.
- Incontri e richieste su misura.
- Agenda privata amministratore.
- Attività recente.
- Controllo tecnico Supabase / Stripe / webhook.

## Upgrade Supabase obbligatorio

Se V8 è già installata, esegui nel SQL Editor:

`SUPABASE_V84_ADMIN_UPGRADE.sql`

Lo script aggiunge:

- `easycome_support_messages`
- `easycome_customer_admin`
- `easycome_admin_tasks`
- accesso admin in lettura a profili e progetti
- email nei profili
- migrazione delle vecchie richieste/risposte in conversazioni

## Account amministratore

L'utente deve essere presente in `easycome_admins`. Dopo la registrazione puoi usare il file/script admin già usato nelle versioni precedenti.

## Notifiche esterne opzionali

Le richieste e i nuovi messaggi arrivano sempre nel Control Room. Per ricevere anche una notifica esterna puoi valorizzare su Vercel:

`EASYCOME_SUPPORT_WEBHOOK_URL`

Può puntare a Make, n8n o un endpoint di notifica.
