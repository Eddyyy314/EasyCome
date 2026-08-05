window.APP_CONFIG = {
  "supabaseUrl": "INSERISCI_PROJECT_URL",
  "supabaseAnonKey": "INSERISCI_PUBLISHABLE_KEY",
  "project": {
    "version": "2.0.0",
    "generatedAt": "2026-08-03T11:33:46.776Z",
    "organizationId": "724cadc7-4799-4f21-aa24-008374af0eb2",
    "company": {
      "name": "Borgo Marina",
      "slug": "borgo-marina",
      "industry": "Ospitalità e servizi",
      "description": "Gestione completa di clienti, prenotazioni, disponibilità delle risorse, preventivi, caparre, documenti, spese e attività operative in un unico ambiente.",
      "email": "direzione@borgomarina.example",
      "phone": "+39 0974 000000",
      "primaryColor": "#e95d2a",
      "accentColor": "#16332d",
      "surfaceColor": "#ffffff",
      "currency": "EUR",
      "locale": "it-IT",
      "logoData": "",
      "style": "signature"
    },
    "modules": [
      "crm",
      "tasks",
      "bookings",
      "quotes",
      "payments",
      "expenses",
      "documents",
      "assets",
      "reports",
      "portal",
      "dynamic_pricing",
      "automations",
      "multiuser"
    ],
    "customEntities": [
      {
        "key": "checkins",
        "label": "Check-in",
        "singular": "Check-in",
        "fields": [
          {
            "key": "guest_name",
            "label": "Ospite",
            "type": "text",
            "required": true
          },
          {
            "key": "booking_number",
            "label": "Prenotazione",
            "type": "text",
            "required": true
          },
          {
            "key": "arrival_date",
            "label": "Arrivo",
            "type": "datetime",
            "required": true
          },
          {
            "key": "document_status",
            "label": "Documenti",
            "type": "select",
            "options": [
              "Da ricevere",
              "Completi",
              "Verificati"
            ]
          },
          {
            "key": "payment_status",
            "label": "Pagamento",
            "type": "select",
            "options": [
              "Da saldare",
              "Caparra",
              "Saldato"
            ]
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "daily_cash",
        "label": "Cassa giornaliera",
        "singular": "Movimento",
        "fields": [
          {
            "key": "movement_date",
            "label": "Data",
            "type": "date",
            "required": true
          },
          {
            "key": "description",
            "label": "Descrizione",
            "type": "text",
            "required": true
          },
          {
            "key": "category",
            "label": "Categoria",
            "type": "select",
            "options": [
              "Incasso",
              "Spesa",
              "Caparra",
              "Rimborso"
            ]
          },
          {
            "key": "amount",
            "label": "Importo",
            "type": "currency",
            "required": true
          },
          {
            "key": "method",
            "label": "Metodo",
            "type": "select",
            "options": [
              "Contanti",
              "Carta",
              "Bonifico"
            ]
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      }
    ],
    "automations": [
      {
        "id": "1e137f30-d6d0-451a-b681-f82cbc311d4a",
        "name": "Nuova richiesta al team",
        "trigger": "record_created",
        "entity": "public_submissions",
        "action": "email",
        "target": "direzione@borgomarina.example",
        "message": "Nuova richiesta ricevuta dal portale.",
        "enabled": true
      },
      {
        "id": "e71b0683-3e00-4c13-88b7-99aca5120ff1",
        "name": "Task pre-arrivo",
        "trigger": "record_created",
        "entity": "bookings",
        "action": "create_task",
        "target": "",
        "message": "Verifica documenti e saldo prima dell’arrivo.",
        "enabled": true
      },
      {
        "id": "1df53b3e-33be-44b5-a68d-2a21588b6a52",
        "name": "Conferma webhook",
        "trigger": "status_changed",
        "entity": "bookings",
        "action": "webhook",
        "target": "https://example.com/make-webhook",
        "message": "Prenotazione confermata.",
        "enabled": true
      }
    ],
    "portal": {
      "enabled": true,
      "type": "booking",
      "title": "Verifica disponibilità e richiedi il tuo soggiorno",
      "successMessage": "Richiesta ricevuta. Ti risponderemo con disponibilità e riepilogo.",
      "collect": [
        "name",
        "email",
        "phone",
        "message"
      ]
    },
    "pricing": {
      "enabled": true,
      "basePrice": 35,
      "unit": "notte",
      "taxPerPerson": 1.8,
      "depositPercent": 30,
      "rules": [
        {
          "type": "date_range",
          "name": "Alta stagione",
          "from": "2026-08-01",
          "to": "2026-08-31",
          "multiplier": 1.35
        },
        {
          "type": "weekday_multiplier",
          "name": "Weekend",
          "days": [
            5,
            6
          ],
          "multiplier": 1.12
        },
        {
          "type": "duration_discount",
          "name": "Settimana",
          "min": 7,
          "percent": 8
        },
        {
          "type": "promo",
          "name": "Promo ritorno",
          "code": "TORNA10",
          "percent": 10
        }
      ],
      "extras": [
        {
          "id": "late",
          "name": "Check-in serale",
          "price": 15,
          "required": false
        },
        {
          "id": "pet",
          "name": "Animale",
          "price": 8,
          "required": false
        }
      ]
    },
    "delivery": {
      "packagePrice": 99,
      "implementationPrice": 150,
      "implementationSelected": false,
      "notes": "Pacchetto software. Implementazione assistita disponibile separatamente.",
      "supportDays": 30,
      "previewApproved": true
    },
    "entities": [
      {
        "key": "customers",
        "label": "Clienti",
        "singular": "Cliente",
        "icon": "users",
        "fields": [
          {
            "key": "name",
            "label": "Nome / Ragione sociale",
            "type": "text",
            "required": true
          },
          {
            "key": "email",
            "label": "Email",
            "type": "email"
          },
          {
            "key": "phone",
            "label": "Telefono",
            "type": "phone"
          },
          {
            "key": "tax_code",
            "label": "Codice fiscale / P. IVA",
            "type": "text"
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "tasks",
        "label": "Attività",
        "singular": "Attività",
        "icon": "check-square",
        "fields": [
          {
            "key": "title",
            "label": "Titolo",
            "type": "text",
            "required": true
          },
          {
            "key": "status",
            "label": "Stato",
            "type": "select",
            "options": [
              "Da fare",
              "In corso",
              "Completata"
            ]
          },
          {
            "key": "priority",
            "label": "Priorità",
            "type": "select",
            "options": [
              "Bassa",
              "Media",
              "Alta",
              "Urgente"
            ]
          },
          {
            "key": "due_date",
            "label": "Scadenza",
            "type": "date"
          },
          {
            "key": "assignee",
            "label": "Responsabile",
            "type": "text"
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "bookings",
        "label": "Prenotazioni",
        "singular": "Prenotazione",
        "icon": "calendar",
        "fields": [
          {
            "key": "customer_name",
            "label": "Cliente",
            "type": "text",
            "required": true
          },
          {
            "key": "start_at",
            "label": "Inizio",
            "type": "datetime",
            "required": true
          },
          {
            "key": "end_at",
            "label": "Fine",
            "type": "datetime",
            "required": true
          },
          {
            "key": "resource_name",
            "label": "Risorsa",
            "type": "text"
          },
          {
            "key": "people",
            "label": "Persone / quantità",
            "type": "number"
          },
          {
            "key": "status",
            "label": "Stato",
            "type": "select",
            "options": [
              "Richiesta",
              "Confermata",
              "Completata",
              "Annullata"
            ]
          },
          {
            "key": "total",
            "label": "Totale",
            "type": "currency"
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "resources",
        "label": "Risorse",
        "singular": "Risorsa",
        "icon": "grid",
        "fields": [
          {
            "key": "name",
            "label": "Nome",
            "type": "text",
            "required": true
          },
          {
            "key": "category",
            "label": "Categoria",
            "type": "text"
          },
          {
            "key": "capacity",
            "label": "Capacità",
            "type": "number"
          },
          {
            "key": "active",
            "label": "Attiva",
            "type": "boolean"
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "quotes",
        "label": "Preventivi",
        "singular": "Preventivo",
        "icon": "file-text",
        "fields": [
          {
            "key": "number",
            "label": "Numero",
            "type": "text",
            "required": true
          },
          {
            "key": "customer_name",
            "label": "Cliente",
            "type": "text",
            "required": true
          },
          {
            "key": "issue_date",
            "label": "Data",
            "type": "date"
          },
          {
            "key": "valid_until",
            "label": "Valido fino al",
            "type": "date"
          },
          {
            "key": "status",
            "label": "Stato",
            "type": "select",
            "options": [
              "Bozza",
              "Inviato",
              "Accettato",
              "Rifiutato"
            ]
          },
          {
            "key": "total",
            "label": "Totale",
            "type": "currency"
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "quote_items",
        "label": "Righe preventivo",
        "singular": "Riga preventivo",
        "icon": "list",
        "system": true,
        "fields": [
          {
            "key": "quote_number",
            "label": "Numero preventivo",
            "type": "text",
            "required": true
          },
          {
            "key": "description",
            "label": "Descrizione",
            "type": "text",
            "required": true
          },
          {
            "key": "quantity",
            "label": "Quantità",
            "type": "number",
            "required": true
          },
          {
            "key": "unit_price",
            "label": "Prezzo unitario",
            "type": "currency",
            "required": true
          },
          {
            "key": "total",
            "label": "Totale riga",
            "type": "currency"
          }
        ]
      },
      {
        "key": "payments",
        "label": "Pagamenti",
        "singular": "Pagamento",
        "icon": "credit-card",
        "fields": [
          {
            "key": "customer_name",
            "label": "Cliente",
            "type": "text"
          },
          {
            "key": "payment_date",
            "label": "Data",
            "type": "date"
          },
          {
            "key": "amount",
            "label": "Importo",
            "type": "currency",
            "required": true
          },
          {
            "key": "method",
            "label": "Metodo",
            "type": "select",
            "options": [
              "Contanti",
              "Carta",
              "Bonifico",
              "Online",
              "Altro"
            ]
          },
          {
            "key": "status",
            "label": "Stato",
            "type": "select",
            "options": [
              "Previsto",
              "Ricevuto",
              "Rimborsato"
            ]
          },
          {
            "key": "reference",
            "label": "Riferimento",
            "type": "text"
          }
        ]
      },
      {
        "key": "suppliers",
        "label": "Fornitori",
        "singular": "Fornitore",
        "icon": "truck",
        "fields": [
          {
            "key": "name",
            "label": "Ragione sociale",
            "type": "text",
            "required": true
          },
          {
            "key": "contact_name",
            "label": "Referente",
            "type": "text"
          },
          {
            "key": "email",
            "label": "Email",
            "type": "email"
          },
          {
            "key": "phone",
            "label": "Telefono",
            "type": "phone"
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "expenses",
        "label": "Spese",
        "singular": "Spesa",
        "icon": "trending-down",
        "fields": [
          {
            "key": "description",
            "label": "Descrizione",
            "type": "text",
            "required": true
          },
          {
            "key": "supplier_name",
            "label": "Fornitore",
            "type": "text"
          },
          {
            "key": "expense_date",
            "label": "Data",
            "type": "date"
          },
          {
            "key": "category",
            "label": "Categoria",
            "type": "text"
          },
          {
            "key": "amount",
            "label": "Importo",
            "type": "currency",
            "required": true
          },
          {
            "key": "paid",
            "label": "Pagata",
            "type": "boolean"
          }
        ]
      },
      {
        "key": "documents",
        "label": "Documenti",
        "singular": "Documento",
        "icon": "paperclip",
        "fields": [
          {
            "key": "name",
            "label": "Nome",
            "type": "text",
            "required": true
          },
          {
            "key": "category",
            "label": "Categoria",
            "type": "text"
          },
          {
            "key": "expiry_date",
            "label": "Scadenza",
            "type": "date"
          },
          {
            "key": "url",
            "label": "Link file",
            "type": "text"
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "assets",
        "label": "Beni e attrezzature",
        "singular": "Bene",
        "icon": "tool",
        "fields": [
          {
            "key": "name",
            "label": "Nome",
            "type": "text",
            "required": true
          },
          {
            "key": "code",
            "label": "Codice",
            "type": "text"
          },
          {
            "key": "category",
            "label": "Categoria",
            "type": "text"
          },
          {
            "key": "purchase_date",
            "label": "Data acquisto",
            "type": "date"
          },
          {
            "key": "status",
            "label": "Stato",
            "type": "select",
            "options": [
              "Operativo",
              "In manutenzione",
              "Dismesso"
            ]
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "maintenance",
        "label": "Manutenzioni",
        "singular": "Manutenzione",
        "icon": "settings",
        "fields": [
          {
            "key": "asset_name",
            "label": "Bene",
            "type": "text",
            "required": true
          },
          {
            "key": "maintenance_date",
            "label": "Data",
            "type": "date"
          },
          {
            "key": "type",
            "label": "Tipo",
            "type": "select",
            "options": [
              "Ordinaria",
              "Straordinaria",
              "Controllo"
            ]
          },
          {
            "key": "status",
            "label": "Stato",
            "type": "select",
            "options": [
              "Pianificata",
              "In corso",
              "Completata"
            ]
          },
          {
            "key": "cost",
            "label": "Costo",
            "type": "currency"
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "public_submissions",
        "label": "Richieste dal sito",
        "singular": "Richiesta",
        "icon": "inbox",
        "fields": [
          {
            "key": "source",
            "label": "Tipo richiesta",
            "type": "text"
          },
          {
            "key": "name",
            "label": "Nome",
            "type": "text",
            "required": true
          },
          {
            "key": "email",
            "label": "Email",
            "type": "email",
            "required": true
          },
          {
            "key": "phone",
            "label": "Telefono",
            "type": "phone"
          },
          {
            "key": "message",
            "label": "Messaggio",
            "type": "longtext"
          },
          {
            "key": "status",
            "label": "Stato",
            "type": "select",
            "options": [
              "Nuova",
              "Contattata",
              "Chiusa"
            ]
          }
        ]
      },
      {
        "key": "pricing_rules",
        "label": "Regole prezzo",
        "singular": "Regola prezzo",
        "icon": "tag",
        "system": true,
        "fields": [
          {
            "key": "name",
            "label": "Nome regola",
            "type": "text",
            "required": true
          },
          {
            "key": "rule_type",
            "label": "Tipo",
            "type": "select",
            "options": [
              "Periodo",
              "Giorno settimana",
              "Durata",
              "Quantità",
              "Promozione"
            ]
          },
          {
            "key": "value",
            "label": "Valore",
            "type": "number"
          },
          {
            "key": "active",
            "label": "Attiva",
            "type": "boolean"
          },
          {
            "key": "configuration",
            "label": "Configurazione",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "automation_log",
        "label": "Registro automazioni",
        "singular": "Esecuzione",
        "icon": "zap",
        "system": true,
        "fields": [
          {
            "key": "workflow_name",
            "label": "Automazione",
            "type": "text"
          },
          {
            "key": "event_name",
            "label": "Evento",
            "type": "text"
          },
          {
            "key": "status",
            "label": "Esito",
            "type": "select",
            "options": [
              "In attesa",
              "Eseguita",
              "Errore"
            ]
          },
          {
            "key": "details",
            "label": "Dettagli",
            "type": "longtext"
          }
        ]
      },
      {
        "key": "checkins",
        "label": "Check-in",
        "singular": "Check-in",
        "fields": [
          {
            "key": "guest_name",
            "label": "Ospite",
            "type": "text",
            "required": true
          },
          {
            "key": "booking_number",
            "label": "Prenotazione",
            "type": "text",
            "required": true
          },
          {
            "key": "arrival_date",
            "label": "Arrivo",
            "type": "datetime",
            "required": true
          },
          {
            "key": "document_status",
            "label": "Documenti",
            "type": "select",
            "options": [
              "Da ricevere",
              "Completi",
              "Verificati"
            ]
          },
          {
            "key": "payment_status",
            "label": "Pagamento",
            "type": "select",
            "options": [
              "Da saldare",
              "Caparra",
              "Saldato"
            ]
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ],
        "custom": true
      },
      {
        "key": "daily_cash",
        "label": "Cassa giornaliera",
        "singular": "Movimento",
        "fields": [
          {
            "key": "movement_date",
            "label": "Data",
            "type": "date",
            "required": true
          },
          {
            "key": "description",
            "label": "Descrizione",
            "type": "text",
            "required": true
          },
          {
            "key": "category",
            "label": "Categoria",
            "type": "select",
            "options": [
              "Incasso",
              "Spesa",
              "Caparra",
              "Rimborso"
            ]
          },
          {
            "key": "amount",
            "label": "Importo",
            "type": "currency",
            "required": true
          },
          {
            "key": "method",
            "label": "Metodo",
            "type": "select",
            "options": [
              "Contanti",
              "Carta",
              "Bonifico"
            ]
          },
          {
            "key": "notes",
            "label": "Note",
            "type": "longtext"
          }
        ],
        "custom": true
      }
    ],
    "price": {
      "base": 99,
      "implementation": 0,
      "implementationSelected": false,
      "modules": 88,
      "customEntities": 12,
      "customFields": 0,
      "automations": 12,
      "pricingRules": 1,
      "bundleDiscount": 17.6,
      "extras": 95.4,
      "total": 194.4
    },
    "quality": {
      "score": 100,
      "grade": "Eccellente",
      "blockers": [],
      "warnings": [
        "Il logo è facoltativo, ma migliora molto la percezione del prodotto."
      ],
      "strengths": [
        "Obiettivo operativo descritto con sufficiente dettaglio.",
        "Portale con dati di contatto essenziali.",
        "Motore prezzi configurato con regole reali.",
        "3 automazioni definite e incluse nel collaudo.",
        "Anteprima approvata prima della consegna.",
        "Archivio documenti predisposto con Storage privato Supabase.",
        "Controlli anti-sovrapposizione inclusi nel frontend e nel database.",
        "Backup JSON, workbook Excel, import/export CSV, foglio operativo, calendario, ruoli e audit log inclusi."
      ],
      "ready": true
    }
  }
};
