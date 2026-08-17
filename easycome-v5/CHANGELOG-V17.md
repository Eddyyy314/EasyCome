# Easy Come V17 — Prospect History

- Tutte le campagne Demo Factory precedenti sono riapribili dalla Factory.
- Ogni prospect ha uno stato persistente `Da contattare` / `Contattata`.
- Filtri rapidi: Tutte, Da contattare, Contattate.
- Le email inviate con successo da Easy Come segnano automaticamente il prospect come contattato.
- Gli stati manuali vengono salvati nel JSON `demo_config.outreach`, quindi non richiedono nuove colonne o SQL.
- Riaprendo una vecchia campagna, Easy Come ricostruisce demo, prezzo e messaggio e aggiorna live i canali pubblici tramite Place ID.
