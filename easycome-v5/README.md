# Easy Come Studio V8

Easy Come permette a un’impresa di configurare, vedere in anteprima e acquistare un sistema digitale personalizzato.

## Novità V8

- **Profilo cliente**: ordini, download, progetti, ticket, incontri, account e gestione abbonamento.
- **Easy Come Hub**: area operativa nel pacchetto generato, collegata allo stesso account Easy Come.
- **Soluzione su misura**: l’utente può saltare il configuratore e chiedere un incontro gratuito.
- **Easy Come Managed**: gestione continuativa di software e database a 30 €/mese, facoltativa.

## Flussi di acquisto

- Solo software: pagamento una tantum.
- Software + gestione tecnica: totale software al primo pagamento e 30 €/mese in abbonamento.
- Gestione tecnica successiva: attivabile dal Profilo.

## Avvio

1. Esegui `SUPABASE_V8_UPGRADE.sql` se parti dalla V7, oppure `SUPABASE_V8_COMPLETO.sql` su un progetto vuoto.
2. Configura le variabili di ambiente indicate in `.env.example`.
3. Crea gli eventi webhook Stripe elencati in `DEPLOY-V8.md`.
4. Esegui `npm run verify` e `npm run build`.
5. Pubblica su Vercel.
