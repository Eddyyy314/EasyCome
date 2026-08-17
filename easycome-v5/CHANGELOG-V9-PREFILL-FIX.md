# Easy Come V9 — Demo → Studio Prefill Fix

- Il pulsante **Personalizza questa versione** apre Easy Come Studio partendo esattamente dal progetto della demo.
- Il prospect entra direttamente nel passaggio Funzioni con i moduli della demo già selezionati.
- Le funzioni restano modificabili: si possono togliere o aggiungere e il totale si aggiorna.
- Il totale iniziale dello Studio viene allineato al prezzo mostrato nella demo.
- Il modulo **Prezzi dinamici** ora è cliccabile: selezionarlo attiva automaticamente la modalità prezzi dinamici; rimuoverlo la disattiva.
- Nella Struttura, la sezione Regole prezzo ha un pulsante Configura che porta direttamente alle regole di prezzo.
- Email mittente outreach corretta in `infoeasycome@libero.it`.
- Le demo prospect non ereditano email o telefono dell'account Easy Come eventualmente aperto nel browser.

## V14 — deterministic demo → Studio handoff
- Prospect Studio no longer waits for the `easycome:account-ready` event.
- `?demo=<slug>` has absolute priority over account, cloud and local drafts.
- Demo page stores the exact backend project in a short-lived `sessionStorage` handoff before navigation.
- Studio refetches the demo from the backend and uses the handoff only as a network fallback.
- If the proposal cannot be loaded, Studio shows a retry state instead of opening a blank/unrelated configuration.
