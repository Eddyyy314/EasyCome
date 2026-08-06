# Easy Come Studio V7

Easy Come Studio V7 è il configuratore pubblico che permette a un’impresa di progettare, vedere in anteprima e acquistare un sistema gestionale personalizzato.

## Flusso cliente

1. L’utente crea il proprio account Easy Come.
2. Configura attività, funzioni, sezioni, regole e layout.
3. Naviga l’anteprima reale del gestionale.
4. Approva il progetto e paga tramite Stripe.
5. Il server verifica il pagamento e genera lo ZIP.
6. Il gestionale acquistato usa lo stesso account Easy Come.

## Novità V7

- account unico per sito, gestionale ed Easy Come Hub;
- progetti salvati su Supabase;
- Easy Come Hub al posto del vecchio portale pubblico;
- manuale HTML e PDF personalizzato;
- richieste assistenza, bug, nuove funzioni, implementazione e formazione;
- struttura dati visuale e procedura guidata per nuove sezioni;
- modelli prezzi: nessun prezzo, preventivo manuale, listino fisso, tariffa oraria, abbonamento e prezzo dinamico;
- ricette di automazione comprensibili;
- layout professionali predefiniti, senza color picker confusi;
- anteprima del gestionale operativo, non del foglio Excel.

## Aree del prodotto

- `index.html`: configuratore pubblico protetto da registrazione;
- `builder.html`: generatore interno con download diretto;
- `orders.html`: pannello ordini;
- `api/`: checkout, account, webhook e generazione server;
- `checkout/schema.sql`: database centrale Easy Come;
- `js/generator-core.js`: motore dei pacchetti;
- `templates/`: codice del gestionale e del Hub generati.

## Limiti dichiarati

Il pacchetto base usa l’account Easy Come e può funzionare con dati locali. L’implementazione opzionale serve per database cloud, deploy, ruoli, migrazione dati e collaudo. Le app native, la fatturazione elettronica e le integrazioni con servizi esterni richiedono configurazioni e account specifici.
