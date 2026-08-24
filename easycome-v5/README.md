# Easy Come V27 — Brand DNA Web + Proposal Commerce

Easy Come è il brand dedicato all’automazione delle PMI. Il Gestionale resta il cuore operativo dell’ecosistema; Easy Come Audit è un modulo complementare del Gestionale. **Easy Come Web** è invece un prodotto autonomo del brand.

## Cosa contiene
- Sito pubblico Easy Come con posizionamento “La tua PMI. Ma automatizzata.”
- Easy Come Studio per configurare i gestionali.
- Hub, Audit e automazioni del Gestionale.
- Control Room / Demo Factory.
- **Easy Come Web Studio V27** con Brand Intelligence reale e proposal commerce.

## Easy Come Web V27
La Factory non deve più inventare una palette e poi applicarla a un template. Per una PMI senza sito proprietario:

1. legge foto pubbliche disponibili e le usa come riferimento visivo;
2. estrae una palette dalle immagini selezionate;
3. permette di aggiungere logo/foto originali, li salva come asset di lavoro Easy Come e li passa al motore creativo insieme ai loro colori;
4. genera un Build Pack AI Studio che obbliga il progetto a usare immagini, colori e linguaggio della vera attività;
5. dopo la build, importa URL preview + ZIP finale dentro Easy Come;
6. genera una proposta privata Easy Come con preview del sito e checkout Stripe.

Facebook, Instagram, Google Maps, Booking, Linktree e directory **non vengono classificati come sito proprietario**.

Vedi `EASYCOME-WEB.md` per il flow completo.

## Avvio
```bash
npm install
npm run dev
```

## Build pubblica
```bash
npm run build
```

La cartella `dist-public/` viene generata dal build e non è inclusa nel pacchetto GitHub per evitare duplicati.

## Variabili V27
Oltre alle variabili già presenti:

```env
EASYCOME_WEB_ASSET_SECRET=stringa-lunga-casuale
SUPABASE_WEB_BUCKET=easycome-web-proposals
```

Il bucket Storage viene creato automaticamente quando possibile tramite la service role Supabase.

## Documentazione
- `AUDIT-ECOSYSTEM.md` — architettura Audit + Gestionale
- `EASYCOME-WEB.md` — Brand DNA, import pacchetto e checkout Easy Come Web
