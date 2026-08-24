> **V33 Clean Checkout:** checkout delle proposte Easy Come Web limitato alla carta, senza Link come metodo di pagamento; copy cliente privo di riferimenti al processo di produzione.

> **V32 Browser Compiler:** import AI Studio senza Vite/Rollup runtime; TSX/JSX viene trasformato con un compilatore JavaScript puro e le dipendenze browser arrivano via ESM CDN.

# Easy Come V30 — Zero‑Touch Web Builder

V30 rende Easy Come Web realmente one-click: lo ZIP sorgente scaricato da Google AI Studio viene riconosciuto e compilato automaticamente anche quando App.tsx/index.tsx sono nella root e non esiste `src/`. Il builder usa le dipendenze già presenti in Easy Come e, quando necessario, installa in una directory temporanea soltanto le dipendenze effettivamente importate con `npm --ignore-scripts`, poi esegue Vite con configurazione controllata Easy Come.

Flow: AI Studio → Download ZIP → Factory → Importa e crea portale → link cliente → checkout. Non serve Publish, `npm install`, `npm run build`, GitHub o Vercel manuale per ogni sito.

# Easy Come V28 — Automation Ecosystem

Questa versione mantiene il posizionamento Easy Come come ecosistema per automatizzare le PMI e introduce **Easy Come Web V28: Asset Lock + Project Portal**.

## Novità V28

- Le foto pubbliche non entrano più automaticamente nei siti.
- Ogni immagine deve essere approvata e classificata in Web Studio.
- Il generatore riceve un Approved Visual Asset Manifest vincolante.
- Nessuna immagine stock/AI sostitutiva è ammessa se non è nel manifest.
- Easy Come Web non richiede più una preview esterna.
- L'admin importa lo ZIP finale direttamente in Easy Come.
- Upload diretto a Supabase Storage con signed upload (supporto pacchetti fino a 50 MB).
- Easy Come rileva automaticamente `dist/`, `build/`, `out/` o sito statico.
- Preview ospitata su `/web-sites/...` e mostrata nel portale cliente.
- Il cliente riceve solo il link Easy Come e paga via checkout Stripe.
- Il download del pacchetto si sblocca dopo il pagamento.

## Avvio

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

`dist-public/` è generata dalla build e non è inclusa nel pacchetto GitHub-ready.

Vedi `EASYCOME-WEB.md` per il flow completo del prodotto Web.

### V29 · Web Portal Auto Build
- Fix cache Factory: `factory.js?v=29.0.0` + `no-store` sulle superfici Factory.
- Rimosso definitivamente il requisito di URL preview esterno.
- Import diretto ZIP Google AI Studio.
- Auto-build server-side per progetti React/Vite comuni.
- Errori di build mostrati esplicitamente nella Factory invece di lasciare il pulsante senza feedback.
