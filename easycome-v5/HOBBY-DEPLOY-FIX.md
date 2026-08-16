# Easy Come V9 — Vercel Hobby deploy fix

Questa build risolve il limite di 12 Vercel Functions del piano Hobby.

## Cosa cambia
- I 15 endpoint API pubblici mantengono gli stessi URL (`/api/...`).
- I relativi handler sono stati spostati in `server/api-handlers/`.
- Vercel crea una sola funzione: `api/router.js`.
- `vercel.json` riscrive in modo trasparente i vecchi endpoint verso il router.
- Frontend, Stripe webhook URL e chiamate esistenti non devono essere cambiati.

## Deploy
Sostituisci i file del repository con questa versione, fai commit/push e Vercel ridistribuirà automaticamente.
