# Easy Come Hospitality V13 — Autopilot

## Il prodotto in una frase

**La prenotazione entra. Easy Come porta la pratica fino alla chiusura. Tu gestisci l’ospite, non il back office.**

Easy Come non deve essere l’ennesimo gestionale che mostra calendario, ospiti, pagamenti e task. Deve essere un **motore operativo per strutture ricettive indipendenti** che trasforma ogni soggiorno in una pratica, esegue automaticamente il lavoro amministrativo possibile e porta al titolare soltanto le eccezioni che richiedono una decisione umana.

---

## Perché V12 non era ancora un prodotto “devo averlo”

La V12 aveva senso come gestionale: centralizzava dati e sezioni. Il problema è che centralizzare lavoro non equivale a eliminarlo. Se dopo aver comprato Easy Come il gestore deve ancora entrare in dieci schermate, controllare documenti, ricordarsi scadenze, copiare dati, inviare pratiche e spuntare attività, il valore percepito resta basso.

La V13 cambia l’unità fondamentale del prodotto:

**prima:** moduli e sezioni;

**adesso:** una pratica soggiorno che si completa da sola.

---

## Il nuovo oggetto centrale: Pratica soggiorno

Ogni prenotazione genera automaticamente un fascicolo unico con:

- prenotazione e soggiorno;
- dati anagrafici degli ospiti;
- documenti di identità e stato verifica;
- privacy, regole e firme;
- verifica identità visiva dove richiesta;
- saldo, caparra e tassa di soggiorno;
- stato Alloggiati Web e ricevuta;
- stato flusso statistico regionale;
- attività di pulizia collegate al check-out;
- documenti prodotti o ricevuti;
- log completo di ogni azione automatica e manuale.

Il gestore non deve più chiedersi “in quale pagina devo andare?”. Apre la pratica soltanto quando Easy Come gli segnala un’eccezione.

---

## Flusso killer: dalla prenotazione alla pratica chiusa

### 1. Arriva una prenotazione

Origine possibile: prenotazione diretta, Booking.com, Airbnb, import PMS/channel manager, email o inserimento manuale.

Easy Come crea il fascicolo, assegna camera e date, apre saldo e tassa di soggiorno, programma pulizia e adempimenti e prepara il portale ospite.

### 2. Easy Come contatta l’ospite

Invia automaticamente il link di pre-check-in e raccoglie i dati una sola volta.

L’ospite inserisce dati personali, recapiti, informazioni necessarie, documento, accettazioni, eventuale firma e preferenze di arrivo.

### 3. Easy Come legge e controlla

Il sistema estrae i dati dai documenti, verifica campi mancanti/incoerenti e riutilizza gli stessi dati per tutti gli adempimenti collegati.

Se qualcosa non torna, non crea lavoro invisibile: genera una **eccezione chiara** con il singolo intervento necessario.

### 4. Guardrail identità

La raccolta digitale dei documenti non viene confusa con la verifica visiva dell’identità. La pratica mantiene uno stato specifico “verifica de visu”. Quando la configurazione normativa lo richiede, Easy Come blocca l’invio finché il controllo non è stato completato in presenza o con una modalità visiva in tempo reale ammessa/configurata.

### 5. Easy Come esegue gli adempimenti

Quando i prerequisiti sono soddisfatti, il motore prepara/esegue gli invii disponibili tramite i connettori configurati, salva le ricevute e aggiorna il fascicolo.

I connettori prioritari sono:

- Alloggiati Web;
- portali statistici regionali/provinciali;
- sistemi comunali per imposta di soggiorno, iniziando da integrazioni con API disponibili;
- sistemi di pagamento;
- PMS/channel manager/OTA per importare le prenotazioni.

### 6. Easy Come gestisce il soggiorno

Può inviare istruzioni, reminder saldo, informazioni di arrivo e messaggi preconfigurati. Le richieste che richiedono una decisione diventano eccezioni, non semplici notifiche perse in una inbox.

### 7. Check-out e chiusura

