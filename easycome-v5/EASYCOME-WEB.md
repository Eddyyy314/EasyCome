# Easy Come Web — Creative Director Engine V26

Easy Come Web è un prodotto autonomo del brand Easy Come. Non richiede il Gestionale, Audit o Hub cliente.

## Cosa cambia in V26

Easy Come **non genera più internamente il sito con template** e non usa Lovable. La Factory agisce come una mini web agency automatizzata: identifica le PMI senza sito proprietario, raccoglie i dati reali, costruisce strategia e direzione creativa, quindi prepara un **Creative Build Pack** per Google AI Studio Build.

Il Build Pack contiene:

- Master Build Prompt specifico per l'attività;
- dati reali dell'impresa e vincoli contro le allucinazioni;
- obiettivo, pubblico, differenziazione, offerta, personalità e territorio;
- riferimenti e immagini opzionali;
- regole anti-template / anti-look-AI;
- Creative Director Quality Gate;
- Mobile Quality Gate;
- Production Quality Gate;
- file Markdown scaricabile e riutilizzabile.

## Regola presenza web

Un URL viene considerato **sito proprietario** solo se è un vero sito dell'attività.

Non contano come sito:

- Facebook / Instagram / TikTok / altri social;
- Linktree e link-in-bio;
- Google Maps / pagine Google;
- Booking / Airbnb / TripAdvisor / TheFork;
- directory e marketplace terzi.

Questi canali restano utili come fonti e contatti, ma la Factory mostra `SOLO SOCIAL` o `SOLO PORTALE ESTERNO` e continua a considerare l'azienda un'opportunità Easy Come Web.

## Flow operativo

1. Demo Factory trova l'attività.
2. Web Intelligence classifica la presenza web.
3. `Crea sito premium` apre il Creative Director Engine.
4. L'operatore inserisce solo le informazioni che conosce; i campi mancanti non vengono inventati.
5. `Crea Build Pack` salva il master prompt e tre passaggi di QA.
6. `Copia + apri AI Studio` copia il Master Prompt e apre Google AI Studio Build.
7. In AI Studio si incolla il prompt e si genera il sito.
8. Si eseguono in sequenza Creative Review, Mobile Pass e Production Pass.
9. Il progetto finale può essere esportato come ZIP o sincronizzato a GitHub dall'ambiente AI Studio.

## Perché non c'è auto-submit

La V26 non usa URL non documentati per precompilare Google AI Studio. Il passaggio è volutamente trasparente: la Factory copia il Master Prompt e apre Build; l'operatore lo incolla. Questo evita dipendenze fragili e mantiene il Build Pack riutilizzabile.

## Principio qualità

Se un sito potrebbe appartenere a cinque attività diverse cambiando soltanto logo e testo, non è abbastanza specifico. Il Quality Gate ordina al motore di ridisegnare le parti generiche, non semplicemente di descriverne i difetti.
