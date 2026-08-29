# Easy Come V10 — Intelligence OS

## Nuovo livello di prodotto
V10 unisce il gestionale Easy Come con tre moduli nativi di intelligence, senza creare un'app separata:

- **Easy Come Finance** — ricavi, costi, margine, incassi, cash flow, crediti, scaduti, concentrazione clienti, categorie di spesa e forecast a 90 giorni.
- **Easy Come Brain** — interfaccia conversazionale sui dati dell'impresa. Le risposte finanziarie sono costruite dai record del gestionale e mostrano evidenze; quando i dati cloud non sono configurati può usare esclusivamente dati demo dichiarati.
- **Audit & Controlli** — rilevazione di fatture scadute, concentrazione clienti, accelerazione dei costi, dati incompleti, possibili duplicati nei pagamenti, spese anomale e risultato negativo.
- **Actions** — coda di azioni suggerite con stati Bozza → Approvata → Eseguita → Archiviata. Le azioni sensibili non vengono eseguite automaticamente.

## Integrazione
- Nuovo preset Studio **CFO & Intelligence**.
- Nuova categoria moduli **Intelligence** nel configuratore.
- Nuovo `intelligence.html` in ogni gestionale che seleziona/usa i moduli V10, con navigazione diretta dal gestionale.
- Tabelle Supabase `brain_actions` e `audit_findings` generate nello schema cliente con lo stesso isolamento per `organization_id` delle altre entità.
- Service worker aggiornato per includere la UI Intelligence.
- Demo Factory V9 conservata e aggiornata: le demo generate includono Finance, Brain e Audit.
- Landing pubblica aggiornata con una preview Intelligence.

## Finance Engine
Il motore calcola i KPI partendo da fatture, pagamenti e spese già presenti nel gestionale:

- fatturato gestionale;
- incassi e rimborsi;
- costi e costi pagati;
- risultato e margine;
- cash flow operativo semplificato;
- crediti aperti, scaduti e in scadenza;
- serie ricavi/costi degli ultimi sei mesi;
- run-rate forecast a 90 giorni;
- concentrazione del primo cliente;
- trend dei costi recenti;
- Finance Health Score.

Le metriche sono di controllo gestionale e non sostituiscono contabilità civilistica/fiscale o consulenza professionale.

## Scenario Lab
Finance include un simulatore locale per modificare:
- ricavi %;
- costi %;
- investimento una tantum;

e vedere l'impatto stimato sul risultato a 90 giorni.

## Prezzi e checkout
I nuovi moduli sono riconosciuti sia dal calcolo browser sia dal ricalcolo server-side:
- Finance €18;
- Brain €20;
- Audit €16.

Restano applicate le regole bundle esistenti. Il server continua a rifiutare moduli sconosciuti.

## Versione
- package: `10.0.0`
- generator project: `10.0.0`
- generated package suffix: `easycome-v10.zip`
