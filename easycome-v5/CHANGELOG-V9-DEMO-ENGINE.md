# Easy Come V9 — Demo Engine

## Integrato sulla base Easy Come V8.8

### Demo Factory
- Nuova pagina amministratore `/factory`.
- Batch da 25, 50 o 100 attività.
- Ricerca server-side con Google Places API (New).
- Rotazione automatica di città e categorie italiane.
- Deduplicazione persistente tramite Google Place ID: un'attività già usata non viene proposta nei batch successivi.
- Campagne e target salvati in Supabase.

### Personalizzazione automatica
- Classificazione del business in template Easy Come.
- Template: officina, hospitality, beauty/appuntamenti, fitness, sanitario, professionale, ristorazione, retail, servizi/cantieri, generico.
- KPI e dati demo fittizi ma coerenti con il settore.
- Generazione di un progetto Easy Come reale compatibile con il generatore già esistente.

### Demo pubblica
- Link univoco `/demo?d=<slug>`.
- Dati azienda Google richiamati live; i dati operativi della demo sono esplicitamente fittizi.
- Scadenza demo dopo 7 giorni.
- Tracking visualizzazioni e click CTA.
- CTA `Personalizzalo` porta a Easy Come Studio con il progetto già precaricato.

### Produzione
- Endpoint server protetti per la Factory (solo admin Easy Come).
- RLS Supabase sulle nuove tabelle; accesso server tramite service role.
- Attribuzione Google Maps nella UI.
- Build Vercel aggiornata per includere Factory e demo.
- Versione package: 9.0.0.

## Test eseguiti
- Syntax check Node dei file nuovi/modificati: OK.
- Build `dist-public`: OK.
- Classificazione template: OK.
- Audit progetto tramite generatore Easy Come esistente: OK.
- Test end-to-end simulato: 100 target generati, 100 unici, demo pubblica caricata, progetto creato, CTA tracciata, campagna completata.

## Prima del deploy
1. Eseguire `SUPABASE_V9_DEMO_FACTORY.sql` su Supabase.
2. Aggiungere `GOOGLE_PLACES_API_KEY` e `APP_URL` alle Environment Variables Vercel.
3. Abilitare Places API (New) nel progetto Google Cloud e impostare restrizioni/quote/budget.
4. Deployare questa cartella/repository.

Nota: V9 genera le demo e prepara link + messaggio di contatto. L'invio massivo automatico di email/WhatsApp non è attivato in questa release.
