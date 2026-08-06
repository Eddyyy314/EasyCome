# NOC Core v1

Base gestionale modulare e riutilizzabile per piccole attività.

## Cosa contiene
- Dashboard KPI
- Attività / prenotazioni
- Calendario per risorsa
- Gestione risorse
- Anagrafica clienti
- Pagamenti
- Preset settore
- Etichette personalizzabili
- Backup JSON
- Export CSV
- Persistenza locale via localStorage
- Layout responsive desktop/mobile

## Preset inclusi
- Area camper
- Hotel / B&B
- Parrucchiere / Salone
- Autonoleggio
- Centro sportivo
- Ristorante

## Come provarlo
Apri `index.html` in un browser moderno.

Per evitare limitazioni del browser con file locali, puoi anche servire la cartella con un server statico, ad esempio:

```bash
python -m http.server 8080
```

poi visita `http://localhost:8080`.

## Architettura logica
Il modello base è:

`Cliente + Attività + Risorsa + Data + Stato + Pagamento`

Le etichette vengono cambiate dalle impostazioni. Lo stesso motore può quindi diventare:

- Ospite + Prenotazione + Piazzola
- Ospite + Prenotazione + Camera
- Cliente + Appuntamento + Postazione
- Cliente + Noleggio + Veicolo
- Cliente + Prenotazione + Campo
- Cliente + Prenotazione + Tavolo

## Stato della versione
Questa è una base frontend funzionante. Salva i dati nel browser del dispositivo e NON è ancora un SaaS cloud multiutente.

Per una versione commerciale completa, i prossimi livelli naturali sono:
1. database cloud e autenticazione;
2. ruoli staff/admin;
3. API / webhook / Make;
4. moduli attivabili per cliente;
5. deploy e dominio;
6. fatturazione/abbonamenti;
7. onboarding automatico cliente.
