# Rapporto test — Easy Come Studio V8

Data build: 7 agosto 2026

## Controlli superati

- sintassi di tutti i file JavaScript frontend e API;
- 11 modelli aziendali generati con punteggio qualità 100/100;
- generatori browser e server allineati;
- pacchetti generati da 39 a 53 file;
- workbook XLSX valido per ogni modello;
- Easy Come Hub V8 presente in ogni pacchetto;
- manuale HTML e manuale PDF presenti;
- profilo cliente incluso nella build pubblica;
- ordini, progetti, ticket e download legati allo stesso account;
- richiesta di soluzione su misura e incontro;
- checkout con solo pagamento una tantum;
- checkout con software una tantum più gestione tecnica mensile;
- endpoint separato per attivare Easy Come Managed dal profilo;
- endpoint Stripe Customer Portal;
- webhook per Checkout, abbonamenti e rinnovi;
- schema Supabase V8 e migrazione dalla V7;
- pannello amministratore con ordini, richieste/incontri e abbonamenti;
- build pubblica senza Builder interno, ZIP engine e template sorgente.

## Test non eseguibili senza gli account del titolare

- pagamento e rinnovo reale su Stripe Live;
- creazione di una sessione Customer Portal sul tuo account Stripe;
- invio webhook sul progetto Vercel di produzione;
- prova completa con il Supabase reale di easy-come.it.

Questi quattro test vanno effettuati in Sandbox dopo il deploy V8 e prima di sostituire le chiavi con quelle Live.
