# Easy Come — Automation Ecosystem

**La tua PMI. Ma automatizzata.**

Questa versione posiziona Easy Come come ecosistema per l’automazione delle PMI:

- **Gestionale Easy Come**: cuore operativo e fonte dati centrale.
- **Automazioni**: regole e flussi costruiti sul lavoro reale dell’azienda.
- **Easy Come Audit**: modulo complementare opzionale da **€100/mese**, utilizzabile solo insieme al Gestionale e collegato allo stesso database.
- **Easy Come Hub**: accesso centrale a Gestionale, Audit, assistenza e nuove funzioni.

- **Easy Come Web Factory**: individua le PMI senza sito dalla Demo Factory e genera un sito multipagina vero (Home, Servizi, Chi siamo, Contatti, Privacy, pagina richiesta/prenotazione quando serve), responsive, SEO-ready e predisposto per salvare le richieste nello stesso Gestionale Easy Come.

## Repository alleggerita per GitHub

`dist-public/` non è incluso nello ZIP perché è un output generato automaticamente e duplicava i file sorgente. È già escluso da `.gitignore`. Per ricrearlo:

```bash
npm run build
```

## Pubblicazione

La repository può essere caricata su GitHub. Per il prodotto completo (login, Supabase, Stripe, webhook e API) usa il repository collegato a Vercel o a un hosting Node/serverless compatibile. GitHub Pages da solo può mostrare la parte statica, ma non esegue le API in `api/` e `server/`.

## Sicurezza

Non caricare `.env` o chiavi reali nel repository. Usa `.env.example` come riferimento e configura le variabili sensibili sul provider di hosting.

## Web Factory

Nella Demo Factory, dopo la scansione dei contatti pubblici, le attività senza sito vengono marcate come opportunità Web Factory. Puoi:

1. generare un sito singolo e rifinirne stile, headline, CTA e colore;
2. generare in batch tutti i siti mancanti del prospect batch;
3. aprire una preview desktop/mobile;
4. scaricare un pacchetto ZIP multipagina pronto alla personalizzazione e pubblicazione;
5. quando il sito viene generato dentro un Gestionale Easy Come, collegare il modulo contatti alla tabella `public_submissions` della stessa `organization_id`.

Il generatore non usa un look “AI” o una singola landing universale: applica sistemi editoriali diversi per hospitality, appuntamenti, professionisti, retail, progetti e attività tecniche.
