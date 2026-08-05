# Test Report — Easy Come V5

Data revisione: 3 agosto 2026

## Esito

**PASS — pacchetto generabile e checkout coerente con il preventivo.**

## Generatore

Sono stati generati e verificati tutti i 9 modelli:

| Modello | Qualità | File | Prezzo software di test |
|---|---:|---:|---:|
| Da zero | 100/100 | 32 | €99,00 |
| Prenotazioni | 100/100 | 37 | €153,00 |
| Appuntamenti | 100/100 | 37 | €135,00 |
| Ristorazione | 100/100 | 42 | €153,40 |
| Officina e interventi | 100/100 | 41 | €157,80 |
| Studio professionale | 100/100 | 38 | €151,80 |
| Negozio e vendite | 100/100 | 39 | €151,80 |
| Progetti e cantieri | 100/100 | 41 | €150,20 |
| Iscrizioni e abbonati | 100/100 | 39 | €151,80 |

Per ogni modello sono stati verificati:

- unicità dei file generati;
- sintassi JavaScript del gestionale, portale e service worker;
- schema Supabase con RLS, ruoli, audit log, Storage e protezione richieste pubbliche;
- presenza di viste tabella, foglio operativo, kanban, agenda, calendario, disponibilità e schede;
- ZIP finale integro;
- qualità minima obbligatoria prima della consegna.

## Interfaccia commerciale

- il timer visibile è stato eliminato;
- la preparazione usa una rotellina e una barra indeterminata;
- la card laterale “Anteprima del brand” è stata rimossa;
- l’anteprima mostra dashboard, foglio operativo, calendario risorse e portale;
- l’implementazione parte da **€0** ed entra nel totale soltanto dopo selezione esplicita;
- selezionando l’implementazione vengono aggiunti **€150** sia nel frontend sia nel calcolo server;
- il prezzo frontend coincide con il prezzo ricalcolato dal server per tutti i modelli.

## Workbook Excel

Il pacchetto dimostrativo Borgo Marina genera un vero file `.xlsx` importabile, con:

- 18 fogli complessivi;
- foglio Istruzioni;
- Dashboard con KPI e formule;
- Calendario disponibilità con formule e colori condizionali;
- Listino e regole di prezzo;
- un foglio operativo per ogni entità;
- righe dimostrative, formati data/valuta, filtri, blocco intestazioni e menu a tendina;
- CSV separato per ogni sezione.

Il workbook è stato importato e ispezionato con `artifact_tool`. Non sono stati rilevati errori `#REF!`, `#DIV/0!`, `#VALUE!`, `#NAME?` o `#N/A` nei fogli controllati.

## Checkout e sicurezza

- importo ricalcolato in `api/_pricing.js`;
- chiavi Stripe e Supabase sensibili solo lato server;
- firma webhook Stripe HMAC-SHA256 verificata con confronto timing-safe;
- schema ordini Supabase con RLS e amministratori separati;
- build pubblica priva di `builder.html`, `zip.js` e template del generatore;
- pagine pagamento riuscito, annullato e gestione ordini presenti.

## Limiti prima del lancio reale

Restano obbligatori:

- test di una transazione reale in Stripe test mode;
- pubblicazione e collaudo del webhook sul dominio definitivo;
- collaudo Supabase con account titolare e collaboratore;
- inserimento dei dati legali reali in termini e privacy;
- verifica fiscale con il commercialista;
- test finale del primo gestionale con i dati di un’impresa pilota.