Il check-out genera la pulizia, controlla saldo/tassa, completa ciò che manca e archivia documenti e prove. La pratica diventa “chiusa” soltanto quando tutti i passaggi richiesti sono completati o esplicitamente esclusi.

---

## La Home: “Easy Come ha lavorato per te”

La Home non deve essere una dashboard piena di grafici. Deve rispondere a tre domande:

1. **Cosa ha già fatto Easy Come oggi?**
2. **Dove serve davvero il titolare?**
3. **Quali pratiche rischiano di non chiudersi in tempo?**

La metrica principale non è il numero di prenotazioni. È il **lavoro eliminato**.

Esempi:

- 31 azioni eseguite automaticamente oggi;
- 2 eccezioni da risolvere;
- 87% delle pratiche gestite senza intervento;
- 4 h 20 min di back office stimato risparmiato questa settimana.

---

## Inbox documentale

Questa è una seconda caratteristica fortemente differenziante.

Il titolare può trascinare o inoltrare materiale senza archiviarlo manualmente: PDF, foto, fatture, documenti ospite, ricevute, email e in seguito allegati provenienti da canali di messaggistica supportati.

Easy Come prova a capire automaticamente:

- che documento è;
- a quale ospite/pratica/fornitore appartiene;
- date e importi;
- eventuale scadenza;
- dati da estrarre;
- azione successiva suggerita;
- livello di confidenza.

Se la confidenza è alta, il documento viene archiviato e collegato. Se è bassa, il gestore riceve una sola richiesta di conferma.

---

## Document Vault: tutta la struttura in ordine

Oltre ai documenti dei soggiorni, Easy Come conserva il fascicolo permanente della struttura:

- CIN;
- codice regionale/locale;
- SCIA o comunicazioni/protocolli;
- polizze;
- contratti con fornitori;
- documenti fiscali/operativi caricati;
- ricevute di invio;
- documenti con rinnovo o scadenza configurabile.

Il valore non è “cloud storage”. Il valore è: **Easy Come sa cosa contiene il documento e cosa bisogna fare dopo.**

---

## Compliance Profile

Le scadenze non devono essere hardcoded in modo generico per “l’Italia”. Ogni struttura ha un profilo composto da:

- Regione / Provincia autonoma;
- Comune;
- tipologia struttura;
- eventuali codici identificativi;
- portali e credenziali/connettori abilitati;
- periodicità e regole configurate;
- eventuali eccezioni locali.

Il prodotto deve distinguere sempre tra:

**Automatico** — Easy Come può eseguire il passaggio.

**Pronto** — Easy Come ha preparato tutto ma serve conferma/invio esterno.

**Bloccato** — manca un prerequisito.

**Manuale** — il portale/processo non consente ancora automazione affidabile.

Questa trasparenza è fondamentale: non promettere un “pilota automatico” dove tecnicamente non esiste.

---

## Autopilot per eccezioni

Il titolare deve poter impostare livelli di autonomia.

Esempi di regole:

- invia automaticamente il pre-check-in dopo la prenotazione;
- sollecita dati mancanti dopo X ore;
- sollecita saldo prima dell’arrivo;
- crea pulizia al check-out;
- archivia automaticamente documenti ad alta confidenza;
- non inviare mai un adempimento se manca un guardrail obbligatorio;
- chiedi approvazione solo per eccezioni economiche o normative.

Il design corretto non è “automazioni” come pagina separata. L’automazione deve essere il comportamento normale dell’intero prodotto.

---

## Cosa NON deve diventare Easy Come

Non deve cercare di battere subito Booking, Smoobu o Octorate sul channel management puro.

Non deve diventare un ERP gigantesco.

Non deve aggiungere 40 tab per dare l’impressione di avere più valore.

Non deve dichiarare “inviato” quando l’integrazione reale non è disponibile.

Non deve richiedere al titolare di copiare gli stessi dati in più punti.

La wedge è molto più precisa:

> **Easy Come è il back office operativo e documentale che chiude le pratiche per te.**

---

