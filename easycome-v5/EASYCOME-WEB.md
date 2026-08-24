> **V32 Browser Compiler:** import AI Studio senza Vite/Rollup runtime; TSX/JSX viene trasformato con un compilatore JavaScript puro e le dipendenze browser arrivano via ESM CDN.

# Easy Come Web — V30 Zero‑Touch Builder

Easy Come Web è un prodotto autonomo del brand Easy Come. La Factory individua PMI senza sito proprietario, prepara il Brand/Creative Build Pack e trasforma il progetto finito in una proposta commerciale ospitata direttamente da Easy Come.

## Regola immagini: Asset Lock

Le foto pubbliche recuperate da Google/social NON vengono più selezionate automaticamente. L'admin deve riconoscere ogni asset e indicarne il ruolo (prodotto, locale, logo, team, lavoro, territorio o altra foto originale). Solo gli asset approvati entrano nel manifest passato al generatore.

Il Master Prompt e tutti i Quality Gate vietano di generare, cercare o sostituire immagini non presenti nell'Approved Visual Asset Manifest. Se non esiste una foto approvata adatta a una sezione, il sito deve essere progettato senza fotografia in quella sezione.

## Flow di vendita

1. Factory → prospect senza sito proprietario.
2. Web Studio → approvazione asset + Brand DNA + Creative Build Pack.
3. Google AI Studio → generazione e Quality Gate.
4. Production Pass → controllo visuale/funzionale del progetto. Non serve creare manualmente `dist/`.
5. Download dello ZIP sorgente direttamente da Google AI Studio.
6. Factory → **Importa in Easy Come**.
7. Easy Come carica il ZIP direttamente su Supabase Storage tramite signed upload, senza far transitare il file nella Function Vercel.
8. Easy Come verifica il pacchetto, trova la cartella pubblicabile e ospita i file sotto `/web-sites/<prospect>/<token>/`.
9. Easy Come genera il portale/proposta privata con preview + checkout Stripe.
10. Il cliente riceve solo il link Easy Come. Lo ZIP non viene allegato al messaggio.
11. Dopo il pagamento il portale sblocca anche il download del pacchetto completo.

## Formati ZIP accettati

L’importer accetta direttamente:

- `dist/index.html`, `build/index.html`, `out/index.html`;
- siti statici completi;
- progetti React/Vite classici con `src/`;
- export recenti di Google AI Studio con `App.tsx`, `index.tsx`, componenti e `package.json` direttamente nella root.

Quando riceve sorgenti, Easy Come rileva l’entrypoint dal vero `index.html`, usa una configurazione Vite controllata, risolve le librerie già comprese nel runtime Easy Come e installa in una directory temporanea soltanto le ulteriori dipendenze effettivamente importate, con lifecycle script disabilitati.

## Storage

Variabili richieste:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_WEB_BUCKET=easycome-web-projects`
- `EASYCOME_WEB_ASSET_SECRET`

Il bucket rimane privato. Le preview vengono servite da Easy Come; gli asset binari grandi vengono forniti con signed URL temporanee.

## V29 — Direct ZIP Auto Build

La Factory non richiede più URL preview esterni. Il flusso è: Google AI Studio → Download ZIP → Importa in Easy Come → portale cliente.

L'importer accetta:
- build statiche con `dist/index.html`, `build/index.html` o `out/index.html`;
- siti statici completi;
- progetti React/Vite sorgente con `package.json`, `index.html` e `src/`.

Quando riceve un progetto React/Vite sorgente, Easy Come esegue una build server-side con base path del portale, pubblica gli asset nello Storage privato e crea automaticamente la preview Easy Come. Non serve `npm run build` manuale.

Il browser forza una nuova versione di `factory.js` a ogni release importante per evitare che una Factory vecchia rimanga in cache.

## V30 — Zero‑Touch Build

Il flusso definitivo è: **AI Studio → Download ZIP → Easy Come → Importa e crea portale**. Non servono Publish in AI Studio, terminale, GitHub, Vercel manuale o `npm run build` per il singolo prospect. Il risultato compilato viene pubblicato nel portale Easy Come; il sorgente originale resta privato e può essere sbloccato al cliente dopo il checkout.
