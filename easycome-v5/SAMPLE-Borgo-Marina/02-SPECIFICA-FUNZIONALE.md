# Specifica funzionale — Borgo Marina

## Obiettivo
Gestione completa di clienti, prenotazioni, disponibilità delle risorse, preventivi, caparre, documenti, spese e attività operative in un unico ambiente.

## Moduli attivi
- Clienti e CRM\n- Attività e scadenze\n- Prenotazioni e risorse\n- Preventivi\n- Registro pagamenti e caparre\n- Spese e fornitori\n- Documenti e allegati\n- Beni e manutenzioni\n- Report e KPI\n- Portale pubblico\n- Prezzi dinamici\n- Motore automazioni\n- Utenti, ruoli e permessi

## Sezioni dati
### Clienti
- Nome / Ragione sociale (text) — obbligatorio\n- Email (email)\n- Telefono (phone)\n- Codice fiscale / P. IVA (text)\n- Note (longtext)\n\n### Attività
- Titolo (text) — obbligatorio\n- Stato (select)\n- Priorità (select)\n- Scadenza (date)\n- Responsabile (text)\n- Note (longtext)\n\n### Prenotazioni
- Cliente (text) — obbligatorio\n- Inizio (datetime) — obbligatorio\n- Fine (datetime) — obbligatorio\n- Risorsa (text)\n- Persone / quantità (number)\n- Stato (select)\n- Totale (currency)\n- Note (longtext)\n\n### Risorse
- Nome (text) — obbligatorio\n- Categoria (text)\n- Capacità (number)\n- Attiva (boolean)\n- Note (longtext)\n\n### Preventivi
- Numero (text) — obbligatorio\n- Cliente (text) — obbligatorio\n- Data (date)\n- Valido fino al (date)\n- Stato (select)\n- Totale (currency)\n- Note (longtext)\n\n### Righe preventivo
- Numero preventivo (text) — obbligatorio\n- Descrizione (text) — obbligatorio\n- Quantità (number) — obbligatorio\n- Prezzo unitario (currency) — obbligatorio\n- Totale riga (currency)\n\n### Pagamenti
- Cliente (text)\n- Data (date)\n- Importo (currency) — obbligatorio\n- Metodo (select)\n- Stato (select)\n- Riferimento (text)\n\n### Fornitori
- Ragione sociale (text) — obbligatorio\n- Referente (text)\n- Email (email)\n- Telefono (phone)\n- Note (longtext)\n\n### Spese
- Descrizione (text) — obbligatorio\n- Fornitore (text)\n- Data (date)\n- Categoria (text)\n- Importo (currency) — obbligatorio\n- Pagata (boolean)\n\n### Documenti
- Nome (text) — obbligatorio\n- Categoria (text)\n- Scadenza (date)\n- Link file (text)\n- Note (longtext)\n\n### Beni e attrezzature
- Nome (text) — obbligatorio\n- Codice (text)\n- Categoria (text)\n- Data acquisto (date)\n- Stato (select)\n- Note (longtext)\n\n### Manutenzioni
- Bene (text) — obbligatorio\n- Data (date)\n- Tipo (select)\n- Stato (select)\n- Costo (currency)\n- Note (longtext)\n\n### Richieste dal sito
- Tipo richiesta (text)\n- Nome (text) — obbligatorio\n- Email (email) — obbligatorio\n- Telefono (phone)\n- Messaggio (longtext)\n- Stato (select)\n\n### Regole prezzo
- Nome regola (text) — obbligatorio\n- Tipo (select)\n- Valore (number)\n- Attiva (boolean)\n- Configurazione (longtext)\n\n### Registro automazioni
- Automazione (text)\n- Evento (text)\n- Esito (select)\n- Dettagli (longtext)\n\n### Check-in
- Ospite (text) — obbligatorio\n- Prenotazione (text) — obbligatorio\n- Arrivo (datetime) — obbligatorio\n- Documenti (select)\n- Pagamento (select)\n- Note (longtext)\n\n### Cassa giornaliera
- Data (date) — obbligatorio\n- Descrizione (text) — obbligatorio\n- Categoria (select)\n- Importo (currency) — obbligatorio\n- Metodo (select)\n- Note (longtext)

## Automazioni
- Nuova richiesta al team: record_created → email\n- Task pre-arrivo: record_created → create_task\n- Conferma webhook: status_changed → webhook
