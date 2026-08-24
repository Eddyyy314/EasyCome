# Easy Come Web — V27 Brand DNA + Proposal Commerce

Easy Come Web è un prodotto indipendente del brand Easy Come.

## Flow definitivo

1. La Factory trova una PMI e distingue sito proprietario, social e portali esterni.
2. `Crea sito premium` apre il Creative Director Engine.
3. **Brand Intelligence** recupera le foto disponibili da Google Places e le mostra come riferimenti reali. Facebook/Instagram/Google Maps non vengono mai classificati come sito proprietario.
4. Il browser analizza le immagini selezionate e ricava una palette reale. Logo/foto originali caricati dall’admin vengono salvati in Easy Come, diventano URL di riferimento temporanei accessibili al motore creativo e hanno priorità nel Brand DNA.
5. Il Build Pack V3 passa ad AI Studio: dati reali, immagini reali/reference, colori reali, strategia, Design DNA e tre Quality Gate anti-AI.
6. AI Studio genera il progetto. Le immagini reference vengono mantenute centralizzate per essere sostituite velocemente con asset autorizzati prima della pubblicazione definitiva.
7. Quando il sito è finito, in Factory premi **Importa sito finito**.
8. Inserisci URL preview, prezzo e ZIP finale. Easy Come carica il pacchetto in Supabase Storage e crea una proposta privata.
9. Easy Come copia un link del tipo `/web-proposal.html?d=...&t=...`.
10. Il prospect apre il link: vede il suo sito dentro una pagina Easy Come, il prezzo e il checkout Stripe.
11. Dopo il pagamento il webhook marca la proposta come acquistata e invia la notifica Easy Come.

## Regole Brand DNA

- I colori non vengono scelti dalla palette Easy Come.
- Se esistono logo/foto/asset reali, sono la fonte principale dell'art direction.
- Le foto pubbliche da Google Places sono mostrate con le attribution restituite da Google e vanno considerate riferimento/private proposal finché i diritti di pubblicazione non sono confermati.
- Il prompt vieta i pattern tipici da landing AI e obbliga il modello a costruire la composizione attorno al materiale reale.
- L'identità deve sembrare dell'attività, non del generatore.

## Storage proposte

Il pacchetto ZIP viene salvato in un bucket Supabase privato. Default: `easycome-web-proposals`. La Factory prova a crearlo automaticamente con service role se non esiste.

Variabili:

```env
EASYCOME_WEB_ASSET_SECRET=una-stringa-lunga-casuale
SUPABASE_WEB_BUCKET=easycome-web-proposals
```

Il pacchetto massimo accettato dalla Factory è 15 MB.

## Checkout proposta

Il checkout Easy Come Web è one-time e non richiede un account Easy Come preventivo. Il prezzo è deciso dall'admin quando pubblica la proposta. Stripe riceve metadata `purchase_type=web_proposal`, `demo_slug` e `proposal_token`.

## Note operative

Le reference Google Places vengono risolte al momento della richiesta tramite Place ID + indice, senza persistere il photo resource name nel Build Pack. Le foto pubbliche servono soprattutto per costruire rapidamente la proposta privata; prima del go-live va comunque confermato il diritto di utilizzo degli asset definitivi del cliente.
