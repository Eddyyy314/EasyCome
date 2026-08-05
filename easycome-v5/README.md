# Easy Come V5 — Generator & Checkout

Un configuratore pubblico con anteprima navigabile e checkout Stripe, più un Builder interno che genera il pacchetto completo del cliente.

## Flusso cliente

1. L’impresa descrive attività e processi.
2. Sceglie moduli, sezioni, campi, prezzi e automazioni.
3. Prova dashboard, foglio operativo, calendario disponibilità e portale.
4. Approva l’anteprima.
5. Una rotellina mostra la preparazione del progetto, senza timer artificiale.
6. Acquista il solo software oppure aggiunge volontariamente l’implementazione assistita da €150.
7. Easy Come genera e consegna il pacchetto configurato.

## Cosa viene generato

- gestionale responsive con dashboard e KPI;
- tabella, foglio modificabile tipo Excel, kanban, agenda, calendario, disponibilità e schede;
- vero workbook `.xlsx` con Istruzioni, Dashboard, Listino, Calendario e fogli operativi;
- modelli CSV per ogni sezione;
- import/export CSV ed Excel, backup e ripristino JSON;
- preventivi, ordini e documenti stampabili;
- portale pubblico;
- Supabase con RLS, Storage, ruoli e audit log;
- automazioni e documentazione di installazione/collaudo.

## Modalità

- `index.html`: configuratore pubblico con anteprima e checkout.
- `builder.html`: copia interna Easy Come con generazione ZIP.
- `orders.html`: gestione ordini pagati, riservata agli amministratori.

## Prezzi

- software base: €99 una tantum;
- moduli: principalmente €4–€15;
- implementazione: €150, **facoltativa e mai preselezionata**;
- nessun canone Easy Come inserito automaticamente.

## Test

```bash
npm run verify
```

Per Stripe e Supabase segui `CHECKOUT_SETUP.md`.