## MVP reale: ordine di sviluppo

### P0 — valore immediato

- Practice Engine e state machine;
- portale ospite;
- archivio documentale per pratica;
- extraction/OCR affidabile per documenti supportati;
- exception center;
- reminder automatici;
- payment link e riconciliazione di base;
- pulizie generate da eventi di soggiorno;
- audit log;
- Compliance Profile.

### P1 — integrazioni che rendono il prodotto indispensabile

- Alloggiati Web tramite servizio ufficiale e gestione ricevute;
- primo adapter statistico regionale end-to-end;
- PayTourist/altro partner comunale con API, dove disponibile;
- import prenotazioni da almeno un PMS/channel manager o feed supportato;
- ingest email/PDF;
- sincronizzazione calendario dove necessaria.

### P2 — moltiplicatori

- più adapter regionali e comunali;
- inbox messaggistica multicanale;
- suggerimenti AI per eccezioni e messaggi;
- contabilità documentale base;
- gestione manutenzioni/fornitori;
- automazioni personalizzate no-code.

---

## KPI di prodotto

Le metriche da mostrare al cliente e da usare internamente sono:

- percentuale pratiche chiuse senza intervento;
- minuti medi di lavoro manuale per soggiorno;
- numero di eccezioni per 100 soggiorni;
- tasso di completamento pre-check-in;
- invii completati / invii falliti;
- percentuale documenti classificati senza intervento;
- saldo insoluto prima dell’arrivo;
- tempo medio tra prenotazione e pratica pronta;
- ore di back office stimate risparmiate.

---

## Modello commerciale consigliato

Per un prodotto che mantiene integrazioni con portali, regole locali, document intelligence e automazioni, il one-time puro non è coerente con il costo e con il valore creato.

Proposta semplice da testare:

**Easy Come Autopilot — €49/mese fino a 5 alloggi + €149 onboarding.**

Poi **€6/mese per ogni alloggio aggiuntivo**.

Niente commissione sulle prenotazioni. Niente prezzo nascosto. Onboarding significa configurazione struttura, profilo adempimenti e collegamento dei connettori disponibili.

Prima di fissare definitivamente il prezzo va misurato il valore reale generato nell’MVP: se Easy Come elimina diverse ore al mese e riduce errori/scadenze, €49/mese diventa una spesa operativa molto più facile da giustificare di un software che mostra soltanto dati.

---

## Pitch commerciale

### Headline

**La prenotazione entra. Il back office si fa da solo.**

### Subheadline

Easy Come raccoglie dati e documenti, prepara le pratiche, segue adempimenti, incassi, scadenze e pulizie. Tu intervieni solo quando serve davvero.

### Demo da vendere in 90 secondi

1. Entra una prenotazione.
2. Nasce automaticamente la pratica.
3. Parte il link all’ospite.
4. Il documento viene acquisito e controllato.
5. Easy Come mostra il guardrail che manca.
6. Il gestore conferma la verifica richiesta.
7. La pratica procede, vengono aggiornati adempimenti e ricevute.
8. Il check-out genera la pulizia.
9. La Home torna a “0 eccezioni”.
10. Report: minuti e operazioni risparmiati.

Questa demo vende il **risultato**, non le feature.

---

## Stato del prototipo V13 incluso nel repository

La demo V13 implementa l’esperienza prodotto e la logica simulata di:

- Autopilot Home;
- Practice Engine;
- fascicolo con tab ospite/documenti/adempimenti/incassi/log;
- guest portal;
- verifica identità de visu come guardrail;
- Inbox documentale;
- Document Vault;
- Compliance connector center;
- Scadenze per soggiorno/mese/struttura;
- report sul lavoro eliminato;
- regole di autonomia;
- creazione di una nuova prenotazione che avvia automaticamente la pratica.

**Importante:** il prototipo dimostra il prodotto e i flussi. Gli invii esterni mostrati come “demo” non sono da considerare integrazioni live finché non vengono collegati ai relativi servizi, credenziali e adapter di produzione.
