# V13 — Invio reale da Libero

- Il pulsante outreach non apre più Gmail o il client predefinito.
- Invio server-side tramite SMTP Libero da `infoeasycome@libero.it`.
- SMTP: `smtp.libero.it`, porta 465, SSL/TLS, autenticazione obbligatoria.
- Nuove env Vercel: `LIBERO_SMTP_USER` e `LIBERO_SMTP_PASSWORD`.
- La password non viene mai inclusa nel repository o nel frontend.
- Il pulsante mostra stato Invio / Inviata ed eventuali errori di configurazione.
