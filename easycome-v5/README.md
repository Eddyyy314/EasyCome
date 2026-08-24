# Easy Come V38 — Free Chat Handoff

Easy Come Web non usa più API generative a pagamento.

## Flow

1. La Factory trova l’attività e distingue sito proprietario, social e portali.
2. Approvi logo/foto reali con Asset Lock.
3. Compili business, obiettivo, conversione e direzione desiderata.
4. **Prepara Master Prompt**: Easy Come salva il brief e crea la proposta (prezzo sito + €50 implementazione).
5. **Scarica Creative Pack**: contiene `MASTER-PROMPT.md`, `ASSET-MANIFEST.json` e le immagini approvate.
6. **Apri ChatGPT** (o un’altra chat), allega il Creative Pack e incolla il prompt.
7. La chat deve consegnare uno ZIP statico: `index.html`, `styles.css`, `app.js`, `assets/`.
8. Torni in Easy Come e premi **Importa e crea portale**.
9. Easy Come applica il Quality Gate, ospita la preview e crea il link cliente + checkout.

## Costi AI

Nessuna `OPENAI_API_KEY` e nessuna API di chat sono richieste da Easy Come Web V38. L’handoff usa la normale interfaccia della chat scelta dall’utente.

## Asset Lock

Il Master Prompt vieta stock e immagini esterne. Se il materiale fotografico non copre uniformemente una sezione ripetuta, il designer deve cambiare la composizione invece di lasciare elementi monchi. L’importatore Easy Come mantiene inoltre i controlli su funzioni finte, immagini esterne e flussi commerciali inutili.

## Prezzo

Il checkout mostra due righe: prezzo del progetto + **€50 implementazione Easy Come Web**.

## Deploy

GitHub + Vercel come prima. Servono le normali variabili Easy Come/Supabase/Stripe già in uso; non serve alcuna chiave API generativa.
