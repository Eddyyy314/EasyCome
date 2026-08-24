# Easy Come Web — V38 Free Chat Handoff

## Principio
Easy Come prepara il contesto; la chat scelta dall’utente crea il sito; Easy Come ospita, vende e consegna. Non esiste una chiamata API generativa nel flusso Web V38.

## Master Prompt
Il prompt contiene business, dati pubblici, obiettivo, audience, differenziante, offerta, territorio, CTA, funzioni, vincoli visivi, palette e manifest degli asset. Obbliga il designer a creare un sito specifico per l’attività, statico e importabile.

## Creative Pack
`/api/web-handoff` crea un ZIP amministrativo con Master Prompt, manifest e copie delle immagini approvate. Gli URL accettati dal pack sono esclusivamente gli endpoint firmati Easy Come per Google Places e asset caricati in Easy Come.

## Design rules
- nessun template universale;
- niente stock o immagini non approvate;
- niente sezioni ripetute con copertura fotografica incoerente;
- tipografia scelta per il brand, non default generici;
- niente marquee/ticker decorativi, card soup, glassmorphism o CTA finte;
- nessun riferimento a ChatGPT, prompt o processo produttivo nel sito cliente;
- ogni azione commerciale deve portare a WhatsApp, telefono, email o richiesta reale.

## Import
Lo ZIP finale viene caricato con signed upload in Supabase Storage e passa attraverso `api/web-package-upload.js`. Il portale resta sotto `/web-sites/:slug/:token/`.

## Commerciale
Prezzo sito configurabile + implementazione fissa €50. Il cliente riceve soltanto il link Easy Come; il pacchetto si sblocca dopo il pagamento.
