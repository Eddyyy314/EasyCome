# Test Easy Come Hospitality V12

## Build
- `npm run build`: PASS
- `dist-public/preview.html`: presente
- JavaScript core/factory/hospitality: syntax PASS

## Preview
- Home: nessun iframe live incorporato nella hero.
- Home: il teaser mantiene proporzioni fisse e apre `preview.html`.
- Configuratore: la preview non è più incorporata in fondo pagina.
- Configuratore: salva il progetto corrente in sessionStorage e apre `preview.html`.
- `preview.html`: pagina dedicata full viewport, iframe PMS 100% x 100% dell'area disponibile.
- Preview: usa il motore Hospitality interattivo già esistente, con navigazione interna senza cambio pagina.

## Factory
- Quantità minima server: 5.
- Vecchio limite per-template rimosso: una ricerca Hospitality da 5 non è più fermata a 2 risultati.
- Google Places Text Search: page size 20.
- Concorrenza ricerca: 8 query per wave.
- Piano query ampliato a località turistiche aggiuntive.
- Limite di sicurezza ampliato fino a 240 query quando necessario.
- Duplicati già usati e duplicati nel batch continuano a essere esclusi.

## Nota
La Factory può richiedere e cercare almeno 5 nuovi target per batch. Se Google Places o l'insieme dei Place ID non ancora usati non restituiscono abbastanza strutture valide, il sistema non inventa lead: restituisce il numero reale trovato e segnala che la ricerca estesa è stata completata.
