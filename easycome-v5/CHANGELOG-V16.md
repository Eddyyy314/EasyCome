# Easy Come V16 — Managed Control Room + Demo Operativa

## Demo operativa
- CRUD locale nella demo: crea, modifica, duplica ed elimina record dimostrativi.
- Ricerca, selezione scheda, export CSV e reset della sandbox.
- Le modifiche demo restano nel browser e non toccano dati reali.
- Il passaggio Demo → Studio continua a usare la configurazione commerciale originaria come base.

## Easy Come Managed Control Room
- Vista Managed arricchita con URL installazione, stato supporto e ultimo accesso.
- Registrazione dell'URL del gestionale cliente direttamente dalla Control Room.
- Apertura in modalità supporto con evento di accesso registrato nel progetto cliente.
- Support email: infoeasycome@libero.it.
- Nessuna password cliente viene salvata o richiesta da Easy Come.

## Accesso supporto nei gestionali generati
- Nuovo ruolo `support` in organization_members.
- Il ruolo support può leggere e modificare dati operativi ma non amministrare membri né eseguire azioni riservate a owner/admin.
- Il titolare può abilitare Easy Come Support dalle impostazioni del gestionale.
- In modalità `?support=1` il gestionale propone un accesso passwordless tramite magic link a infoeasycome@libero.it.
- Lo schema e la Edge Function invite-member generati includono il ruolo support.

## Sicurezza
- Le credenziali del cliente non vengono condivise con Easy Come.
- L'accesso tecnico è un account separato e revocabile dalla gestione collaboratori del gestionale.
- La Control Room registra l'ultimo avvio di una sessione supporto.
