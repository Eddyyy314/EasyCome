# Borgo Marina

Pacchetto generato con **Easy Come Studio Masterpiece** e bloccato da un controllo qualità prima del download.

## Contenuto

- gestionale dinamico con 17 sezioni;
- viste tabella, foglio Excel, bacheca, agenda, calendario, disponibilità e schede quando coerenti;
- import/export CSV e backup JSON;
- audit log, permessi reali e Storage documenti privato;
- modalità demo locale immediata;
- collegamento Supabase per login e dati cloud;
- schema SQL con Row Level Security;
- portale pubblico attivo;
- motore prezzi dinamici configurato;
- 3 automazioni configurate;
- Edge Function per email, webhook, notifiche, task e aggiornamenti;
- file Vercel e Netlify per il deploy.

## Moduli

- Clienti e CRM
- Attività e scadenze
- Prenotazioni e risorse
- Preventivi
- Registro pagamenti e caparre
- Spese e fornitori
- Documenti e allegati
- Beni e manutenzioni
- Report e KPI
- Portale pubblico
- Prezzi dinamici
- Motore automazioni
- Utenti, ruoli e permessi

## Avvio immediato in demo

Apri il file index.html con un server statico. Da Terminale:

```bash
npx serve .
```

Poi apri l'indirizzo mostrato. Senza Supabase il gestionale funziona in modalità locale usando il browser.

## Collegamento Supabase

1. Crea un progetto Supabase.
2. Apri **SQL Editor** ed esegui supabase/schema.sql.
3. Apri js/config.js.
4. Sostituisci INSERISCI_PROJECT_URL con il Project URL.
5. Sostituisci INSERISCI_PUBLISHABLE_KEY con la publishable/anon key.
6. Apri il gestionale e registrati usando l’email titolare `direzione@borgomarina.example`. Solo quell’indirizzo può reclamare il ruolo owner.
7. Pubblica le Edge Functions `process-automations` e `invite-member`.
8. In Supabase Auth configura Site URL e Redirect URLs con il dominio finale.

Non inserire mai la service role key nel frontend.

## Automazioni

Le automazioni sono in automations/automation-plan.json e nella Edge Function:

```text
supabase/functions/process-automations/index.ts
```

Per pubblicarla:

```bash
supabase functions deploy process-automations --no-verify-jwt
supabase functions deploy invite-member
```

Secret opzionali:

- AUTOMATION_CRON_SECRET
- RESEND_API_KEY
- EMAIL_FROM
- AI_WEBHOOK_URL

Programma una chiamata periodica alla funzione per processare la coda.

## Prezzo Easy Come configurato

- Pacchetto base: €99.00
- Implementazione assistita: non selezionata
- Moduli e personalizzazioni: €95.40
- **Totale: €194.40 una tantum**

## Limite importante

Il pacchetto contiene codice, database e configurazione. Email, WhatsApp, checkout online e AI richiedono le rispettive API. Il modulo “Fatture e scadenze” è una gestione interna e non sostituisce un servizio di fatturazione elettronica o un software contabile certificato.
