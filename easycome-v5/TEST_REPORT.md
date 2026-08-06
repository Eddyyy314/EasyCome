# Easy Come Studio V6 — Test report

Data verifica: 5 agosto 2026

## Risultato

**PASS** per struttura, generazione pacchetti, prezzi, build pubblica e file binari.

## Test eseguiti

- 10 modelli aziendali generati;
- punteggio qualità minimo: 100/100 nei modelli standard;
- da 38 a 53 file generati nei modelli standard;
- modello completo con sito, PWA, AI e brand kit;
- coerenza prezzo browser/server per tutti i modelli;
- implementazione da €150 applicata soltanto quando selezionata;
- ZIP browser e ZIP server validi;
- workbook Excel importato con `artifact_tool`;
- 9 fogli rilevati nel workbook campione;
- nessun errore formula evidente (#REF, #DIV/0, #VALUE, #NAME, #N/A);
- dashboard Excel renderizzata e ispezionata;
- manuale PDF renderizzato senza testo tagliato o sovrapposto;
- sintassi verificata per tutti i file JavaScript, API e script;
- build Vercel pubblica completata;
- `builder.html`, `zip.js` e template interni esclusi dalla build pubblica;
- pagina di successo collegata a `/api/generate-delivery`;
- endpoint di consegna bloccato se Stripe non restituisce `payment_status=paid`;
- schema ordini con `delivery_status`, `download_count` e `last_downloaded_at`;
- integrità dello ZIP dimostrativo verificata con `unzip -t`.

## Pacchetto campione

Atelier Nova:

- 55 file;
- gestionale, portale e database;
- Excel e CSV;
- manuale PDF;
- sito pubblico;
- app PWA;
- brand kit;
- AI configurabile;
- workflow n8n e piano Make;
- totale simulato: €193,40;
- qualità: 97/100.

## Non verificato in questo ambiente

- pagamento Stripe reale o Sandbox con le credenziali dell'utente;
- ricezione webhook sul dominio `easy-come.it`;
- scrittura reale degli ordini nel progetto Supabase dell'utente;
- download post-pagamento su Vercel con le variabili dell'utente;
- invio reale di email, WhatsApp o richieste AI.

Questi punti richiedono le credenziali e gli account esterni dell'utente. Il test finale va eseguito in Sandbox dopo il deploy.
