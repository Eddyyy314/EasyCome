# Easy Come V25 — Automation + AI Web Studio

Easy Come è il brand dedicato all’automazione delle PMI. Il Gestionale resta il cuore operativo dell’ecosistema; Easy Come Audit è un modulo complementare del Gestionale. **Easy Come Web** è invece un prodotto autonomo del brand.

## Cosa contiene
- Sito pubblico Easy Come con posizionamento “La tua PMI. Ma automatizzata.”
- Easy Come Studio per configurare i gestionali.
- Hub, Audit e automazioni del Gestionale.
- Control Room / Demo Factory.
- **Easy Come Web Studio**: individua PMI senza un vero sito proprietario, costruisce un brief premium e avvia la generazione tramite Lovable Build with URL. Non richiede il Gestionale.

## Easy Come Web
La V25 rimuove il generatore visuale interno come percorso principale. Facebook/Instagram/Linktree/Booking/TripAdvisor/Google Maps non vengono classificati come “sito”. Per le opportunità reali, la Factory prepara un brief dettagliato e apre Lovable con autosubmit. Vedi `EASYCOME-WEB.md`.

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

## Documentazione
- `AUDIT-ECOSYSTEM.md` — architettura Audit + Gestionale
- `EASYCOME-WEB.md` — specifica Easy Come Web
