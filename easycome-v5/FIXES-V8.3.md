# Easy Come 8.3 — stabilità account, ricerca e inbox

## Correzioni
- Bozze isolate per account Supabase: un nuovo utente non eredita più il progetto del precedente browser session.
- Cambio account gestito anche senza ricaricare la pagina.
- Link Profilo sempre visibile nel builder desktop e mobile.
- Azioni `Salvato`, `Anteprima` e `Profilo` riallineate.
- Ricerca del gestionale aggiorna solo i risultati: il campo non viene più ricreato a ogni carattere.
- Calendario completato con celle finali e bordi coerenti.
- Assistenza, nuove funzioni e incontri passano da `/api/support-request` e finiscono nella inbox centrale Easy Come.
- Pannello amministratore usa automaticamente `/api/public-config`: non richiede chiavi duplicate in `js/admin-config.js`.
- Conteggio richieste aperte visibile nel pannello amministratore.
- Webhook esterno facoltativo tramite `EASYCOME_SUPPORT_WEBHOOK_URL`.

## Nessuna migrazione SQL richiesta
La versione usa le tabelle V8 già esistenti.
