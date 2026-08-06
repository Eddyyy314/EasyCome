# Rapporto test — Easy Come Studio V7

Data: 6 agosto 2026

## Esito

**PASS**

## Controlli eseguiti

- 11 modelli aziendali generati;
- controllo qualità 100/100 per tutti i modelli di test;
- prezzi browser/server coincidenti;
- implementazione da €150 sempre opzionale;
- account centrale montato prima del configuratore;
- checkout collegato all’utente autenticato;
- consegna V7 con identità dell’acquirente;
- Easy Come Hub generato in ogni pacchetto;
- manuale personalizzato HTML e PDF;
- assenza del vecchio `js/portal.js`;
- layout predefiniti e wizard dati/prezzi/automazioni;
- anteprima iniziale sulla dashboard reale;
- workbook XLSX valido;
- JavaScript browser e server verificato sintatticamente;
- generatore browser/server allineato;
- build pubblica priva del Builder interno e dei template sorgente;
- ZIP completo superiore a 100 KB.

## Pacchetto campione

`ESEMPIO-Studio-Dentale-Aurora-V7.zip` contiene 53 file e usa il modello “preventivo manuale”, utile per attività senza un prezzo fisso.

## Test non eseguibili senza credenziali reali

- registrazione sul Supabase dell’utente;
- pagamento reale Stripe;
- invio reale di una richiesta Hub al database Easy Come;
- accesso allo ZIP generato con l’account reale dell’acquirente.

Questi test vanno completati in Sandbox dopo il deploy.
