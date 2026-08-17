# Easy Come V19 — Test email + Posta inviata

- Ripristinato e mantenuto il messaggio outreach originale preferito, con firma `Edoardo` senza cognome.
- Aggiunto pulsante `Invia test` per spedire la stessa email a un indirizzo di prova senza segnare il prospect come contattato.
- L’invio reale continua a usare SMTP Libero.
- Dopo l’accettazione SMTP, Easy Come prova a salvare la stessa email nella cartella IMAP con flag `\Sent` / Posta inviata.
- Tracking separato: accettazione SMTP, Message-ID e stato della copia in Posta inviata.
- Nessuna nuova variabile: usa `LIBERO_SMTP_PASSWORD` anche per IMAP.
