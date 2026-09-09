# EasyCome · Website → Work

Prototipo statico della nuova EasyCome.

## Cosa dimostra

- `index.html` — landing del prodotto: **Il tuo sito dovrebbe lavorare.**
- `site.html` — sito pubblico dell'attività con booking diretto.
- `app.html` — hub operativo: Oggi, Calendario, Prenotazioni, Clienti, Sito, Automazioni e Setup.
- `assets/core.js` — unico stato condiviso in `localStorage`: una prenotazione fatta sul sito compare subito nel gestionale.
- `assets/theme.css` — design system condiviso.

## Avvio

Non serve installare nulla. Per GitHub Pages basta caricare questa cartella.

Per sviluppo locale è consigliato un piccolo server statico, ad esempio:

```bash
python3 -m http.server 8000
```

Poi aprire `http://localhost:8000`.

## Demo consigliata

1. Apri `app.html` e guarda **Oggi**.
2. Vai su **Sito** e apri il sito pubblico.
3. Fai una nuova prenotazione dal sito.
4. Torna su **Prenotazioni** o **Calendario**: la prenotazione è già entrata.
5. In **Impostazioni**, usa “Cambia mestiere in un click” per trasformare la demo da B&B a barbiere, officina o studio di consulenza.

## Nota tecnica

È un prototipo front-end: i dati sono salvati nel browser con `localStorage`. Per produzione serviranno autenticazione, database, pagamenti, invio messaggi, sincronizzazioni calendario/canali e backend sicuro.
