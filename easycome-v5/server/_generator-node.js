import { createZipBytes } from './_zip-node.js';
import { ECProductTemplates } from './_product-templates-node.js';
const global = { EasyZip: { createZipBytes }, ECProductTemplates, crypto: globalThis.crypto };
  'use strict';

  const BASE_PRICE = 198;
  const IMPLEMENTATION_PRICE = 150;

  const MODULES = [
    { id: 'crm', name: 'Clienti e CRM', category: 'Operatività', price: 0, included: true, description: 'Anagrafiche, contatti, note e storico.', entities: ['customers'] },
    { id: 'tasks', name: 'Attività e scadenze', category: 'Operatività', price: 0, included: true, description: 'Task, priorità, responsabili e date.', entities: ['tasks'] },
    { id: 'bookings', name: 'Prenotazioni e risorse', category: 'Vendite', price: 20, description: 'Agenda, risorse e controllo anti-sovrapposizione.', entities: ['bookings', 'resources'] },
    { id: 'appointments', name: 'Appuntamenti', category: 'Vendite', price: 16, description: 'Agenda, servizi e operatori.', entities: ['appointments', 'services', 'staff'] },
    { id: 'quotes', name: 'Preventivi', category: 'Vendite', price: 12, description: 'Documenti stampabili, righe, stato, validità e totale.', entities: ['quotes', 'quote_items'] },
    { id: 'orders', name: 'Ordini', category: 'Vendite', price: 16, description: 'Ordini, righe, totali e avanzamento.', entities: ['orders', 'order_items', 'products'] },
    { id: 'inventory', name: 'Magazzino', category: 'Operatività', price: 20, description: 'Prodotti, giacenze registrate e movimenti manuali.', entities: ['products', 'stock_movements'] },
    { id: 'invoices', name: 'Fatture e scadenze', category: 'Amministrazione', price: 24, description: 'Gestione interna di fatture, righe, scadenze e stato. Non sostituisce la fatturazione elettronica.', entities: ['invoices', 'invoice_items'] },
    { id: 'payments', name: 'Registro pagamenti e caparre', category: 'Amministrazione', price: 16, description: 'Registrazione di incassi, caparre, rimborsi e metodi. Checkout online escluso.', entities: ['payments'] },
    { id: 'expenses', name: 'Spese e fornitori', category: 'Amministrazione', price: 12, description: 'Costi, fornitori e categorie.', entities: ['suppliers', 'expenses'] },
    { id: 'projects', name: 'Progetti e commesse', category: 'Operatività', price: 16, description: 'Progetti, fasi, budget e avanzamento.', entities: ['projects', 'tasks'] },
    { id: 'support', name: 'Ticket e assistenza', category: 'Relazioni', price: 16, description: 'Richieste, priorità, assegnazione e SLA.', entities: ['tickets'] },
    { id: 'staff', name: 'Personale e turni', category: 'Operatività', price: 16, description: 'Anagrafiche, ruoli, turni e agenda del personale.', entities: ['staff', 'shifts'] },
    { id: 'documents', name: 'Documenti e allegati', category: 'Operatività', price: 8, description: 'Archivio documentale e scadenze.', entities: ['documents'] },
    { id: 'assets', name: 'Beni e manutenzioni', category: 'Operatività', price: 20, description: 'Attrezzature, veicoli e manutenzioni.', entities: ['assets', 'maintenance'] },
    { id: 'reports', name: 'Report e KPI', category: 'Analisi', price: 16, description: 'Dashboard calcolata dai dati, filtri, CSV, backup e grafici.', entities: [] },
    { id: 'easycome_hub', name: 'Manuale & Easy Come Hub', category: 'Assistenza', price: 0, included: true, description: 'Manuale personalizzato, onboarding, supporto, bug e richiesta nuove funzioni.', entities: [] },
    { id: 'dynamic_pricing', name: 'Prezzi dinamici', category: 'Automazioni', price: 24, description: 'Stagioni, giorni, durata, persone, extra e promo.', entities: ['pricing_rules', 'quotes'] },
    { id: 'automations', name: 'Motore automazioni', category: 'Automazioni', price: 16, description: 'Trigger, email, webhook, task e aggiornamenti.', entities: ['automation_log'] },
    { id: 'multiuser', name: 'Utenti, ruoli e permessi', category: 'Sicurezza', price: 12, description: 'Accessi separati per titolare e collaboratori.', entities: [] },
    { id: 'multisite', name: 'Più sedi', category: 'Struttura', price: 20, description: 'Anagrafica sedi e attribuzione della sede ai dati operativi.', entities: ['locations'] },
    { id: 'ai', name: 'AI tramite integrazione', category: 'Automazioni', price: 30, description: 'Bozze, riepiloghi e classificazione tramite API esterna configurata.', entities: ['ai_requests'] },
    { id: 'mobile_app', name: 'App PWA installabile', category: 'Canali', price: 24, description: 'Web app mobile installabile con accessi rapidi e modalità offline di base.', entities: [] },
    { id: 'branding', name: 'Brand kit completo', category: 'Identità', price: 12, description: 'Logo vettoriale, varianti, copertina social e guida visiva.', entities: [] },
  ];

  const ENTITY_PRESETS = {
    customers: {
      key: 'customers', label: 'Clienti', singular: 'Cliente', icon: 'users',
      fields: [
        { key: 'name', label: 'Nome / Ragione sociale', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Telefono', type: 'phone' },
        { key: 'tax_code', label: 'Codice fiscale / P. IVA', type: 'text' },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    tasks: {
      key: 'tasks', label: 'Attività', singular: 'Attività', icon: 'check-square',
      fields: [
        { key: 'title', label: 'Titolo', type: 'text', required: true },
        { key: 'status', label: 'Stato', type: 'select', options: ['Da fare', 'In corso', 'Completata'] },
        { key: 'priority', label: 'Priorità', type: 'select', options: ['Bassa', 'Media', 'Alta', 'Urgente'] },
        { key: 'due_date', label: 'Scadenza', type: 'date' },
        { key: 'assignee', label: 'Responsabile', type: 'text' },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    bookings: {
      key: 'bookings', label: 'Prenotazioni', singular: 'Prenotazione', icon: 'calendar',
      fields: [
        { key: 'customer_name', label: 'Cliente', type: 'text', required: true },
        { key: 'start_at', label: 'Inizio', type: 'datetime', required: true },
        { key: 'end_at', label: 'Fine', type: 'datetime', required: true },
        { key: 'resource_name', label: 'Risorsa', type: 'text' },
        { key: 'people', label: 'Persone / quantità', type: 'number' },
        { key: 'status', label: 'Stato', type: 'select', options: ['Richiesta', 'Confermata', 'Completata', 'Annullata'] },
        { key: 'total', label: 'Totale', type: 'currency' },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    resources: {
      key: 'resources', label: 'Risorse', singular: 'Risorsa', icon: 'grid',
      fields: [
        { key: 'name', label: 'Nome', type: 'text', required: true },
        { key: 'category', label: 'Categoria', type: 'text' },
        { key: 'capacity', label: 'Capacità', type: 'number' },
        { key: 'active', label: 'Attiva', type: 'boolean' },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    appointments: {
      key: 'appointments', label: 'Appuntamenti', singular: 'Appuntamento', icon: 'clock',
      fields: [
        { key: 'customer_name', label: 'Cliente', type: 'text', required: true },
        { key: 'service_name', label: 'Servizio', type: 'text', required: true },
        { key: 'operator_name', label: 'Operatore', type: 'text' },
        { key: 'start_at', label: 'Data e ora', type: 'datetime', required: true },
        { key: 'duration_minutes', label: 'Durata in minuti', type: 'number' },
        { key: 'status', label: 'Stato', type: 'select', options: ['Prenotato', 'Confermato', 'Eseguito', 'Annullato'] },
        { key: 'price', label: 'Prezzo', type: 'currency' },
      ],
    },
    services: {
      key: 'services', label: 'Servizi', singular: 'Servizio', icon: 'briefcase',
      fields: [
        { key: 'name', label: 'Nome servizio', type: 'text', required: true },
        { key: 'duration_minutes', label: 'Durata', type: 'number' },
        { key: 'price', label: 'Prezzo', type: 'currency' },
        { key: 'active', label: 'Attivo', type: 'boolean' },
        { key: 'description', label: 'Descrizione', type: 'longtext' },
      ],
    },
    staff: {
      key: 'staff', label: 'Personale', singular: 'Persona', icon: 'user-check',
      fields: [
        { key: 'name', label: 'Nome', type: 'text', required: true },
        { key: 'role', label: 'Ruolo', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Telefono', type: 'phone' },
        { key: 'active', label: 'Attivo', type: 'boolean' },
      ],
    },
    quotes: {
      key: 'quotes', label: 'Preventivi', singular: 'Preventivo', icon: 'file-text',
      fields: [
        { key: 'number', label: 'Numero', type: 'text', required: true },
        { key: 'customer_name', label: 'Cliente', type: 'text', required: true },
        { key: 'issue_date', label: 'Data', type: 'date' },
        { key: 'valid_until', label: 'Valido fino al', type: 'date' },
        { key: 'status', label: 'Stato', type: 'select', options: ['Bozza', 'Inviato', 'Accettato', 'Rifiutato'] },
        { key: 'total', label: 'Totale', type: 'currency' },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    quote_items: {
      key: 'quote_items', label: 'Righe preventivo', singular: 'Riga preventivo', icon: 'list', system: true,
      fields: [
        { key: 'quote_number', label: 'Numero preventivo', type: 'text', required: true },
        { key: 'description', label: 'Descrizione', type: 'text', required: true },
        { key: 'quantity', label: 'Quantità', type: 'number', required: true },
        { key: 'unit_price', label: 'Prezzo unitario', type: 'currency', required: true },
        { key: 'total', label: 'Totale riga', type: 'currency' },
      ],
    },
    order_items: {
      key: 'order_items', label: 'Righe ordine', singular: 'Riga ordine', icon: 'list', system: true,
      fields: [
        { key: 'order_number', label: 'Numero ordine', type: 'text', required: true },
        { key: 'description', label: 'Prodotto / servizio', type: 'text', required: true },
        { key: 'quantity', label: 'Quantità', type: 'number', required: true },
        { key: 'unit_price', label: 'Prezzo unitario', type: 'currency', required: true },
        { key: 'total', label: 'Totale riga', type: 'currency' },
      ],
    },
    invoice_items: {
      key: 'invoice_items', label: 'Righe fattura', singular: 'Riga fattura', icon: 'list', system: true,
      fields: [
        { key: 'invoice_number', label: 'Numero fattura', type: 'text', required: true },
        { key: 'description', label: 'Descrizione', type: 'text', required: true },
        { key: 'quantity', label: 'Quantità', type: 'number', required: true },
        { key: 'unit_price', label: 'Prezzo unitario', type: 'currency', required: true },
        { key: 'vat_rate', label: 'IVA %', type: 'number' },
        { key: 'total', label: 'Totale riga', type: 'currency' },
      ],
    },
    orders: {
      key: 'orders', label: 'Ordini', singular: 'Ordine', icon: 'shopping-bag',
      fields: [
        { key: 'number', label: 'Numero ordine', type: 'text', required: true },
        { key: 'customer_name', label: 'Cliente', type: 'text', required: true },
        { key: 'order_date', label: 'Data ordine', type: 'date' },
        { key: 'status', label: 'Stato', type: 'select', options: ['Nuovo', 'In lavorazione', 'Pronto', 'Consegnato', 'Annullato'] },
        { key: 'total', label: 'Totale', type: 'currency' },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    products: {
      key: 'products', label: 'Prodotti', singular: 'Prodotto', icon: 'box',
      fields: [
        { key: 'name', label: 'Nome', type: 'text', required: true },
        { key: 'sku', label: 'Codice / SKU', type: 'text' },
        { key: 'category', label: 'Categoria', type: 'text' },
        { key: 'price', label: 'Prezzo', type: 'currency' },
        { key: 'stock', label: 'Giacenza', type: 'number' },
        { key: 'active', label: 'Attivo', type: 'boolean' },
      ],
    },
    stock_movements: {
      key: 'stock_movements', label: 'Movimenti magazzino', singular: 'Movimento', icon: 'repeat',
      fields: [
        { key: 'product_name', label: 'Prodotto', type: 'text', required: true },
        { key: 'movement_type', label: 'Tipo', type: 'select', options: ['Carico', 'Scarico', 'Rettifica'] },
        { key: 'quantity', label: 'Quantità', type: 'number', required: true },
        { key: 'movement_date', label: 'Data', type: 'date' },
        { key: 'reason', label: 'Motivo', type: 'text' },
      ],
    },
    invoices: {
      key: 'invoices', label: 'Fatture', singular: 'Fattura', icon: 'receipt',
      fields: [
        { key: 'number', label: 'Numero', type: 'text', required: true },
        { key: 'customer_name', label: 'Cliente', type: 'text', required: true },
        { key: 'issue_date', label: 'Data emissione', type: 'date' },
        { key: 'due_date', label: 'Scadenza', type: 'date' },
        { key: 'status', label: 'Stato', type: 'select', options: ['Bozza', 'Emessa', 'Pagata', 'Scaduta'] },
        { key: 'total', label: 'Totale', type: 'currency' },
      ],
    },
    payments: {
      key: 'payments', label: 'Pagamenti', singular: 'Pagamento', icon: 'credit-card',
      fields: [
        { key: 'customer_name', label: 'Cliente', type: 'text' },
        { key: 'payment_date', label: 'Data', type: 'date' },
        { key: 'amount', label: 'Importo', type: 'currency', required: true },
        { key: 'method', label: 'Metodo', type: 'select', options: ['Contanti', 'Carta', 'Bonifico', 'Online', 'Altro'] },
        { key: 'status', label: 'Stato', type: 'select', options: ['Previsto', 'Ricevuto', 'Rimborsato'] },
        { key: 'reference', label: 'Riferimento', type: 'text' },
      ],
    },
    suppliers: {
      key: 'suppliers', label: 'Fornitori', singular: 'Fornitore', icon: 'truck',
      fields: [
        { key: 'name', label: 'Ragione sociale', type: 'text', required: true },
        { key: 'contact_name', label: 'Referente', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Telefono', type: 'phone' },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    expenses: {
      key: 'expenses', label: 'Spese', singular: 'Spesa', icon: 'trending-down',
      fields: [
        { key: 'description', label: 'Descrizione', type: 'text', required: true },
        { key: 'supplier_name', label: 'Fornitore', type: 'text' },
        { key: 'expense_date', label: 'Data', type: 'date' },
        { key: 'category', label: 'Categoria', type: 'text' },
        { key: 'amount', label: 'Importo', type: 'currency', required: true },
        { key: 'paid', label: 'Pagata', type: 'boolean' },
      ],
    },
    projects: {
      key: 'projects', label: 'Progetti', singular: 'Progetto', icon: 'folder',
      fields: [
        { key: 'name', label: 'Nome progetto', type: 'text', required: true },
        { key: 'customer_name', label: 'Cliente', type: 'text' },
        { key: 'start_date', label: 'Inizio', type: 'date' },
        { key: 'end_date', label: 'Fine prevista', type: 'date' },
        { key: 'status', label: 'Stato', type: 'select', options: ['Pianificato', 'In corso', 'Sospeso', 'Completato'] },
        { key: 'budget', label: 'Budget', type: 'currency' },
        { key: 'progress', label: 'Avanzamento %', type: 'number' },
      ],
    },
    tickets: {
      key: 'tickets', label: 'Ticket', singular: 'Ticket', icon: 'help-circle',
      fields: [
        { key: 'subject', label: 'Oggetto', type: 'text', required: true },
        { key: 'customer_name', label: 'Cliente', type: 'text' },
        { key: 'priority', label: 'Priorità', type: 'select', options: ['Bassa', 'Media', 'Alta', 'Urgente'] },
        { key: 'status', label: 'Stato', type: 'select', options: ['Aperto', 'In lavorazione', 'In attesa', 'Chiuso'] },
        { key: 'assignee', label: 'Assegnato a', type: 'text' },
        { key: 'description', label: 'Descrizione', type: 'longtext' },
      ],
    },
    shifts: {
      key: 'shifts', label: 'Turni', singular: 'Turno', icon: 'calendar-days',
      fields: [
        { key: 'staff_name', label: 'Persona', type: 'text', required: true },
        { key: 'start_at', label: 'Inizio', type: 'datetime', required: true },
        { key: 'end_at', label: 'Fine', type: 'datetime', required: true },
        { key: 'location', label: 'Sede', type: 'text' },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    documents: {
      key: 'documents', label: 'Documenti', singular: 'Documento', icon: 'paperclip',
      fields: [
        { key: 'name', label: 'Nome', type: 'text', required: true },
        { key: 'category', label: 'Categoria', type: 'text' },
        { key: 'expiry_date', label: 'Scadenza', type: 'date' },
        { key: 'url', label: 'Link file', type: 'text' },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    assets: {
      key: 'assets', label: 'Beni e attrezzature', singular: 'Bene', icon: 'tool',
      fields: [
        { key: 'name', label: 'Nome', type: 'text', required: true },
        { key: 'code', label: 'Codice', type: 'text' },
        { key: 'category', label: 'Categoria', type: 'text' },
        { key: 'purchase_date', label: 'Data acquisto', type: 'date' },
        { key: 'status', label: 'Stato', type: 'select', options: ['Operativo', 'In manutenzione', 'Dismesso'] },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    maintenance: {
      key: 'maintenance', label: 'Manutenzioni', singular: 'Manutenzione', icon: 'settings',
      fields: [
        { key: 'asset_name', label: 'Bene', type: 'text', required: true },
        { key: 'maintenance_date', label: 'Data', type: 'date' },
        { key: 'type', label: 'Tipo', type: 'select', options: ['Ordinaria', 'Straordinaria', 'Controllo'] },
        { key: 'status', label: 'Stato', type: 'select', options: ['Pianificata', 'In corso', 'Completata'] },
        { key: 'cost', label: 'Costo', type: 'currency' },
        { key: 'notes', label: 'Note', type: 'longtext' },
      ],
    },
    locations: {
      key: 'locations', label: 'Sedi', singular: 'Sede', icon: 'map-pin',
      fields: [
        { key: 'name', label: 'Nome sede', type: 'text', required: true },
        { key: 'address', label: 'Indirizzo', type: 'text' },
        { key: 'city', label: 'Città', type: 'text' },
        { key: 'phone', label: 'Telefono', type: 'phone' },
        { key: 'active', label: 'Attiva', type: 'boolean' },
      ],
    },
    public_submissions: {
      key: 'public_submissions', label: 'Richieste dal sito', singular: 'Richiesta', icon: 'inbox',
      fields: [
        { key: 'source', label: 'Tipo richiesta', type: 'text' },
        { key: 'name', label: 'Nome', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'email', required: true },
        { key: 'phone', label: 'Telefono', type: 'phone' },
        { key: 'message', label: 'Messaggio', type: 'longtext' },
        { key: 'status', label: 'Stato', type: 'select', options: ['Nuova', 'Contattata', 'Chiusa'] },
      ],
    },
    pricing_rules: {
      key: 'pricing_rules', label: 'Regole prezzo', singular: 'Regola prezzo', icon: 'tag', system: true,
      fields: [
        { key: 'name', label: 'Nome regola', type: 'text', required: true },
        { key: 'rule_type', label: 'Tipo', type: 'select', options: ['Periodo', 'Giorno settimana', 'Durata', 'Quantità', 'Promozione'] },
        { key: 'value', label: 'Valore', type: 'number' },
        { key: 'active', label: 'Attiva', type: 'boolean' },
        { key: 'configuration', label: 'Configurazione', type: 'longtext' },
      ],
    },
    automation_log: {
      key: 'automation_log', label: 'Registro automazioni', singular: 'Esecuzione', icon: 'zap', system: true,
      fields: [
        { key: 'workflow_name', label: 'Automazione', type: 'text' },
        { key: 'event_name', label: 'Evento', type: 'text' },
        { key: 'status', label: 'Esito', type: 'select', options: ['In attesa', 'Eseguita', 'Errore'] },
        { key: 'details', label: 'Dettagli', type: 'longtext' },
      ],
    },
    ai_requests: {
      key: 'ai_requests', label: 'Attività AI', singular: 'Attività AI', icon: 'sparkles', system: true,
      fields: [
        { key: 'request_type', label: 'Tipo', type: 'text' },
        { key: 'input_text', label: 'Input', type: 'longtext' },
        { key: 'output_text', label: 'Output', type: 'longtext' },
        { key: 'status', label: 'Stato', type: 'select', options: ['Richiesta', 'Completata', 'Errore'] },
      ],
    },
  };

  const AUTOMATION_TRIGGERS = [
    { id: 'record_created', label: 'Quando viene creato un record' },
    { id: 'record_updated', label: 'Quando cambia un record' },
    { id: 'status_changed', label: 'Quando cambia lo stato' },
    { id: 'date_reached', label: 'Quando arriva una data o scadenza' },
    { id: 'public_request', label: 'Quando arriva una richiesta dal sito' },
  ];

  const AUTOMATION_ACTIONS = [
    { id: 'email', label: 'Invia email', executable: true },
    { id: 'webhook', label: 'Chiama webhook / Make / n8n', executable: true },
    { id: 'create_task', label: 'Crea attività', executable: true },
    { id: 'update_status', label: 'Aggiorna stato', executable: true },
    { id: 'notify', label: 'Crea notifica interna', executable: true },
    { id: 'ai', label: 'Elabora con AI', executable: true },
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function slugify(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'mia-azienda';
  }

  function sqlName(value) {
    return String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().trim()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '')
      .replace(/_+/g, '_')
      .slice(0, 48) || 'campo';
  }

  function uuidv4() {
    if (global.crypto && global.crypto.randomUUID) return global.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : ((r & 0x3) | 0x8);
      return v.toString(16);
    });
  }

  function defaultProject() {
    return {
      version: '8.4.0',
      generatedAt: new Date().toISOString(),
      organizationId: uuidv4(),
      company: {
        name: '', slug: '', industry: '', description: '', email: '', phone: '',
        primaryColor: '#275dff', accentColor: '#17213b', surfaceColor: '#f7f8fb', currency: 'EUR', locale: 'it-IT', logoData: '', style: 'studio', layout: 'studio',
      },
      modules: ['crm', 'tasks', 'easycome_hub'],
      customEntities: [],
      automations: [],
      hub: { enabled: true, manual: true, support: true, featureRequests: true, onboarding: true, updates: true },
      pricing: { mode: 'none', enabled: false, basePrice: 0, unit: 'servizio', taxPerPerson: 0, depositPercent: 0, minimumUnits: 1, renewalNoticeDays: 15, rules: [], extras: [] },
      identity: { provider: 'easycome', supabaseUrl: '', supabaseAnonKey: '', ownerUserId: '', ownerEmail: '', easycomeBaseUrl: 'https://easy-come.it', dataMode: 'local' },
      delivery: { packagePrice: BASE_PRICE, implementationPrice: IMPLEMENTATION_PRICE, implementationSelected: false, auditServiceSelected: false, auditMonthlyPrice: 100, managedServiceSelected: false, managedServicePrice: 30, notes: '', supportDays: 30, previewApproved: false },
    };
  }

  function buildEntities(project) {
    const keys = [];
    project.modules.forEach((moduleId) => {
      const module = MODULES.find((item) => item.id === moduleId);
      if (module) module.entities.forEach((key) => { if (!keys.includes(key)) keys.push(key); });
    });
    if (project.pricing && project.pricing.mode === 'dynamic' && !keys.includes('pricing_rules')) keys.push('pricing_rules');
    const presets = keys.map((key) => clone(ENTITY_PRESETS[key])).filter(Boolean);
    const custom = (project.customEntities || []).map((entity) => ({ ...clone(entity), key: sqlName(entity.key || entity.label), custom: true }));
    const merged = [];
    [...presets, ...custom].forEach((entity) => {
      const existing = merged.find((item) => item.key === entity.key);
      if (!existing) merged.push(entity);
      else {
        entity.fields.forEach((field) => {
          if (!existing.fields.some((item) => item.key === field.key)) existing.fields.push(field);
        });
      }
    });
    if (project.modules.includes('multisite')) {
      merged.forEach((entity) => {
        if (!entity.system && entity.key !== 'locations' && !entity.fields.some((field) => field.key === 'location_name')) {
          entity.fields.splice(1, 0, { key: 'location_name', label: 'Sede', type: 'text' });
        }
      });
    }
    if (project.modules.includes('projects')) {
      const tasks = merged.find((entity) => entity.key === 'tasks');
      if (tasks && !tasks.fields.some((field) => field.key === 'project_name')) tasks.fields.splice(1, 0, { key: 'project_name', label: 'Progetto / commessa', type: 'text' });
    }
    return merged;
  }

  function calculatePrice(project) {
    const modulesTotal = project.modules.reduce((sum, id) => {
      const module = MODULES.find((item) => item.id === id);
      return sum + (module ? module.price : 0);
    }, 0);
    const customEntitiesTotal = (project.customEntities || []).length * 12;
    const customFieldsTotal = (project.customEntities || []).reduce((sum, entity) => sum + Math.max(0, (entity.fields || []).length - 6) * 2, 0);
    const automationTotal = (project.automations || []).length * 8;
    const pricingRulesTotal = project.pricing && project.pricing.enabled ? Math.max(0, (project.pricing.rules || []).length - 3) * 2 : 0;
    const paidModuleCount = project.modules.filter((id) => (MODULES.find((item) => item.id === id)?.price || 0) > 0).length;
    const discountRate = paidModuleCount >= 8 ? 0.20 : paidModuleCount >= 5 ? 0.10 : 0;
    const bundleDiscount = Math.round(modulesTotal * discountRate * 100) / 100;
    const extras = modulesTotal + customEntitiesTotal + customFieldsTotal + automationTotal + pricingRulesTotal - bundleDiscount;
    const base = Number(project.delivery.packagePrice || BASE_PRICE);
    const implementationSelected = Boolean(project.delivery.implementationSelected);
    const implementation = implementationSelected ? Number(project.delivery.implementationPrice || IMPLEMENTATION_PRICE) : 0;
    return {
      base,
      implementation,
      implementationSelected,
      modules: modulesTotal,
      customEntities: customEntitiesTotal,
      customFields: customFieldsTotal,
      automations: automationTotal,
      pricingRules: pricingRulesTotal,
      bundleDiscount,
      extras,
      total: base + implementation + extras,
    };
  }

  function auditProject(project) {
    const blockers = [];
    const warnings = [];
    const strengths = [];
    const entities = buildEntities(project);
    let score = 100;
    const penalize = (points, message, blocking = false) => {
      score -= points;
      (blocking ? blockers : warnings).push(message);
    };

    if (!String(project.company?.name || '').trim() || String(project.company?.name || '').trim().length < 3) penalize(18, 'Inserisci un nome aziendale completo.', true);
    if (!String(project.company?.email || '').trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(project.company?.email || '').trim())) penalize(16, 'Inserisci l’email del titolare: serve per assegnare il primo accesso in sicurezza.', true);
    if (String(project.company?.description || '').trim().length < 35) penalize(8, 'Descrivi meglio il processo da semplificare: l’anteprima e la documentazione saranno più credibili.');
    else strengths.push('Obiettivo operativo descritto con sufficiente dettaglio.');

    if ((project.modules || []).length < 2) penalize(10, 'Il progetto non contiene abbastanza funzioni operative.', true);
    if (!entities.length) penalize(20, 'Non è stata generata nessuna sezione dati.', true);
    if (entities.length > 24) penalize(4, 'Il gestionale contiene molte sezioni: valuta di dividerle in fasi per non complicare l’esperienza.');

    const duplicateEntities = entities.map((entity) => entity.key).filter((key, index, all) => all.indexOf(key) !== index);
    if (duplicateEntities.length) penalize(18, `Chiavi sezione duplicate: ${[...new Set(duplicateEntities)].join(', ')}.`, true);
    entities.forEach((entity) => {
      if (!entity.fields?.length) penalize(8, `La sezione “${entity.label}” non contiene campi.`, true);
      const duplicates = (entity.fields || []).map((field) => field.key).filter((key, index, all) => all.indexOf(key) !== index);
      if (duplicates.length) penalize(12, `Campi duplicati nella sezione “${entity.label}”.`, true);
      if (!entity.system && !(entity.fields || []).some((field) => field.required)) penalize(2, `La sezione “${entity.label}” non ha nessun campo obbligatorio.`);
    });

    if (project.hub?.enabled !== true) penalize(8, 'Easy Come Hub deve restare incluso nel pacchetto.', true);
    else strengths.push('Manuale personalizzato ed Easy Come Hub inclusi.');

    const pricingMode = project.pricing?.mode || 'none';
    if (pricingMode === 'dynamic') {
      if (Number(project.pricing.basePrice || 0) <= 0) penalize(8, 'Il prezzo variabile è attivo ma il prezzo di partenza è zero.');
      if (!(project.pricing.rules || []).length) warnings.push('Prezzo variabile senza variazioni: verrà usato soltanto il prezzo di partenza.');
      else strengths.push('Prezzo variabile configurato con regole reali.');
    }
    if (['fixed','hourly','subscription'].includes(pricingMode) && Number(project.pricing.basePrice || 0) <= 0) {
      penalize(4, 'Il modello economico selezionato non ha ancora un valore indicativo.');
    }
    if (pricingMode === 'manual_quote') strengths.push('Preventivazione caso per caso configurata senza forzare un listino fisso.');

    (project.automations || []).forEach((flow, index) => {
      const name = flow.name || `Automazione ${index + 1}`;
      if (!flow.trigger || !flow.action) penalize(8, `${name}: trigger o azione mancanti.`, true);
      if (['email', 'webhook', 'update_status'].includes(flow.action) && !String(flow.target || '').trim()) penalize(8, `${name}: manca destinatario, URL o nuovo stato.`, true);
      if (flow.action === 'email' && flow.target && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(flow.target) && !String(flow.target).includes('{{')) penalize(3, `${name}: verifica l’indirizzo email di destinazione.`);
      if (flow.action === 'webhook' && flow.target && !/^https:\/\//i.test(flow.target)) penalize(4, `${name}: usa un webhook HTTPS.`);
    });
    if ((project.automations || []).length) strengths.push(`${project.automations.length} automazioni definite e incluse nel collaudo.`);

    if (!project.delivery?.previewApproved) penalize(10, 'L’anteprima non è stata ancora approvata.', true);
    else strengths.push('Anteprima approvata prima della consegna.');

    if (!project.company?.logoData) warnings.push('Il logo è facoltativo, ma migliora molto la percezione del prodotto.');
    if ((project.modules || []).includes('documents')) strengths.push('Archivio documenti predisposto con Storage privato Supabase.');
    if ((project.modules || []).includes('bookings') || (project.modules || []).includes('appointments')) strengths.push('Controlli anti-sovrapposizione inclusi nel frontend e nel database.');
    strengths.push('Backup JSON, workbook Excel, import/export CSV, viste operative, calendario, ruoli e audit log inclusi.');

    score = Math.max(0, Math.min(100, Math.round(score)));
    const grade = score >= 92 && blockers.length === 0 ? 'Eccellente' : score >= 82 && blockers.length === 0 ? 'Pronto' : score >= 68 ? 'Da rifinire' : 'Non consegnabile';
    return { score, grade, blockers, warnings, strengths, ready: blockers.length === 0 && score >= 82 };
  }

  function sqlType(field) {
    switch (field.type) {
      case 'number': return 'numeric';
      case 'currency': return 'numeric(12,2)';
      case 'date': return 'date';
      case 'datetime': return 'timestamptz';
      case 'boolean': return 'boolean default false';
      case 'longtext': return 'text';
      default: return 'text';
    }
  }

  function sqlLiteral(value) {
    if (value === null || value === undefined) return 'null';
    return "'" + String(value).replace(/'/g, "''") + "'";
  }

  function generateSchema(project, entities) {
    const orgId = project.organizationId;
    const companyName = project.company.name || 'Azienda';
    const ownerEmail = String(project.company.email || '').trim().toLowerCase();
    const baseEntityKeys = new Set(['public_submissions', 'automation_log']);
    const generatedEntities = entities.filter((entity) => !baseEntityKeys.has(sqlName(entity.key)));

    const tableBlocks = generatedEntities.map((entity) => {
      const table = sqlName(entity.key);
      const columns = entity.fields.map((field) => {
        const required = field.required ? ' not null' : '';
        return `  ${sqlName(field.key)} ${sqlType(field)}${required}`;
      });
      const indexes = [
        `create index if not exists ${table}_organization_idx on public.${table}(organization_id);`,
        `create index if not exists ${table}_created_at_idx on public.${table}(created_at desc);`,
      ];
      if (entity.fields.some((field) => sqlName(field.key) === 'status')) indexes.push(`create index if not exists ${table}_status_idx on public.${table}(organization_id, status);`);
      const firstDate = entity.fields.find((field) => ['date', 'datetime'].includes(field.type));
      if (firstDate) indexes.push(`create index if not exists ${table}_${sqlName(firstDate.key)}_idx on public.${table}(organization_id, ${sqlName(firstDate.key)});`);

      return `
create table if not exists public.${table} (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
${columns.join(',\n')}${columns.length ? ',' : ''}
  created_by uuid references auth.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.${table} enable row level security;

drop policy if exists "${table}_member_select" on public.${table};
drop policy if exists "${table}_member_insert" on public.${table};
drop policy if exists "${table}_member_update" on public.${table};
drop policy if exists "${table}_admin_delete" on public.${table};
create policy "${table}_member_select" on public.${table}
for select using (public.org_can_read(organization_id));
create policy "${table}_member_insert" on public.${table}
for insert with check (public.org_can_write(organization_id));
create policy "${table}_member_update" on public.${table}
for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "${table}_admin_delete" on public.${table}
for delete using (public.org_can_admin(organization_id));

drop trigger if exists ${table}_set_updated_at on public.${table};
create trigger ${table}_set_updated_at
before update on public.${table}
for each row execute function public.set_updated_at();

drop trigger if exists ${table}_audit on public.${table};
create trigger ${table}_audit
after insert or update or delete on public.${table}
for each row execute function public.audit_record_change();

${indexes.join('\n')}
`;
    }).join('\n');

    const triggerBlocks = generatedEntities.map((entity) => {
      const table = sqlName(entity.key);
      return `
drop trigger if exists ${table}_queue_automation on public.${table};
create trigger ${table}_queue_automation
after insert or update on public.${table}
for each row execute function public.queue_automation_event();`;
    }).join('\n');

    const bookingRules = [];
    if (entities.some((entity) => entity.key === 'bookings')) bookingRules.push(`
alter table public.bookings drop constraint if exists bookings_valid_range;
alter table public.bookings add constraint bookings_valid_range check (end_at > start_at);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'bookings_no_overlap') then
    alter table public.bookings add constraint bookings_no_overlap
    exclude using gist (
      organization_id with =,
      resource_name with =,
      tstzrange(start_at, end_at, '[)') with &&
    ) where (resource_name is not null and coalesce(status, '') not ilike '%annull%');
  end if;
end $$;`);
    if (entities.some((entity) => entity.key === 'appointments')) bookingRules.push(`
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'appointments_no_overlap') then
    alter table public.appointments add constraint appointments_no_overlap
    exclude using gist (
      organization_id with =,
      operator_name with =,
      tstzrange(start_at, start_at + make_interval(mins => greatest(coalesce(duration_minutes,30)::int,1)), '[)') with &&
    ) where (operator_name is not null and coalesce(status, '') not ilike '%annull%');
  end if;
end $$;`);
    if (entities.some((entity) => entity.key === 'shifts')) bookingRules.push(`
alter table public.shifts drop constraint if exists shifts_valid_range;
alter table public.shifts add constraint shifts_valid_range check (end_at > start_at);
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'shifts_no_overlap') then
    alter table public.shifts add constraint shifts_no_overlap
    exclude using gist (
      organization_id with =,
      staff_name with =,
      tstzrange(start_at, end_at, '[)') with &&
    ) where (staff_name is not null);
  end if;
end $$;`);

    const pricingSeed = project.pricing && project.pricing.enabled
      ? `
insert into public.app_settings (organization_id, key, value)
values ('${orgId}', 'pricing', ${sqlLiteral(JSON.stringify(project.pricing))}::jsonb)
on conflict (organization_id, key) do update set value = excluded.value, updated_at = now();
`
      : '';

    return `-- Easy Come Studio V8 — schema Supabase
-- Progetto: ${companyName}
-- Generato: ${new Date().toISOString()}
-- Eseguibile più volte: policy, trigger e seed sono idempotenti.

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

create table if not exists public.organizations (
  id uuid primary key,
  name text not null,
  slug text not null unique,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer','support')),
  email text,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organization_members add column if not exists email text;
alter table public.organization_members drop constraint if exists organization_members_role_check;
alter table public.organization_members add constraint organization_members_role_check check (role in ('owner','admin','member','viewer','support'));

create table if not exists public.app_settings (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (organization_id, key)
);

create table if not exists public.automation_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  entity text not null,
  event_type text not null,
  record_id uuid,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','processing','done','error')),
  error_message text,
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  processed_at timestamptz
);

create table if not exists public.automation_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  workflow_name text,
  event_name text,
  status text not null default 'In attesa',
  details text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.internal_notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null,
  message text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  table_name text not null,
  record_id uuid,
  action text not null check (action in ('INSERT','UPDATE','DELETE')),
  actor_id uuid references auth.users(id) on delete set null,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.public_submission_limits (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  client_token text not null,
  submitted_at timestamptz not null default now()
);

create table if not exists public.public_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null default 'request',
  name text,
  email text,
  phone text,
  message text,
  status text not null default 'Nuova',
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.org_role(p_organization_id uuid)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.organization_members
  where organization_id = p_organization_id and user_id = auth.uid()
  limit 1;
$$;

create or replace function public.org_can_read(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.org_role(p_organization_id) in ('owner','admin','member','viewer','support'); $$;

create or replace function public.org_can_write(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.org_role(p_organization_id) in ('owner','admin','member','support'); $$;

create or replace function public.org_can_admin(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.org_role(p_organization_id) in ('owner','admin'); $$;

create or replace function public.get_my_role(p_organization_id uuid)
returns text language sql stable security definer set search_path = public
as $$ select public.org_role(p_organization_id); $$;
grant execute on function public.get_my_role(uuid) to authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.claim_owner_by_email(p_organization_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  expected_email text;
  current_email text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select lower(nullif(settings->'brand'->>'email','')) into expected_email
  from public.organizations where id = p_organization_id;
  current_email := lower(coalesce(auth.jwt()->>'email',''));
  if expected_email is null then raise exception 'Owner email not configured'; end if;
  if current_email <> expected_email then raise exception 'Email not authorized as owner'; end if;
  if exists (select 1 from public.organization_members where organization_id = p_organization_id) then return false; end if;
  insert into public.organization_members (organization_id, user_id, role, email)
  values (p_organization_id, auth.uid(), 'owner', current_email)
  on conflict do nothing;
  return true;
end;
$$;

grant execute on function public.claim_owner_by_email(uuid) to authenticated;

create or replace function public.submit_public_request(
  p_organization_id uuid,
  p_source text,
  p_payload jsonb,
  p_client_token text,
  p_website text default ''
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
  recent_count integer;
begin
  if coalesce(trim(p_website),'') <> '' then raise exception 'Invalid request'; end if;
  if not exists (select 1 from public.organizations where id = p_organization_id) then raise exception 'Organization not found'; end if;
  if length(coalesce(p_client_token,'')) < 8 then raise exception 'Invalid client token'; end if;
  if octet_length(p_payload::text) > 25000 then raise exception 'Request too large'; end if;
  select count(*) into recent_count from public.public_submission_limits
  where organization_id = p_organization_id and client_token = p_client_token
    and submitted_at > now() - interval '10 minutes';
  if recent_count >= 5 then raise exception 'Troppe richieste. Riprova tra qualche minuto.'; end if;
  insert into public.public_submission_limits (organization_id, client_token) values (p_organization_id, p_client_token);
  delete from public.public_submission_limits where submitted_at < now() - interval '24 hours';
  insert into public.public_submissions (
    organization_id, source, name, email, phone, message, payload
  ) values (
    p_organization_id,
    coalesce(nullif(p_source, ''), 'request'),
    nullif(p_payload->>'name', ''),
    nullif(p_payload->>'email', ''),
    nullif(p_payload->>'phone', ''),
    nullif(p_payload->>'message', ''),
    p_payload
  ) returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.submit_public_request(uuid, text, jsonb, text, text) to anon, authenticated;

create or replace function public.queue_automation_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.automation_events (organization_id, entity, event_type, record_id, payload)
  values (
    new.organization_id,
    tg_table_name,
    case
      when tg_table_name = 'public_submissions' and tg_op = 'INSERT' then 'public_request'
      when tg_op = 'INSERT' then 'record_created'
      else 'record_updated'
    end,
    new.id,
    to_jsonb(new)
  );
  if tg_op = 'UPDATE' and (to_jsonb(old)->>'status') is distinct from (to_jsonb(new)->>'status') then
    insert into public.automation_events (organization_id, entity, event_type, record_id, payload)
    values (new.organization_id, tg_table_name, 'status_changed', new.id, to_jsonb(new));
  end if;
  return new;
end;
$$;

create or replace function public.audit_record_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  org uuid;
  rid uuid;
begin
  org := coalesce(new.organization_id, old.organization_id);
  rid := coalesce(new.id, old.id);
  insert into public.audit_log (organization_id, table_name, record_id, action, actor_id, old_data, new_data)
  values (org, tg_table_name, rid, tg_op, auth.uid(), case when tg_op <> 'INSERT' then to_jsonb(old) end, case when tg_op <> 'DELETE' then to_jsonb(new) end);
  return coalesce(new, old);
end;
$$;

insert into public.organizations (id, name, slug, settings)
values (
  '${orgId}',
  ${sqlLiteral(companyName)},
  ${sqlLiteral(project.company.slug || slugify(companyName))},
  ${sqlLiteral(JSON.stringify({ brand: { ...project.company, email: ownerEmail }, modules: project.modules, version: project.version || '2.0.0' }))}::jsonb
)
on conflict (id) do update set name = excluded.name, slug = excluded.slug, settings = excluded.settings;

alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.app_settings enable row level security;
alter table public.automation_events enable row level security;
alter table public.automation_log enable row level security;
alter table public.internal_notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.public_submission_limits enable row level security;
alter table public.public_submissions enable row level security;

drop policy if exists "organizations_member_select" on public.organizations;
create policy "organizations_member_select" on public.organizations for select using (public.org_can_read(id));

drop policy if exists "members_member_select" on public.organization_members;
drop policy if exists "members_admin_insert" on public.organization_members;
drop policy if exists "members_admin_update" on public.organization_members;
drop policy if exists "members_admin_delete" on public.organization_members;
create policy "members_member_select" on public.organization_members for select using (user_id = auth.uid() or public.org_can_read(organization_id));
create policy "members_admin_insert" on public.organization_members for insert with check (public.org_can_admin(organization_id));
create policy "members_admin_update" on public.organization_members for update using (public.org_can_admin(organization_id)) with check (public.org_can_admin(organization_id));
create policy "members_admin_delete" on public.organization_members for delete using (public.org_can_admin(organization_id));

drop policy if exists "settings_member_select" on public.app_settings;
drop policy if exists "settings_admin_write" on public.app_settings;
create policy "settings_member_select" on public.app_settings for select using (public.org_can_read(organization_id));
create policy "settings_admin_write" on public.app_settings for all using (public.org_can_admin(organization_id)) with check (public.org_can_admin(organization_id));

drop policy if exists "automation_admin_select" on public.automation_events;
create policy "automation_admin_select" on public.automation_events for select using (public.org_can_admin(organization_id));

drop policy if exists "automation_log_member_select" on public.automation_log;
drop policy if exists "automation_log_admin_write" on public.automation_log;
create policy "automation_log_member_select" on public.automation_log for select using (public.org_can_read(organization_id));
create policy "automation_log_admin_write" on public.automation_log for all using (public.org_can_admin(organization_id)) with check (public.org_can_admin(organization_id));


drop policy if exists "notifications_member_all" on public.internal_notifications;
create policy "notifications_member_all" on public.internal_notifications for all using (public.org_can_read(organization_id)) with check (public.org_can_write(organization_id));

drop policy if exists "audit_admin_select" on public.audit_log;
create policy "audit_admin_select" on public.audit_log for select using (public.org_can_admin(organization_id));

drop policy if exists "submissions_member_select" on public.public_submissions;
drop policy if exists "submissions_member_update" on public.public_submissions;
drop policy if exists "submissions_admin_delete" on public.public_submissions;
create policy "submissions_member_select" on public.public_submissions for select using (public.org_can_read(organization_id));
create policy "submissions_member_update" on public.public_submissions for update using (public.org_can_write(organization_id)) with check (public.org_can_write(organization_id));
create policy "submissions_admin_delete" on public.public_submissions for delete using (public.org_can_admin(organization_id));

drop trigger if exists public_submissions_set_updated_at on public.public_submissions;
create trigger public_submissions_set_updated_at before update on public.public_submissions for each row execute function public.set_updated_at();
drop trigger if exists public_submissions_audit on public.public_submissions;
create trigger public_submissions_audit after insert or update or delete on public.public_submissions for each row execute function public.audit_record_change();
drop trigger if exists public_submissions_queue_automation on public.public_submissions;
create trigger public_submissions_queue_automation after insert or update on public.public_submissions for each row execute function public.queue_automation_event();

drop trigger if exists automation_log_set_updated_at on public.automation_log;
create trigger automation_log_set_updated_at before update on public.automation_log for each row execute function public.set_updated_at();

create index if not exists public_submissions_org_created_idx on public.public_submissions(organization_id, created_at desc);
create index if not exists automation_events_status_idx on public.automation_events(status, created_at);
create index if not exists automation_log_org_created_idx on public.automation_log(organization_id, created_at desc);
create index if not exists audit_log_org_created_idx on public.audit_log(organization_id, created_at desc);
create index if not exists public_submission_limits_idx on public.public_submission_limits(organization_id, client_token, submitted_at desc);

${tableBlocks}
${triggerBlocks}
${bookingRules.join('\n')}
${pricingSeed}

insert into storage.buckets (id, name, public)
values ('easycome-documents', 'easycome-documents', false)
on conflict (id) do nothing;

drop policy if exists "easycome_documents_member_select" on storage.objects;
drop policy if exists "easycome_documents_member_insert" on storage.objects;
drop policy if exists "easycome_documents_member_update" on storage.objects;
drop policy if exists "easycome_documents_admin_delete" on storage.objects;
create policy "easycome_documents_member_select" on storage.objects for select
using (bucket_id = 'easycome-documents' and public.org_can_read((storage.foldername(name))[1]::uuid));
create policy "easycome_documents_member_insert" on storage.objects for insert
with check (bucket_id = 'easycome-documents' and public.org_can_write((storage.foldername(name))[1]::uuid));
create policy "easycome_documents_member_update" on storage.objects for update
using (bucket_id = 'easycome-documents' and public.org_can_write((storage.foldername(name))[1]::uuid));
create policy "easycome_documents_admin_delete" on storage.objects for delete
using (bucket_id = 'easycome-documents' and public.org_can_admin((storage.foldername(name))[1]::uuid));

-- Primo accesso sicuro:
-- 1) registrati con ${ownerEmail || 'l’email titolare configurata nel progetto'};
-- 2) l'app chiama claim_owner_by_email e assegna il ruolo owner solo a quell'indirizzo;
-- 3) gli altri utenti vengono aggiunti dal titolare in organization_members.
`;
  }
  function generateConfig(project, entities) {
    const safeProject = clone(project);
    safeProject.company.slug = safeProject.company.slug || slugify(safeProject.company.name);
    safeProject.entities = entities;
    safeProject.price = calculatePrice(project);
    safeProject.managed = { supportEmail: 'infoeasycome@libero.it', supportRole: 'support', accessMode: 'magic-link', ...(safeProject.managed || {}) };
    const identity = safeProject.identity || {};
    return `window.APP_CONFIG = ${JSON.stringify({
      supabaseUrl: identity.supabaseUrl || 'INSERISCI_PROJECT_URL',
      supabaseAnonKey: identity.supabaseAnonKey || 'INSERISCI_PUBLISHABLE_KEY',
      dataMode: identity.dataMode || 'local',
      easycomeBaseUrl: identity.easycomeBaseUrl || 'https://easy-come.it',
      project: safeProject,
    }, null, 2)};\n`;
  }

  function generatedStyles(project) {
    if (!global.ECProductTemplates) throw new Error('Template prodotto non caricati.');
    return global.ECProductTemplates.styles(project);
  }
  function generatedIndexHtml(project) {
    const title = project.company.name || 'Gestionale';
    return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} — Gestionale</title>
  <meta name="description" content="Gestionale operativo di ${escapeHtml(title)}">
  <meta name="theme-color" content="${project.company.accentColor || '#151515'}">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body>
  <div id="app"></div>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/config.js"></script>
  <script src="js/app.js"></script>
  <script>if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}</script>
</body>
</html>`;
  }

  function generatedHubHtml(project) {
    const title = `Easy Come Hub — ${project.company.name || 'Azienda'}`;
    return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="Manuale, supporto e nuove funzioni per ${escapeHtml(project.company.name || 'Azienda')}">
  <meta name="theme-color" content="${project.company.accentColor || '#17213b'}">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body class="hub-page">
  <div id="hub"></div>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/config.js"></script>
  <script src="js/hub.js"></script>
</body>
</html>`;
  }

  function generatedAuditHtml(project) {
    return "<!doctype html>\n<html lang=\"it\">\n<head>\n<meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Easy Come Audit</title>\n<meta name=\"theme-color\" content=\"#171815\">\n<link rel=\"icon\" href=\"assets/favicon.svg\" type=\"image/svg+xml\">\n<style>\n:root{--paper:#f3eee4;--surface:#fbf8f2;--ink:#171815;--muted:#746f66;--line:#cdc4b6;--orange:#f05a2a;--green:#276b52;--red:#a83f32;--amber:#a96b20}*{box-sizing:border-box}html{background:var(--paper)}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,Arial,sans-serif}button,input,select{font:inherit}.audit-shell{min-height:100vh;display:grid;grid-template-columns:250px minmax(0,1fr)}.side{background:#171815;color:#fff;padding:26px 20px;position:sticky;top:0;height:100vh;display:flex;flex-direction:column}.brand{display:flex;align-items:center;gap:12px;text-decoration:none;color:#fff}.brand b{width:44px;height:44px;background:var(--orange);display:grid;place-items:center}.brand strong{font:700 23px Georgia,serif}.brand small{display:block;color:#ffffff77;font-size:10px;letter-spacing:.14em;margin-top:3px}.side nav{display:grid;gap:5px;margin-top:38px}.side button,.side a.nav{border:0;background:transparent;color:#ffffff9e;text-decoration:none;padding:12px 10px;text-align:left;display:flex;gap:11px;align-items:center}.side button.active,.side button:hover,.side a.nav:hover{background:#ffffff0e;color:#fff}.side i{font-style:normal;color:var(--orange);width:20px}.side footer{margin-top:auto;border-top:1px solid #ffffff18;padding-top:18px;color:#ffffff78;font-size:11px;line-height:1.55}.side footer strong{color:#fff;display:block;margin-bottom:8px}.main{padding:32px clamp(22px,4vw,58px) 80px;min-width:0}.top{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:30px}.eyebrow{font-size:10px;letter-spacing:.16em;font-weight:900;color:var(--orange)}h1,h2,h3,p{margin-top:0}.top h1{font:700 clamp(38px,5vw,68px)/.95 Georgia,serif;letter-spacing:-.045em;margin:10px 0 8px}.top p,.muted{color:var(--muted)}.top-actions{display:flex;gap:9px}.btn{border:1px solid var(--ink);background:transparent;padding:11px 15px;font-weight:800;cursor:pointer}.btn.primary{background:var(--ink);color:#fff}.btn.orange{background:var(--orange);border-color:var(--orange);color:#fff}.btn:disabled{opacity:.45;cursor:not-allowed}.hero{border:1px solid var(--line);background:var(--surface);display:grid;grid-template-columns:1.35fr .65fr;min-height:250px}.hero-copy{padding:34px}.hero-copy h2{font:700 clamp(35px,4vw,58px)/.98 Georgia,serif;letter-spacing:-.04em;margin:12px 0}.hero-copy p{max-width:720px;line-height:1.6}.hero-side{border-left:1px solid var(--line);padding:30px;display:flex;flex-direction:column;justify-content:space-between}.hero-side strong{font:700 50px Georgia,serif}.hero-side small{color:var(--muted);line-height:1.45}.grid3{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);margin-top:18px}.metric{background:var(--surface);padding:23px}.metric span{font-size:10px;letter-spacing:.13em;font-weight:900;color:var(--muted)}.metric strong{display:block;font:700 34px Georgia,serif;margin-top:10px}.section{margin-top:28px}.section-head{display:flex;justify-content:space-between;gap:16px;align-items:end;margin-bottom:12px}.section-head h2{font:700 31px Georgia,serif;margin:5px 0 0}.card{background:var(--surface);border:1px solid var(--line);padding:24px}.empty{padding:50px;text-align:center;color:var(--muted)}.flow{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid var(--line);background:var(--line);gap:1px;margin:18px 0}.flow div{background:var(--surface);padding:18px}.flow b{display:block;font:700 24px Georgia,serif}.flow span{font-size:10px;color:var(--muted);letter-spacing:.1em}.finding-list{display:grid;gap:10px}.finding{border:1px solid var(--line);background:var(--surface);padding:19px;display:grid;grid-template-columns:110px 1fr auto;gap:18px;align-items:start;cursor:pointer}.finding:hover{border-color:#8f877c}.sev{font-size:10px;font-weight:900;letter-spacing:.12em}.sev.high{color:var(--red)}.sev.medium{color:var(--amber)}.sev.info{color:var(--green)}.finding h3{font-size:17px;margin:0 0 6px}.finding p{font-size:13px;color:var(--muted);margin:0;line-height:1.5}.count{font:700 24px Georgia,serif}.panel{position:fixed;inset:0 0 0 auto;width:min(620px,100%);background:var(--surface);border-left:1px solid var(--ink);z-index:50;overflow:auto;box-shadow:-30px 0 80px #0002}.panel-head{padding:22px 25px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between}.panel-body{padding:25px}.panel h2{font:700 35px Georgia,serif}.panel h3{margin-top:28px}.panel .box{border:1px solid var(--line);padding:16px;margin-top:10px;line-height:1.55}.solution{border:1px solid var(--line);padding:16px;margin:10px 0}.solution.recommended{border:2px solid var(--orange)}.solution small{color:var(--orange);font-weight:900;letter-spacing:.08em}.evidence{overflow:auto}.evidence table{width:100%;border-collapse:collapse;min-width:500px}.evidence th,.evidence td{border-bottom:1px solid var(--line);padding:10px;text-align:left;font-size:12px;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.scan{min-height:65vh;display:grid;place-items:center;text-align:center}.scanner{width:180px;height:180px;border:1px solid var(--line);border-radius:50%;display:grid;place-items:center;position:relative;margin:auto}.scanner:before,.scanner:after{content:\"\";position:absolute;border:1px solid var(--line);border-radius:50%;inset:25px}.scanner:after{inset:55px;background:var(--ink)}.scanner b{position:relative;z-index:2;color:#fff;font:700 24px Georgia,serif}.progress{height:5px;background:#ddd5ca;margin:25px auto 10px;max-width:700px}.progress i{display:block;height:100%;background:var(--orange);width:0;transition:.25s}.step-text{color:var(--orange);font-size:11px;letter-spacing:.12em;font-weight:900}.recognition{display:grid;gap:1px;background:var(--line);border:1px solid var(--line)}.recognition article{background:var(--surface);padding:18px;display:grid;grid-template-columns:1fr auto;gap:15px}.recognition strong{font-size:15px}.recognition small{color:var(--muted)}.gate{max-width:900px;margin:7vh auto;border:1px solid var(--ink);background:var(--surface);padding:40px}.gate h1{font:700 clamp(44px,7vw,78px)/.92 Georgia,serif}.gate .price{font:700 55px Georgia,serif}.gate ul{line-height:2;color:var(--muted)}.history-row{display:grid;grid-template-columns:1fr auto auto;gap:15px;padding:15px 0;border-bottom:1px solid var(--line);align-items:center}.history-row button{border:0;background:none;text-align:left;padding:0;cursor:pointer}.history-row strong{display:block}.history-row small{color:var(--muted)}.ok{color:var(--green)}.warn{color:var(--amber)}.danger{color:var(--red)}@media(max-width:900px){.audit-shell{grid-template-columns:1fr}.side{position:relative;height:auto;padding:16px}.side nav{grid-template-columns:repeat(3,1fr);margin-top:18px}.side footer{display:none}.main{padding:24px 16px 60px}.hero{grid-template-columns:1fr}.hero-side{border-left:0;border-top:1px solid var(--line)}.grid3,.flow{grid-template-columns:1fr}.finding{grid-template-columns:1fr}.top{display:block}.top-actions{margin-top:15px}.panel{width:100%}}\n</style>\n</head>\n<body><div id=\"audit\"></div>\n<script src=\"https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2\"></script>\n<script src=\"js/config.js\"></script>\n<script src=\"js/audit.js\"></script>\n</body></html>\n";
  }

  function generatedAuditJs() {
    return "'use strict';\n(() => {\n  const cfg=window.APP_CONFIG||{};\n  const project=cfg.project||{};\n  const company=project.company||{};\n  const entities=Array.isArray(project.entities)?project.entities:[];\n  const orgId=project.organizationId||'';\n  const root=document.getElementById('audit');\n  const authReady=Boolean(cfg.supabaseUrl&&cfg.supabaseAnonKey&&!String(cfg.supabaseUrl).includes('INSERISCI_')&&!String(cfg.supabaseAnonKey).includes('INSERISCI_')&&window.supabase);\n  const dataMode=cfg.dataMode||project.identity?.dataMode||'local';\n  const cloudData=authReady&&dataMode==='cloud';\n  const db=authReady?window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey):null;\n  const state={session:null,subscription:null,data:{},findings:[],controls:[],view:'home',selected:null,history:[],lastAudit:null};\n  const $=(q,r=document)=>r.querySelector(q); const $$=(q,r=document)=>[...r.querySelectorAll(q)];\n  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',\"'\":'&#039;'}[c]));\n  const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:company.currency||'EUR'}).format(Number(v||0));\n  const uid=()=>globalThis.crypto?.randomUUID?.()||Math.random().toString(36).slice(2);\n  const historyKey=()=>`easycome-audit:${orgId}:history:v1`;\n  const verifiedKey=()=>`easycome-audit:${orgId}:verified:v1`;\n  const norm=v=>String(v??'').trim().toLowerCase();\n  const n=v=>{const x=Number(String(v??'').replace(',','.'));return Number.isFinite(x)?x:null};\n  const d=v=>{if(!v)return null;const x=new Date(v);return Number.isFinite(x.getTime())?x:null};\n  const isCanceled=v=>/annull|cancel|void|storn/.test(norm(v));\n  const isDone=v=>/pagat|paid|complet|chius|done|saldat/.test(norm(v));\n  const systemKeys=new Set(['id','organization_id','created_at','updated_at','created_by','updated_by']);\n  function loadHistory(){try{state.history=JSON.parse(localStorage.getItem(historyKey())||'[]')}catch{state.history=[]}}\n  function saveHistory(audit){state.history=[audit,...state.history.filter(a=>a.id!==audit.id)].slice(0,30);localStorage.setItem(historyKey(),JSON.stringify(state.history));state.lastAudit=audit}\n  function verified(){try{return JSON.parse(localStorage.getItem(verifiedKey())||'{}')}catch{return {}}}\n  function setVerified(id,value){const v=verified();v[id]=Boolean(value);localStorage.setItem(verifiedKey(),JSON.stringify(v))}\n  function hasAudit(){const s=state.subscription;return Boolean(project.delivery?.auditServiceSelected||project.delivery?.managedServiceSelected||(['active','trialing'].includes(s?.status)&&(String(s.plan_code||'').includes('audit')||Number(s.amount_cents||0)>=10000)))}\n  function shell(content){return `<div class=\"audit-shell\"><aside class=\"side\"><a class=\"brand\" href=\"easycome-hub.html\"><b>EC</b><span><strong>Easy Come</strong><small>AUDIT \u00b7 ${esc(company.name||'PMI')}</small></span></a><nav><button data-view=\"home\" class=\"${state.view==='home'?'active':''}\"><i>\u2302</i>Panoramica</button><button data-new class=\"${state.view==='scan'?'active':''}\"><i>\u25ce</i>Nuovo audit</button><button data-view=\"history\" class=\"${state.view==='history'?'active':''}\"><i>\u25c7</i>Storico</button><a class=\"nav\" href=\"index.html\"><i>\u2197</i>Gestionale</a><a class=\"nav\" href=\"easycome-hub.html\"><i>EC</i>Easy Come Hub</a></nav><footer><strong>Database collegato</strong>Audit legge direttamente il gestionale Easy Come della tua azienda. Nessun file da caricare.</footer></aside><main class=\"main\">${content}</main></div>`}\n  function top(title,sub,actions=''){return `<header class=\"top\"><div><span class=\"eyebrow\">EASY COME AUDIT \u00b7 DATABASE LIVE</span><h1>${esc(title)}</h1><p>${esc(sub)}</p></div><div class=\"top-actions\">${actions}</div></header>`}\n  function gate(){root.innerHTML=`<main class=\"gate\"><span class=\"eyebrow\">EASY COME \u00b7 MODULO COMPLEMENTARE</span><h1>Il controllo intelligente del tuo gestionale.</h1><p>Easy Come Audit funziona solo insieme al Gestionale Easy Come: legge lo stesso database, controlla i record reali e ti porta dal problema alla soluzione senza esportare file.</p><div class=\"price\">100 \u20ac <small style=\"font:600 15px Inter\">/ mese</small></div><ul><li>Nessun costo di acquisto Audit</li><li>Stesso account e stesso database del Gestionale</li><li>Diagnosi spiegate in italiano semplice</li><li>Soluzioni operative collegate alle sezioni del gestionale</li></ul><a class=\"btn primary\" href=\"${esc((cfg.easycomeBaseUrl||'https://easy-come.it').replace(/\\/$/,''))}/profilo.html?tab=care\" target=\"_blank\">Attiva Easy Come Audit</a><a class=\"btn\" href=\"easycome-hub.html\" style=\"margin-left:8px\">Torna all'Hub</a></main>`}\n  function home(){const last=state.lastAudit||state.history[0];const actions='<button class=\"btn orange\" data-new>Avvia audit sul database</button>';if(!last)return shell(top('Il tuo database, sotto controllo.','Easy Come analizza solo i dati realmente presenti nel gestionale e ti dice cosa vale la pena sistemare.',actions)+`<section class=\"hero\"><div class=\"hero-copy\"><span class=\"eyebrow\">NESSUN EXPORT. NESSUN EXCEL.</span><h2>Dal gestionale alla diagnosi, in un click.</h2><p>Prima riconosce la struttura del tuo Easy Come, poi esegue solo i controlli possibili con i dati disponibili. Se un controllo non \u00e8 dimostrabile, viene dichiarato non eseguibile: non diventa un falso problema.</p></div><aside class=\"hero-side\"><span class=\"eyebrow\">FLOW</span><strong>4</strong><small>Capisci \u2192 Priorit\u00e0 \u2192 Risolvi \u2192 Verifica</small></aside></section><div class=\"flow\"><div><span>01</span><b>Capisci</b><small>Quali dati sono stati letti.</small></div><div><span>02</span><b>Priorit\u00e0</b><small>Solo problemi supportati da evidenze.</small></div><div><span>03</span><b>Risolvi</b><small>Soluzioni concrete e link al gestionale.</small></div><div><span>04</span><b>Verifica</b><small>Ricontrolla dopo la correzione.</small></div></div>`);\n    const hi=last.findings.filter(f=>f.severity==='high').length, med=last.findings.filter(f=>f.severity==='medium').length, done=last.findings.filter(f=>verified()[f.id]).length;\n    return shell(top('Il controllo pi\u00f9 recente.','Parti dall\u2019esito, poi apri solo ci\u00f2 che richiede davvero attenzione.',actions)+`<section class=\"hero\"><div class=\"hero-copy\"><span class=\"eyebrow\">ULTIMO AUDIT \u00b7 ${esc(new Date(last.createdAt).toLocaleString('it-IT'))}</span><h2>${hi?hi+' priorit\u00e0 da affrontare':med?med+' verifiche da completare':'Nessuna criticit\u00e0 importante rilevata'}</h2><p>${esc(last.summary)}</p><button class=\"btn primary\" data-open-audit=\"${esc(last.id)}\">Apri risultato completo</button></div><aside class=\"hero-side\"><span class=\"eyebrow\">RECORD ANALIZZATI</span><strong>${last.realRecords}</strong><small>${last.controlsRun} controlli eseguiti \u00b7 ${last.controlsSkipped} non eseguibili</small></aside></section><div class=\"grid3\"><article class=\"metric\"><span>PRIORIT\u00c0</span><strong class=\"${hi?'danger':'ok'}\">${hi}</strong></article><article class=\"metric\"><span>VERIFICHE</span><strong>${med}</strong></article><article class=\"metric\"><span>RISOLTI / VERIFICATI</span><strong>${done}</strong></article></div>`)}\n  function historyView(){return shell(top('Storico audit.','Ogni controllo resta associato alla tua azienda e pu\u00f2 essere riaperto.', '<button class=\"btn orange\" data-new>Nuovo audit</button>')+`<section class=\"card\">${state.history.length?state.history.map(a=>`<div class=\"history-row\"><button data-open-audit=\"${esc(a.id)}\"><strong>Audit del ${esc(new Date(a.createdAt).toLocaleString('it-IT'))}</strong><small>${a.realRecords} record \u00b7 ${a.controlsRun} controlli \u00b7 ${a.findings.length} risultati</small></button><span>${a.findings.filter(f=>f.severity==='high').length} priorit\u00e0</span><button class=\"btn\" data-open-audit=\"${esc(a.id)}\">Apri</button></div>`).join(''):'<div class=\"empty\">Non hai ancora eseguito audit.</div>'}</section>`)}\n  async function loadEntity(entity){if(cloudData&&state.session){const r=await db.from(entity.key).select('*').eq('organization_id',orgId).limit(5000);if(r.error){return {rows:[],error:r.error.message}}return {rows:r.data||[],error:null}}try{return {rows:JSON.parse(localStorage.getItem(`easycome:${orgId}:${entity.key}`)||'[]'),error:null}}catch{return {rows:[],error:'Dati locali non leggibili'}}}\n  async function loadDatabase(progress){state.data={};let total=0;for(let i=0;i<entities.length;i++){const e=entities[i];progress(6+Math.round((i/Math.max(1,entities.length))*30),`Lettura ${e.label||e.key}\u2026`);const out=await loadEntity(e);state.data[e.key]={entity:e,rows:out.rows,error:out.error};total+=out.rows.length}return total}\n  function addFinding(arr,x){const sig=[x.code,x.entityKey,(x.evidence||[]).map(r=>r.id||r.number||r.name||JSON.stringify(r).slice(0,70)).join('|')].join(':');x.id=x.id||btoa(unescape(encodeURIComponent(sig))).replace(/[^a-z0-9]/gi,'').slice(0,40);arr.push(x)}\n  function diagnose(){const f=[],controls=[];let real=0;Object.values(state.data).forEach(x=>real+=x.rows.length);\n    const recordControl=(name,status,detail)=>controls.push({name,status,detail});\n    // 1 required fields\n    entities.forEach(e=>{const bag=state.data[e.key];if(!bag||bag.error){recordControl(`${e.label}: campi obbligatori`,'skipped',bag?.error||'Tabella non disponibile');return}const req=(e.fields||[]).filter(x=>x.required);if(!req.length)return;let misses=[];bag.rows.forEach(row=>req.forEach(field=>{if(row[field.key]===null||row[field.key]===undefined||String(row[field.key]).trim()==='')misses.push({row,field})}));recordControl(`${e.label}: campi obbligatori`,'run',`${bag.rows.length} record`);if(misses.length)addFinding(f,{code:'required',entityKey:e.key,severity:'high',confidence:'alta',title:`${misses.length} dati obbligatori mancanti in ${e.label}`,plain:`Easy Come ha trovato record che non contengono informazioni richieste dal tuo stesso gestionale.`,why:'Un dato obbligatorio mancante pu\u00f2 bloccare automazioni, documenti, filtri o controlli successivi.',checked:`${bag.rows.length} record di ${e.label}; campi: ${req.map(x=>x.label).join(', ')}`,evidence:misses.slice(0,40).map(x=>({...x.row,_problema:`Manca ${x.field.label}`})),solution:`Completa i campi mancanti direttamente nella sezione ${e.label}.`,options:[`Apri ${e.label} e completa i record segnalati`,'Esporta le evidenze e assegnale a un collaboratore','Segna come eccezione solo se il dato non \u00e8 applicabile']})});\n    // 2 duplicate strong identifiers\n    entities.forEach(e=>{const bag=state.data[e.key];if(!bag||bag.error||bag.rows.length<2)return;const ids=(e.fields||[]).filter(x=>/(^number$|invoice_number|order_number|quote_number|sku|reference|codice|numero)/i.test(x.key));ids.forEach(field=>{const m=new Map();bag.rows.forEach(r=>{const v=norm(r[field.key]);if(!v)return;if(!m.has(v))m.set(v,[]);m.get(v).push(r)});const groups=[...m.values()].filter(g=>g.length>1);recordControl(`${e.label}: unicit\u00e0 ${field.label}`,'run',`${bag.rows.length} record`);if(groups.length)addFinding(f,{code:'duplicate-id',entityKey:e.key,severity:'high',confidence:'alta',title:`${groups.length} identificativi duplicati in ${e.label}`,plain:`Lo stesso ${field.label.toLowerCase()} compare su pi\u00f9 record.`,why:'Gli identificativi duplicati possono causare doppie registrazioni, documenti ambigui e riconciliazioni errate.',checked:`Campo ${field.label} su ${bag.rows.length} record`,evidence:groups.flat().slice(0,40),solution:`Verifica i duplicati e conserva un solo identificativo per record reale.`,options:[`Apri ${e.label} e confronta i duplicati`,'Esporta le evidenze per un controllo amministrativo','Se sono record diversi, assegna identificativi univoci']})})});\n    // 3 invalid/reversed dates\n    entities.forEach(e=>{const bag=state.data[e.key];if(!bag||bag.error)return;const dateFields=(e.fields||[]).filter(x=>['date','datetime'].includes(x.type));if(!dateFields.length)return;let invalid=[];bag.rows.forEach(r=>dateFields.forEach(field=>{if(r[field.key]&&!d(r[field.key]))invalid.push({...r,_problema:`Data non valida: ${field.label}`})}));recordControl(`${e.label}: validit\u00e0 date`,'run',`${bag.rows.length} record`);if(invalid.length)addFinding(f,{code:'invalid-date',entityKey:e.key,severity:'high',confidence:'alta',title:`${invalid.length} date non valide in ${e.label}`,plain:'Alcune date presenti nel database non possono essere interpretate correttamente.',why:'Date non valide alterano scadenze, calendari, filtri e automazioni.',checked:`${dateFields.length} campi data su ${bag.rows.length} record`,evidence:invalid.slice(0,40),solution:`Correggi le date segnalate nel gestionale.`,options:[`Apri ${e.label} e correggi le date`,'Esporta le evidenze','Ricontrolla dopo la modifica']});const pairs=[['start_at','end_at'],['start_date','end_date'],['issue_date','due_date']];pairs.forEach(([a,b])=>{if(!(e.fields||[]).some(x=>x.key===a)||!(e.fields||[]).some(x=>x.key===b))return;const bad=bag.rows.filter(r=>d(r[a])&&d(r[b])&&d(r[b])<d(r[a]));if(bad.length)addFinding(f,{code:'reversed-range',entityKey:e.key,severity:'high',confidence:'alta',title:`${bad.length} intervalli temporali incoerenti in ${e.label}`,plain:'La data finale risulta precedente alla data iniziale.',why:'L\u2019intervallo non \u00e8 logicamente valido e pu\u00f2 alterare disponibilit\u00e0, scadenze o report.',checked:`Confronto ${a} \u2192 ${b}`,evidence:bad.slice(0,40),solution:'Correggi l\u2019inizio o la fine dell\u2019intervallo.',options:[`Apri ${e.label} sui record segnalati`,'Verifica la fonte originale della data','Ricontrolla l\u2019audit']})})});\n    // 4 booking overlap\n    const bookings=state.data.bookings?.rows||[];if(state.data.bookings&&!state.data.bookings.error){if(bookings.length&&bookings.some(r=>r.resource_name)){let pairs=[];const valid=bookings.filter(r=>!isCanceled(r.status)&&r.resource_name&&d(r.start_at)&&d(r.end_at));for(let i=0;i<valid.length;i++)for(let j=i+1;j<valid.length;j++){const a=valid[i],b=valid[j];if(norm(a.resource_name)===norm(b.resource_name)&&d(a.start_at)<d(b.end_at)&&d(b.start_at)<d(a.end_at))pairs.push([a,b])}recordControl('Prenotazioni: sovrapposizioni risorsa','run',`${valid.length} prenotazioni con risorsa`);if(pairs.length)addFinding(f,{code:'booking-overlap',entityKey:'bookings',severity:'high',confidence:'alta',title:`${pairs.length} possibili sovrapposizioni di prenotazione`,plain:'La stessa risorsa risulta occupata da due prenotazioni in periodi che si sovrappongono.',why:'Pu\u00f2 generare overbooking o assegnazioni operative impossibili.',checked:'Risorsa + data/ora inizio + data/ora fine, escluse le cancellate',evidence:pairs.flat().slice(0,40),solution:'Conferma quale prenotazione deve mantenere la risorsa oppure riassegna una delle due.',options:['Apri Prenotazioni e riassegna la risorsa','Contatta il cliente prima di modificare','Segna come verificato se la sovrapposizione \u00e8 intenzionale']})}else recordControl('Prenotazioni: sovrapposizioni risorsa','skipped','Manca una risorsa valorizzata')}\n    // 5 totals vs item tables\n    [['invoices','invoice_items','number','invoice_number','Fatture'],['orders','order_items','number','order_number','Ordini'],['quotes','quote_items','number','quote_number','Preventivi']].forEach(([headKey,lineKey,headId,lineId,label])=>{const h=state.data[headKey],l=state.data[lineKey];if(!h||!h.rows.length)return;if(!l||!l.rows.length){recordControl(`${label}: totale vs righe`,'skipped','Righe documento non disponibili');return}let bad=[];h.rows.forEach(head=>{const key=norm(head[headId]);if(!key)return;const rows=l.rows.filter(x=>norm(x[lineId])===key);if(!rows.length)return;const sum=rows.reduce((s,x)=>s+(n(x.total)??((n(x.quantity)||0)*(n(x.unit_price)||0))),0);const total=n(head.total);if(total!==null&&Math.abs(sum-total)>.02)bad.push({...head,_somma_righe:sum,_differenza:sum-total})});recordControl(`${label}: totale vs righe`,'run',`${h.rows.length} documenti`);if(bad.length)addFinding(f,{code:'total-lines',entityKey:headKey,severity:'high',confidence:'alta',title:`${bad.length} totali non coincidono con le righe in ${label}`,plain:'Il totale salvato sul documento non coincide con la somma delle sue righe.',why:'Questa \u00e8 un\u2019incoerenza matematica diretta nel database.',checked:`${label} collegati alle relative righe tramite numero documento`,evidence:bad.slice(0,40),solution:'Apri i documenti segnalati e riallinea totale o righe dopo aver verificato la fonte corretta.',options:[`Apri ${label} e confronta le righe`,'Esporta le differenze','Ricontrolla dopo la correzione']})});\n    // 6 negative stock\n    const products=state.data.products;if(products&&!products.error&&products.rows.length){const bad=products.rows.filter(r=>n(r.stock)!==null&&n(r.stock)<0);recordControl('Magazzino: giacenze negative','run',`${products.rows.length} prodotti`);if(bad.length)addFinding(f,{code:'negative-stock',entityKey:'products',severity:'high',confidence:'alta',title:`${bad.length} prodotti con giacenza negativa`,plain:'Il gestionale registra una quantit\u00e0 disponibile inferiore a zero.',why:'Pu\u00f2 indicare movimenti mancanti, scarichi duplicati o vendite non allineate.',checked:'Campo giacenza del catalogo prodotti',evidence:bad.slice(0,40),solution:'Ricostruisci i movimenti dei prodotti segnalati prima di correggere manualmente la giacenza.',options:['Apri Magazzino e controlla i movimenti','Esporta l\u2019elenco prodotti','Correggi la giacenza solo dopo il controllo']})}\n    // 7 overdue invoices: attention, not error\n    const inv=state.data.invoices;if(inv&&!inv.error&&inv.rows.length){const now=new Date();const bad=inv.rows.filter(r=>d(r.due_date)&&d(r.due_date)<now&&!isDone(r.status)&&!isCanceled(r.status));recordControl('Fatture: scadenze aperte','run',`${inv.rows.length} fatture`);if(bad.length)addFinding(f,{code:'overdue-invoices',entityKey:'invoices',severity:'medium',confidence:'alta',title:`${bad.length} fatture risultano scadute e ancora aperte`,plain:'Non \u00e8 necessariamente un errore: sono posizioni che il database indica come ancora da chiudere.',why:'Vale la pena verificare incasso, stato documento o attivit\u00e0 di sollecito.',checked:'Data di scadenza e stato della fattura',evidence:bad.slice(0,40),solution:'Verifica prima se il pagamento esiste; poi aggiorna lo stato o avvia il sollecito.',options:['Apri Fatture e verifica lo stato','Controlla il registro Pagamenti','Esporta le posizioni da sollecitare']})}\n    // 8 overdue tasks\n    const tasks=state.data.tasks;if(tasks&&!tasks.error&&tasks.rows.length){const now=new Date();const bad=tasks.rows.filter(r=>d(r.due_date)&&d(r.due_date)<now&&!isDone(r.status));recordControl('Attivit\u00e0: scadenze aperte','run',`${tasks.rows.length} attivit\u00e0`);if(bad.length)addFinding(f,{code:'overdue-tasks',entityKey:'tasks',severity:'medium',confidence:'alta',title:`${bad.length} attivit\u00e0 sono oltre la scadenza`,plain:'Il gestionale mostra attivit\u00e0 con una scadenza passata che non risultano completate.',why:'Pu\u00f2 segnalare lavoro arretrato oppure semplicemente stati non aggiornati.',checked:'Scadenza e stato delle attivit\u00e0',evidence:bad.slice(0,40),solution:'Aggiorna lo stato se il lavoro \u00e8 gi\u00e0 stato svolto oppure ripianifica ci\u00f2 che \u00e8 ancora aperto.',options:['Apri Attivit\u00e0 e aggiorna gli stati','Riassegna o ripianifica le attivit\u00e0','Segna come verificato se gi\u00e0 gestite']})}\n    // 9 payments anomalous negative/refund without reference\n    const pay=state.data.payments;if(pay&&!pay.error&&pay.rows.length){const bad=pay.rows.filter(r=>(n(r.amount)||0)<0&&!String(r.reference||'').trim());recordControl('Pagamenti: storni senza riferimento','run',`${pay.rows.length} pagamenti`);if(bad.length)addFinding(f,{code:'refund-reference',entityKey:'payments',severity:'medium',confidence:'alta',title:`${bad.length} storni o importi negativi senza riferimento`,plain:'Easy Come ha trovato movimenti negativi senza un riferimento che spieghi a cosa sono collegati.',why:'Non \u00e8 prova di errore, ma rende pi\u00f9 difficile ricostruire il motivo dello storno.',checked:'Importo negativo + assenza del campo riferimento',evidence:bad.slice(0,40),solution:'Collega ogni storno al pagamento, documento o causale che lo giustifica.',options:['Apri Pagamenti e aggiungi il riferimento','Verifica banca/POS prima di modificare','Esporta i movimenti da riconciliare']})}\n    // 10 statistical outlier, conservative\n    ['payments','expenses','invoices','orders'].forEach(key=>{const bag=state.data[key];if(!bag||bag.error||bag.rows.length<12)return;const field=key==='payments'?'amount':key==='expenses'?'amount':'total';const vals=bag.rows.map(r=>n(r[field])).filter(x=>x!==null&&Math.abs(x)>0).map(Math.abs).sort((a,b)=>a-b);if(vals.length<12)return;const median=vals[Math.floor(vals.length/2)];const threshold=Math.max(median*8,median+1000);const bad=bag.rows.filter(r=>{const x=n(r[field]);return x!==null&&Math.abs(x)>threshold});recordControl(`${bag.entity.label}: importi fuori scala`,'run',`${vals.length} valori, soglia ${money(threshold)}`);if(bad.length)addFinding(f,{code:'amount-outlier',entityKey:key,severity:'medium',confidence:'media',title:`${bad.length} importi molto pi\u00f9 alti del normale in ${bag.entity.label}`,plain:'Sono valori statisticamente lontani dalla dimensione tipica dei record di questa sezione. Non significa che siano sbagliati.',why:'Un importo eccezionale merita una verifica rapida per escludere zeri in pi\u00f9, duplicazioni o operazioni straordinarie.',checked:`Confronto prudenziale rispetto alla mediana (${money(median)}); soglia ${money(threshold)}`,evidence:bad.slice(0,40),solution:'Conferma che gli importi siano intenzionali confrontandoli con il documento o pagamento originale.',options:[`Apri ${bag.entity.label} e verifica l\u2019importo`,'Esporta le evidenze','Segna come verificato se corretto']})});\n    f.sort((a,b)=>({high:0,medium:1,info:2}[a.severity]-({high:0,medium:1,info:2}[b.severity])));\n    const high=f.filter(x=>x.severity==='high').length,medium=f.filter(x=>x.severity==='medium').length;const skipped=controls.filter(x=>x.status==='skipped').length;\n    return {id:uid(),createdAt:new Date().toISOString(),realRecords:real,controlsRun:controls.filter(x=>x.status==='run').length,controlsSkipped:skipped,findings:f,controls,summary:high?`Easy Come ha rilevato ${high} priorit\u00e0 supportate da evidenze nel database. Parti da queste prima delle verifiche secondarie.`:medium?`Non risultano incoerenze bloccanti. Restano ${medium} verifiche operative da confermare.`:'I controlli eseguibili non hanno rilevato problemi rilevanti nei dati disponibili.'};\n  }\n  async function startAudit(){state.view='scan';root.innerHTML=shell(`<section class=\"scan\"><div><div class=\"scanner\"><b>EC</b></div><h1 style=\"font:700 48px Georgia,serif;margin:28px 0 8px\">Controllo del database in corso.</h1><p class=\"muted\">Prima leggiamo i record reali. Poi eseguiamo solo controlli logicamente dimostrabili.</p><div class=\"progress\"><i id=\"bar\"></i></div><div class=\"step-text\" id=\"step\">Connessione al Gestionale Easy Come\u2026</div></div></section>`);const update=(pct,text)=>{const bar=$('#bar');const step=$('#step');if(bar)bar.style.width=pct+'%';if(step)step.textContent=text};try{await new Promise(r=>setTimeout(r,220));update(5,'Sessione e azienda verificate\u2026');const total=await loadDatabase(update);update(42,`${total} record reali acquisiti\u2026`);await new Promise(r=>setTimeout(r,200));update(55,'Controllo coerenza strutturale\u2026');await new Promise(r=>setTimeout(r,160));update(68,'Controllo date, duplicati e relazioni\u2026');await new Promise(r=>setTimeout(r,160));update(82,'Controllo logiche operative e importi\u2026');const audit=diagnose();update(94,'Costruzione delle soluzioni\u2026');await new Promise(r=>setTimeout(r,220));saveHistory(audit);state.selected=audit;update(100,'Audit completato.');await new Promise(r=>setTimeout(r,250));renderAudit(audit)}catch(err){root.innerHTML=shell(top('Audit interrotto.','I dati non sono stati giudicati perch\u00e9 il controllo non \u00e8 arrivato alla fine.')+`<section class=\"card\"><h2>${esc(err.message||String(err))}</h2><p class=\"muted\">Riprova. Se il problema resta, apri Assistenza dall\u2019Easy Come Hub.</p><button class=\"btn primary\" data-new>Riprova audit</button></section>`);bind()}}\n  function auditResult(a){const hi=a.findings.filter(x=>x.severity==='high').length,med=a.findings.filter(x=>x.severity==='medium').length,ver=verified();return top('Audit completato.','Il risultato \u00e8 diviso in un flow semplice: capisci cosa \u00e8 stato controllato, affronta le priorit\u00e0, applica una soluzione e ricontrolla.','<button class=\"btn\" data-export>Esporta evidenze</button><button class=\"btn orange\" data-new>Ricontrolla ora</button>')+`<div class=\"flow\"><div><span>01 \u00b7 CAPISCI</span><b>${a.realRecords}</b><small>record reali letti direttamente dal gestionale</small></div><div><span>02 \u00b7 PRIORIT\u00c0</span><b class=\"${hi?'danger':'ok'}\">${hi}</b><small>problemi ad alta confidenza da affrontare</small></div><div><span>03 \u00b7 RISOLVI</span><b>${med}</b><small>verifiche operative non necessariamente errori</small></div><div><span>04 \u00b7 VERIFICA</span><b>${a.findings.filter(x=>ver[x.id]).length}/${a.findings.length}</b><small>risultati gi\u00e0 verificati da te</small></div></div><section class=\"section\"><div class=\"section-head\"><div><span class=\"eyebrow\">CAPISCI</span><h2>Cosa ha fatto Easy Come</h2></div></div><div class=\"grid3\"><article class=\"metric\"><span>CONTROLLI ESEGUITI</span><strong>${a.controlsRun}</strong></article><article class=\"metric\"><span>NON ESEGUIBILI</span><strong>${a.controlsSkipped}</strong></article><article class=\"metric\"><span>RISULTATI TOTALI</span><strong>${a.findings.length}</strong></article></div><div class=\"card\" style=\"margin-top:1px\"><p>${esc(a.summary)}</p><details><summary><b>Vedi tutti i controlli e perch\u00e9 alcuni non sono stati eseguiti</b></summary><div style=\"margin-top:15px\">${a.controls.map(c=>`<p><span class=\"${c.status==='run'?'ok':'warn'}\">${c.status==='run'?'\u2713 Eseguito':'\u2014 Non eseguibile'}</span> \u00b7 <b>${esc(c.name)}</b><br><small class=\"muted\">${esc(c.detail)}</small></p>`).join('')}</div></details></div></section><section class=\"section\"><div class=\"section-head\"><div><span class=\"eyebrow\">PRIORIT\u00c0 \u2192 RISOLVI</span><h2>Da cosa partire</h2></div><span class=\"muted\">Clicca un risultato per vedere evidenze e soluzioni.</span></div><div class=\"finding-list\">${a.findings.length?a.findings.map(x=>`<article class=\"finding\" data-finding=\"${esc(x.id)}\"><span class=\"sev ${esc(x.severity)}\">${x.severity==='high'?'PRIORIT\u00c0':x.severity==='medium'?'DA VERIFICARE':'INFO'}<br><small>${esc(x.confidence)} confidenza</small></span><div><h3>${esc(x.title)}</h3><p>${esc(x.plain)}</p></div><span class=\"count\">${(x.evidence||[]).length}</span></article>`).join(''):'<div class=\"card\"><h2 class=\"ok\">Nessun problema rilevante.</h2><p>I controlli che Easy Come ha potuto eseguire non hanno trovato incoerenze da segnalare. Controlla comunque l\u2019elenco dei controlli non eseguibili.</p></div>'}</div></section><section class=\"section\"><div class=\"section-head\"><div><span class=\"eyebrow\">VERIFICA</span><h2>Dopo le correzioni, ricontrolla.</h2></div></div><div class=\"card\"><p>Easy Come non considera un problema \u201cchiuso\u201d perch\u00e9 hai cliccato un pulsante. Correggi i dati nel Gestionale, poi esegui un nuovo Audit: il controllo deve passare sui dati aggiornati.</p><button class=\"btn orange\" data-new>Ricontrolla il database</button></div></section>`}\n  function renderAudit(a){state.selected=a;state.view='result';root.innerHTML=shell(auditResult(a));bind()}\n  function findingPanel(f){const e=entities.find(x=>x.key===f.entityKey);const ver=verified()[f.id];const keys=[...new Set((f.evidence||[]).flatMap(r=>Object.keys(r)).filter(k=>!systemKeys.has(k)))].slice(0,7);return `<aside class=\"panel\"><header class=\"panel-head\"><span class=\"eyebrow\">${f.severity==='high'?'PRIORIT\u00c0':'VERIFICA'} \u00b7 CONFINENZA ${esc(f.confidence).toUpperCase()}</span><button class=\"btn\" data-close>Chiudi</button></header><div class=\"panel-body\"><h2>${esc(f.title)}</h2><p>${esc(f.plain)}</p><h3>Cosa ha controllato Easy Come</h3><div class=\"box\">${esc(f.checked)}</div><h3>Perch\u00e9 te lo segnaliamo</h3><div class=\"box\">${esc(f.why)}</div><h3>Evidenze nel tuo database</h3><div class=\"box evidence\">${f.evidence?.length?`<table><thead><tr>${keys.map(k=>`<th>${esc(k)}</th>`).join('')}</tr></thead><tbody>${f.evidence.slice(0,20).map(r=>`<tr>${keys.map(k=>`<td>${esc(r[k])}</td>`).join('')}</tr>`).join('')}</tbody></table>`:'Nessuna riga da mostrare.'}</div><h3>Soluzione consigliata</h3><div class=\"solution recommended\"><small>CONSIGLIATA DA EASY COME</small><p>${esc(f.solution)}</p>${e?`<a class=\"btn primary\" href=\"index.html#${encodeURIComponent(e.key)}\">Apri ${esc(e.label)} nel Gestionale</a>`:''}</div>${(f.options||[]).slice(1).map((o,i)=>`<div class=\"solution\"><small>OPZIONE ${i+2}</small><p>${esc(o)}</p></div>`).join('')}<div style=\"display:flex;gap:8px;flex-wrap:wrap;margin-top:25px\"><button class=\"btn\" data-export-finding=\"${esc(f.id)}\">Scarica evidenze CSV</button><button class=\"btn ${ver?'':'orange'}\" data-verify=\"${esc(f.id)}\">${ver?'\u2713 Gi\u00e0 verificato':'Segna come verificato'}</button></div><p class=\"muted\" style=\"margin-top:18px;font-size:12px\">\u201cVerificato\u201d registra la tua revisione. Per dimostrare che il problema \u00e8 realmente sparito, correggi il Gestionale e avvia un nuovo Audit.</p></div></aside>`}\n  function csv(rows){if(!rows.length)return '';const keys=[...new Set(rows.flatMap(r=>Object.keys(r)))];const q=v=>'\"'+String(v??'').replaceAll('\"','\"\"')+'\"';return [keys.map(q).join(','),...rows.map(r=>keys.map(k=>q(r[k])).join(','))].join('\\n')}\n  function download(name,text,type='text/csv'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}\n  function exportAll(){const a=state.selected;if(!a)return;const rows=a.findings.flatMap(f=>(f.evidence||[]).map(r=>({severita:f.severity,titolo:f.title,controllo:f.checked,soluzione:f.solution,...r})));download(`easycome-audit-${new Date(a.createdAt).toISOString().slice(0,10)}.csv`,csv(rows))}\n  function bind(){$$('[data-view]').forEach(b=>b.onclick=()=>{state.view=b.dataset.view;render()});$$('[data-new]').forEach(b=>b.onclick=startAudit);$$('[data-open-audit]').forEach(b=>b.onclick=()=>{const a=state.history.find(x=>x.id===b.dataset.openAudit);if(a)renderAudit(a)});$$('[data-finding]').forEach(b=>b.onclick=()=>{const f=state.selected?.findings.find(x=>x.id===b.dataset.finding);if(f){document.body.insertAdjacentHTML('beforeend',findingPanel(f));bindPanel()}});$('[data-export]')?.addEventListener('click',exportAll)}\n  function bindPanel(){$('[data-close]')?.addEventListener('click',()=>$('.panel')?.remove());$('[data-verify]')?.addEventListener('click',e=>{setVerified(e.currentTarget.dataset.verify,true);$('.panel')?.remove();renderAudit(state.selected)});$('[data-export-finding]')?.addEventListener('click',e=>{const f=state.selected?.findings.find(x=>x.id===e.currentTarget.dataset.exportFinding);if(f)download(`evidenze-${f.code}.csv`,csv(f.evidence||[]))})}\n  function render(){root.innerHTML=state.view==='history'?historyView():home();bind()}\n  async function init(){loadHistory();if(!entities.length){root.innerHTML=`<main class=\"gate\"><span class=\"eyebrow\">EASY COME AUDIT</span><h1>Nessun Gestionale Easy Come collegato.</h1><p>Audit \u00e8 un modulo complementare: per funzionare deve conoscere le sezioni e il database del tuo Gestionale Easy Come.</p><a class=\"btn primary\" href=\"easycome-hub.html\">Torna all'Hub</a></main>`;return}if(authReady){const {data}=await db.auth.getSession();state.session=data.session;if(!state.session){root.innerHTML=`<main class=\"gate\"><span class=\"eyebrow\">ACCESSO EASY COME</span><h1>Accedi prima al tuo Hub.</h1><p>Audit usa la stessa sessione e lo stesso spazio aziendale del Gestionale.</p><a class=\"btn primary\" href=\"easycome-hub.html\">Accedi dall'Easy Come Hub</a></main>`;return}const s=await db.from('easycome_subscriptions').select('*').eq('user_id',state.session.user.id).order('created_at',{ascending:false}).limit(1);if(!s.error)state.subscription=s.data?.[0]||null}if(!hasAudit()){gate();return}render()}\n  init();\n})();\n";
  }

  function generatedManualHtml(project, entities) {
    const moduleNames = (project.modules || []).map((id) => MODULES.find((item) => item.id === id)?.name).filter(Boolean);
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Manuale — ${escapeHtml(project.company.name || 'Gestionale')}</title><style>
    *{box-sizing:border-box}body{margin:0;background:#f1eee8;color:#171916;font-family:Inter,Arial,sans-serif}.manual-shell{display:grid;grid-template-columns:270px 1fr;min-height:100vh}.manual-nav{background:#171916;color:#fff;padding:28px 22px;position:sticky;top:0;height:100vh}.manual-brand{display:flex;gap:10px;align-items:center}.manual-brand b{width:42px;height:42px;border-radius:13px;background:${project.company.primaryColor || '#275dff'};display:grid;place-items:center}.manual-brand span strong,.manual-brand span small{display:block}.manual-brand span small{color:#ffffff77;font-size:10px}.manual-nav nav{display:grid;gap:5px;margin-top:35px}.manual-nav a{color:#ffffff88;text-decoration:none;padding:10px;border-radius:10px;font-size:12px}.manual-nav a:hover{background:#ffffff12;color:#fff}.manual-nav footer{position:absolute;bottom:24px;font-size:10px;color:#ffffff66}.manual-main{padding:52px clamp(28px,7vw,100px);max-width:1100px}.manual-main>header span{font-size:10px;letter-spacing:.14em;color:${project.company.primaryColor || '#275dff'};font-weight:900}.manual-main h1{font:700 clamp(50px,7vw,90px)/.9 Georgia,serif;letter-spacing:-.055em;margin:15px 0}.manual-main>header p{font-size:18px;color:#6f6a62;line-height:1.55}.manual-section{background:#fff;border:1px solid #dcd6cd;border-radius:22px;padding:28px;margin:18px 0}.manual-section h2{font-size:27px;margin:0 0 12px}.manual-section p,.manual-section li{line-height:1.65;color:#625d56}.manual-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.manual-card{border:1px solid #e4ded5;border-radius:16px;padding:18px}.manual-card strong,.manual-card small{display:block}.manual-card small{color:#817a70;margin-top:5px}.step-list{counter-reset:step;display:grid;gap:12px}.step-list article{display:grid;grid-template-columns:38px 1fr;gap:12px}.step-list article:before{counter-increment:step;content:counter(step);width:38px;height:38px;border-radius:12px;background:#171916;color:#fff;display:grid;place-items:center;font-weight:900}.step-list h3{margin:0}.step-list p{margin:4px 0 0}.manual-actions{display:flex;gap:10px;flex-wrap:wrap}.manual-actions a{display:inline-block;text-decoration:none;padding:12px 15px;border-radius:11px;background:#171916;color:#fff;font-weight:800}.manual-actions a.secondary{background:#fff;color:#171916;border:1px solid #d8d1c6}@media(max-width:800px){.manual-shell{grid-template-columns:1fr}.manual-nav{position:relative;height:auto}.manual-nav nav,.manual-nav footer{display:none}.manual-grid{grid-template-columns:1fr}.manual-main{padding:30px 20px}}
    </style></head><body><div class="manual-shell"><aside class="manual-nav"><div class="manual-brand"><b>EC</b><span><strong>${escapeHtml(project.company.name || 'Gestionale')}</strong><small>Manuale Easy Come</small></span></div><nav><a href="#inizio">Primo accesso</a><a href="#panoramica">Panoramica</a><a href="#sezioni">Sezioni operative</a><a href="#dati">Dati e backup</a><a href="#hub">Easy Come Hub</a><a href="#sicurezza">Sicurezza</a></nav><footer>Generato per ${escapeHtml(project.company.email || '')}</footer></aside><main class="manual-main"><header><span>MANUALE PERSONALIZZATO · VERSIONE 1.0</span><h1>${escapeHtml(project.company.name || 'Il tuo gestionale')}</h1><p>${escapeHtml(project.company.description || 'Questa guida spiega come usare il sistema giorno per giorno.')}</p></header>
    <section class="manual-section" id="inizio"><h2>Primo accesso</h2><div class="step-list"><article><div><h3>Apri il gestionale</h3><p>Usa lo stesso indirizzo email e la stessa password creati su Easy Come.</p></div></article><article><div><h3>Controlla il tuo account</h3><p>Il titolare accede come amministratore. Gli altri utenti vengono invitati dalla sezione Impostazioni.</p></div></article><article><div><h3>Completa la checklist</h3><p>Apri Easy Come Hub e completa i passaggi di avvio prima di inserire dati reali.</p></div></article></div></section>
    <section class="manual-section" id="panoramica"><h2>Panoramica</h2><p>La dashboard mostra attività, scadenze, indicatori e accessi rapidi. I valori si aggiornano in base ai dati inseriti nelle sezioni operative.</p><div class="manual-grid">${moduleNames.slice(0,8).map((name)=>`<article class="manual-card"><strong>${escapeHtml(name)}</strong><small>Funzione inclusa nel progetto</small></article>`).join('')}</div></section>
    <section class="manual-section" id="sezioni"><h2>Sezioni operative</h2><div class="manual-grid">${entities.filter((e)=>!e.system).map((entity)=>`<article class="manual-card"><strong>${escapeHtml(entity.label)}</strong><small>${entity.fields.length} campi · crea, cerca, modifica ed esporta</small></article>`).join('')}</div></section>
    <section class="manual-section" id="dati"><h2>Dati, Excel e backup</h2><ul><li>Usa la ricerca e i filtri per trovare rapidamente le informazioni.</li><li>Esporta CSV o workbook Excel senza bloccare i dati nel software.</li><li>Scarica un backup JSON prima di importazioni o modifiche importanti.</li><li>Il pacchetto base usa accesso Easy Come e dati locali; l’implementazione può attivare il database cloud.</li></ul></section>
    <section class="manual-section" id="hub"><h2>Easy Come Hub</h2><p>È il canale riservato tra la tua azienda ed Easy Come. Qui puoi aprire il manuale, seguire l’onboarding, segnalare un problema, chiedere una nuova funzione, prenotare un incontro, vedere gli aggiornamenti e raggiungere il profilo centrale con ordini e gestione del servizio tecnico.</p><div class="manual-actions"><a href="easycome-hub.html">Apri Easy Come Hub</a><a class="secondary" href="DOCUMENTI/MANUALE-OPERATIVO.pdf">Scarica PDF</a></div></section>
    <section class="manual-section" id="sicurezza"><h2>Sicurezza e buone pratiche</h2><ul><li>Non condividere password tra collaboratori: crea un account per ogni persona.</li><li>Conserva backup periodici in una posizione sicura.</li><li>Attiva il database cloud solo con RLS e ruoli verificati.</li><li>Le integrazioni esterne richiedono credenziali intestate all’azienda.</li></ul></section>
    </main></div></body></html>`;
  }

  function generatedAppJs() {
    if (!global.ECProductTemplates) throw new Error('Template prodotto non caricati.');
    return global.ECProductTemplates.appJs();
  }
  function generatedHubJs() {
    if (!global.ECProductTemplates) throw new Error('Template prodotto non caricati.');
    return global.ECProductTemplates.hubJs();
  }
  function generatedAutomationFunction(project) {
    const workflows = JSON.stringify(project.automations || [], null, 2);
    const entityMap = Object.fromEntries(buildEntities(project).map((entity) => [entity.key, entity]));
    const dateFlows = (project.automations || []).filter((flow) => flow.trigger === 'date_reached' && flow.entity).map((flow) => {
      const entity = entityMap[flow.entity];
      const dateField = entity?.fields?.find((field) => ['datetime', 'date'].includes(field.type));
      return dateField ? { workflowName: flow.name, entity: flow.entity, dateField: dateField.key } : null;
    }).filter(Boolean);
    return `// Supabase Edge Function: process-automations
// Deploy: supabase functions deploy process-automations --no-verify-jwt
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const workflows = ${workflows};
const dateFlows = ${JSON.stringify(dateFlows, null, 2)};

Deno.serve(async (req) => {
  const cronSecret = Deno.env.get('AUTOMATION_CRON_SECRET');
  if (!cronSecret || req.headers.get('x-cron-secret') !== cronSecret) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(url, serviceKey);
  const now = new Date();
  const nextHour = new Date(now.getTime() + 60 * 60 * 1000);

  // Genera eventi per le scadenze configurate. La deduplica impedisce doppie esecuzioni.
  for (const dateFlow of dateFlows) {
    const { data: dueRows, error: dueError } = await db
      .from(dateFlow.entity)
      .select('*')
      .gte(dateFlow.dateField, now.toISOString())
      .lt(dateFlow.dateField, nextHour.toISOString())
      .limit(100);
    if (dueError) continue;
    for (const row of dueRows || []) {
      const dueValue = String(row[dateFlow.dateField] || '');
      const dedupeKey = [dateFlow.workflowName, row.id, dueValue].join(':');
      await db.from('automation_events').upsert({
        organization_id: row.organization_id,
        entity: dateFlow.entity,
        event_type: 'date_reached',
        record_id: row.id,
        payload: row,
        dedupe_key: dedupeKey,
      }, { onConflict: 'dedupe_key', ignoreDuplicates: true });
    }
  }

  const { data: events, error } = await db
    .from('automation_events')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(50);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const results = [];
  for (const event of events || []) {
    const { data: claimed } = await db.from('automation_events')
      .update({ status: 'processing' })
      .eq('id', event.id)
      .eq('status', 'pending')
      .select('id')
      .maybeSingle();
    if (!claimed) continue;

    const matched = workflows.filter((flow) => flow.enabled !== false
      && flow.trigger === event.event_type
      && (!flow.entity || flow.entity === event.entity));

    try {
      for (const flow of matched) {
        try {
          if (flow.action === 'webhook' && flow.target) {
            const response = await fetch(flow.target, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ flow, event }),
            });
            if (!response.ok) throw new Error('Webhook HTTP ' + response.status);
          }

          if (flow.action === 'email') {
            const apiKey = Deno.env.get('RESEND_API_KEY');
            const from = Deno.env.get('EMAIL_FROM');
            const to = flow.target || event.payload?.email;
            if (!apiKey || !from || !to) throw new Error('Configura RESEND_API_KEY, EMAIL_FROM e destinatario');
            const response = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: { authorization: 'Bearer ' + apiKey, 'content-type': 'application/json' },
              body: JSON.stringify({
                from, to,
                subject: flow.subject || flow.name || 'Aggiornamento dal gestionale',
                html: flow.message || '<p>Nuovo evento nel gestionale.</p>',
              }),
            });
            if (!response.ok) throw new Error('Email non inviata: ' + await response.text());
          }

          if (flow.action === 'notify') {
            const { error: notifyError } = await db.from('internal_notifications').insert({
              organization_id: event.organization_id,
              title: flow.name || 'Nuova notifica',
              message: flow.message || JSON.stringify(event.payload),
            });
            if (notifyError) throw notifyError;
          }

          if (flow.action === 'create_task') {
            const { error: taskError } = await db.from('tasks').insert({
              organization_id: event.organization_id,
              title: flow.message || flow.name || 'Attività automatica',
              status: 'Da fare',
              priority: 'Media',
            });
            if (taskError) throw taskError;
          }

          if (flow.action === 'update_status' && flow.entity && flow.target) {
            const { error: updateError } = await db.from(flow.entity)
              .update({ status: flow.target })
              .eq('id', event.record_id)
              .eq('organization_id', event.organization_id);
            if (updateError) throw updateError;
          }

          if (flow.action === 'ai') {
            const endpoint = Deno.env.get('AI_WEBHOOK_URL');
            if (!endpoint) throw new Error('Configura AI_WEBHOOK_URL');
            const response = await fetch(endpoint, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ flow, event }),
            });
            if (!response.ok) throw new Error('AI webhook HTTP ' + response.status);
          }

          await db.from('automation_log').insert({
            organization_id: event.organization_id,
            workflow_name: flow.name || flow.action,
            event_name: event.event_type,
            status: 'Eseguita',
            details: 'Record ' + (event.record_id || 'n/a'),
          });
        } catch (flowError) {
          await db.from('automation_log').insert({
            organization_id: event.organization_id,
            workflow_name: flow.name || flow.action,
            event_name: event.event_type,
            status: 'Errore',
            details: String(flowError),
          });
          throw flowError;
        }
      }

      await db.from('automation_events').update({ status: 'done', processed_at: new Date().toISOString() }).eq('id', event.id);
      results.push({ id: event.id, ok: true, workflows: matched.length });
    } catch (automationError) {
      await db.from('automation_events').update({ status: 'error', error_message: String(automationError), processed_at: new Date().toISOString() }).eq('id', event.id);
      results.push({ id: event.id, ok: false, error: String(automationError) });
    }
  }

  return Response.json({ processed: results.length, results });
});
`;
  }
  function generatedInviteFunction(project) {
    return `// Supabase Edge Function: invite-member
// Deploy: supabase functions deploy invite-member
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
  const authHeader = req.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) return new Response('Unauthorized', { status: 401 });

  const url = Deno.env.get('SUPABASE_URL')!;
  const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
  const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const userDb = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
  const adminDb = createClient(url, service);

  const body = await req.json().catch(() => ({}));
  const organizationId = String(body.organizationId || '');
  const email = String(body.email || '').trim().toLowerCase();
  const role = ['admin','member','viewer','support'].includes(body.role) ? body.role : 'member';
  const redirectTo = String(body.redirectTo || '');
  if (!organizationId || !email.includes('@')) return Response.json({ error: 'Dati invito non validi' }, { status: 400 });

  const { data: roleData, error: roleError } = await userDb.rpc('get_my_role', { p_organization_id: organizationId });
  if (roleError || !['owner','admin'].includes(roleData)) return new Response('Forbidden', { status: 403 });

  const { data: invited, error: inviteError } = await adminDb.auth.admin.inviteUserByEmail(email, redirectTo ? { redirectTo } : undefined);
  if (inviteError) {
    // L'utente potrebbe esistere già: prova a trovarlo per email.
    const { data: listed, error: listError } = await adminDb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (listError) return Response.json({ error: inviteError.message }, { status: 400 });
    const existing = listed.users.find((user) => String(user.email || '').toLowerCase() === email);
    if (!existing) return Response.json({ error: inviteError.message }, { status: 400 });
    const { error: memberError } = await adminDb.from('organization_members').upsert({ organization_id: organizationId, user_id: existing.id, role, email });
    if (memberError) return Response.json({ error: memberError.message }, { status: 400 });
    return Response.json({ ok: true, userId: existing.id, existing: true });
  }

  const userId = invited.user?.id;
  if (!userId) return Response.json({ error: 'Invito creato senza user id' }, { status: 500 });
  const { error: memberError } = await adminDb.from('organization_members').upsert({ organization_id: organizationId, user_id: userId, role, email });
  if (memberError) return Response.json({ error: memberError.message }, { status: 400 });
  return Response.json({ ok: true, userId, invited: true });
});
`;
  }

  function generatedManifest(project) {
    const name = project.company.name || 'Gestionale';
    return JSON.stringify({ name, short_name: name.slice(0, 16), start_url: './index.html', scope: './', display: 'standalone', background_color: '#f4f5f2', theme_color: project.company.accentColor || '#151515', icons: [{ src: 'assets/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }] }, null, 2);
  }

  function generatedServiceWorker() {
    return `const CACHE='easycome-v8';const ASSETS=['./','./index.html','./easycome-hub.html','./manuale.html','./assets/styles.css','./js/config.js','./js/app.js','./js/hub.js'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));`;
  }

  function generatedFavicon(project) {
    const primary = project.company.primaryColor || '#ff6b35';
    const initials = (project.company.name || 'EC').split(/\\s+/).slice(0,2).map((x)=>x[0]).join('').toUpperCase();
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="${primary}"/><text x="32" y="39" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" font-weight="800" fill="white">${escapeHtml(initials)}</text></svg>`;
  }

  function generatedFunctionalSpec(project, entities) {
    return `# Specifica funzionale — ${project.company.name || 'Gestionale'}\n\n## Obiettivo\n${project.company.description || 'Centralizzare e semplificare i processi aziendali.'}\n\n## Moduli attivi\n${project.modules.map((id)=>'- '+(MODULES.find((m)=>m.id===id)?.name||id)).join('\\n')}\n\n## Sezioni dati\n${entities.map((e)=>`### ${e.label}\n${e.fields.map((f)=>`- ${f.label} (${f.type})${f.required?' — obbligatorio':''}`).join('\\n')}`).join('\\n\\n')}\n\n## Automazioni\n${(project.automations||[]).map((a)=>`- ${a.name}: ${a.trigger} → ${a.action}`).join('\\n')||'- Nessuna automazione personalizzata'}\n`;
  }

  function generatedTestChecklist(project, entities) {
    return `# Checklist collaudo\n\n- [ ] Login con le stesse credenziali Easy Come\n- [ ] Recupero password verificato\n- [ ] Creazione, modifica ed eliminazione record\n- [ ] Ricerca in ogni sezione\n- [ ] Permessi utenti verificati\n- [ ] Visualizzazione mobile\n- [ ] Backup ed esportazione dati\n- [ ] Easy Come Hub aperto con lo stesso account\n- [ ] Richiesta di assistenza inviata dal Hub\n- [ ] Manuale personalizzato verificato\n${project.pricing.enabled?'- [ ] Calcolo prezzi e regole promozionali\\n':''}${(project.automations||[]).map((a)=>`- [ ] Automazione: ${a.name}`).join('\\n')}\n\nSezioni da verificare: ${entities.map((e)=>e.label).join(', ')}.\n`;
  }

  function generatedOffer(project, price) {
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Offerta ${escapeHtml(project.company.name||'')}</title><style>body{font-family:Arial,sans-serif;background:#f5f5f2;color:#171717;margin:0;padding:50px}.sheet{max-width:820px;margin:auto;background:#fff;border-radius:24px;padding:45px;box-shadow:0 25px 80px #0001}h1{font-size:42px;margin:12px 0}.muted{color:#777}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eee}.total{background:#171717;color:#fff;border-radius:18px;padding:22px;margin-top:20px}.total strong{font-size:34px;display:block;margin-top:5px}.pill{display:inline-block;background:${project.company.primaryColor||'#ff6b35'}22;color:${project.company.primaryColor||'#ff6b35'};padding:7px 10px;border-radius:999px;font-weight:bold;font-size:12px}</style></head><body><div class="sheet"><span class="pill">EASY COME · UNA TANTUM</span><h1>${escapeHtml(project.company.name||'Gestionale personalizzato')}</h1><p class="muted">${escapeHtml(project.company.description||'Soluzione digitale personalizzata per semplificare il lavoro quotidiano.')}</p><h2>Investimento</h2><div class="row"><span>Pacchetto software</span><strong>€${price.base.toFixed(2)}</strong></div>${price.implementation ? `<div class="row"><span>Implementazione assistita (opzionale)</span><strong>€${price.implementation.toFixed(2)}</strong></div>` : ''}<div class="row"><span>Moduli e personalizzazioni</span><strong>€${price.extras.toFixed(2)}</strong></div><div class="total"><span>Totale da pagare ora</span><strong>€${price.total.toFixed(2)}</strong><small>${(project.delivery?.auditServiceSelected || project.delivery?.managedServiceSelected) ? 'Più €100 al mese per Easy Come Audit, integrato nel Gestionale.' : 'Easy Come Audit non selezionato.'}</small></div><h2>Cosa ricevi</h2><p>Gestionale responsive, fogli Excel, calendario operativo, database Supabase, Easy Come Hub e manuale personalizzato.${price.implementation ? ` Implementazione assistita e ${project.delivery.supportDays||30} giorni di supporto inclusi.` : ' Implementazione e supporto non inclusi nel pacchetto software.'}</p></div></body></html>`;
  }

  function generatedQualityReport(project, entities, price, quality) {
    return `# Rapporto qualità — ${project.company.name || 'Gestionale'}

**Valutazione:** ${quality.score}/100 — ${quality.grade}

## Controlli bloccanti
${quality.blockers.length ? quality.blockers.map((item) => `- [ ] ${item}`).join('\n') : '- Nessun blocco rilevato.'}

## Avvisi da verificare
${quality.warnings.length ? quality.warnings.map((item) => `- [ ] ${item}`).join('\n') : '- Nessun avviso critico.'}

## Punti di forza inclusi
${quality.strengths.map((item) => `- ${item}`).join('\n')}

## Dimensione del prodotto
- ${entities.length} sezioni dati;
- ${project.modules.length} moduli;
- ${(project.automations || []).length} automazioni;
- backup JSON completo;
- importazione ed esportazione CSV;
- viste tabella, foglio Excel, bacheca, agenda, calendario, disponibilità e schede quando coerenti;
- audit log e permessi per ruolo;
- prezzo configurato: €${price.total.toFixed(2)} da pagare ora;${(project.delivery?.auditServiceSelected || project.delivery?.managedServiceSelected) ? '\n- Easy Come Audit selezionato: €100 al mese, collegato al database del Gestionale.' : ''}

## Regola di consegna
Il pacchetto deve essere consegnato soltanto dopo aver completato la checklist di collaudo, collegato Supabase e verificato i flussi esterni effettivamente acquistati.
`;
  }

  function generatedFeatureMap(project, entities) {
    const rows = entities.map((entity) => {
      const hasStatus = entity.fields.some((field) => field.key === 'status' || field.key.toLowerCase().includes('stato'));
      const hasDate = entity.fields.some((field) => ['date', 'datetime'].includes(field.type));
      const views = ['Tabella'];
      if (hasStatus) views.push('Bacheca');
      if (hasDate) views.push('Agenda');
      if (['customers', 'products', 'resources', 'staff', 'services'].includes(entity.key)) views.push('Schede');
      return `| ${entity.label} | ${entity.fields.length} | ${views.join(', ')} | CRUD, ricerca, CSV |`;
    });
    return `# Mappa delle funzioni

## Funzioni trasversali
- login e recupero password;
- ruoli owner, admin, member, viewer e support tecnico Easy Come;
- dashboard con KPI calcolati dai dati;
- ricerca, filtri e ordinamento;
- importazione ed esportazione CSV;
- backup e ripristino JSON;
- stampa di preventivi, ordini e fatture;
- caricamento documenti su Storage privato;
- controllo sovrapposizioni per prenotazioni, appuntamenti e turni;
- audit log delle modifiche;
- PWA e utilizzo responsive.

## Sezioni generate
| Sezione | Campi | Viste | Operazioni |
|---|---:|---|---|
${rows.join('\n')}

## Integrazioni esterne
Le automazioni email, webhook, AI e pagamenti diventano operative soltanto dopo aver configurato le credenziali indicate in ".env.example" e aver eseguito i relativi test.
`;
  }

  function generatedDeliveryGate(project) {
    return `# Prima della consegna al cliente

## 1. Accesso e sicurezza
- [ ] Eseguito supabase/schema.sql senza errori.
- [ ] Registrato il titolare con ${project.company.email || 'l’email configurata'}.
- [ ] Verificato che il titolare riceva il ruolo owner.
- [ ] Creato almeno un utente viewer e verificati i permessi di sola lettura.
- [ ] Verificata la cancellazione soltanto con owner/admin.
- [ ] Se Easy Come Audit è attivo, verificato accesso al modulo dallo stesso Easy Come Hub e dallo stesso tenant aziendale.

## 2. Flussi operativi
- [ ] Creato, modificato, duplicato ed eliminato un record per ogni sezione.
- [ ] Provate tabella, foglio Excel, bacheca, agenda, calendario, disponibilità e schede disponibili.
- [ ] Esportato e reimportato un CSV.
- [ ] Creato un backup JSON e verificato il contenuto.
- [ ] Inviata una richiesta di prova da Easy Come Hub.\n${project.pricing.enabled ? '- [ ] Verificati prezzo base, regole, tasse, extra e caparra.\n' : ''}- [ ] Verificati i controlli anti-sovrapposizione quando presenti.

## 3. Automazioni
${(project.automations || []).length ? (project.automations || []).map((flow) => `- [ ] Testata “${flow.name}” con un evento reale.`).join('\n') : '- Nessuna automazione personalizzata da testare.'}

## 4. Consegna
- [ ] Rimossi o sostituiti i dati dimostrativi.
- [ ] Configurati dominio, Site URL e Redirect URLs.
- [ ] Consegnata la guida al cliente.
- [ ] Concordata la durata del supporto iniziale (${project.delivery.supportDays || 30} giorni).
- [ ] Consegnato un backup iniziale.
`;
  }

  function generatedReadme(project, entities, price) {
    const moduleNames = project.modules.map((id) => MODULES.find((item) => item.id === id)?.name).filter(Boolean);
    return `# ${project.company.name || 'Gestionale personalizzato'}

Pacchetto generato con **Easy Come Studio V8** e bloccato da un controllo qualità prima del download.

## Contenuto

- gestionale dinamico con ${entities.length} sezioni;
- viste tabella, foglio Excel, bacheca, agenda, calendario, disponibilità e schede quando coerenti;
- import/export CSV e backup JSON;
- audit log, permessi reali e Storage documenti privato;
- modalità demo locale immediata;
- collegamento Supabase per login e dati cloud;
- schema SQL con Row Level Security;
- Easy Come Hub ridisegnato per manuale, assistenza, incontri, nuove funzioni e gestione tecnica;
- motore prezzi dinamici${project.pricing.enabled ? ' configurato' : ' predisposto'};
- ${project.automations.length} automazioni configurate;
- Edge Function per email, webhook, notifiche, task e aggiornamenti;
- file Vercel e Netlify per il deploy;
- workbook Excel, manuale PDF, executive summary e brand kit;
- sito Web Factory multipagina, SEO locale e form collegato al Gestionale quando selezionato;
- workflow n8n e piano Make quando sono presenti automazioni;
- endpoint AI configurabile quando viene selezionato il modulo AI;
- accesso al profilo Easy Come per ordini, download, incontri, assistenza e gestione dell’eventuale abbonamento tecnico.

## Moduli

${moduleNames.map((name) => `- ${name}`).join('\n')}

## Avvio immediato in demo

Apri il file index.html con un server statico. Da Terminale:

\`\`\`bash
npx serve .
\`\`\`

Poi apri l'indirizzo mostrato. Senza Supabase il gestionale funziona in modalità locale usando il browser.

## Collegamento Supabase

1. Crea un progetto Supabase.
2. Apri **SQL Editor** ed esegui supabase/schema.sql.
3. Apri js/config.js.
4. Sostituisci INSERISCI_PROJECT_URL con il Project URL.
5. Sostituisci INSERISCI_PUBLISHABLE_KEY con la publishable/anon key.
6. Apri il gestionale e registrati usando l’email titolare \`${project.company.email || 'configurata nel progetto'}\`. Solo quell’indirizzo può reclamare il ruolo owner.
7. Pubblica le Edge Functions \`process-automations\` e \`invite-member\`.
8. In Supabase Auth configura Site URL e Redirect URLs con il dominio finale.

Non inserire mai la service role key nel frontend.

## Automazioni

Le automazioni sono in automations/automation-plan.json e nella Edge Function:

\`\`\`text
supabase/functions/process-automations/index.ts
\`\`\`

Per pubblicarla:

\`\`\`bash
supabase functions deploy process-automations --no-verify-jwt
supabase functions deploy invite-member
\`\`\`

Secret opzionali:

- AUTOMATION_CRON_SECRET
- RESEND_API_KEY
- EMAIL_FROM
- AI_API_URL
- AI_API_KEY
- AI_MODEL

Programma una chiamata periodica alla funzione per processare la coda.

## Profilo e continuità Easy Come

Accedi all’indirizzo ${project.identity?.easycomeBaseUrl || 'https://easy-come.it'}/profilo.html con lo stesso account usato per l’acquisto. Da lì puoi riscaricare il pacchetto, chiedere assistenza, prenotare un incontro e gestire il servizio tecnico mensile quando attivo.

## Prezzo Easy Come configurato

- Pacchetto base: €${price.base.toFixed(2)}
- Totale da pagare ora: €${price.total.toFixed(2)}
${(project.delivery?.auditServiceSelected || project.delivery?.managedServiceSelected) ? '- Easy Come Audit: €100/mese, integrato e utilizzabile solo con il Gestionale Easy Come' : '- Easy Come Audit: non selezionato'}
- Implementazione assistita: ${price.implementation ? `€${price.implementation.toFixed(2)} (selezionata)` : 'non selezionata'}
- Moduli e personalizzazioni: €${price.extras.toFixed(2)}
- **Totale da pagare ora: €${price.total.toFixed(2)}**

## Limite importante

Il pacchetto contiene codice, database e configurazione. Email, WhatsApp, checkout online e AI richiedono le rispettive API. Il modulo “Fatture e scadenze” è una gestione interna e non sostituisce un servizio di fatturazione elettronica o un software contabile certificato.
`;
  }

  function generatedSetup(project) {
    return `# INSTALLAZIONE SEMPLICE

## Prova senza configurazione

1. Apri la cartella.
2. Avvia un server statico con \`npx serve .\`.
3. Entra in modalità demo.
4. I dati restano nel browser.

## Metti online il gestionale

### Supabase

1. Crea un progetto.
2. Esegui \`supabase/schema.sql\` nel SQL Editor.
3. Incolla URL e publishable key in \`js/config.js\`.
4. In Authentication → URL Configuration inserisci il dominio finale.

### Vercel

1. Carica questa cartella in un repository GitHub.
2. Importa il repository su Vercel.
3. Framework: Other.
4. Nessun build command obbligatorio.
5. Output directory: \`.\`.

### Netlify

Trascina la cartella nella schermata Deploy oppure collega il repository.

## Primo accesso

Registrati dal gestionale con l’email del titolare configurata nel progetto: **${project.company.email || 'da inserire'}**. Se la conferma email è attiva, conferma l’indirizzo. La RPC \`claim_owner_by_email\` rifiuta indirizzi diversi.

## Easy Come Hub

È disponibile in \`easycome-hub.html\` e usa le stesse credenziali dell’account Easy Come.
`;
  }

  function xmlEscape(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
  }

  function excelColumn(index) {
    let value = index + 1;
    let out = '';
    while (value > 0) {
      value -= 1;
      out = String.fromCharCode(65 + (value % 26)) + out;
      value = Math.floor(value / 26);
    }
    return out;
  }

  function excelExample(field, index) {
    if (field.type === 'number') return String([1, 2, 5, 10][index % 4]);
    if (field.type === 'currency') return String([99, 150, 250, 480][index % 4]);
    if (field.type === 'date') return '2026-08-03';
    if (field.type === 'datetime') return '2026-08-03 09:00';
    if (field.type === 'boolean') return 'Sì';
    if (field.type === 'select') return field.options?.[0] || 'Attivo';
    if (field.type === 'email') return 'cliente@esempio.it';
    if (field.type === 'phone') return '+39 333 1234567';
    return index === 0 ? 'Esempio' : '';
  }

  function generatedExcelWorkbook(project, entities) {
    if (!global.EasyZip?.createZipBytes) return null;

    const visible = entities.filter((entity) => !entity.system).slice(0, 24);
    const usedNames = new Set();
    const sheetName = (label, index) => {
      let base = String(label || `Foglio ${index + 1}`).replace(/[\\/?*\[\]:]/g, ' ').trim().slice(0, 31) || `Foglio ${index + 1}`;
      let name = base;
      let suffix = 2;
      while (usedNames.has(name)) name = `${base.slice(0, 27)} ${suffix++}`;
      usedNames.add(name);
      return name;
    };
    const safeFormulaSheet = (name) => `'${String(name).replace(/'/g, "''")}'`;
    const excelDateSerial = (date) => Math.floor(date.getTime() / 86400000) + 25569;
    const styleForField = (field) => {
      if (field.type === 'currency') return 4;
      if (field.type === 'date') return 5;
      if (field.type === 'datetime') return 6;
      if (field.type === 'number') return 16;
      if (field.type === 'boolean') return 11;
      return 0;
    };
    const cell = (ref, value, style = 0, formula = '') => {
      const styleAttr = style ? ` s="${style}"` : '';
      if (formula) return `<c r="${ref}"${styleAttr}><f>${xmlEscape(formula)}</f><v>0</v></c>`;
      if (typeof value === 'number' && Number.isFinite(value)) return `<c r="${ref}"${styleAttr}><v>${value}</v></c>`;
      return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t xml:space="preserve">${xmlEscape(value ?? '')}</t></is></c>`;
    };
    const row = (number, cells, height = '') => `<row r="${number}"${height ? ` ht="${height}" customHeight="1"` : ''}>${cells.join('')}</row>`;
    const sampleForField = (entity, field, index) => {
      const key = `${entity.key} ${field.key} ${field.label}`.toLowerCase();
      const date = new Date(Date.UTC(2026, 7, 3 + index));
      if (field.type === 'number') return [1, 2, 4, 8, 12][index % 5];
      if (field.type === 'currency') return [99, 150, 245, 480, 720][index % 5];
      if (field.type === 'date') return excelDateSerial(date);
      if (field.type === 'datetime') return excelDateSerial(date) + ((9 + index) / 24);
      if (field.type === 'boolean') return index % 4 === 3 ? 'No' : 'Sì';
      if (field.type === 'select') return field.options?.[index % Math.max(1, field.options.length)] || 'Attivo';
      if (field.type === 'email') return `cliente${index + 1}@esempio.it`;
      if (field.type === 'phone') return `+39 333 12345${String(index + 1).padStart(2, '0')}`;
      if (key.includes('cliente') || key.includes('customer')) return ['Giulia Romano', 'Marco De Luca', 'Studio Aurora', 'Sofia Conti', 'Alba Srl'][index % 5];
      if (key.includes('risorsa') || key.includes('resource')) return ['Risorsa 01', 'Risorsa 02', 'Risorsa 03', 'Risorsa 04', 'Risorsa 05'][index % 5];
      if (key.includes('nome') || key.includes('name')) return [`${entity.singular || entity.label} ${index + 1}`];
      if (key.includes('numero') || key.includes('number')) return `2026-${String(index + 1).padStart(3, '0')}`;
      if (key.includes('responsabile') || key.includes('assignee') || key.includes('operator')) return ['Chiara', 'Matteo', 'Francesca', 'Paolo', 'Elena'][index % 5];
      if (key.includes('note')) return index === 0 ? 'Riga dimostrativa: sostituisci o elimina prima dell’importazione.' : '';
      return index === 0 ? 'Esempio operativo' : '';
    };

    const entitySheets = visible.map((entity, index) => ({ name: sheetName(entity.label, index + 10), type: 'entity', entity }));
    const hasCalendar = visible.some((entity) => ['bookings', 'appointments', 'shifts'].includes(entity.key));
    const hasPricing = Boolean(project.pricing?.enabled || (project.pricing?.rules || []).length || (project.pricing?.extras || []).length);
    const sheets = [
      { name: sheetName('Istruzioni', 0), type: 'instructions' },
      { name: sheetName('Dashboard', 1), type: 'dashboard' },
      ...(hasCalendar ? [{ name: sheetName('Calendario disponibilità', 2), type: 'availability' }] : []),
      ...(hasPricing ? [{ name: sheetName('Listino e regole', 3), type: 'pricing' }] : []),
      ...entitySheets,
    ];
    const byEntityKey = new Map(entitySheets.map((sheet) => [sheet.entity.key, sheet]));
    const worksheetFiles = [];

    sheets.forEach((sheet, sheetIndex) => {
      let rows = '';
      let cols = '';
      let merges = [];
      let validations = [];
      let conditional = [];
      let autoFilter = '';
      let frozen = '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>';
      let maxRow = 20;
      let maxCol = 8;

      if (sheet.type === 'instructions') {
        maxCol = 7;
        maxRow = 22;
        merges = ['A1:G2', 'A4:G4', 'A17:G17'];
        cols = '<col min="1" max="1" width="4" customWidth="1"/><col min="2" max="2" width="27" customWidth="1"/><col min="3" max="7" width="18" customWidth="1"/>';
        rows += row(1, [cell('A1', `${project.company.name || 'Gestionale'} · Modello operativo`, 1)], 28);
        rows += row(4, [cell('A4', 'COME USARE QUESTO FILE', 2)], 22);
        const instructions = [
          ['1', 'Lavora sulle copie', 'Conserva questo file come modello e crea una copia per ogni importazione importante.'],
          ['2', 'Non cambiare le intestazioni', 'La prima riga operativa di ogni foglio corrisponde ai campi del gestionale.'],
          ['3', 'Usa filtri e menu', 'Le colonne con valori predefiniti contengono menu a tendina e controlli.'],
          ['4', 'Controlla il calendario', 'Quando presenti, disponibilità e occupazioni si leggono nel foglio dedicato.'],
          ['5', 'Importa dal gestionale', 'Esporta CSV/XLS dal gestionale, aggiorna i dati e reimporta mantenendo le colonne.'],
          ['6', 'Prima della consegna', 'Elimina le righe dimostrative e verifica formule, ruoli, backup, manuale e Easy Come Hub.'],
        ];
        instructions.forEach((item, index) => {
          const r = index + 6;
          rows += row(r, [cell(`A${r}`, item[0], 3), cell(`B${r}`, item[1], 15), cell(`C${r}`, item[2], 8)], 28);
          merges.push(`C${r}:G${r}`);
        });
        rows += row(17, [cell('A17', 'DATI DEL PROGETTO', 2)], 22);
        const info = [
          ['Azienda', project.company.name || '—'],
          ['Settore', project.company.industry || '—'],
          ['Email titolare', project.company.email || '—'],
          ['Pacchetto software', `€${calculatePrice(project).total.toFixed(2)} una tantum`],
        ];
        info.forEach((item, index) => {
          const r = 19 + index;
          rows += row(r, [cell(`A${r}`, item[0], 10), cell(`B${r}`, item[1], 15)]);
          merges.push(`B${r}:D${r}`);
        });
        frozen = '';
      }

      if (sheet.type === 'dashboard') {
        maxCol = 8;
        maxRow = Math.max(24, visible.length + 12);
        merges = ['A1:H2', 'A4:B4', 'C4:D4', 'E4:F4', 'G4:H4', 'A7:H7'];
        cols = '<col min="1" max="1" width="25" customWidth="1"/><col min="2" max="2" width="15" customWidth="1"/><col min="3" max="8" width="17" customWidth="1"/>';
        rows += row(1, [cell('A1', project.company.name || 'Gestionale', 1)], 30);
        rows += row(4, [cell('A4', 'SEZIONI OPERATIVE', 10), cell('C4', 'MODULI ATTIVI', 10), cell('E4', 'VALORE SOFTWARE', 10), cell('G4', 'STATO PROGETTO', 10)], 22);
        rows += row(5, [cell('A5', visible.length, 9), cell('C5', (project.modules || []).length, 9), cell('E5', calculatePrice(project).total, 4), cell('G5', 'Pronto per il collaudo', 12)], 30);
        rows += row(7, [cell('A7', 'RIEPILOGO DATI', 2)], 22);
        rows += row(8, [cell('A8', 'Sezione', 3), cell('B8', 'Righe compilate', 3), cell('C8', 'Uso operativo', 3), cell('D8', 'Ultimo controllo', 3)], 22);
        visible.forEach((entity, index) => {
          const r = index + 9;
          const entitySheet = byEntityKey.get(entity.key);
          const ref = `${safeFormulaSheet(entitySheet.name)}!A:A`;
          rows += row(r, [
            cell(`A${r}`, entity.label, 15),
            cell(`B${r}`, 0, 16, `MAX(COUNTA(${ref})-3,0)`),
            cell(`C${r}`, entity.fields.slice(0, 3).map((field) => field.label).join(' · '), 8),
            cell(`D${r}`, 'Da verificare', 14),
          ]);
        });
        const financialStart = visible.length + 11;
        rows += row(financialStart, [cell(`A${financialStart}`, 'CONTROLLO ECONOMICO', 2)], 22);
        merges.push(`A${financialStart}:H${financialStart}`);
        const financialRows = [];
        const moneyMetric = (label, entityKey, fieldKey) => {
          const entitySheet = byEntityKey.get(entityKey);
          if (!entitySheet) return;
          const index = entitySheet.entity.fields.findIndex((field) => field.key === fieldKey);
          if (index < 0) return;
          const col = excelColumn(index);
          financialRows.push([label, `SUM(${safeFormulaSheet(entitySheet.name)}!${col}4:${col}1000)`]);
        };
        moneyMetric('Pagamenti registrati', 'payments', 'amount');
        moneyMetric('Spese registrate', 'expenses', 'amount');
        moneyMetric('Preventivi', 'quotes', 'total');
        moneyMetric('Ordini', 'orders', 'total');
        moneyMetric('Fatture interne', 'invoices', 'total');
        if (!financialRows.length) financialRows.push(['Valore configurazione', `${calculatePrice(project).total}`]);
        financialRows.slice(0, 5).forEach((item, index) => {
          const r = financialStart + 2 + index;
          rows += row(r, [cell(`A${r}`, item[0], 10), cell(`B${r}`, 0, 4, item[1])]);
        });
        autoFilter = `A8:D${visible.length + 8}`;
        frozen = '<pane ySplit="8" topLeftCell="A9" activePane="bottomLeft" state="frozen"/>';
      }

      if (sheet.type === 'availability') {
        maxCol = 32;
        maxRow = 35;
        merges = ['A1:AF2', 'A4:AF4'];
        cols = '<col min="1" max="1" width="22" customWidth="1"/><col min="2" max="32" width="8.5" customWidth="1"/>';
        rows += row(1, [cell('A1', `${project.company.name || 'Gestionale'} · Calendario disponibilità`, 1)], 30);
        rows += row(4, [cell('A4', 'Cambia il mese in B5. Le celle verdi indicano disponibilità; le rosse un’occupazione registrata.', 8)], 24);
        rows += row(5, [cell('A5', 'Mese', 3), cell('B5', excelDateSerial(new Date(Date.UTC(2026, 7, 1))), 5)]);
        rows += row(7, [cell('A7', 'Risorsa', 3), ...Array.from({ length: 31 }, (_, index) => cell(`${excelColumn(index + 1)}7`, index + 1, 3))], 22);
        const resourceSheet = byEntityKey.get('resources');
        const bookingSheet = byEntityKey.get('bookings') || byEntityKey.get('appointments') || byEntityKey.get('shifts');
        const resourceNames = ['Risorsa 01', 'Risorsa 02', 'Risorsa 03', 'Risorsa 04', 'Risorsa 05', 'Risorsa 06', 'Risorsa 07', 'Risorsa 08'];
        resourceNames.forEach((name, index) => {
          const r = index + 8;
          const cells = [cell(`A${r}`, name, 15)];
          for (let day = 1; day <= 31; day += 1) {
            const ref = `${excelColumn(day)}${r}`;
            if (bookingSheet) {
              const resourceIndex = bookingSheet.entity.fields.findIndex((field) => /resource|operator|staff/i.test(field.key));
              const startIndex = bookingSheet.entity.fields.findIndex((field) => /start_at|date|scheduled/i.test(field.key));
              const endIndex = bookingSheet.entity.fields.findIndex((field) => /end_at/i.test(field.key));
              if (resourceIndex >= 0 && startIndex >= 0) {
                const resourceCol = excelColumn(resourceIndex);
                const startCol = excelColumn(startIndex);
                const endCol = endIndex >= 0 ? excelColumn(endIndex) : startCol;
                const bookingName = safeFormulaSheet(bookingSheet.name);
                const formula = `IF(COUNTIFS(${bookingName}!$${resourceCol}:$${resourceCol},$A${r},${bookingName}!$${startCol}:$${startCol},\"<\"&DATE(YEAR($B$5),MONTH($B$5),${day}+1),${bookingName}!$${endCol}:$${endCol},\">=\"&DATE(YEAR($B$5),MONTH($B$5),${day}))>0,\"OCCUPATA\",\"LIBERA\")`;
                cells.push(cell(ref, '', 11, formula));
              } else cells.push(cell(ref, 'LIBERA', 11));
            } else cells.push(cell(ref, 'LIBERA', 11));
          }
          rows += row(r, cells, 21);
        });
        conditional.push('<conditionalFormatting sqref="B8:AF35"><cfRule type="cellIs" dxfId="0" priority="1" operator="equal"><formula>"LIBERA"</formula></cfRule><cfRule type="cellIs" dxfId="1" priority="2" operator="equal"><formula>"OCCUPATA"</formula></cfRule></conditionalFormatting>');
        frozen = '<pane xSplit="1" ySplit="7" topLeftCell="B8" activePane="bottomRight" state="frozen"/>';
      }

      if (sheet.type === 'pricing') {
        maxCol = 8;
        const rules = project.pricing?.rules || [];
        const extras = project.pricing?.extras || [];
        maxRow = Math.max(22, rules.length + extras.length + 14);
        merges = ['A1:H2', 'A4:H4', 'A7:H7'];
        cols = '<col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="28" customWidth="1"/><col min="3" max="8" width="18" customWidth="1"/>';
        rows += row(1, [cell('A1', `${project.company.name || 'Gestionale'} · Listino e regole`, 1)], 30);
        rows += row(4, [cell('A4', 'CONFIGURAZIONE BASE', 2)], 22);
        rows += row(5, [cell('A5', 'Prezzo base servizio', 10), cell('B5', Number(project.pricing?.basePrice || 0), 4)]);
        rows += row(7, [cell('A7', 'REGOLE DI PREZZO', 2)], 22);
        rows += row(8, [cell('A8', 'Nome', 3), cell('B8', 'Tipo', 3), cell('C8', 'Valore', 3), cell('D8', 'Da', 3), cell('E8', 'A', 3)], 22);
        rules.forEach((rule, index) => {
          const r = 9 + index;
          rows += row(r, [cell(`A${r}`, rule.name || `Regola ${index + 1}`, 15), cell(`B${r}`, rule.type || 'custom'), cell(`C${r}`, rule.amount ?? rule.percent ?? rule.value ?? ''), cell(`D${r}`, rule.from || rule.min || ''), cell(`E${r}`, rule.to || rule.max || '')]);
        });
        const extrasStart = 10 + rules.length;
        rows += row(extrasStart, [cell(`A${extrasStart}`, 'EXTRA E SUPPLEMENTI', 2)], 22);
        merges.push(`A${extrasStart}:H${extrasStart}`);
        rows += row(extrasStart + 1, [cell(`A${extrasStart + 1}`, 'Nome', 3), cell(`B${extrasStart + 1}`, 'Tipo', 3), cell(`C${extrasStart + 1}`, 'Prezzo', 3), cell(`D${extrasStart + 1}`, 'Obbligatorio', 3)], 22);
        extras.forEach((extra, index) => {
          const r = extrasStart + 2 + index;
          rows += row(r, [cell(`A${r}`, extra.name || `Extra ${index + 1}`, 15), cell(`B${r}`, extra.type || 'fixed'), cell(`C${r}`, Number(extra.price || extra.amount || 0), 4), cell(`D${r}`, extra.required ? 'Sì' : 'No', 11)]);
        });
        autoFilter = `A8:E${Math.max(9, 8 + rules.length)}`;
        frozen = '<pane ySplit="8" topLeftCell="A9" activePane="bottomLeft" state="frozen"/>';
      }

      if (sheet.type === 'entity') {
        const fields = sheet.entity.fields.slice(0, 24);
        maxCol = Math.max(1, fields.length);
        maxRow = 1000;
        const lastCol = excelColumn(maxCol - 1);
        merges = [`A1:${lastCol}1`];
        cols = fields.map((field, index) => {
          const width = field.type === 'longtext' ? 36 : field.type === 'email' ? 25 : field.type === 'datetime' ? 21 : field.type === 'currency' ? 15 : index === 0 ? 24 : 18;
          return `<col min="${index + 1}" max="${index + 1}" width="${width}" customWidth="1"/>`;
        }).join('');
        rows += row(1, [cell('A1', `${project.company.name || 'Gestionale'} · ${sheet.entity.label}`, 1)], 28);
        rows += row(2, [cell('A2', `Foglio operativo · ${sheet.entity.singular || sheet.entity.label} · mantieni le intestazioni della riga 3`, 8)], 22);
        merges.push(`A2:${lastCol}2`);
        rows += row(3, fields.map((field, index) => cell(`${excelColumn(index)}3`, field.label + (field.required ? ' *' : ''), 3)), 24);
        for (let sampleIndex = 0; sampleIndex < 5; sampleIndex += 1) {
          const r = sampleIndex + 4;
          const cells = fields.map((field, index) => {
            const ref = `${excelColumn(index)}${r}`;
            if (field.key === 'total') {
              const quantityIndex = fields.findIndex((candidate) => candidate.key === 'quantity');
              const priceIndex = fields.findIndex((candidate) => candidate.key === 'unit_price');
              if (quantityIndex >= 0 && priceIndex >= 0) return cell(ref, 0, 4, `${excelColumn(quantityIndex)}${r}*${excelColumn(priceIndex)}${r}`);
            }
            return cell(ref, sampleForField(sheet.entity, field, sampleIndex), styleForField(field));
          });
          rows += row(r, cells, 22);
        }
        fields.forEach((field, index) => {
          const col = excelColumn(index);
          if (field.type === 'select' && field.options?.length) {
            const list = field.options.filter((option) => !String(option).includes(',')).join(',').slice(0, 240);
            if (list) validations.push(`<dataValidation type="list" allowBlank="1" showErrorMessage="1" errorTitle="Valore non valido" error="Scegli una voce dal menu" sqref="${col}4:${col}1000"><formula1>"${xmlEscape(list)}"</formula1></dataValidation>`);
            const green = field.options.find((option) => /complet|pagat|confermat|attiv|consegnat|chius/i.test(option));
            const red = field.options.find((option) => /annull|rifiut|scadut|dismess|urgente/i.test(option));
            const yellow = field.options.find((option) => /corso|attesa|bozza|richiesta|pianificat/i.test(option));
            const rules = [];
            if (green) rules.push(`<cfRule type="cellIs" dxfId="0" priority="1" operator="equal"><formula>"${xmlEscape(green)}"</formula></cfRule>`);
            if (red) rules.push(`<cfRule type="cellIs" dxfId="1" priority="2" operator="equal"><formula>"${xmlEscape(red)}"</formula></cfRule>`);
            if (yellow) rules.push(`<cfRule type="cellIs" dxfId="2" priority="3" operator="equal"><formula>"${xmlEscape(yellow)}"</formula></cfRule>`);
            if (rules.length) conditional.push(`<conditionalFormatting sqref="${col}4:${col}1000">${rules.join('')}</conditionalFormatting>`);
          }
          if (field.type === 'boolean') validations.push(`<dataValidation type="list" allowBlank="1" sqref="${col}4:${col}1000"><formula1>"Sì,No"</formula1></dataValidation>`);
        });
        autoFilter = `A3:${lastCol}1000`;
        frozen = '<pane ySplit="3" topLeftCell="A4" activePane="bottomLeft" state="frozen"/>';
      }

      if (!cols) cols = Array.from({ length: maxCol }, (_, index) => `<col min="${index + 1}" max="${index + 1}" width="${index === 0 ? 25 : 18}" customWidth="1"/>`).join('');
      const mergeXml = merges.length ? `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join('')}</mergeCells>` : '';
      const validationXml = validations.length ? `<dataValidations count="${validations.length}">${validations.join('')}</dataValidations>` : '';
      const filterXml = autoFilter ? `<autoFilter ref="${autoFilter}"/>` : '';
      const viewXml = `<sheetViews><sheetView showGridLines="${sheet.type === 'entity' ? 1 : 0}" workbookViewId="0">${frozen}</sheetView></sheetViews>`;
      worksheetFiles.push({
        name: `xl/worksheets/sheet${sheetIndex + 1}.xml`,
        data: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><dimension ref="A1:${excelColumn(maxCol - 1)}${maxRow}"/>${viewXml}<sheetFormatPr defaultRowHeight="18"/><cols>${cols}</cols><sheetData>${rows}</sheetData>${filterXml}${mergeXml}${conditional.join('')}${validationXml}<pageMargins left="0.3" right="0.3" top="0.5" bottom="0.5" header="0.2" footer="0.2"/></worksheet>`,
      });
    });

    const workbookSheets = sheets.map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join('');
    const workbookRels = sheets.map((sheet, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join('');
    const overrides = sheets.map((sheet, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('');
    const styles = `<?xml version="1.0" encoding="UTF-8"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
      <numFmts count="4"><numFmt numFmtId="164" formatCode="€ #,##0.00"/><numFmt numFmtId="165" formatCode="dd/mm/yyyy"/><numFmt numFmtId="166" formatCode="dd/mm/yyyy hh:mm"/><numFmt numFmtId="167" formatCode="0%"/></numFmts>
      <fonts count="5"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="18"/><name val="Aptos Display"/></font><font><b/><color rgb="FF171815"/><sz val="20"/><name val="Aptos Display"/></font><font><i/><color rgb="FF6F716B"/><sz val="10"/><name val="Aptos"/></font></fonts>
      <fills count="8"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF171815"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFF6B35"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF4F1EA"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F5ED"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFE8E2"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF3D6"/><bgColor indexed="64"/></patternFill></fill></fills>
      <borders count="3"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFD8D5CD"/></left><right style="thin"><color rgb="FFD8D5CD"/></right><top style="thin"><color rgb="FFD8D5CD"/></top><bottom style="thin"><color rgb="FFD8D5CD"/></bottom><diagonal/></border><border><left/><right/><top/><bottom style="medium"><color rgb="FF171815"/></bottom><diagonal/></border></borders>
      <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
      <cellXfs count="17">
        <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
        <xf numFmtId="0" fontId="2" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
        <xf numFmtId="0" fontId="1" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
        <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
        <xf numFmtId="164" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
        <xf numFmtId="165" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="166" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="167" fontId="0" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center"/></xf>
        <xf numFmtId="0" fontId="4" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
        <xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center"/></xf>
        <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
        <xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="0" fontId="0" fillId="6" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="0" fontId="0" fillId="7" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment horizontal="center" vertical="center"/></xf>
        <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
        <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment horizontal="right" vertical="center"/></xf>
      </cellXfs>
      <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
      <dxfs count="3"><dxf><fill><patternFill patternType="solid"><fgColor rgb="FFE8F5ED"/><bgColor indexed="64"/></patternFill></fill><font><color rgb="FF157347"/><b/></font></dxf><dxf><fill><patternFill patternType="solid"><fgColor rgb="FFFFE8E2"/><bgColor indexed="64"/></patternFill></fill><font><color rgb="FFB42318"/><b/></font></dxf><dxf><fill><patternFill patternType="solid"><fgColor rgb="FFFFF3D6"/><bgColor indexed="64"/></patternFill></fill><font><color rgb="FF8A5B00"/><b/></font></dxf></dxfs>
    </styleSheet>`;
    const files = [
      { name: '[Content_Types].xml', data: `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${overrides}</Types>` },
      { name: '_rels/.rels', data: '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>' },
      { name: 'xl/workbook.xml', data: `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><bookViews><workbookView/></bookViews><sheets>${workbookSheets}</sheets><calcPr calcMode="auto" fullCalcOnLoad="1" forceFullCalc="1"/></workbook>` },
      { name: 'xl/_rels/workbook.xml.rels', data: `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRels}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
      { name: 'xl/styles.xml', data: styles },
      ...worksheetFiles,
    ];
    return global.EasyZip.createZipBytes(files);
  }

  function generatedCsvTemplate(entity) {
    const quote = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const header = entity.fields.map((field) => quote(field.label)).join(';');
    const example = entity.fields.map((field, index) => quote(excelExample(field, index))).join(';');
    return `\ufeff${header}\n${example}\n`;
  }

  function generatedLogoWordmarkSvg(project, inverse = false) {
    const name = escapeHtml(project.company.name || 'Easy Come Business');
    const primary = inverse ? '#ffffff' : (project.company.primaryColor || '#ff6b35');
    const ink = inverse ? '#ffffff' : (project.company.accentColor || '#151515');
    const initials = (project.company.name || 'EC').split(/\s+/).filter(Boolean).slice(0,2).map((part)=>part[0]).join('').toUpperCase();
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="360" viewBox="0 0 1200 360"><rect width="1200" height="360" fill="${inverse ? project.company.accentColor || '#151515' : '#ffffff'}"/><rect x="70" y="70" width="220" height="220" rx="58" fill="${primary}"/><text x="180" y="210" dominant-baseline="middle" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="76" font-weight="800" fill="${inverse ? project.company.accentColor || '#151515' : '#ffffff'}">${escapeHtml(initials)}</text><text x="340" y="178" font-family="Georgia,serif" font-size="82" font-weight="700" fill="${ink}">${name}</text><text x="344" y="232" font-family="Arial,Helvetica,sans-serif" font-size="24" letter-spacing="5" fill="${primary}">${escapeHtml(project.company.industry || 'GESTIONE · AUTOMAZIONE · CRESCITA').toUpperCase()}</text></svg>`;
  }

  function generatedSocialCoverSvg(project) {
    const name = escapeHtml(project.company.name || 'La tua impresa');
    const description = escapeHtml((project.company.description || 'Un sistema digitale costruito intorno al tuo lavoro.').slice(0,150));
    const primary = project.company.primaryColor || '#ff6b35';
    const accent = project.company.accentColor || '#151515';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#f4efe7"/><circle cx="1360" cy="170" r="260" fill="${primary}" opacity=".9"/><circle cx="1460" cy="720" r="390" fill="${accent}" opacity=".96"/><path d="M0 720 C420 560 680 900 1110 650 L1110 900 H0Z" fill="${primary}" opacity=".16"/><text x="110" y="290" font-family="Georgia,serif" font-size="112" font-weight="700" fill="${accent}">${name}</text><foreignObject x="115" y="350" width="850" height="220"><div xmlns="http://www.w3.org/1999/xhtml" style="font:32px/1.45 Arial,sans-serif;color:${accent};max-width:760px">${description}</div></foreignObject><rect x="115" y="665" width="390" height="76" rx="38" fill="${primary}"/><text x="310" y="712" text-anchor="middle" font-family="Arial,sans-serif" font-size="25" font-weight="800" fill="#fff">SCOPRI IL NOSTRO SISTEMA</text></svg>`;
  }

  function generatedBrandGuide(project) {
    const primary = project.company.primaryColor || '#ff6b35';
    const accent = project.company.accentColor || '#151515';
    const name = escapeHtml(project.company.name || 'La tua impresa');
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Brand kit — ${name}</title><style>body{margin:0;background:#eee8de;color:${accent};font-family:Arial,sans-serif}.wrap{max-width:1050px;margin:auto;padding:60px 24px}.hero{background:#fff;border:1px solid ${accent};padding:54px;box-shadow:14px 14px 0 #0001}.eyebrow{font-size:12px;font-weight:800;letter-spacing:.18em;color:${primary}}h1{font:700 64px/1 Georgia,serif;margin:18px 0}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px;margin-top:30px}.card{background:#fff;border:1px solid #bdb4a7;padding:24px}.swatch{height:130px;border:1px solid #0002;margin-bottom:16px}.type-serif{font:700 42px Georgia,serif}.type-sans{font:700 28px Arial,sans-serif}.rules{line-height:1.7}.logo{width:100%;background:#fff;border:1px solid #ddd}</style></head><body><main class="wrap"><section class="hero"><span class="eyebrow">IDENTITÀ VISIVA</span><h1>${name}</h1><p>${escapeHtml(project.company.description || 'Sistema visivo coordinato per comunicare in modo chiaro e riconoscibile.')}</p><div class="grid"><div class="card"><div class="swatch" style="background:${primary}"></div><strong>Colore principale</strong><p>${primary}</p></div><div class="card"><div class="swatch" style="background:${accent}"></div><strong>Colore scuro</strong><p>${accent}</p></div><div class="card"><div class="type-serif">Titoli</div><p>Georgia / serif editoriale</p></div><div class="card"><div class="type-sans">Testi e interfaccia</div><p>Arial / sans-serif funzionale</p></div></div><h2>Regole essenziali</h2><div class="rules"><p>Usa il colore principale per azioni, stati positivi e dettagli riconoscibili. Mantieni ampi spazi bianchi. Non alterare proporzioni e contrasto del logo. Per testi lunghi usa sempre il colore scuro su fondo chiaro.</p></div><img class="logo" src="logo-wordmark.svg" alt="Logo ${name}"></section></main></body></html>`;
  }

  function generatedPublicSite(project) {
    const modules = (project.modules || []).map((id)=>MODULES.find((item)=>item.id===id)?.name).filter(Boolean).slice(0,8);
    const name = escapeHtml(project.company.name || 'La tua impresa');
    const primary = project.company.primaryColor || '#ff6b35';
    const accent = project.company.accentColor || '#151515';
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${name}</title><meta name="description" content="${escapeHtml(project.company.description || '')}"><style>*{box-sizing:border-box}body{margin:0;background:#f5efe6;color:${accent};font-family:Arial,sans-serif}a{color:inherit}.nav{display:flex;justify-content:space-between;align-items:center;padding:26px 5vw;border-bottom:1px solid ${accent}}.brand{font:700 25px Georgia,serif}.nav a{font-size:13px;font-weight:800;text-decoration:none}.hero{min-height:72vh;padding:8vw 5vw;display:grid;grid-template-columns:1.2fr .8fr;gap:4vw;align-items:center}.k{color:${primary};font-size:12px;font-weight:900;letter-spacing:.18em}h1{font:700 clamp(58px,8vw,128px)/.88 Georgia,serif;letter-spacing:-.06em;margin:22px 0}.lead{max-width:700px;font-size:20px;line-height:1.55}.cta{display:inline-block;margin-top:24px;padding:17px 25px;background:${primary};color:#fff;text-decoration:none;font-weight:800}.art{height:520px;border:1px solid ${accent};position:relative;overflow:hidden;background:#fff}.art:before{content:'';position:absolute;width:420px;height:420px;border-radius:50%;background:${primary};right:-120px;top:-90px}.art:after{content:'';position:absolute;width:520px;height:320px;background:${accent};left:-80px;bottom:-180px;transform:rotate(-12deg)}.services{padding:80px 5vw;background:#fff}.services h2{font:700 54px Georgia,serif}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:1px;background:${accent};border:1px solid ${accent}}.card{background:#fff;padding:28px;min-height:170px}.card b{display:block;color:${primary};font-size:12px;margin-bottom:18px}.footer{padding:42px 5vw;display:flex;justify-content:space-between;gap:20px;flex-wrap:wrap}@media(max-width:800px){.hero{grid-template-columns:1fr}.art{height:330px}}</style></head><body><nav class="nav"><div class="brand">${name}</div><a href="mailto:${escapeHtml(project.company.email || '')}">CONTATTI →</a></nav><main><section class="hero"><div><span class="k">${escapeHtml(project.company.industry || 'SERVIZI DIGITALI').toUpperCase()}</span><h1>${name}</h1><p class="lead">${escapeHtml(project.company.description || 'Un servizio costruito con attenzione, processi chiari e strumenti digitali semplici da usare.')}</p><a class="cta" href="mailto:${escapeHtml(project.company.email || '')}">Contatta ${name}</a></div><div class="art" aria-hidden="true"></div></section><section class="services"><span class="k">COSA GESTIAMO</span><h2>Un’esperienza più semplice, dall’inizio alla fine.</h2><div class="grid">${modules.map((module,index)=>`<article class="card"><b>${String(index+1).padStart(2,'0')}</b><h3>${escapeHtml(module)}</h3><p>Processo coordinato con il gestionale e aggiornabile dal tuo team.</p></article>`).join('')}</div></section></main><footer class="footer"><strong>${name}</strong><span>${escapeHtml(project.company.email || '')}</span></footer></body></html>`;
  }

  function generatedMobileApp(project, entities) {
    const name = escapeHtml(project.company.name || 'La tua impresa');
    const primary = project.company.primaryColor || '#ff6b35';
    const quick = entities.filter((entity)=>!entity.system).slice(0,6);
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="${primary}"><link rel="manifest" href="manifest.webmanifest"><title>${name} App</title><style>*{box-sizing:border-box}body{margin:0;background:#f3f1ed;color:#161616;font-family:Arial,sans-serif;padding-bottom:90px}.top{padding:calc(25px + env(safe-area-inset-top)) 22px 22px;background:${project.company.accentColor || '#151515'};color:#fff}.top span{font-size:11px;letter-spacing:.14em;color:${primary};font-weight:900}.top h1{margin:9px 0 0;font:700 34px Georgia,serif}.content{padding:20px}.hero{background:${primary};color:#fff;border-radius:26px;padding:25px;min-height:180px;display:flex;flex-direction:column;justify-content:space-between}.hero strong{font:700 30px Georgia,serif}.hero button{border:0;background:#fff;color:#111;padding:13px 16px;border-radius:14px;font-weight:800}.label{font-size:11px;font-weight:900;letter-spacing:.12em;margin:28px 0 12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.tile{border:0;background:#fff;border-radius:20px;padding:20px;text-align:left;min-height:125px;box-shadow:0 8px 30px #00000008}.tile b{display:block;font-size:20px;margin-bottom:20px}.tile span{font-weight:800}.offline{background:#fff4d8;border-radius:18px;padding:17px;margin-top:16px;font-size:13px}.nav{position:fixed;bottom:0;left:0;right:0;background:#fff;border-top:1px solid #ddd;display:flex;justify-content:space-around;padding:12px 10px calc(12px + env(safe-area-inset-bottom));font-size:11px;font-weight:800}.nav a{text-decoration:none;color:#222}</style></head><body><header class="top"><span>APP OPERATIVA</span><h1>${name}</h1></header><main class="content"><section class="hero"><div><small>OGGI</small><strong>Il lavoro importante, a portata di mano.</strong></div><button onclick="location.href='../index.html'">Apri il gestionale completo</button></section><div class="label">ACCESSI RAPIDI</div><section class="grid">${quick.map((entity,index)=>`<button class="tile" onclick="location.href='../index.html#${escapeHtml(entity.key)}'"><b>${['◎','▦','◇','✓','⌁','◷'][index%6]}</b><span>${escapeHtml(entity.label)}</span></button>`).join('')}</section><div class="offline"><strong>Modalità mobile</strong><br>La shell resta disponibile anche con connessione instabile; i dati cloud richiedono il collegamento a Supabase.</div></main><nav class="nav"><a href="../index.html">Gestionale</a><a href="../easycome-hub.html">Easy Come Hub</a></nav><script>if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js');</script></body></html>`;
  }

  function generatedMobileManifest(project) {
    return JSON.stringify({name:`${project.company.name || 'Easy Come'} App`,short_name:(project.company.name||'App').slice(0,18),start_url:'./index.html',display:'standalone',background_color:'#f3f1ed',theme_color:project.company.primaryColor||'#ff6b35',icons:[{src:'../assets/favicon.svg',sizes:'any',type:'image/svg+xml'}]},null,2);
  }

  function generatedMobileServiceWorker() {
    return `const C='ec-mobile-v8';const A=['./','./index.html','./manifest.webmanifest','../assets/favicon.svg'];self.addEventListener('install',e=>e.waitUntil(caches.open(C).then(c=>c.addAll(A))));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).catch(()=>caches.match('./index.html')))));`;
  }

  function generatedCapacitorConfig(project) {
    return JSON.stringify({appId:`com.easycome.${slugify(project.company.name).replace(/-/g,'')}`.slice(0,50),appName:project.company.name || 'Easy Come App',webDir:'mobile',server:{androidScheme:'https'}},null,2);
  }

  function generatedAiEndpoint(project) {
    return `export default async function handler(req,res){if(req.method!=='POST')return res.status(405).json({error:'Metodo non consentito'});try{const key=process.env.AI_API_KEY;const url=process.env.AI_API_URL;const model=process.env.AI_MODEL||'default';if(!key||!url)throw new Error('Configura AI_API_URL e AI_API_KEY');const message=String(req.body?.message||'').slice(0,6000);const context=${JSON.stringify((project.company.description || '').slice(0,1500))};const r=await fetch(url,{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+key},body:JSON.stringify({model,messages:[{role:'system',content:'Sei l’assistente operativo di ${String(project.company.name || '').replace(/'/g,"\\'")}. Usa questo contesto: '+context},{role:'user',content:message}]})});const data=await r.json();if(!r.ok)throw new Error(data.error?.message||'Provider AI non disponibile');return res.status(200).json({answer:data.choices?.[0]?.message?.content||data.output_text||''});}catch(e){return res.status(400).json({error:e.message||'Errore AI'});}}`;
  }

  function generatedAiReadme(project) {
    return `# Assistente AI — ${project.company.name || ''}\n\nIl pacchetto include una funzione server compatibile con provider API configurabili.\n\nVariabili richieste:\n\n- \`AI_API_URL\`\n- \`AI_API_KEY\`\n- \`AI_MODEL\`\n\nL’assistente non è attivo finché non vengono inserite credenziali valide e definite le regole privacy dell’impresa. Non inviare dati sensibili senza una base giuridica e una configurazione adeguata.\n`;
  }

  function generatedN8nWorkflow(project) {
    const flows = (project.automations || []).filter((flow)=>flow.enabled!==false);
    const nodes=[{parameters:{httpMethod:'POST',path:`${slugify(project.company.name)}-easycome`,responseMode:'onReceived',options:{}},id:'webhook',name:'Easy Come Webhook',type:'n8n-nodes-base.webhook',typeVersion:2,position:[260,300]}];
    if(flows.length){nodes.push({parameters:{assignments:{assignments:[{id:'project',name:'project',value:project.company.name||'',type:'string'},{id:'automation_count',name:'automation_count',value:flows.length,type:'number'}]},options:{}},id:'prepare',name:'Prepara evento',type:'n8n-nodes-base.set',typeVersion:3.4,position:[520,300]});}
    return JSON.stringify({name:`${project.company.name || 'Easy Come'} — Automazioni`,nodes,connections:flows.length?{'Easy Come Webhook':{main:[[{node:'Prepara evento',type:'main',index:0}]]}}:{},active:false,settings:{executionOrder:'v1'},meta:{templateCredsSetupCompleted:false},tags:[{name:'Easy Come'}]},null,2);
  }

  function generatedMakePlan(project) {
    return JSON.stringify({format:'easycome-make-plan-v1',company:project.company.name,warning:'Piano tecnico: ricrea i moduli nel tuo account Make e collega le credenziali del cliente.',scenarios:(project.automations||[]).map((flow,index)=>({order:index+1,name:flow.name,trigger:flow.trigger,entity:flow.entity,action:flow.action,target:flow.target||'',message:flow.message||'',recommendedModules:['Webhooks','Router','HTTP','Email']}))},null,2);
  }

  function generatedExecutiveSummary(project, entities, price) {
    const moduleNames=(project.modules||[]).map((id)=>MODULES.find((item)=>item.id===id)?.name).filter(Boolean);
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Executive summary</title><style>body{font-family:Arial,sans-serif;margin:0;background:#eee9df;color:#171717}.page{width:900px;max-width:calc(100% - 40px);margin:40px auto;background:#fff;padding:50px;border:1px solid #111}.k{font-size:11px;letter-spacing:.16em;font-weight:800;color:${project.company.primaryColor||'#ff6b35'}}h1{font:700 60px/1 Georgia,serif}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#222;border:1px solid #222}.metric{background:#fff;padding:22px}.metric b{font-size:30px;display:block}.list{columns:2;line-height:1.8}@media(max-width:700px){.grid{grid-template-columns:1fr}.list{columns:1}}</style></head><body><main class="page"><span class="k">EASY COME STUDIO · PROGETTO DIGITALE</span><h1>${escapeHtml(project.company.name||'')}</h1><p>${escapeHtml(project.company.description||'')}</p><div class="grid"><div class="metric"><b>${entities.filter(e=>!e.system).length}</b><span>sezioni operative</span></div><div class="metric"><b>${project.automations?.length||0}</b><span>automazioni progettate</span></div><div class="metric"><b>€${price.total.toFixed(2)}</b><span>da pagare ora${(project.delivery?.auditServiceSelected || project.delivery?.managedServiceSelected) ? ' + €100/mese Audit' : ''}</span></div></div><h2>Componenti incluse</h2><div class="list">${moduleNames.map(name=>`<div>✓ ${escapeHtml(name)}</div>`).join('')}</div><h2>Consegna</h2><p>Gestionale, database Supabase, workbook Excel, manuale personalizzato, Easy Come Hub e asset selezionati nel configuratore. Le integrazioni esterne richiedono credenziali intestate al cliente.</p></main></body></html>`;
  }

  function pdfEscape(value) {
    return String(value || '').replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)').replace(/[\u0080-\uFFFF]/g,(char)=>({ 'à':'a','è':'e','é':'e','ì':'i','ò':'o','ù':'u','€':'EUR','—':'-' }[char]||'?'));
  }

  function generatedManualPdf(project, entities, price) {
    const lines=[
      `MANUALE OPERATIVO - ${project.company.name || 'GESTIONALE'}`,
      '',
      '1. COSA CONTIENE IL PACCHETTO',
      `Sezioni operative: ${entities.filter(e=>!e.system).length}`,
      `Totale progetto: EUR ${price.total.toFixed(2)} una tantum`,
      '',
      '2. AVVIO RAPIDO',
      'Apri README.md e 01-INSTALLAZIONE.md. Crea un progetto Supabase, esegui supabase/schema.sql e inserisci URL e chiave pubblica in js/config.js.',
      '',
      '3. GESTIONALE',
      'index.html apre il gestionale. easycome-hub.html è il centro del sistema: apre Gestionale, Easy Come Audit, manuale, assistenza e nuove funzioni. audit.html usa lo stesso account e legge direttamente il database del Gestionale. La cartella mobile contiene la PWA installabile quando selezionata.',
      '',
      '4. DATI ED EXCEL',
      'La cartella Excel contiene il workbook operativo e i modelli CSV per importazione ed esportazione.',
      '',
      '5. AUTOMAZIONI E AI',
      'Le integrazioni esterne restano inattive finche non vengono configurate credenziali del cliente. Verifica sempre privacy, destinatari e testi prima di attivarle.',
      '',
      '6. COLLAUDO',
      'Esegui la checklist inclusa prima della consegna: accessi, permessi, dati, Easy Come Hub, manuale, backup e automazioni.',
    ];
    const wrapped=[];
    lines.forEach(line=>{if(!line){wrapped.push('');return;}const words=line.split(/\s+/);let current='';words.forEach(word=>{const next=(current+' '+word).trim();if(next.length>88){wrapped.push(current);current=word}else current=next});if(current)wrapped.push(current)});
    const pages=[];for(let i=0;i<wrapped.length;i+=44)pages.push(wrapped.slice(i,i+44));
    const objects=[];const add=(body)=>{objects.push(body);return objects.length};
    const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
    const pageIds=[];const contentIds=[];
    pages.forEach((page,pageIndex)=>{let stream='BT\n/F1 11 Tf\n50 790 Td\n';page.forEach((line,index)=>{const size=index===0&&pageIndex===0?18:11;if(index===0&&pageIndex===0)stream+='/F1 18 Tf\n';stream+=`(${pdfEscape(line)}) Tj\n0 -17 Td\n`;if(index===0&&pageIndex===0)stream+='/F1 11 Tf\n';});stream+='ET';const content=add(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);contentIds.push(content);pageIds.push(add('PENDING'));});
    const pagesId=add('PAGES_PENDING');
    pageIds.forEach((id,index)=>{objects[id-1]=`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 ${font} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;});
    objects[pagesId-1]=`<< /Type /Pages /Kids [${pageIds.map(id=>`${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
    const catalog=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
    let pdf='%PDF-1.4\n';const offsets=[0];objects.forEach((obj,index)=>{offsets.push(pdf.length);pdf+=`${index+1} 0 obj\n${obj}\nendobj\n`;});const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;for(let i=1;i<offsets.length;i++)pdf+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';pdf+=`trailer\n<< /Size ${objects.length+1} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new TextEncoder().encode(pdf);
  }

  function generatedPackageJson(project) {
    return JSON.stringify({
      name: slugify(project.company.name || 'easycome-gestionale'),
      version: '8.4.0',
      private: true,
      scripts: { dev: 'npx serve .', preview: 'npx serve .', 'deploy:supabase': 'supabase db push' },
    }, null, 2);
  }


  function generatePackage(projectInput) {
    const project = clone(projectInput);
    project.generatedAt = new Date().toISOString();
    project.company.slug = project.company.slug || slugify(project.company.name);
    if (!project.organizationId) project.organizationId = uuidv4();
    project.hub = { enabled: true, manual: true, support: true, featureRequests: true, onboarding: true, ...(project.hub || {}) };
    project.delivery = project.delivery || {};
    project.delivery.auditServiceSelected = Boolean(project.delivery.auditServiceSelected ?? project.delivery.managedServiceSelected);
    project.delivery.auditMonthlyPrice = 100;
    if (!project.modules.includes('easycome_hub')) project.modules.push('easycome_hub');
    if (project.pricing) project.pricing.enabled = ['fixed','hourly','subscription','dynamic'].includes(project.pricing.mode || 'none');
    const entities = buildEntities(project);
    const price = calculatePrice(project);
    const quality = auditProject(project);
    if (!quality.ready) throw new Error('Il progetto non supera il controllo qualità: ' + quality.blockers.join(' · '));
    const configObject = { ...project, entities, price, quality };
    const files = [
      { name: 'README.md', data: generatedReadme(project, entities, price) },
      { name: '01-INSTALLAZIONE.md', data: generatedSetup(project) },
      { name: '02-SPECIFICA-FUNZIONALE.md', data: generatedFunctionalSpec(project, entities) },
      { name: '03-CHECKLIST-COLLAUDO.md', data: generatedTestChecklist(project, entities) },
      { name: '04-RAPPORTO-QUALITA.md', data: generatedQualityReport(project, entities, price, quality) },
      { name: '05-MAPPA-FUNZIONI.md', data: generatedFeatureMap(project, entities) },
      { name: '06-PRIMA-DELLA-CONSEGNA.md', data: generatedDeliveryGate(project) },
      { name: 'OFFERTA-COMMERCIALE.html', data: generatedOffer(project, price) },
      { name: 'easycome-project.json', data: JSON.stringify(configObject, null, 2) },
      { name: 'DOCUMENTI/EXECUTIVE-SUMMARY.html', data: generatedExecutiveSummary(project, entities, price) },
      { name: 'DOCUMENTI/MANUALE-OPERATIVO.pdf', data: generatedManualPdf(project, entities, price) },
      { name: 'BRAND/logo-wordmark.svg', data: generatedLogoWordmarkSvg(project, false) },
      { name: 'BRAND/logo-wordmark-inverse.svg', data: generatedLogoWordmarkSvg(project, true) },
      { name: 'BRAND/social-cover.svg', data: generatedSocialCoverSvg(project) },
      { name: 'BRAND/brand-guide.html', data: generatedBrandGuide(project) },
      { name: `Excel/MODELLO-DATI-${project.company.slug || 'gestionale'}.xlsx`, data: generatedExcelWorkbook(project, entities) || 'Workbook non generato: apri il Builder interno con js/zip.js caricato.' },
      { name: 'Excel/LEGGIMI.md', data: '# Modelli Excel\n\nIl file .xlsx contiene un foglio Dashboard e un foglio per ogni sezione operativa. Mantieni le intestazioni della prima riga quando importi i dati nel gestionale.\n' },
      ...entities.filter((entity) => !entity.system).map((entity) => ({ name: `Excel/CSV/${entity.key}.csv`, data: generatedCsvTemplate(entity) })),
      { name: 'package.json', data: generatedPackageJson(project) },
      { name: '.gitignore', data: '.env\n.env.local\n.DS_Store\nnode_modules/\n' },
      { name: '.env.example', data: 'SUPABASE_URL=\nSUPABASE_ANON_KEY=\nEASYCOME_BASE_URL=https://easy-come.it\nAUTOMATION_CRON_SECRET=\nRESEND_API_KEY=\nEMAIL_FROM=\nAI_API_URL=\nAI_API_KEY=\nAI_MODEL=\n' },
      { name: 'index.html', data: generatedIndexHtml(project) },
      { name: 'easycome-hub.html', data: generatedHubHtml(project) },
      { name: 'audit.html', data: generatedAuditHtml(project) },
      { name: 'manuale.html', data: generatedManualHtml(project, entities) },
      { name: 'manifest.webmanifest', data: generatedManifest(project) },
      { name: 'sw.js', data: generatedServiceWorker() },
      { name: 'assets/favicon.svg', data: generatedFavicon(project) },
      { name: 'assets/styles.css', data: generatedStyles(project) },
      { name: 'js/config.js', data: generateConfig(project, entities) },
      { name: 'js/app.js', data: generatedAppJs() },
      { name: 'js/hub.js', data: generatedHubJs() },
      { name: 'js/audit.js', data: generatedAuditJs() },
      { name: 'supabase/schema.sql', data: generateSchema(project, entities) },
      { name: 'supabase/functions/process-automations/index.ts', data: generatedAutomationFunction(project) },
      { name: 'supabase/functions/invite-member/index.ts', data: generatedInviteFunction(project) },
      { name: 'automations/automation-plan.json', data: JSON.stringify(project.automations || [], null, 2) },
      { name: 'pricing/pricing-rules.json', data: JSON.stringify(project.pricing || {}, null, 2) },
      ...((project.modules || []).includes('mobile_app') ? [
        { name: 'mobile/index.html', data: generatedMobileApp(project, entities) },
        { name: 'mobile/manifest.webmanifest', data: generatedMobileManifest(project) },
        { name: 'mobile/sw.js', data: generatedMobileServiceWorker() },
        { name: 'mobile/capacitor.config.json', data: generatedCapacitorConfig(project) },
        { name: 'mobile/README.md', data: '# App PWA\n\nLa cartella mobile contiene una web app installabile. Non sono inclusi file binari App Store o Play Store. Per creare pacchetti nativi usa Capacitor e account sviluppatore intestati al cliente.\n' },
      ] : []),
      ...((project.modules || []).includes('ai') ? [
        { name: 'api/ai-assistant.js', data: generatedAiEndpoint(project) },
        { name: 'AI/README.md', data: generatedAiReadme(project) },
        { name: 'AI/knowledge-base.md', data: `# Knowledge base — ${project.company.name || ''}\n\n## Attività\n${project.company.description || ''}\n\n## Regole\n- Non inventare prezzi o disponibilità.\n- Chiedere conferma quando mancano dati.\n- Non condividere informazioni riservate.\n` },
      ] : []),
      ...((project.modules || []).includes('automations') ? [
        { name: 'automations/n8n-workflow.json', data: generatedN8nWorkflow(project) },
        { name: 'automations/make-scenario-plan.json', data: generatedMakePlan(project) },
      ] : []),
      { name: 'vercel.json', data: JSON.stringify({ cleanUrls: true, trailingSlash: false }, null, 2) },
      { name: 'netlify.toml', data: '[build]\n  publish = "."\n\n[[headers]]\n  for = "/*"\n  [headers.values]\n    X-Frame-Options = "DENY"\n    X-Content-Type-Options = "nosniff"\n' },
    ];
    return { project: configObject, entities, price, files, filename: `${project.company.slug || 'gestionale'}-easycome-v8.zip` };
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[match]));
  }

  export const ECGenerator = {
    BASE_PRICE,
    IMPLEMENTATION_PRICE,
    MODULES,
    ENTITY_PRESETS,
    AUTOMATION_TRIGGERS,
    AUTOMATION_ACTIONS,
    defaultProject,
    buildEntities,
    calculatePrice,
    auditProject,
    generatePackage,
    slugify,
    sqlName,
    uuidv4,
  };
