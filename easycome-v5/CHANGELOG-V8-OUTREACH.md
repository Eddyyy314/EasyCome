# Easy Come V8 — Outreach Engine

## Cosa cambia

- La Demo Factory mostra **solo l'email** come contatto commerciale.
- Dopo aver selezionato un prospect, Easy Come recupera il sito pubblico da Google Places e prova a trovare una **email aziendale pubblicata sul sito**.
- Nessuna email viene inventata: se non viene trovata, la riga mostra `Email non trovata`.
- Nuovo pulsante **Manda email**: apre Gmail con destinatario, oggetto, testo, link demo e prezzo già compilati.
- Mittente operativo impostato per ora su `edoardolaneve8@gmail.com` (tramite `authuser` di Gmail; l'account deve essere già collegato nel browser).
- Messaggio commerciale riscritto: presentazione Easy Come, demo gratuita, gestionali da 99 €, prezzo della configurazione e CTA alla personalizzazione.
- Ogni demo riceve un **prezzo indicativo calcolato sui moduli e sulla complessità del progetto generato**.
- Il prezzo viene salvato dentro `demo_config`, così Factory e demo pubblica mostrano lo stesso importo.
- La demo pubblica mostra `Questa configurazione: €X una tantum` e ricorda che Easy Come parte da 99 €.
- Le nuove demo salvano uno snapshot minimo dell'attività dentro `demo_config`: la visualizzazione pubblica non deve richiamare Google Places a ogni apertura.
- Place Details viene usato soltanto sui prospect selezionati per recuperare il sito necessario alla ricerca email.

## Setup

Nessuna nuova variabile Vercel e nessuna nuova migrazione SQL sono richieste rispetto alla V7.
