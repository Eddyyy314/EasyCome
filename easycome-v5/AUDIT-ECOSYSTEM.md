# Easy Come Audit — Ecosistema integrato

## Prodotto
Easy Come Audit non è un software indipendente. È un modulo premium del Gestionale Easy Come.

- Gestionale Easy Come: acquisto una tantum secondo la configurazione del cliente.
- Easy Come Audit: 100 €/mese.
- Nessun costo di acquisto o setup separato per Audit.
- Audit può essere attivato solo se l'account possiede un Gestionale Easy Come.

## Esperienza cliente
Il punto di ingresso è `easycome-hub.html`.

1. Il cliente accede con il proprio Easy Come ID.
2. L'Hub riconosce l'azienda e l'abbonamento Audit.
3. Se Audit è attivo, il cliente apre `audit.html` direttamente dall'Hub.
4. Audit usa lo stesso `organizationId` del Gestionale.
5. Non è previsto upload CSV/XLSX nell'esperienza integrata.
6. I controlli leggono i dati reali delle entità configurate nel Gestionale.
7. Il risultato segue il flow: Capisci → Priorità → Risolvi → Verifica.
8. Ogni finding contiene evidenze e un collegamento alla sezione del Gestionale da correggere.
9. Dopo la correzione il cliente può rieseguire il controllo.

## Entitlement Audit
L'accesso è considerato attivo se almeno una di queste condizioni è vera:

- il progetto consegnato contiene `delivery.auditServiceSelected = true`;
- esiste un abbonamento Easy Come con stato `active` o `trialing` e piano Audit (`audit_100` / importo >= 10000 centesimi).

Il vecchio campo `managedServiceSelected` rimane soltanto come compatibilità dati durante la migrazione e non è più il nome commerciale del servizio.

## Dati
Audit segue la stessa modalità dati del Gestionale:

- `dataMode = cloud`: legge le stesse tabelle Supabase filtrate per `organization_id`;
- `dataMode = local`: legge le stesse chiavi Local Storage `easycome:<organizationId>:<entity>` usate dal Gestionale.

Questo evita copie del database e diagnosi su file diversi dalla fonte operativa.

## Diagnostica
Il motore è volutamente conservativo. Segnala solo condizioni verificabili sui dati disponibili. Se un controllo richiede informazioni mancanti, deve essere marcato come non eseguibile e non trasformato in un problema.

Controlli attuali: campi obbligatori mancanti, identificativi duplicati, date non valide, intervalli invertiti, sovrapposizioni di prenotazioni/risorse, quadratura testata-righe quando disponibile, stock negativo, scadenze operative, storni/pagamenti negativi senza riferimento e outlier prudenti.

## Checkout e attivazione successiva
- In fase di acquisto del Gestionale il cliente può aggiungere Easy Come Audit a 100 €/mese.
- Dal Profilo Easy Come un cliente che possiede già il Gestionale può attivare Audit successivamente.
- L'endpoint `/api/create-audit-subscription` verifica prima l'esistenza di un progetto Gestionale associato all'utente.
- Il piano Stripe è identificato come `audit_100`.

## Nota di produzione
Nell'architettura di consegna corrente Easy Come ID e abbonamenti sono centrali. Quando un Gestionale viene configurato con un database Supabase dedicato al cliente, l'entitlement Audit deve restare leggibile dal client tramite account centrale o tramite un bridge/sync sicuro dell'abbonamento. Non duplicare i dati operativi per risolvere l'entitlement.
