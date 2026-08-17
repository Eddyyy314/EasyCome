# Easy Come V9 — Demo Factory

Questa versione integra la Demo Factory direttamente nell'Easy Come v8.8 esistente.

## 1. Supabase
Apri Supabase > SQL Editor ed esegui `SUPABASE_V9_DEMO_FACTORY.sql` una sola volta.

## 2. Vercel
Aggiungi alle Environment Variables:

- `GOOGLE_PLACES_API_KEY` = chiave Google Cloud con Places API (New) abilitata
- `APP_URL` = `https://www.easy-come.it` (oppure il dominio effettivo)

Le variabili Easy Come già esistenti (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, Stripe...) restano invariate.

## 3. Google Cloud
Abilita Places API (New) sul progetto della chiave. Limita la chiave alle API necessarie e configura quote/budget alert.

## 4. Utilizzo
1. Vai su `/admin.html` e accedi come amministratore.
2. Clicca `Demo Factory` nella sidebar.
3. Seleziona 25, 50 o 100.
4. Premi `Trova e genera le demo`.
5. Copia link o messaggio per ogni attività.
6. Il batch successivo esclude automaticamente ogni `place_id` già salvato.

## Come funziona la personalizzazione
- Google Places viene interrogato lato server.
- Le query ruotano automaticamente tra città e categorie italiane.
- Ogni risultato viene classificato in un template Easy Come (officina, hospitality, beauty, fitness, sanitario, studio professionale, ristorazione, retail, servizi/cantieri, generico).
- Il database conserva il Place ID per evitare duplicati e una configurazione Easy Come proprietaria.
- I dati Google visibili nella demo vengono richiamati live tramite Place Details.
- La demo dura 7 giorni.
- Cliccando `Personalizzalo` il prospect arriva in Easy Come Studio con il progetto già precaricato.

## Nota Google Maps Platform
La UI include attribuzione `Google Maps`. I Place ID possono essere conservati per deduplicazione. Verifica sempre i termini Google Maps Platform e le regole applicabili al tuo account/billing address, soprattutto per caching, attribuzione e uso dei contenuti Places.

## V13 — invio email reale da Libero

In Vercel → Settings → Environment Variables aggiungi:

- `LIBERO_SMTP_USER` = `infoeasycome@libero.it` (opzionale: è già il default)
- `LIBERO_SMTP_PASSWORD` = la password dell'account Libero

Salva almeno su Production e fai un nuovo Redeploy. Non inserire mai la password in GitHub, `.env.example` o nel frontend. Il pulsante **Invia email** userà l'SMTP Libero server-side e il mittente reale sarà `Edoardo | Easy Come <infoeasycome@libero.it>`.
