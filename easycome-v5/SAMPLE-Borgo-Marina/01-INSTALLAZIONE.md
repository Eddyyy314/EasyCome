# INSTALLAZIONE SEMPLICE

## Prova senza configurazione

1. Apri la cartella.
2. Avvia un server statico con `npx serve .`.
3. Entra in modalità demo.
4. I dati restano nel browser.

## Metti online il gestionale

### Supabase

1. Crea un progetto.
2. Esegui `supabase/schema.sql` nel SQL Editor.
3. Incolla URL e publishable key in `js/config.js`.
4. In Authentication → URL Configuration inserisci il dominio finale.

### Vercel

1. Carica questa cartella in un repository GitHub.
2. Importa il repository su Vercel.
3. Framework: Other.
4. Nessun build command obbligatorio.
5. Output directory: `.`.

### Netlify

Trascina la cartella nella schermata Deploy oppure collega il repository.

## Primo accesso

Registrati dal gestionale con l’email del titolare configurata nel progetto: **direzione@borgomarina.example**. Se la conferma email è attiva, conferma l’indirizzo. La RPC `claim_owner_by_email` rifiuta indirizzi diversi.

## Portale pubblico

È attivo in `portal.html`.
