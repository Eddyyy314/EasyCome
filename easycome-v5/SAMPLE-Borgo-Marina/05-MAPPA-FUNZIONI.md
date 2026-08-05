# Mappa delle funzioni

## Funzioni trasversali
- login e recupero password;
- ruoli owner, admin, member e viewer;
- dashboard con KPI calcolati dai dati;
- ricerca, filtri e ordinamento;
- importazione ed esportazione CSV;
- backup e ripristino JSON;
- stampa di preventivi, ordini e fatture;
- caricamento documenti su Storage privato;
- controllo sovrapposizioni per prenotazioni, appuntamenti e turni;
- audit log delle modifiche;
- PWA e utilizzo responsive.

## Sezioni generate
| Sezione | Campi | Viste | Operazioni |
|---|---:|---|---|
| Clienti | 5 | Tabella, Schede | CRUD, ricerca, CSV |
| Attività | 6 | Tabella, Bacheca, Agenda | CRUD, ricerca, CSV |
| Prenotazioni | 8 | Tabella, Bacheca, Agenda | CRUD, ricerca, CSV |
| Risorse | 5 | Tabella, Schede | CRUD, ricerca, CSV |
| Preventivi | 7 | Tabella, Bacheca, Agenda | CRUD, ricerca, CSV |
| Righe preventivo | 5 | Tabella | CRUD, ricerca, CSV |
| Pagamenti | 6 | Tabella, Bacheca, Agenda | CRUD, ricerca, CSV |
| Fornitori | 5 | Tabella | CRUD, ricerca, CSV |
| Spese | 6 | Tabella, Agenda | CRUD, ricerca, CSV |
| Documenti | 5 | Tabella, Agenda | CRUD, ricerca, CSV |
| Beni e attrezzature | 6 | Tabella, Bacheca, Agenda | CRUD, ricerca, CSV |
| Manutenzioni | 6 | Tabella, Bacheca, Agenda | CRUD, ricerca, CSV |
| Richieste dal sito | 6 | Tabella, Bacheca | CRUD, ricerca, CSV |
| Regole prezzo | 5 | Tabella | CRUD, ricerca, CSV |
| Registro automazioni | 4 | Tabella, Bacheca | CRUD, ricerca, CSV |
| Check-in | 6 | Tabella, Agenda | CRUD, ricerca, CSV |
| Cassa giornaliera | 6 | Tabella, Agenda | CRUD, ricerca, CSV |

## Integrazioni esterne
Le automazioni email, webhook, AI e pagamenti diventano operative soltanto dopo aver configurato le credenziali indicate in ".env.example" e aver eseguito i relativi test.
