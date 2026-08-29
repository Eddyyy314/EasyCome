# Setup Easy Come V10 — Intelligence OS

## Upgrade della piattaforma Easy Come
V10 parte dalla V9 esistente. Le variabili Vercel/Supabase/Stripe già configurate restano valide.

1. Sostituisci i file del repository con quelli della release V10 mantenendo la stessa Root Directory Vercel.
2. Mantieni le variabili esistenti: `APP_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe e, per Demo Factory, `GOOGLE_PLACES_API_KEY`.
3. Se non erano già state eseguite, mantieni le migrazioni precedenti V8.7/V9 previste dalla tua installazione.
4. Esegui `npm run build` e verifica che `dist-public` venga creato.
5. Deploy su Vercel.

## Nuovi clienti V10
Nel configuratore seleziona il preset **CFO & Intelligence** oppure abilita Finance, Brain e/o Audit. Lo ZIP cliente generato contiene già:

- `intelligence.html`;
- `assets/intelligence.css`;
- `js/intelligence.js`;
- schema Supabase con `brain_actions` e `audit_findings`;
- collegamenti dal gestionale all'Intelligence OS.

Per la modalità cloud del gestionale cliente, esegui normalmente `supabase/schema.sql` generato dal pacchetto V10 e configura `js/config.js`.

## Nessuna API AI obbligatoria
Il Brain V10 core funziona come motore deterministico sui KPI e sulle evidenze del gestionale, quindi non richiede una chiave LLM per produrre analisi finanziarie affidabili. L'eventuale modulo AI esterna rimane separato e opzionale.

## Regola di sicurezza operativa
Le azioni suggerite dal Brain vengono preparate e salvate in coda. L'utente deve approvarle prima di marcarle come eseguite. V10 non invia automaticamente solleciti, pagamenti o modifiche contabili.
