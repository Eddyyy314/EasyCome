(function (global) {
  'use strict';

  const BASE_PRICE = 99;
  const IMPLEMENTATION_PRICE = 150;

  const MODULES = [
    { id: 'crm', name: 'Clienti e CRM', category: 'Operatività', price: 0, included: true, description: 'Anagrafiche, contatti, note e storico.', entities: ['customers'] },
    { id: 'tasks', name: 'Attività e scadenze', category: 'Operatività', price: 0, included: true, description: 'Task, priorità, responsabili e date.', entities: ['tasks'] },
    { id: 'bookings', name: 'Prenotazioni e risorse', category: 'Vendite', price: 10, description: 'Agenda, risorse e controllo anti-sovrapposizione.', entities: ['bookings', 'resources'] },
    { id: 'appointments', name: 'Appuntamenti', category: 'Vendite', price: 8, description: 'Agenda, servizi e operatori.', entities: ['appointments', 'services', 'staff'] },
    { id: 'quotes', name: 'Preventivi', category: 'Vendite', price: 6, description: 'Documenti stampabili, righe, stato, validità e totale.', entities: ['quotes', 'quote_items'] },
    { id: 'orders', name: 'Ordini', category: 'Vendite', price: 8, description: 'Ordini, righe, totali e avanzamento.', entities: ['orders', 'order_items', 'products'] },
    { id: 'inventory', name: 'Magazzino', category: 'Operatività', price: 10, description: 'Prodotti, giacenze registrate e movimenti manuali.', entities: ['products', 'stock_movements'] },
    { id: 'invoices', name: 'Fatture e scadenze', category: 'Amministrazione', price: 12, description: 'Gestione interna di fatture, righe, scadenze e stato. Non sostituisce la fatturazione elettronica.', entities: ['invoices', 'invoice_items'] },
    { id: 'payments', name: 'Registro pagamenti e caparre', category: 'Amministrazione', price: 8, description: 'Registrazione di incassi, caparre, rimborsi e metodi. Checkout online escluso.', entities: ['payments'] },
    { id: 'expenses', name: 'Spese e fornitori', category: 'Amministrazione', price: 6, description: 'Costi, fornitori e categorie.', entities: ['suppliers', 'expenses'] },
    { id: 'projects', name: 'Progetti e commesse', category: 'Operatività', price: 8, description: 'Progetti, fasi, budget e avanzamento.', entities: ['projects', 'tasks'] },
    { id: 'support', name: 'Ticket e assistenza', category: 'Relazioni', price: 8, description: 'Richieste, priorità, assegnazione e SLA.', entities: ['tickets'] },
    { id: 'staff', name: 'Personale e turni', category: 'Operatività', price: 8, description: 'Anagrafiche, ruoli, turni e agenda del personale.', entities: ['staff', 'shifts'] },
    { id: 'documents', name: 'Documenti e allegati', category: 'Operatività', price: 4, description: 'Archivio documentale e scadenze.', entities: ['documents'] },
    { id: 'assets', name: 'Beni e manutenzioni', category: 'Operatività', price: 10, description: 'Attrezzature, veicoli e manutenzioni.', entities: ['assets', 'maintenance'] },
    { id: 'reports', name: 'Report e KPI', category: 'Analisi', price: 8, description: 'Dashboard calcolata dai dati, filtri, CSV, backup e grafici.', entities: [] },
    { id: 'portal', name: 'Portale pubblico', category: 'Canali', price: 10, description: 'Richieste, ordini, appuntamenti o preventivi online.', entities: ['public_submissions'] },
    { id: 'dynamic_pricing', name: 'Prezzi dinamici', category: 'Automazioni', price: 12, description: 'Stagioni, giorni, durata, persone, extra e promo.', entities: ['pricing_rules', 'quotes'] },
    { id: 'automations', name: 'Motore automazioni', category: 'Automazioni', price: 8, description: 'Trigger, email, webhook, task e aggiornamenti.', entities: ['automation_log'] },
    { id: 'multiuser', name: 'Utenti, ruoli e permessi', category: 'Sicurezza', price: 6, description: 'Accessi separati per titolare e collaboratori.', entities: [] },
    { id: 'multisite', name: 'Più sedi', category: 'Struttura', price: 10, description: 'Anagrafica sedi e attribuzione della sede ai dati operativi.', entities: ['locations'] },
    { id: 'ai', name: 'AI tramite integrazione', category: 'Automazioni', price: 15, description: 'Bozze, riepiloghi e classificazione tramite API esterna configurata.', entities: ['ai_requests'] },
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
      version: '2.0.0',
      generatedAt: new Date().toISOString(),
      organizationId: uuidv4(),
      company: {
        name: '', slug: '', industry: '', description: '', email: '', phone: '',
        primaryColor: '#ff6b35', accentColor: '#151515', surfaceColor: '#ffffff', currency: 'EUR', locale: 'it-IT', logoData: '', style: 'signature',
      },
      modules: ['crm', 'tasks'],
      customEntities: [],
      automations: [],
      portal: { enabled: false, type: 'request', title: 'Invia una richiesta', successMessage: 'Richiesta inviata correttamente.', collect: ['name', 'email', 'phone', 'message'] },
      pricing: { enabled: false, basePrice: 0, unit: 'servizio', taxPerPerson: 0, depositPercent: 0, rules: [], extras: [] },
      delivery: { packagePrice: BASE_PRICE, implementationPrice: IMPLEMENTATION_PRICE, implementationSelected: false, notes: '', supportDays: 30, previewApproved: false },
    };
  }

  function buildEntities(project) {
    const keys = [];
    project.modules.forEach((moduleId) => {
      const module = MODULES.find((item) => item.id === moduleId);
      if (module) module.entities.forEach((key) => { if (!keys.includes(key)) keys.push(key); });
    });
    if (project.portal && project.portal.enabled && !keys.includes('public_submissions')) keys.push('public_submissions');
    if (project.pricing && project.pricing.enabled && !keys.includes('pricing_rules')) keys.push('pricing_rules');
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
    const customEntitiesTotal = (project.customEntities || []).length * 6;
    const customFieldsTotal = (project.customEntities || []).reduce((sum, entity) => sum + Math.max(0, (entity.fields || []).length - 6) * 1, 0);
    const automationTotal = (project.automations || []).length * 4;
    const pricingRulesTotal = project.pricing && project.pricing.enabled ? Math.max(0, (project.pricing.rules || []).length - 3) * 1 : 0;
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

    if (project.portal?.enabled) {
      if (!(project.portal.collect || []).includes('name') || !(project.portal.collect || []).includes('email')) penalize(7, 'Il portale dovrebbe raccogliere almeno nome ed email.');
      else strengths.push('Portale con dati di contatto essenziali.');
      if (String(project.portal.title || '').trim().length < 8) penalize(4, 'Rendi più specifico il titolo del portale.');
    }

    if (project.pricing?.enabled) {
      if (Number(project.pricing.basePrice || 0) <= 0) penalize(8, 'I prezzi dinamici sono attivi ma il prezzo base è zero.');
      if (!(project.pricing.rules || []).length) penalize(4, 'Aggiungi almeno una regola oppure disattiva i prezzi dinamici.');
      else strengths.push('Motore prezzi configurato con regole reali.');
    }

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
    strengths.push('Backup JSON, workbook Excel, import/export CSV, foglio operativo, calendario, ruoli e audit log inclusi.');

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

    return `-- Easy Come Studio Masterpiece — schema Supabase
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
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  email text,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

alter table public.organization_members add column if not exists email text;

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
as $$ select public.org_role(p_organization_id) in ('owner','admin','member','viewer'); $$;

create or replace function public.org_can_write(p_organization_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select public.org_role(p_organization_id) in ('owner','admin','member'); $$;

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
    return `window.APP_CONFIG = ${JSON.stringify({
      supabaseUrl: 'INSERISCI_PROJECT_URL',
      supabaseAnonKey: 'INSERISCI_PUBLISHABLE_KEY',
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

  function generatedPortalHtml(project) {
    const title = project.portal.title || 'Invia una richiesta';
    return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)} — ${escapeHtml(project.company.name || 'Azienda')}</title>
  <meta name="description" content="Portale clienti di ${escapeHtml(project.company.name || 'Azienda')}">
  <meta name="theme-color" content="${project.company.accentColor || '#151515'}">
  <link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="assets/styles.css">
</head>
<body class="portal">
  <div id="portal"></div>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="js/config.js"></script>
  <script src="js/portal.js"></script>
</body>
</html>`;
  }

  function generatedAppJs() {
    if (!global.ECProductTemplates) throw new Error('Template prodotto non caricati.');
    return global.ECProductTemplates.appJs();
  }
  function generatedPortalJs() {
    if (!global.ECProductTemplates) throw new Error('Template prodotto non caricati.');
    return global.ECProductTemplates.portalJs();
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
  const role = ['admin','member','viewer'].includes(body.role) ? body.role : 'member';
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
    return `const CACHE='easycome-v2';const ASSETS=['./','./index.html','./portal.html','./assets/styles.css','./js/config.js','./js/app.js','./js/portal.js'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));`;
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
    return `# Checklist collaudo\n\n- [ ] Login e recupero accesso\n- [ ] Creazione, modifica ed eliminazione record\n- [ ] Ricerca in ogni sezione\n- [ ] Permessi utenti verificati\n- [ ] Visualizzazione mobile\n- [ ] Backup ed esportazione dati\n${project.portal.enabled?'- [ ] Invio richiesta dal portale\\n- [ ] Conferma di avvenuta ricezione\\n':''}${project.pricing.enabled?'- [ ] Calcolo prezzi e regole promozionali\\n':''}${(project.automations||[]).map((a)=>`- [ ] Automazione: ${a.name}`).join('\\n')}\n\nSezioni da verificare: ${entities.map((e)=>e.label).join(', ')}.\n`;
  }

  function generatedOffer(project, price) {
    return `<!doctype html><html lang="it"><head><meta charset="utf-8"><title>Offerta ${escapeHtml(project.company.name||'')}</title><style>body{font-family:Arial,sans-serif;background:#f5f5f2;color:#171717;margin:0;padding:50px}.sheet{max-width:820px;margin:auto;background:#fff;border-radius:24px;padding:45px;box-shadow:0 25px 80px #0001}h1{font-size:42px;margin:12px 0}.muted{color:#777}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eee}.total{background:#171717;color:#fff;border-radius:18px;padding:22px;margin-top:20px}.total strong{font-size:34px;display:block;margin-top:5px}.pill{display:inline-block;background:${project.company.primaryColor||'#ff6b35'}22;color:${project.company.primaryColor||'#ff6b35'};padding:7px 10px;border-radius:999px;font-weight:bold;font-size:12px}</style></head><body><div class="sheet"><span class="pill">EASY COME · UNA TANTUM</span><h1>${escapeHtml(project.company.name||'Gestionale personalizzato')}</h1><p class="muted">${escapeHtml(project.company.description||'Soluzione digitale personalizzata per semplificare il lavoro quotidiano.')}</p><h2>Investimento</h2><div class="row"><span>Pacchetto software</span><strong>€${price.base.toFixed(2)}</strong></div>${price.implementation ? `<div class="row"><span>Implementazione assistita (opzionale)</span><strong>€${price.implementation.toFixed(2)}</strong></div>` : ''}<div class="row"><span>Moduli e personalizzazioni</span><strong>€${price.extras.toFixed(2)}</strong></div><div class="total"><span>Totale una tantum</span><strong>€${price.total.toFixed(2)}</strong><small>Nessun canone Easy Come.</small></div><h2>Cosa ricevi</h2><p>Gestionale responsive, fogli Excel, calendario operativo, database Supabase, portale cliente e documentazione.${price.implementation ? ` Implementazione assistita e ${project.delivery.supportDays||30} giorni di supporto inclusi.` : ' Implementazione e supporto non inclusi nel pacchetto software.'}</p></div></body></html>`;
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
- prezzo configurato: €${price.total.toFixed(2)} una tantum.

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
- ruoli owner, admin, member e viewer;
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

## 2. Flussi operativi
- [ ] Creato, modificato, duplicato ed eliminato un record per ogni sezione.
- [ ] Provate tabella, foglio Excel, bacheca, agenda, calendario, disponibilità e schede disponibili.
- [ ] Esportato e reimportato un CSV.
- [ ] Creato un backup JSON e verificato il contenuto.
${project.portal.enabled ? '- [ ] Inviata una richiesta reale dal portale e verificata nel gestionale.\n' : ''}${project.pricing.enabled ? '- [ ] Verificati prezzo base, regole, tasse, extra e caparra.\n' : ''}- [ ] Verificati i controlli anti-sovrapposizione quando presenti.

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

Pacchetto generato con **Easy Come Studio Masterpiece** e bloccato da un controllo qualità prima del download.

## Contenuto

- gestionale dinamico con ${entities.length} sezioni;
- viste tabella, foglio Excel, bacheca, agenda, calendario, disponibilità e schede quando coerenti;
- import/export CSV e backup JSON;
- audit log, permessi reali e Storage documenti privato;
- modalità demo locale immediata;
- collegamento Supabase per login e dati cloud;
- schema SQL con Row Level Security;
- portale pubblico${project.portal.enabled ? ' attivo' : ' predisposto'};
- motore prezzi dinamici${project.pricing.enabled ? ' configurato' : ' predisposto'};
- ${project.automations.length} automazioni configurate;
- Edge Function per email, webhook, notifiche, task e aggiornamenti;
- file Vercel e Netlify per il deploy.

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
- AI_WEBHOOK_URL

Programma una chiamata periodica alla funzione per processare la coda.

## Prezzo Easy Come configurato

- Pacchetto base: €${price.base.toFixed(2)}
- Implementazione assistita: ${price.implementation ? `€${price.implementation.toFixed(2)} (selezionata)` : 'non selezionata'}
- Moduli e personalizzazioni: €${price.extras.toFixed(2)}
- **Totale: €${price.total.toFixed(2)} una tantum**

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

## Portale pubblico

${project.portal.enabled ? 'È attivo in `portal.html`.' : 'È presente ma disattivato nella configurazione. Puoi attivarlo modificando `easycome-project.json` e `js/config.js`.'}
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
          ['6', 'Prima della consegna', 'Elimina le righe dimostrative e verifica formule, ruoli, backup e portale.'],
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

  function generatedPackageJson(project) {
    return JSON.stringify({
      name: slugify(project.company.name || 'easycome-gestionale'),
      version: '2.0.0',
      private: true,
      scripts: { dev: 'npx serve .', preview: 'npx serve .' },
    }, null, 2);
  }

  function generatePackage(projectInput) {
    const project = clone(projectInput);
    project.generatedAt = new Date().toISOString();
    project.company.slug = project.company.slug || slugify(project.company.name);
    if (!project.organizationId) project.organizationId = uuidv4();
    if (project.portal) project.portal.enabled = project.modules.includes('portal') || Boolean(project.portal.enabled);
    if (project.pricing) project.pricing.enabled = project.modules.includes('dynamic_pricing') || Boolean(project.pricing.enabled);
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
      { name: `Excel/MODELLO-DATI-${project.company.slug || 'gestionale'}.xlsx`, data: generatedExcelWorkbook(project, entities) || 'Workbook non generato: apri il Builder interno con js/zip.js caricato.' },
      { name: 'Excel/LEGGIMI.md', data: '# Modelli Excel\n\nIl file .xlsx contiene un foglio Dashboard e un foglio per ogni sezione operativa. Mantieni le intestazioni della prima riga quando importi i dati nel gestionale.\n' },
      ...entities.filter((entity) => !entity.system).map((entity) => ({ name: `Excel/CSV/${entity.key}.csv`, data: generatedCsvTemplate(entity) })),
      { name: 'package.json', data: generatedPackageJson(project) },
      { name: '.gitignore', data: '.env\n.env.local\n.DS_Store\nnode_modules/\n' },
      { name: '.env.example', data: 'SUPABASE_URL=\nSUPABASE_ANON_KEY=\nAUTOMATION_CRON_SECRET=\nRESEND_API_KEY=\nEMAIL_FROM=\nAI_WEBHOOK_URL=\n' },
      { name: 'index.html', data: generatedIndexHtml(project) },
      { name: 'portal.html', data: generatedPortalHtml(project) },
      { name: 'manifest.webmanifest', data: generatedManifest(project) },
      { name: 'sw.js', data: generatedServiceWorker() },
      { name: 'assets/favicon.svg', data: generatedFavicon(project) },
      { name: 'assets/styles.css', data: generatedStyles(project) },
      { name: 'js/config.js', data: generateConfig(project, entities) },
      { name: 'js/app.js', data: generatedAppJs() },
      { name: 'js/portal.js', data: generatedPortalJs() },
      { name: 'supabase/schema.sql', data: generateSchema(project, entities) },
      { name: 'supabase/functions/process-automations/index.ts', data: generatedAutomationFunction(project) },
      { name: 'supabase/functions/invite-member/index.ts', data: generatedInviteFunction(project) },
      { name: 'automations/automation-plan.json', data: JSON.stringify(project.automations || [], null, 2) },
      { name: 'pricing/pricing-rules.json', data: JSON.stringify(project.pricing || {}, null, 2) },
      { name: 'vercel.json', data: JSON.stringify({ cleanUrls: true, trailingSlash: false }, null, 2) },
      { name: 'netlify.toml', data: '[build]\n  publish = "."\n\n[[headers]]\n  for = "/*"\n  [headers.values]\n    X-Frame-Options = "DENY"\n    X-Content-Type-Options = "nosniff"\n' },
    ];
    return { project: configObject, entities, price, files, filename: `${project.company.slug || 'gestionale'}-easycome.zip` };
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[match]));
  }

  global.ECGenerator = {
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
}(window));
