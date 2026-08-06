(function () {
  'use strict';

  const G = window.ECGenerator;
  const SALES = window.EASYCOME_SALES || { mode: 'customer', generationSeconds: 0, checkoutEndpoint: '/api/create-checkout-session', paymentUrl: '', supportEmail: '', termsUrl: '/termini.html', privacyUrl: '/privacy.html', internalDownloadEnabled: false };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[match]));
  const money = (value) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));

  const steps = [
    { id: 'idea', label: 'Attività', subtitle: 'Chi sei e cosa vuoi semplificare' },
    { id: 'modules', label: 'Funzioni', subtitle: 'Cosa deve fare il sistema' },
    { id: 'structure', label: 'Struttura', subtitle: 'Cosa vuoi tenere sotto controllo' },
    { id: 'logic', label: 'Regole', subtitle: 'Prezzi, procedure e automazioni' },
    { id: 'design', label: 'Layout', subtitle: 'Scegli un’identità già progettata' },
    { id: 'preview', label: 'Anteprima', subtitle: 'Naviga il gestionale vero' },
    { id: 'delivery', label: 'Acquisto', subtitle: 'Pacchetto e servizi opzionali' },
  ];

  const TEMPLATES = [
    { id: 'complete', icon: '◆', name: 'Sistema aziendale completo', description: 'Clienti, attività, preventivi, pagamenti, report, automazioni, app e manuale.', industry: 'Impresa e servizi', modules: ['crm','tasks','quotes','payments','reports','automations','multiuser','website','mobile_app','branding','ai','easycome_hub'] },
    { id: 'custom', icon: '✦', name: 'Parti essenziale', description: 'Clienti, attività, manuale e Easy Come Hub. Aggiungi solo ciò che serve.', modules: ['crm', 'tasks', 'easycome_hub'] },
    { id: 'booking', icon: '▦', name: 'Prenotazioni e disponibilità', description: 'Camere, spazi, noleggi, strutture e servizi con calendario risorse.', industry: 'Attività con prenotazioni', modules: ['crm', 'tasks', 'bookings', 'quotes', 'payments', 'dynamic_pricing', 'automations', 'multiuser','easycome_hub'], pricingMode: 'dynamic' },
    { id: 'appointments', icon: '◷', name: 'Agenda e appuntamenti', description: 'Studi, saloni, centri, consulenti e professionisti.', industry: 'Servizi su appuntamento', modules: ['crm', 'tasks', 'appointments', 'payments', 'quotes', 'automations', 'multiuser','easycome_hub'], pricingMode: 'manual_quote' },
    { id: 'restaurant', icon: '♨', name: 'Ristorazione', description: 'Prenotazioni, ordini, tavoli, fornitori, turni e cassa.', industry: 'Ristorazione', modules: ['crm', 'tasks', 'bookings', 'orders', 'inventory', 'expenses', 'staff', 'reports', 'automations','easycome_hub'] },
    { id: 'workshop', icon: '⌁', name: 'Officina e interventi', description: 'Veicoli, lavori, preventivi, ricambi e stato intervento.', industry: 'Officina o assistenza tecnica', modules: ['crm', 'tasks', 'quotes', 'orders', 'inventory', 'payments', 'assets', 'automations', 'multiuser','easycome_hub'], pricingMode: 'manual_quote', custom: [{ key: 'vehicles', label: 'Veicoli', singular: 'Veicolo', fields: [{ key: 'plate', label: 'Targa', type: 'text', required: true }, { key: 'customer', label: 'Cliente', type: 'text', required: true }, { key: 'brand', label: 'Marca e modello', type: 'text' }, { key: 'mileage', label: 'Chilometraggio', type: 'number' }, { key: 'notes', label: 'Note', type: 'longtext' }] }] },
    { id: 'professional', icon: '§', name: 'Studio professionale', description: 'Clienti, pratiche, documenti, scadenze, preventivi e attività.', industry: 'Studio professionale', modules: ['crm', 'tasks', 'projects', 'quotes', 'invoices', 'payments', 'documents', 'automations', 'multiuser','easycome_hub'], pricingMode: 'manual_quote', custom: [{ key: 'cases', label: 'Pratiche', singular: 'Pratica', fields: [{ key: 'title', label: 'Oggetto', type: 'text', required: true }, { key: 'customer', label: 'Cliente', type: 'text', required: true }, { key: 'status', label: 'Stato', type: 'select', options: ['Nuova', 'In lavorazione', 'In attesa', 'Chiusa'] }, { key: 'deadline', label: 'Scadenza', type: 'date' }, { key: 'notes', label: 'Note', type: 'longtext' }] }] },
    { id: 'health', icon: '✚', name: 'Studio medico o dentistico', description: 'Pazienti, appuntamenti, trattamenti, documenti e preventivi personalizzati.', industry: 'Studio sanitario', modules: ['crm','tasks','appointments','quotes','payments','documents','multiuser','easycome_hub'], pricingMode: 'manual_quote', custom: [{ key:'patients', label:'Pazienti', singular:'Paziente', fields:[{key:'name',label:'Nome e cognome',type:'text',required:true},{key:'phone',label:'Telefono',type:'phone'},{key:'birth_date',label:'Data di nascita',type:'date'},{key:'treatment',label:'Trattamento',type:'text'},{key:'next_visit',label:'Prossimo controllo',type:'date'},{key:'notes',label:'Note riservate',type:'longtext'}]}] },
    { id: 'retail', icon: '◇', name: 'Negozio e vendite', description: 'Prodotti, ordini, scorte, clienti, pagamenti e report.', industry: 'Commercio', modules: ['crm', 'tasks', 'orders', 'inventory', 'invoices', 'payments', 'expenses', 'reports', 'automations', 'multiuser','easycome_hub'], pricingMode:'fixed' },
    { id: 'projects', icon: '△', name: 'Progetti e cantieri', description: 'Commesse, sopralluoghi, materiali, documenti e avanzamento.', industry: 'Impresa a commessa', modules: ['crm', 'tasks', 'projects', 'quotes', 'expenses', 'staff', 'documents', 'assets', 'reports', 'automations', 'multiuser','easycome_hub'], pricingMode:'manual_quote' },
    { id: 'membership', icon: '◎', name: 'Iscrizioni e abbonati', description: 'Palestre, scuole, corsi, associazioni e membership.', industry: 'Attività con iscritti', modules: ['crm', 'tasks', 'appointments', 'payments', 'documents', 'reports', 'automations', 'multiuser','easycome_hub'], pricingMode:'subscription', custom: [{ key: 'memberships', label: 'Abbonamenti', singular: 'Abbonamento', fields: [{ key: 'customer', label: 'Iscritto', type: 'text', required: true }, { key: 'plan', label: 'Piano', type: 'text', required: true }, { key: 'start_date', label: 'Inizio', type: 'date' }, { key: 'end_date', label: 'Scadenza', type: 'date' }, { key: 'status', label: 'Stato', type: 'select', options: ['Attivo', 'In scadenza', 'Scaduto'] }] }] },
  ];

  const LAYOUT_PRESETS = [
    { id:'studio', name:'Studio', description:'Chiaro, ordinato e autorevole', primary:'#275dff', accent:'#17213b', surface:'#f7f8fb', sample:['#17213b','#275dff','#ffffff'] },
    { id:'atelier', name:'Atelier', description:'Editoriale, caldo e premium', primary:'#e85d36', accent:'#241c18', surface:'#f4eee5', sample:['#241c18','#e85d36','#f4eee5'] },
    { id:'olive', name:'Olive', description:'Naturale, sobrio e accogliente', primary:'#51745b', accent:'#183126', surface:'#f1f3ed', sample:['#183126','#51745b','#f1f3ed'] },
    { id:'cobalt', name:'Cobalt', description:'Tecnologico ma umano', primary:'#2f65e8', accent:'#101c36', surface:'#eef3fb', sample:['#101c36','#2f65e8','#eef3fb'] },
    { id:'graphite', name:'Graphite', description:'Contrasto deciso e operativo', primary:'#ff6b35', accent:'#151515', surface:'#f3f3f0', sample:['#151515','#ff6b35','#f3f3f0'] },
    { id:'calma', name:'Calma', description:'Morbido, elegante e discreto', primary:'#8b6f9e', accent:'#30263a', surface:'#f5f1f6', sample:['#30263a','#8b6f9e','#f5f1f6'] },
  ];

  const SECTION_PRESETS = [
    { id:'patients', icon:'✚', label:'Pazienti', singular:'Paziente', fields:[['Nome e cognome','text',true],['Telefono','phone'],['Data di nascita','date'],['Trattamento','text'],['Prossimo controllo','date'],['Note riservate','longtext']] },
    { id:'vehicles', icon:'⌁', label:'Veicoli', singular:'Veicolo', fields:[['Targa','text',true],['Cliente','text',true],['Marca e modello','text'],['Chilometraggio','number'],['Stato intervento','select'],['Note','longtext']] },
    { id:'cases', icon:'§', label:'Pratiche', singular:'Pratica', fields:[['Oggetto','text',true],['Cliente','text',true],['Stato','select'],['Scadenza','date'],['Responsabile','text'],['Note','longtext']] },
    { id:'properties', icon:'⌂', label:'Immobili', singular:'Immobile', fields:[['Codice','text',true],['Indirizzo','text',true],['Proprietario','text'],['Stato','select'],['Valore','currency'],['Note','longtext']] },
    { id:'worksites', icon:'△', label:'Cantieri', singular:'Cantiere', fields:[['Nome cantiere','text',true],['Cliente','text',true],['Indirizzo','text'],['Stato','select'],['Data fine prevista','date'],['Budget','currency']] },
    { id:'courses', icon:'◎', label:'Corsi', singular:'Corso', fields:[['Titolo','text',true],['Docente','text'],['Data inizio','date'],['Posti','number'],['Stato','select'],['Note','longtext']] },
    { id:'interventions', icon:'⚒', label:'Interventi', singular:'Intervento', fields:[['Titolo','text',true],['Cliente','text',true],['Data e ora','datetime'],['Tecnico','text'],['Stato','select'],['Costo','currency']] },
    { id:'suppliers_custom', icon:'◇', label:'Fornitori', singular:'Fornitore', fields:[['Ragione sociale','text',true],['Referente','text'],['Email','email'],['Telefono','phone'],['Categoria','select'],['Note','longtext']] },
  ];

  const PRICE_MODES = [
    { id:'none', icon:'—', name:'Non gestisco prezzi', description:'Il gestionale organizza dati e lavoro, senza calcoli economici.' },
    { id:'manual_quote', icon:'✎', name:'Preventivo caso per caso', description:'Perfetto per dentisti, studi, officine, cantieri e consulenze.' },
    { id:'fixed', icon:'€', name:'Listino fisso', description:'Ogni prodotto o servizio ha un prezzo definito.' },
    { id:'hourly', icon:'◷', name:'Tariffa oraria o giornaliera', description:'Calcolo in base al tempo impiegato.' },
    { id:'subscription', icon:'↻', name:'Abbonamenti o pacchetti', description:'Canoni, rinnovi, scadenze e piani.' },
    { id:'dynamic', icon:'↗', name:'Prezzo variabile', description:'Stagioni, durata, persone, disponibilità, extra e promozioni.' },
  ];

  const AUTOMATION_RECIPES = [
    { id:'confirmation', icon:'✉', name:'Conferma automatica', description:'Quando nasce una richiesta o prenotazione, invia una conferma.', flow:{name:'Conferma automatica',trigger:'record_created',entity:'',action:'email',target:'{{email}}',message:'Abbiamo ricevuto la tua richiesta. Ti aggiorneremo presto.'} },
    { id:'reminder', icon:'◷', name:'Promemoria scadenza', description:'Avvisa il team o il cliente prima di una data importante.', flow:{name:'Promemoria scadenza',trigger:'date_reached',entity:'tasks',action:'notify',target:'team',message:'È arrivata una scadenza da gestire.'} },
    { id:'status', icon:'↻', name:'Aggiornamento cliente', description:'Quando cambia lo stato, invia una comunicazione.', flow:{name:'Aggiornamento stato',trigger:'status_changed',entity:'',action:'email',target:'{{email}}',message:'Lo stato della tua pratica è stato aggiornato.'} },
    { id:'task', icon:'✓', name:'Crea attività interna', description:'Da un nuovo record crea automaticamente un task per il team.', flow:{name:'Crea task operativo',trigger:'record_created',entity:'',action:'create_task',target:'team',message:'Gestire la nuova voce inserita.'} },
    { id:'calendar', icon:'▦', name:'Sincronizza agenda', description:'Prepara il collegamento con Google Calendar tramite Make o n8n.', flow:{name:'Sincronizza calendario',trigger:'record_created',entity:'appointments',action:'webhook',target:'https://hook.example.com/calendar',message:'Invia appuntamento al calendario.'} },
    { id:'overdue', icon:'!', name:'Pagamento o pratica in ritardo', description:'Crea un avviso quando una scadenza non viene chiusa.', flow:{name:'Avviso ritardo',trigger:'date_reached',entity:'payments',action:'notify',target:'team',message:'Controllare la voce scaduta.'} },
  ];

  let project = normalizeProject(loadDraft() || G.defaultProject());
  let currentStep = 0;
  let customFieldDraft = [];
  let sectionDraft = { label: '', singular: '' };
  let automationDraft = { name: '', trigger: 'record_created', entity: '', action: 'notify', target: '', message: '', enabled: true };
  let previewMode = 'dashboard';
  let previewDevice = 'desktop';
  let previewEntityKey = '';

  function normalizeProject(value) {
    const base = G.defaultProject();
    const p = { ...base, ...value, company: { ...base.company, ...(value.company || {}) }, pricing: { ...base.pricing, ...(value.pricing || {}) }, delivery: { ...base.delivery, ...(value.delivery || {}) } };
    const moduleAliases = { portal: 'easycome_hub', public_portal: 'easycome_hub', client_portal: 'easycome_hub', hub: 'easycome_hub' };
    p.modules = Array.from(new Set([...(p.modules || []).map((id) => moduleAliases[id] || id), 'crm', 'tasks', 'easycome_hub']));
    p.customEntities = p.customEntities || [];
    p.automations = p.automations || [];
    p.pricing.rules = p.pricing.rules || [];
    p.pricing.extras = p.pricing.extras || [];
    p.company.style = p.company.style || 'studio';
    p.company.layout = p.company.layout || p.company.style || 'studio';
    p.company.logoData = p.company.logoData || '';
    p.hub = { enabled: true, manual: true, support: true, featureRequests: true, onboarding: true, ...(p.hub || {}) };
    p.pricing.mode = p.pricing.mode || (p.pricing.enabled ? 'dynamic' : 'none');
    p.delivery.previewApproved = Boolean(p.delivery.previewApproved);
    p.delivery.implementationSelected = Boolean(p.delivery.implementationSelected);
    p.templateId = p.templateId || 'custom';
    return p;
  }

  let cloudSaveTimer;
  function saveDraft() {
    try { localStorage.setItem('easycome-generator-pro-draft', JSON.stringify(project)); } catch (_) {}
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => window.EasyComeAccount?.saveProject?.(project), 700);
  }
  function loadDraft() { try { return JSON.parse(localStorage.getItem('easycome-generator-pro-draft') || 'null'); } catch (_) { return null; } }
  function toast(message) { const node = document.createElement('div'); node.className = 'toast'; node.textContent = message; document.body.appendChild(node); setTimeout(() => node.remove(), 2500); }
  function initials() { return (project.company.name || 'EC').split(/\s+/).slice(0, 2).map((item) => item[0]).join('').toUpperCase(); }
  function logoMarkup() { return project.company.logoData ? `<img src="${project.company.logoData}" alt="">` : esc(initials()); }

  function syncEffects() {
    if (!project.modules.includes('easycome_hub')) project.modules.push('easycome_hub');
    project.hub = { enabled: true, manual: true, support: true, featureRequests: true, onboarding: true, ...(project.hub || {}) };
    const mode = project.pricing?.mode || 'none';
    project.pricing.enabled = ['fixed','hourly','subscription','dynamic'].includes(mode);
    if (mode === 'dynamic' && !project.modules.includes('dynamic_pricing')) project.modules.push('dynamic_pricing');
    if (mode !== 'dynamic') project.modules = project.modules.filter((id) => id !== 'dynamic_pricing');
    if (mode === 'manual_quote' && !project.modules.includes('quotes')) project.modules.push('quotes');
  }

  function applyTemplate(id) {
    const template = TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    project.templateId = id;
    project.modules = Array.from(new Set([...(template.modules || ['crm', 'tasks']), 'easycome_hub']));
    project.customEntities = JSON.parse(JSON.stringify(template.custom || []));
    if (template.industry && !project.company.industry.trim()) project.company.industry = template.industry;
    if (template.description && !project.company.description.trim()) project.company.description = template.description;
    project.pricing.mode = template.pricingMode || 'none';
    project.pricing.enabled = ['fixed','hourly','subscription','dynamic'].includes(project.pricing.mode);
    if (project.pricing.mode === 'dynamic' && !project.pricing.basePrice) project.pricing.basePrice = 50;
    project.delivery.previewApproved = false;
    toast(`Modello “${template.name}” applicato.`);
    render();
  }

  function render() {
    syncEffects();
    saveDraft();
    renderSteps();
    renderPanel();
    renderSummary();
    updateNavigation();
  }

  function renderSteps() {
    $('#stepList').innerHTML = steps.map((step, index) => `<button class="step-item ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'done' : ''}" data-step="${index}"><span class="step-number">${index < currentStep ? '✓' : index + 1}</span><span><strong>${step.label}</strong><small>${step.subtitle}</small></span></button>`).join('');
    $$('.step-item').forEach((button) => button.onclick = () => { currentStep = Number(button.dataset.step); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  function renderPanel() {
    const functions = [ideaStep, modulesStep, structureStep, logicStep, designStep, previewStep, deliveryStep];
    $('#panel').innerHTML = functions[currentStep]();
    bindPanel();
  }

  function ideaStep() {
    const c = project.company;
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 1</span><h1>Che impresa vuoi semplificare?</h1><p>Scegli una base oppure parti da zero. Ogni elemento resterà modificabile e verrà mostrato nell’anteprima prima dell’acquisto.</p></div><div class="heading-badge">Anteprima sempre gratuita</div></div>
      <div class="section-title"><div><h2>Scegli una partenza intelligente</h2><p>I modelli accelerano la configurazione, ma non limitano il risultato.</p></div><span>${TEMPLATES.length} modelli</span></div>
      <div class="template-grid">${TEMPLATES.map((template) => `<button class="template-card ${project.templateId === template.id ? 'active' : ''}" data-template="${template.id}"><span class="template-icon">${template.icon}</span><strong>${esc(template.name)}</strong><small>${esc(template.description)}</small>${template.id === 'custom' ? '<em>Universale</em>' : ''}</button>`).join('')}</div>
      <div class="form-grid two">
        <label class="field"><span>Nome dell’attività *</span><input id="companyName" value="${esc(c.name)}" placeholder="Es. Studio Aurora" autofocus></label>
        <label class="field"><span>Settore</span><input id="industry" value="${esc(c.industry)}" placeholder="Es. Officina, ristorante, consulenza"></label>
        <label class="field full"><span>Quale lavoro deve rendere più semplice?</span><textarea id="description" placeholder="Racconta cosa viene fatto oggi a mano, cosa si perde e cosa deve diventare automatico…">${esc(c.description)}</textarea><small>Questo testo aiuta a progettare sezioni, manuale e flussi coerenti con il tuo lavoro.</small></label>
        <label class="field"><span>Email titolare *</span><input id="companyEmail" type="email" value="${esc(c.email)}" placeholder="titolare@azienda.it"><small>Serve per creare in sicurezza il primo account amministratore.</small></label>
        <label class="field"><span>Telefono</span><input id="companyPhone" value="${esc(c.phone)}" placeholder="+39 …"></label>
      </div>
      <div class="info-card"><strong>Risultato finale</strong><p>Riceverai gestionale responsive, workbook Excel, database Supabase, sito pubblico, PWA installabile, Easy Come Hub, brand kit, automazioni e documentazione nello stesso ZIP, in base ai moduli scelti.</p></div>`;
  }

  function modulesStep() {
    const categories = [...new Set(G.MODULES.map((item) => item.category))];
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 2</span><h1>Scegli soltanto ciò che serve.</h1><p>I moduli hanno prezzi piccoli e trasparenti. Clienti, attività, dashboard e gestione dati sono già compresi nel pacchetto.</p></div><div class="heading-badge">Base ${money(99)}</div></div>
      <div class="saving-note">✓ Extra ridotti: la maggior parte costa tra €8 e €20 una tantum</div>
      ${categories.map((category) => `<section class="module-section"><div class="section-title"><h2>${esc(category)}</h2><span>${G.MODULES.filter((item) => item.category === category).length} funzioni</span></div><div class="module-grid">${G.MODULES.filter((item) => item.category === category).map(moduleCard).join('')}</div></section>`).join('')}`;
  }

  function moduleCard(module) {
    const selected = project.modules.includes(module.id);
    return `<button class="module-card ${selected ? 'selected' : ''} ${module.included ? 'included' : ''}" data-module="${module.id}" ${module.included ? 'disabled' : ''}><span class="module-check">${selected ? '✓' : '+'}</span><span class="module-copy"><strong>${esc(module.name)}</strong><small>${esc(module.description)}</small></span><span class="module-price">${module.included ? 'Incluso' : '+' + money(module.price)}</span></button>`;
  }

  function structureStep() {
    const entities = G.buildEntities(project);
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 3</span><h1>Cosa vuoi tenere sotto controllo?</h1><p>Le sezioni sono le aree del gestionale: pazienti, pratiche, veicoli, commesse, corsi o qualsiasi elemento del tuo lavoro.</p></div><div class="heading-badge">${entities.length} aree operative</div></div>
      <section class="data-map">
        <div class="data-map-head"><div><span class="micro-label">STRUTTURA ATTUALE</span><h2>Il gestionale è già organizzato così</h2><p>Apri ogni area nell’anteprima finale. I campi indicano le informazioni che potrai inserire.</p></div></div>
        <div class="entity-showcase">${entities.map((entity) => `<article class="entity-showcase-card ${entity.custom ? 'custom' : ''}"><header><span class="entity-showcase-icon">${entity.custom ? '✦' : esc(entity.label.slice(0,1))}</span><div><strong>${esc(entity.label)}</strong><small>${entity.custom ? 'Creata da te' : 'Aggiunta dalle funzioni scelte'}</small></div>${entity.custom ? `<button class="icon-button remove-entity" data-key="${esc(entity.key)}" aria-label="Elimina">×</button>` : '<span class="included-tag">Inclusa</span>'}</header><div class="field-chip-row">${entity.fields.slice(0,6).map((field)=>`<span>${esc(field.label)}</span>`).join('')}${entity.fields.length>6?`<span class="more-chip">+${entity.fields.length-6}</span>`:''}</div></article>`).join('')}</div>
      </section>
      <section class="builder-card section-wizard"><div class="section-title"><div><span class="micro-label">NUOVA AREA</span><h2>Aggiungi una sezione in tre mosse</h2><p>Scegli un esempio oppure crea un’area con le parole che usate già in azienda.</p></div><span class="price-pill">+ ${money(6)}</span></div>
        <div class="wizard-step"><span>1</span><div><strong>Parti da un esempio</strong><small>Puoi cambiare tutto dopo.</small></div></div>
        <div class="section-preset-grid">${SECTION_PRESETS.map((preset)=>`<button class="section-preset" data-section-preset="${preset.id}"><b>${preset.icon}</b><span><strong>${esc(preset.label)}</strong><small>${preset.fields.length} campi pronti</small></span></button>`).join('')}</div>
        <div class="wizard-step"><span>2</span><div><strong>Dai un nome all’area</strong><small>Usa il linguaggio reale della tua attività.</small></div></div>
        <div class="form-grid two compact"><label class="field"><span>Nome nel menu</span><input id="entityLabel" value="${esc(sectionDraft.label)}" placeholder="Es. Pazienti"></label><label class="field"><span>Una singola voce si chiama…</span><input id="entitySingular" value="${esc(sectionDraft.singular)}" placeholder="Es. Paziente"></label></div>
        <div class="wizard-step"><span>3</span><div><strong>Scegli le informazioni</strong><small>I primi sei campi sono inclusi.</small></div></div>
        <div class="field-builder"><div class="field-builder-head"><strong>Campi della sezione</strong><span>${customFieldDraft.length} selezionati</span></div><div class="draft-fields visual">${customFieldDraft.map((field,index)=>`<div class="draft-field"><span><strong>${esc(field.label)}</strong><small>${fieldTypeLabel(field.type)}${field.required?' · obbligatorio':''}</small></span><button class="icon-button remove-draft-field" data-index="${index}">×</button></div>`).join('')||'<div class="empty-mini">Scegli un esempio sopra oppure aggiungi il primo campo.</div>'}</div>
          <div class="quick-field-row"><span>Aggiunte rapide:</span>${[['Stato','select'],['Scadenza','date'],['Responsabile','text'],['Importo','currency'],['Note','longtext']].map(([label,type])=>`<button class="quick-field" data-quick-field="${label}" data-quick-type="${type}">+ ${label}</button>`).join('')}</div>
          <div class="field-adder clearer"><label><span>Nome campo</span><input id="fieldLabel" placeholder="Es. Prossimo controllo"></label><label><span>Tipo di informazione</span><select id="fieldType"><option value="text">Testo breve</option><option value="longtext">Note lunghe</option><option value="number">Numero</option><option value="currency">Importo</option><option value="date">Data</option><option value="datetime">Data e ora</option><option value="email">Email</option><option value="phone">Telefono</option><option value="boolean">Sì / No</option><option value="select">Elenco di scelte</option></select></label><label id="fieldOptionsWrap" class="hidden"><span>Scelte possibili</span><input id="fieldOptions" placeholder="Nuovo, In corso, Completato"></label><label class="inline-check"><input id="fieldRequired" type="checkbox"> Campo obbligatorio</label><button id="addField" class="btn btn-secondary">Aggiungi campo</button></div>
        </div><button id="addEntity" class="btn btn-primary create-section-button">Crea la sezione “${esc(sectionDraft.label || 'Nuova area')}”</button></section>`;
  }

  function logicStep() {
    const entities = G.buildEntities(project).filter((item) => !item.system);
    const currentMode = project.pricing.mode || 'none';
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 4</span><h1>Come funziona davvero il tuo lavoro?</h1><p>Non tutte le aziende hanno un listino. Scegli il modello più vicino alla realtà: il sistema mostrerà solo le impostazioni utili.</p></div><div class="heading-badge">${project.automations.length} flussi attivi</div></div>
      <section class="builder-card business-rules"><div class="section-title"><div><span class="micro-label">PREZZI E PREVENTIVI</span><h2>Come determini il prezzo al cliente?</h2><p>Puoi anche scegliere “nessun prezzo”: il gestionale funzionerà normalmente.</p></div></div>
        <div class="price-mode-grid">${PRICE_MODES.map((mode)=>`<button class="price-mode-card ${currentMode===mode.id?'active':''}" data-price-mode="${mode.id}"><b>${mode.icon}</b><span><strong>${mode.name}</strong><small>${mode.description}</small></span><i>${currentMode===mode.id?'✓':''}</i></button>`).join('')}</div>
        <div class="pricing-explainer">${pricingBuilder()}</div>
      </section>
      <section class="builder-card recipe-builder"><div class="section-title"><div><span class="micro-label">AUTOMAZIONI GUIDATE</span><h2>Cosa vuoi che succeda da solo?</h2><p>Scegli un risultato. Easy Come prepara il flusso tecnico; potrai rifinirlo durante l’implementazione.</p></div><span class="price-pill">${money(4)} ciascuna</span></div>
        <div class="automation-recipe-grid">${AUTOMATION_RECIPES.map((recipe)=>{const added=project.automations.some((flow)=>flow.recipeId===recipe.id);return `<button class="automation-recipe ${added?'added':''}" data-recipe="${recipe.id}" ${added?'disabled':''}><b>${recipe.icon}</b><span><strong>${recipe.name}</strong><small>${recipe.description}</small></span><i>${added?'Aggiunta':'+'}</i></button>`}).join('')}</div>
        <div class="automation-list improved">${project.automations.map((flow,index)=>`<article class="automation-row"><span class="automation-bolt">⚡</span><div><strong>${esc(flow.name)}</strong><small>Quando: ${esc(triggerLabel(flow.trigger))} · Azione: ${esc(actionLabel(flow.action))}</small></div><button class="icon-button remove-automation" data-index="${index}">×</button></article>`).join('')||'<div class="empty-mini">Nessuna automazione selezionata. Puoi aggiungerla anche più avanti.</div>'}</div>
        <details class="advanced-automation"><summary>Configurazione avanzata <span>per chi sa già cosa vuole</span></summary><div class="form-grid two compact automation-form"><label class="field"><span>Nome del flusso</span><input id="automationName" value="${esc(automationDraft.name)}" placeholder="Es. Avvisa il team"></label><label class="field"><span>Su quale sezione?</span><select id="automationEntity"><option value="">Qualsiasi sezione</option>${entities.map((entity)=>`<option value="${entity.key}" ${automationDraft.entity===entity.key?'selected':''}>${esc(entity.label)}</option>`).join('')}</select></label><label class="field"><span>Quando parte?</span><select id="automationTrigger">${G.AUTOMATION_TRIGGERS.map((item)=>`<option value="${item.id}" ${automationDraft.trigger===item.id?'selected':''}>${esc(item.label)}</option>`).join('')}</select></label><label class="field"><span>Cosa deve fare?</span><select id="automationAction">${G.AUTOMATION_ACTIONS.map((item)=>`<option value="${item.id}" ${automationDraft.action===item.id?'selected':''}>${esc(item.label)}</option>`).join('')}</select></label><label class="field full"><span>Destinatario, URL o nuovo stato</span><input id="automationTarget" value="${esc(automationDraft.target)}" placeholder="Es. {{email}}, team, URL Make/n8n"></label><label class="field full"><span>Messaggio o istruzione</span><textarea id="automationMessage" placeholder="Cosa deve comunicare o creare?">${esc(automationDraft.message)}</textarea></label></div><button id="addAutomation" class="btn btn-secondary">Aggiungi flusso avanzato</button></details>
      </section>`;
  }

  function pricingBuilder() {
    const p = project.pricing;
    const mode = p.mode || 'none';
    if (mode === 'none') return `<div class="mode-result calm"><b>Nessun calcolo economico</b><p>Il gestionale organizzerà clienti, attività, documenti e scadenze. Potrai registrare importi manualmente solo dove serve.</p></div>`;
    if (mode === 'manual_quote') return `<div class="mode-result"><b>Preventivi personalizzati</b><p>Il prezzo viene deciso dopo la visita, l’analisi o il sopralluogo. Easy Come aggiunge preventivi con righe, note, validità, totale e stato.</p><div class="mode-checks"><span>✓ Nessun prezzo obbligatorio</span><span>✓ Preventivo modificabile</span><span>✓ Storico per cliente</span></div></div>`;
    if (mode === 'fixed') return `<div class="form-grid three compact"><label class="field"><span>Prezzo indicativo principale</span><input id="basePrice" type="number" step="0.01" value="${esc(p.basePrice)}"></label><label class="field"><span>Unità</span><input id="priceUnit" value="${esc(p.unit)}" placeholder="prodotto, servizio, seduta"></label><label class="field"><span>Caparra facoltativa %</span><input id="depositPercent" type="number" min="0" max="100" value="${esc(p.depositPercent)}"></label><div class="mode-result full"><b>Listino nel gestionale</b><p>Potrai creare più prodotti o servizi con prezzi diversi. Il valore sopra serve solo per l’anteprima e i documenti iniziali.</p></div></div>`;
    if (mode === 'hourly') return `<div class="form-grid three compact"><label class="field"><span>Tariffa base</span><input id="basePrice" type="number" step="0.01" value="${esc(p.basePrice)}"></label><label class="field"><span>Unità di tempo</span><select id="priceUnit"><option value="ora" ${p.unit==='ora'?'selected':''}>Ora</option><option value="giorno" ${p.unit==='giorno'?'selected':''}>Giorno</option><option value="mezza giornata" ${p.unit==='mezza giornata'?'selected':''}>Mezza giornata</option></select></label><label class="field"><span>Minimo fatturabile</span><input id="minimumUnits" type="number" step="0.5" value="${esc(p.minimumUnits||1)}"></label></div>`;
    if (mode === 'subscription') return `<div class="form-grid three compact"><label class="field"><span>Quota del piano principale</span><input id="basePrice" type="number" step="0.01" value="${esc(p.basePrice)}"></label><label class="field"><span>Frequenza</span><select id="priceUnit"><option value="mese" ${p.unit==='mese'?'selected':''}>Mensile</option><option value="trimestre" ${p.unit==='trimestre'?'selected':''}>Trimestrale</option><option value="anno" ${p.unit==='anno'?'selected':''}>Annuale</option></select></label><label class="field"><span>Giorni preavviso rinnovo</span><input id="renewalNoticeDays" type="number" value="${esc(p.renewalNoticeDays||15)}"></label><div class="mode-result full"><b>Piani e scadenze</b><p>Nel gestionale potrai creare più piani, controllare rinnovi e vedere chi è in scadenza.</p></div></div>`;
    return `<div class="dynamic-pricing-simple"><div class="form-grid four compact"><label class="field"><span>Prezzo di partenza</span><input id="basePrice" type="number" step="0.01" value="${esc(p.basePrice)}"></label><label class="field"><span>Per ogni</span><input id="priceUnit" value="${esc(p.unit)}" placeholder="notte, giorno, persona"></label><label class="field"><span>Tassa per persona</span><input id="taxPerPerson" type="number" step="0.01" value="${esc(p.taxPerPerson)}"></label><label class="field"><span>Caparra %</span><input id="depositPercent" type="number" min="0" max="100" value="${esc(p.depositPercent)}"></label></div>
      <div class="rule-guide"><strong>Aggiungi una variazione</strong><p>Esempio: “dal 1 al 20 agosto aumenta del 20%” oppure “da 7 notti sconto 10%”.</p></div>
      <div class="pricing-rules">${(p.rules||[]).map((rule,index)=>`<article class="pricing-rule"><div><strong>${esc(rule.name||rule.type)}</strong><small>${esc(ruleSummary(rule))}</small></div><button class="icon-button remove-pricing-rule" data-index="${index}">×</button></article>`).join('')||'<div class="empty-mini">Nessuna variazione: verrà usato il prezzo di partenza.</div>'}</div>
      <div class="rule-adder guided"><label><span>Tipo</span><select id="pricingRuleType"><option value="date_range">Periodo o stagione</option><option value="weekday_multiplier">Giorno della settimana</option><option value="duration_discount">Sconto per durata</option><option value="promo">Codice promozionale</option></select></label><label><span>Nome semplice</span><input id="pricingRuleName" placeholder="Es. Alta stagione"></label><label><span>Valore</span><input id="pricingRuleValue" placeholder="Es. 1.20 oppure 10"></label><label><span>Dettagli</span><input id="pricingRuleExtra" placeholder="Date, giorni, soglia o codice"></label><button id="addPricingRule" class="btn btn-secondary">Aggiungi variazione</button></div></div>`;
  }

  function designStep() {
    const c = project.company;
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 5</span><h1>Scegli un layout già progettato bene.</h1><p>Niente codici colore e combinazioni casuali. Seleziona una direzione visiva completa: tipografia, contrasti, superfici e navigazione sono già coordinate.</p></div><div class="heading-badge">6 layout professionali</div></div>
      <section class="builder-card"><div class="section-title"><div><span class="micro-label">LOGO</span><h2>Il marchio dell’azienda</h2><p>Facoltativo. Se non lo carichi, useremo le iniziali in modo elegante.</p></div><span>Incluso</span></div><div class="upload-field premium"><div class="upload-preview" id="logoPreview">${logoMarkup()}</div><div><label for="logoUpload">Carica logo</label><small>PNG, JPG o SVG · massimo 900 KB</small><input id="logoUpload" type="file" accept="image/*"></div>${c.logoData?'<button id="removeLogo" class="icon-button">×</button>':''}</div></section>
      <section class="layout-picker"><div class="section-title"><div><span class="micro-label">DIREZIONE VISIVA</span><h2>Quale atmosfera rappresenta meglio l’impresa?</h2><p>Ogni proposta viene applicata a dashboard, pagine operative, documentazione e app.</p></div></div>
        <div class="layout-grid">${LAYOUT_PRESETS.map((layout)=>`<button class="layout-card ${c.layout===layout.id||c.style===layout.id?'active':''}" data-layout="${layout.id}"><div class="layout-mock" style="--l1:${layout.sample[0]};--l2:${layout.sample[1]};--l3:${layout.sample[2]}"><aside></aside><main><i></i><b></b><span></span><span></span></main></div><div><strong>${layout.name}</strong><small>${layout.description}</small></div><em>${c.layout===layout.id||c.style===layout.id?'Scelto':'Scegli'}</em></button>`).join('')}</div>
      </section>
      <section class="hub-explainer"><div class="hub-explainer-copy"><span class="micro-label">SEMPRE INCLUSO</span><h2>Easy Come Hub</h2><p>Non è un modulo pubblico per i clienti dell’azienda. È il canale riservato tra l’impresa ed Easy Come, accessibile con le stesse credenziali del gestionale.</p><div class="hub-feature-grid"><span>Manuale personalizzato</span><span>Assistenza e bug</span><span>Richiesta nuove funzioni</span><span>Checklist di avvio</span><span>Versioni e aggiornamenti</span><span>Richiesta implementazione</span></div></div><div class="hub-mini-preview"><header><b>EC</b><span>Easy Come Hub</span></header><article><small>IL TUO SISTEMA</small><strong>${esc(c.name||'La tua azienda')}</strong><p>Manuale, supporto e nuove funzioni in un unico posto.</p></article><div><span>Apri manuale</span><span>Chiedi una funzione</span></div></div></section>`;
  }

  function previewStep() {
    const previewAudit = G.auditProject({ ...project, delivery: { ...project.delivery, previewApproved: true } });
    const canApprove = previewAudit.blockers.length === 0;
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 6</span><h1>Questo è il gestionale che useranno davvero.</h1><p>Niente griglie Excel nell’anteprima principale: naviga dashboard, area operativa, calendario ed Easy Come Hub esattamente come appariranno all’azienda.</p></div><div class="heading-badge ${canApprove?'success':''}">${canApprove?'Anteprima pronta':`${previewAudit.blockers.length} controlli da risolvere`}</div></div>${previewStage()}
      <section class="audit-panel"><div class="audit-score"><strong>${previewAudit.score}</strong><span>/100</span><small>${esc(previewAudit.grade)}</small></div><div><h3>Controllo prima dell’acquisto</h3><div class="audit-list">${previewAudit.blockers.map((item)=>`<p class="blocker">✕ ${esc(item)}</p>`).join('')}${previewAudit.warnings.slice(0,4).map((item)=>`<p class="warning">! ${esc(item)}</p>`).join('')}${!previewAudit.blockers.length?'<p class="passed">✓ Il progetto è coerente e può essere acquistato.</p>':''}</div></div></section>
      <div class="approval-card"><label class="${canApprove?'':'disabled'}"><input id="approvePreview" type="checkbox" ${project.delivery.previewApproved?'checked':''} ${canApprove?'':'disabled'}><span><strong>Ho provato il gestionale e la struttura mi rappresenta</strong><small>${canApprove?'Potrai ancora cambiare il progetto prima del pagamento.':'Risolvi prima i controlli indicati sopra.'}</small></span></label><button id="fullscreenPreview" class="btn btn-preview">Apri a schermo intero</button></div>`;
  }

  function previewStage() {
    return `<div class="preview-stage"><div class="preview-toolbar"><div class="preview-toolbar-left"><i class="preview-dot"></i><i class="preview-dot"></i><i class="preview-dot"></i><button class="preview-mode ${previewMode==='dashboard'?'active':''}" data-preview-mode="dashboard">Dashboard</button><button class="preview-mode ${previewMode==='workspace'?'active':''}" data-preview-mode="workspace">Area operativa</button><button class="preview-mode ${previewMode==='calendar'?'active':''}" data-preview-mode="calendar">Calendario</button><button class="preview-mode ${previewMode==='hub'?'active':''}" data-preview-mode="hub">Easy Come Hub</button></div><div class="preview-toolbar-right"><button class="device-button ${previewDevice==='desktop'?'active':''}" data-device="desktop">Desktop</button><button class="device-button ${previewDevice==='mobile'?'active':''}" data-device="mobile">Mobile</button></div></div><div class="preview-window ${previewDevice==='mobile'?'mobile':''}" id="previewWindow">${renderPreviewContent()}</div></div>`;
  }

  function renderPreviewContent() {
    if (previewMode === 'hub') return hubPreviewHtml();
    return appPreviewHtml(previewMode);
  }

  function appPreviewHtml(mode) {
    const entities = G.buildEntities(project).filter((item)=>!item.system);
    if (!previewEntityKey || !entities.some((item)=>item.key===previewEntityKey)) previewEntityKey=entities[0]?.key||'';
    const current=entities.find((item)=>item.key===previewEntityKey)||entities[0];
    const brand=project.company.name||'La tua azienda';
    const body=mode==='workspace'&&current?workspacePreviewBody(current):mode==='calendar'?calendarPreviewBody(entities):dashboardPreviewBody(entities);
    return `<div class="preview-app layout-${esc(project.company.layout||project.company.style||'studio')}" style="--pv-primary:${esc(project.company.primaryColor)};--pv-accent:${esc(project.company.accentColor)};--pv-surface:${esc(project.company.surfaceColor||'#f7f8fb')}"><aside class="pv-sidebar"><div class="pv-logo"><span class="pv-logo-mark">${logoMarkup()}</span><div><strong>${esc(brand)}</strong><small>Gestionale aziendale</small></div></div><nav class="pv-nav"><button class="${mode==='dashboard'?'active':''}" data-pv-dashboard>⌂ Panoramica</button>${entities.slice(0,9).map((entity)=>`<button class="${mode==='workspace'&&current?.key===entity.key?'active':''}" data-pv-entity="${entity.key}">${esc(entity.label.slice(0,1))} &nbsp;${esc(entity.label)}</button>`).join('')}</nav><div class="pv-sidebar-system"><button data-preview-mode="hub">EC &nbsp;Easy Come Hub</button><span>Manuale e supporto inclusi</span></div></aside><main class="pv-main">${body}</main></div>`;
  }

  function dashboardPreviewBody(entities) {
    const brand=project.company.name||'Azienda';
    return `<div class="pv-top"><div><h2>Panoramica</h2><p>Oggi · tutto ciò che richiede attenzione</p></div><div class="pv-user"><span>${esc(initials())}</span><div><b>${esc(project.company.email||'titolare@azienda.it')}</b><small>Account Easy Come</small></div></div></div><section class="pv-hero"><span>CENTRO OPERATIVO</span><h3>Buon lavoro, ${esc(brand.split(' ')[0])}.</h3><p>${esc(project.company.description||'Clienti, lavoro e scadenze in un unico spazio semplice.')}</p><div class="pv-hero-actions"><b>+ Nuova operazione</b><i>Vedi agenda</i></div></section><section class="pv-stats"><article class="pv-stat"><span>Da gestire oggi</span><strong>${Math.max(6,entities.length+3)}</strong><small>3 priorità alte</small></article><article class="pv-stat"><span>Attività aperte</span><strong>${Math.max(18,entities.length*5)}</strong><small>Aggiornate adesso</small></article><article class="pv-stat"><span>Clienti attivi</span><strong>128</strong><small>12 nuovi questo mese</small></article><article class="pv-stat"><span>Automazioni</span><strong>${project.automations.length}</strong><small>${project.automations.length?'Flussi configurati':'Aggiungibili in seguito'}</small></article></section><section class="pv-grid"><article class="pv-card"><div class="pv-card-title"><h4>Attività recente</h4><span>Ultimi 7 giorni</span></div><div class="pv-chart">${[42,61,48,77,59,91,72].map((height)=>`<i style="height:${height}%"></i>`).join('')}</div></article><article class="pv-card"><div class="pv-card-title"><h4>Agenda di oggi</h4><span>5 impegni</span></div><div class="pv-list">${entities.slice(0,4).map((entity,index)=>`<div><b>${String(9+index).padStart(2,'0')}:00</b><span><strong>${esc(entity.label)}</strong><small>${4+index*2} elementi da gestire</small></span></div>`).join('')}</div></article></section><section class="pv-bottom-grid"><article><span>SCADENZE</span><strong>3 attività urgenti</strong><small>Apri e assegna al team</small></article><article><span>MANUALE</span><strong>Guida personalizzata</strong><small>Inclusa nel sistema</small></article><article><span>EASY COME HUB</span><strong>Supporto disponibile</strong><small>Richiedi funzioni e assistenza</small></article></section>`;
  }

  function workspacePreviewBody(entity) {
    const rows=sampleRows(entity), fields=entity.fields.slice(0,5);
    return `<div class="pv-top"><div><span class="pv-breadcrumb">GESTIONALE / ${esc(entity.label.toUpperCase())}</span><h2>${esc(entity.label)}</h2><p>Ricerca, filtri, schede e azioni in un’unica area.</p></div><button class="pv-new-button">+ Nuova ${esc(entity.singular||'voce')}</button></div><section class="pv-workspace-tools"><label>⌕ <span>Cerca in ${esc(entity.label.toLowerCase())}…</span></label><button>Tutti gli stati⌄</button><button>Ordina⌄</button><i>${rows.length*6} risultati</i></section><section class="pv-workspace"><div class="pv-work-list"><header>${fields.slice(0,3).map((field)=>`<b>${esc(field.label)}</b>`).join('')}<b>Stato</b></header>${Array.from({length:7},(_,index)=>{const row=rows[index%rows.length];return `<article class="${index===1?'selected':''}">${fields.slice(0,3).map((field)=>`<span>${esc(row[field.key])}</span>`).join('')}<span><u>${['Nuovo','In lavorazione','Completato'][index%3]}</u></span></article>`}).join('')}</div><aside class="pv-detail"><span>SCHEDA SELEZIONATA</span><h3>${esc(primaryPreviewLabel(entity,rows[1]||rows[0]))}</h3>${fields.map((field)=>`<div><small>${esc(field.label)}</small><strong>${esc((rows[1]||rows[0])?.[field.key]||'—')}</strong></div>`).join('')}<footer><button>Modifica</button><button>Altre azioni</button></footer></aside></section>`;
  }

  function primaryPreviewLabel(entity,row){
    const field=entity.fields.find((item)=>['name','title','customer_name','plate'].includes(item.key))||entity.fields[0];
    return field?row?.[field.key]||entity.singular:entity.singular;
  }

  function calendarPreviewBody(entities) {
    const resources = ['Risorsa 01','Risorsa 02','Risorsa 03','Risorsa 04','Risorsa 05','Risorsa 06'];
    const days = Array.from({length:14},(_,index)=>index+3);
    return `<div class="pv-top"><div><h2>Calendario disponibilità</h2><p>Vista mensile collegata a prenotazioni, appuntamenti e risorse</p></div><div class="pv-calendar-actions"><span>‹ Agosto 2026 ›</span><b>Oggi</b></div></div><section class="pv-calendar-kpis"><div><span>Disponibili oggi</span><strong>18</strong></div><div><span>Occupati</span><strong>7</strong></div><div><span>Richieste in attesa</span><strong>3</strong></div><div><span>Tasso utilizzo</span><strong>72%</strong></div></section><article class="pv-availability"><div class="pv-av-row pv-av-head"><b>Risorsa</b>${days.map((day)=>`<span>${day}<small>${['L','M','M','G','V','S','D'][(day-3)%7]}</small></span>`).join('')}</div>${resources.map((resource,rowIndex)=>`<div class="pv-av-row"><b>${resource}<small>${rowIndex%2?'Standard':'Premium'}</small></b>${days.map((day,colIndex)=>{const busy=(rowIndex*3+colIndex)%5===0||(rowIndex+colIndex)%7===0;const request=(rowIndex+colIndex)%9===0;return `<span class="${busy?'busy':request?'request':'free'}" title="${busy?'Occupato':request?'Richiesta':'Libero'}">${busy?'●':request?'◐':'✓'}</span>`}).join('')}</div>`).join('')}<footer><i class="free">✓ Libero</i><i class="busy">● Occupato</i><i class="request">◐ Richiesta</i></footer></article><section class="pv-calendar-bottom"><article><span>PROSSIMO ARRIVO</span><strong>Mario Rossi · 14:30</strong><small>Risorsa 03 · confermato</small></article><article><span>CONTROLLO AUTOMATICO</span><strong>Nessuna sovrapposizione</strong><small>Disponibilità verificata in tempo reale</small></article></section>`;
  }

  function sampleRows(entity) {
    const names = ['Mario Rossi', 'Anna Bianchi', 'Studio Aurora', 'Luca Verdi'];
    return Array.from({ length: 4 }, (_, index) => {
      const row = {};
      entity.fields.forEach((field) => {
        const key = `${field.key} ${field.label}`.toLowerCase();
        if (field.type === 'currency') row[field.key] = money([120, 245, 89, 460][index]);
        else if (field.type === 'number') row[field.key] = [2, 5, 12, 24][index];
        else if (field.type === 'date' || field.type === 'datetime') row[field.key] = ['03/08/2026', '05/08/2026', '08/08/2026', '12/08/2026'][index];
        else if (field.type === 'boolean') row[field.key] = index % 2 ? 'No' : 'Sì';
        else if (field.type === 'select') row[field.key] = (field.options || ['Attivo'])[index % (field.options || ['Attivo']).length];
        else if (key.includes('email')) row[field.key] = ['mario@esempio.it', 'anna@esempio.it', 'info@aurora.it', 'luca@esempio.it'][index];
        else if (key.includes('nome') || key.includes('name') || key.includes('cliente')) row[field.key] = names[index];
        else if (key.includes('stato') || key.includes('status')) row[field.key] = ['Nuovo', 'In corso', 'Completato', 'In attesa'][index];
        else row[field.key] = ['Dato esempio', 'Voce operativa', 'Informazione', 'Nota interna'][index];
      });
      return row;
    });
  }

  function hubPreviewHtml() {
    return `<div class="pv-hub"><aside><div class="pv-hub-brand"><b>EC</b><span><strong>Easy Come Hub</strong><small>Spazio riservato</small></span></div><nav><button class="active">Panoramica</button><button>Manuale operativo</button><button>Assistenza</button><button>Nuove funzioni</button><button>Avvio e aggiornamenti</button></nav><footer><span>Connesso come</span><strong>${esc(project.company.email||'titolare@azienda.it')}</strong></footer></aside><main><header><div><span>IL TUO SISTEMA EASY COME</span><h2>${esc(project.company.name||'La tua azienda')}</h2><p>Manuale, richieste e prossimi miglioramenti senza perdere conversazioni.</p></div><i>Versione 1.0</i></header><section class="pv-hub-progress"><div><span>AVVIO DEL SISTEMA</span><strong>4 di 6 passaggi completati</strong><i><b style="width:67%"></b></i></div><button>Continua configurazione</button></section><section class="pv-hub-actions"><article><b>?</b><span><strong>Apri il manuale</strong><small>Guida creata sulle funzioni scelte</small></span></article><article><b>＋</b><span><strong>Chiedi una funzione</strong><small>Descrivi cosa vuoi aggiungere</small></span></article><article><b>!</b><span><strong>Segnala un problema</strong><small>Invia priorità e dettagli tecnici</small></span></article><article><b>↗</b><span><strong>Richiedi implementazione</strong><small>Database, pubblicazione e collaudo</small></span></article></section><section class="pv-hub-grid"><article><header><h3>Le tue richieste</h3><span>Vedi tutte</span></header><div><b>Nuovo report mensile</b><small>In valutazione · ieri</small></div><div><b>Collegamento calendario</b><small>Risposta inviata · 3 giorni fa</small></div></article><article><header><h3>Cosa include il sistema</h3></header><div class="pv-hub-pills">${project.modules.slice(0,7).map((id)=>`<span>${esc(G.MODULES.find((item)=>item.id===id)?.name||id)}</span>`).join('')}</div></article></section></main></div>`;
  }

  function deliveryStep() {
    const price = G.calculatePrice(project), entities = G.buildEntities(project), audit = G.auditProject(project), ready = audit.ready;
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 7</span><h1>Il sistema digitale completo, non un template vuoto.</h1><p>Il pacchetto può includere gestionale, Excel, sito pubblico, PWA mobile, database, automazioni, AI configurabile e documentazione. L’implementazione assistita resta facoltativa.</p></div><div class="heading-badge ${ready ? 'success' : ''}">${audit.score}/100 · ${esc(audit.grade)}</div></div>
      <div class="quality-grid"><article class="quality-card"><span>FILE CONSEGNATI</span><strong>45+</strong></article><article class="quality-card"><span>SEZIONI</span><strong>${entities.length}</strong></article><article class="quality-card"><span>VISTE OPERATIVE</span><strong>6</strong></article><article class="quality-card"><span>FOGLI EXCEL</span><strong>${Math.max(2, entities.length)}</strong></article></div>
      <section class="audit-panel delivery-audit"><div class="audit-score"><strong>${audit.score}</strong><span>/100</span><small>${esc(audit.grade)}</small></div><div><h3>Esito del controllo automatico</h3><div class="audit-list">${audit.blockers.map((item) => `<p class="blocker">✕ ${esc(item)}</p>`).join('')}${audit.warnings.slice(0, 5).map((item) => `<p class="warning">! ${esc(item)}</p>`).join('')}${audit.strengths.slice(0, 5).map((item) => `<p class="passed">✓ ${esc(item)}</p>`).join('')}</div></div></section>
      <div class="delivery-grid"><section class="package-card"><div class="package-icon">PRO</div><div><h2>${esc(project.company.name || 'Gestionale personalizzato')}</h2><p>Un sistema di lavoro completo, pronto per essere configurato sul database dell’impresa.</p></div><div class="package-files">${['Dashboard con KPI e indicatori', 'Foglio operativo modificabile tipo Excel', 'Calendario disponibilità e risorse', 'Workbook .xlsx già strutturato', 'Tabella, kanban, agenda e schede', 'Import/export, filtri e azioni massive', 'Preventivi, ordini e documenti stampabili', 'Ruoli, audit log e backup', 'Easy Come Hub: manuale, assistenza e nuove funzioni', 'Database Supabase e automazioni', 'Manuale PDF ed executive summary', 'Brand kit vettoriale', project.modules.includes('website') ? 'Sito pubblico coordinato' : 'Sito pubblico selezionabile', project.modules.includes('mobile_app') ? 'App PWA installabile' : 'App PWA selezionabile', project.modules.includes('ai') ? 'Assistente AI configurabile' : 'Modulo AI selezionabile'].map((item) => `<span>✓ ${item}</span>`).join('')}</div><button id="reviewPreview" class="btn btn-secondary" style="grid-column:1/-1">Rivedi anteprima</button><button id="downloadPackage" class="btn btn-primary download-button" ${ready ? '' : 'disabled'}>${SALES.mode === 'customer' ? 'Prepara il progetto e continua' : 'Prepara e scarica il pacchetto'}</button>${ready ? '' : `<p class="validation-note">Il pacchetto non è ancora consegnabile: risolvi i controlli rossi e approva l’anteprima.</p>`}</section>
      <section class="quote-card"><span class="eyebrow">Prezzo una tantum</span><div class="quote-lines"><div><span>Pacchetto software</span><strong>${money(price.base)}</strong></div><div><span>Moduli</span><strong>${money(price.modules)}</strong></div><div><span>Sezioni e campi su misura</span><strong>${money(price.customEntities + price.customFields)}</strong></div><div><span>Automazioni</span><strong>${money(price.automations)}</strong></div><div><span>Regole prezzo extra</span><strong>${money(price.pricingRules)}</strong></div>${price.bundleDiscount ? `<div><span>Sconto bundle funzioni</span><strong>- ${money(price.bundleDiscount)}</strong></div>` : ''}${price.implementation ? `<div><span>Implementazione assistita</span><strong>${money(price.implementation)}</strong></div>` : ''}</div><label class="implementation-addon"><input id="implementationSelected" type="checkbox" ${project.delivery.implementationSelected ? 'checked' : ''}><span><strong>Aggiungi implementazione assistita</strong><small>Installazione Supabase, configurazione, test, pubblicazione e consegna guidata.</small></span><b>+ ${money(project.delivery.implementationPrice || 150)}</b></label><div class="quote-total"><span>Totale cliente</span><strong>${money(price.total)}</strong><small>Nessun canone Easy Come</small></div><label class="field"><span>Note commerciali</span><textarea id="deliveryNotes" placeholder="Tempi, formazione, condizioni…">${esc(project.delivery.notes)}</textarea></label><button id="printQuote" class="btn btn-secondary" style="width:100%">Stampa offerta professionale</button></section></div>
      <div class="truth-card"><strong>${SALES.mode === 'customer' ? 'Anteprima prima dell’acquisto' : 'Modalità Builder Easy Come'}</strong><p>${SALES.mode === 'customer' ? 'Il pacchetto software si acquista da solo. L’implementazione non viene mai aggiunta automaticamente: il cliente la seleziona soltanto quando desidera il servizio.' : 'Il pacchetto contiene anche workbook Excel, calendario operativo, database e checklist. L’implementazione è un servizio separato e facoltativo.'}</p></div>`;
  }

  function qualityScore() {
    return G.auditProject(project).score;
  }
  function renderSummary() {
    const price = G.calculatePrice(project), entities = G.buildEntities(project), audit = G.auditProject(project);
    $('#summary').innerHTML = `<div class="summary-brand"><span>${logoMarkup()}</span><div><strong>${esc(project.company.name || 'Nuovo gestionale')}</strong><small>${esc(project.company.industry || 'Progetto universale')}</small></div></div><div class="summary-metrics"><div><span>Moduli</span><strong>${project.modules.length}</strong></div><div><span>Sezioni</span><strong>${entities.length}</strong></div><div><span>Qualità</span><strong>${audit.score}</strong></div></div><div class="summary-quality ${audit.ready ? 'ready' : ''}"><span>${audit.ready ? 'PRONTO ALLA CONSEGNA' : 'CONTROLLO IN CORSO'}</span><strong>${esc(audit.grade)}</strong><small>${audit.blockers.length ? `${audit.blockers.length} elementi bloccanti` : 'Nessun blocco rilevato'}</small></div><div class="summary-capabilities"><span>Excel</span><span>Database</span><span>PWA</span><span>Brand kit</span></div><div class="summary-list"><div><span>Software base</span><strong>${money(price.base)}</strong></div><div><span>Extra scelti</span><strong>${money(price.extras)}</strong></div>${price.implementation ? `<div><span>Implementazione opzionale</span><strong>${money(price.implementation)}</strong></div>` : ''}</div><div class="summary-total"><span>Totale una tantum</span><strong>${money(price.total)}</strong><small>${price.implementation ? 'Implementazione selezionata' : 'Implementazione non inclusa'}</small></div><button id="summaryPreview" class="btn btn-preview summary-cta">Prova l’anteprima</button><button id="resetProject" class="btn btn-ghost">Ricomincia da zero</button>`;
    $('#summaryPreview').onclick = openPreviewOverlay;
    $('#resetProject').onclick = () => { if (confirm('Eliminare la configurazione corrente?')) { project = normalizeProject(G.defaultProject()); currentStep = 0; customFieldDraft = []; render(); } };
  }

  function updateNavigation() {
    $('#previous').disabled = currentStep === 0;
    $('#next').textContent = currentStep === steps.length - 1 ? 'Torna all’inizio' : currentStep === 4 ? 'Vai all’anteprima' : 'Continua';
    $('#progressMobile').textContent = `${currentStep + 1} / ${steps.length}`;
  }

  function bindPanel() {
    [bindIdea, bindModules, bindStructure, bindLogic, bindDesign, bindPreview, bindDelivery][currentStep]();
  }

  function bindIdea() {
    $$('.template-card').forEach((card) => card.onclick = () => applyTemplate(card.dataset.template));
    const bind = (id, setter) => { const input = $('#' + id); input.oninput = () => { setter(input.value); project.delivery.previewApproved = false; saveDraft(); renderSummary(); }; };
    bind('companyName', (value) => { project.company.name = value; project.company.slug = G.slugify(value); });
    bind('industry', (value) => project.company.industry = value);
    bind('description', (value) => project.company.description = value);
    bind('companyEmail', (value) => project.company.email = value);
    bind('companyPhone', (value) => project.company.phone = value);
  }

  function bindModules() {
    $$('.module-card:not([disabled])').forEach((card) => card.onclick = () => { const id = card.dataset.module; project.modules = project.modules.includes(id) ? project.modules.filter((item) => item !== id) : [...project.modules, id]; project.delivery.previewApproved = false; render(); });
  }

  function bindStructure() {
    const presetToFields = (preset) => preset.fields.map(([label,type,required])=>({
      key:G.sqlName(label), label, type, required:Boolean(required),
      options:type==='select'?['Nuovo','In corso','Completato']:undefined,
    }));
    $$('.remove-entity').forEach((button)=>button.onclick=()=>{project.customEntities=project.customEntities.filter((entity)=>entity.key!==button.dataset.key);project.delivery.previewApproved=false;render();});
    $$('.remove-draft-field').forEach((button)=>button.onclick=()=>{customFieldDraft.splice(Number(button.dataset.index),1);renderPanel();});
    $$('.section-preset').forEach((button)=>button.onclick=()=>{
      const preset=SECTION_PRESETS.find((item)=>item.id===button.dataset.sectionPreset);
      if(!preset)return;
      sectionDraft={label:preset.label,singular:preset.singular};
      customFieldDraft=presetToFields(preset);
      renderPanel();
      toast(`Base “${preset.label}” caricata. Puoi modificarla.`);
    });
    $$('.quick-field').forEach((button)=>button.onclick=()=>{
      const label=button.dataset.quickField,type=button.dataset.quickType;
      if(customFieldDraft.some((field)=>field.label.toLowerCase()===label.toLowerCase()))return toast('Questo campo è già presente.');
      customFieldDraft.push({key:G.sqlName(label),label,type,required:false,options:type==='select'?['Nuovo','In corso','Completato']:undefined});
      renderPanel();
    });
    $('#entityLabel').oninput=(event)=>{sectionDraft.label=event.target.value;const button=$('#addEntity');if(button)button.textContent=`Crea la sezione “${sectionDraft.label||'Nuova area'}”`;};
    $('#entitySingular').oninput=(event)=>sectionDraft.singular=event.target.value;
    $('#fieldType').onchange=(event)=>$('#fieldOptionsWrap').classList.toggle('hidden',event.target.value!=='select');
    $('#addField').onclick=()=>{
      const label=$('#fieldLabel').value.trim();if(!label)return toast('Scrivi il nome del campo.');
      const type=$('#fieldType').value;
      if(customFieldDraft.some((field)=>field.label.toLowerCase()===label.toLowerCase()))return toast('Esiste già un campo con questo nome.');
      customFieldDraft.push({key:G.sqlName(label),label,type,required:$('#fieldRequired').checked,options:type==='select'?$('#fieldOptions').value.split(',').map((item)=>item.trim()).filter(Boolean):undefined});
      renderPanel();
    };
    $('#addEntity').onclick=()=>{
      const label=(sectionDraft.label||$('#entityLabel').value).trim(),singular=(sectionDraft.singular||$('#entitySingular').value||label).trim();
      if(!label)return toast('Dai un nome alla sezione.');
      if(!customFieldDraft.length)return toast('Aggiungi almeno un campo.');
      const key=G.sqlName(label);
      if(G.buildEntities(project).some((entity)=>entity.key===key))return toast('Esiste già una sezione con questo nome.');
      project.customEntities.push({key,label,singular,fields:customFieldDraft});
      customFieldDraft=[];sectionDraft={label:'',singular:''};project.delivery.previewApproved=false;toast('Sezione creata.');render();
    };
  }

  function bindLogic() {
    $$('.price-mode-card').forEach((button)=>button.onclick=()=>{
      const mode=button.dataset.priceMode;
      project.pricing.mode=mode;
      project.pricing.enabled=['fixed','hourly','subscription','dynamic'].includes(mode);
      if(mode==='manual_quote'&&!project.modules.includes('quotes'))project.modules.push('quotes');
      if(mode==='dynamic'&&!project.modules.includes('dynamic_pricing'))project.modules.push('dynamic_pricing');
      if(mode!=='dynamic')project.modules=project.modules.filter((id)=>id!=='dynamic_pricing');
      project.delivery.previewApproved=false;render();
    });
    const numberKeys=['basePrice','taxPerPerson','depositPercent','minimumUnits','renewalNoticeDays'];
    ['basePrice','priceUnit','taxPerPerson','depositPercent','minimumUnits','renewalNoticeDays'].forEach((id)=>{
      const input=$('#'+id);if(!input)return;
      input.oninput=(event)=>{project.pricing[id==='priceUnit'?'unit':id]=numberKeys.includes(id)?Number(event.target.value||0):event.target.value;project.delivery.previewApproved=false;saveDraft();renderSummary();};
    });
    $$('.remove-pricing-rule').forEach((button)=>button.onclick=()=>{project.pricing.rules.splice(Number(button.dataset.index),1);project.delivery.previewApproved=false;render();});
    if($('#addPricingRule'))$('#addPricingRule').onclick=()=>{
      const type=$('#pricingRuleType').value,name=$('#pricingRuleName').value.trim()||'Nuova variazione',value=Number($('#pricingRuleValue').value||0),extra=$('#pricingRuleExtra').value.trim();let rule={type,name};
      if(type==='date_range'){const[from,to]=extra.split(',').map((item)=>item.trim());rule={...rule,from,to,multiplier:value||1};}
      if(type==='weekday_multiplier')rule={...rule,days:extra.split(',').map(Number).filter((item)=>!Number.isNaN(item)),multiplier:value||1};
      if(type==='duration_discount')rule={...rule,min:Number(extra||1),percent:value};
      if(type==='promo')rule={...rule,code:extra,percent:value};
      project.pricing.rules.push(rule);project.delivery.previewApproved=false;render();
    };
    $$('.automation-recipe').forEach((button)=>button.onclick=()=>{
      const recipe=AUTOMATION_RECIPES.find((item)=>item.id===button.dataset.recipe);if(!recipe)return;
      if(!project.modules.includes('automations'))project.modules.push('automations');
      project.automations.push({...recipe.flow,id:G.uuidv4(),recipeId:recipe.id,enabled:true});
      project.delivery.previewApproved=false;toast('Automazione aggiunta.');render();
    });
    $$('.remove-automation').forEach((button)=>button.onclick=()=>{project.automations.splice(Number(button.dataset.index),1);project.delivery.previewApproved=false;render();});
    const map={automationName:'name',automationEntity:'entity',automationTrigger:'trigger',automationAction:'action',automationTarget:'target',automationMessage:'message'};
    Object.keys(map).forEach((id)=>{const input=$('#'+id);if(input)input.oninput=()=>automationDraft[map[id]]=input.value;});
    if($('#addAutomation'))$('#addAutomation').onclick=()=>{
      if(!automationDraft.name.trim())return toast('Dai un nome al flusso.');
      if(!project.modules.includes('automations'))project.modules.push('automations');
      project.automations.push({...automationDraft,id:G.uuidv4()});
      automationDraft={name:'',trigger:'record_created',entity:'',action:'notify',target:'',message:'',enabled:true};
      project.delivery.previewApproved=false;toast('Flusso avanzato aggiunto.');render();
    };
  }

  function bindDesign() {
    const upload=$('#logoUpload');
    upload.onchange=()=>{const file=upload.files?.[0];if(!file)return;if(file.size>900000)return toast('Usa un logo più leggero di 900 KB.');const reader=new FileReader();reader.onload=()=>{project.company.logoData=reader.result;project.delivery.previewApproved=false;render();};reader.readAsDataURL(file);};
    if($('#removeLogo'))$('#removeLogo').onclick=()=>{project.company.logoData='';project.delivery.previewApproved=false;render();};
    $$('.layout-card').forEach((button)=>button.onclick=()=>{
      const layout=LAYOUT_PRESETS.find((item)=>item.id===button.dataset.layout);if(!layout)return;
      project.company.layout=layout.id;project.company.style=layout.id;project.company.primaryColor=layout.primary;project.company.accentColor=layout.accent;project.company.surfaceColor=layout.surface;
      project.delivery.previewApproved=false;toast(`Layout ${layout.name} applicato.`);render();
    });
  }

  function bindPreview() {
    bindPreviewControls($('#panel'));
    $('#approvePreview').onchange = (event) => { project.delivery.previewApproved = event.target.checked; saveDraft(); renderSummary(); };
    $('#fullscreenPreview').onclick = openPreviewOverlay;
  }

  function bindPreviewControls(root) {
    $$('[data-preview-mode]', root).forEach((button) => button.onclick = () => { previewMode = button.dataset.previewMode; const stage = button.closest('.preview-stage'); stage.outerHTML = previewStage(); bindPreviewControls($('#panel')); });
    $$('[data-device]', root).forEach((button) => button.onclick = () => { previewDevice = button.dataset.device; const stage = button.closest('.preview-stage'); stage.outerHTML = previewStage(); bindPreviewControls($('#panel')); });
    $$('[data-pv-entity]', root).forEach((button) => button.onclick = () => { previewMode = 'workspace'; previewEntityKey = button.dataset.pvEntity; const stage = button.closest('.preview-stage'); stage.outerHTML = previewStage(); bindPreviewControls($('#panel')); });
    $$('[data-pv-dashboard]', root).forEach((button) => button.onclick = () => { previewMode = 'dashboard'; const stage = button.closest('.preview-stage'); stage.outerHTML = previewStage(); bindPreviewControls($('#panel')); });
  }

  function openPreviewOverlay() {
    $('#previewRoot').innerHTML = `<div class="preview-overlay"><div class="preview-overlay-head"><div><h2>Anteprima live · ${esc(project.company.name || 'Nuovo gestionale')}</h2><p>Naviga dashboard, area operativa, calendario e Easy Come Hub. Passa da desktop a mobile.</p></div><button class="close-preview" id="closePreview">×</button></div>${previewStage()}</div>`;
    $('#closePreview').onclick = () => $('#previewRoot').innerHTML = '';
    bindOverlayPreview();
  }

  function bindOverlayPreview() {
    const root = $('#previewRoot');
    $$('[data-preview-mode]', root).forEach((button) => button.onclick = () => { previewMode = button.dataset.previewMode; openPreviewOverlay(); });
    $$('[data-device]', root).forEach((button) => button.onclick = () => { previewDevice = button.dataset.device; openPreviewOverlay(); });
    $$('[data-pv-entity]', root).forEach((button) => button.onclick = () => { previewMode = 'workspace'; previewEntityKey = button.dataset.pvEntity; openPreviewOverlay(); });
    $$('[data-pv-dashboard]', root).forEach((button) => button.onclick = () => { previewMode = 'dashboard'; openPreviewOverlay(); });
  }

  const PREPARATION_STAGES = [
    { at: 0.00, label: 'Lettura della configurazione', note: 'Controllo dati, moduli e obiettivi' },
    { at: 0.18, label: 'Progettazione della struttura', note: 'Sezioni, campi e relazioni' },
    { at: 0.40, label: 'Verifica dei flussi', note: 'Regole di lavoro, prezzi e automazioni' },
    { at: 0.63, label: 'Preparazione della specifica', note: 'Requisiti, dati e documenti di progetto' },
    { at: 0.84, label: 'Controllo finale', note: 'Qualità, sicurezza e preventivo' },
  ];

  function projectForCheckout() {
    const moduleAliases = { portal: 'easycome_hub', public_portal: 'easycome_hub', client_portal: 'easycome_hub', hub: 'easycome_hub' };
    return {
      ...project,
      modules: Array.from(new Set((project.modules || []).map((id) => moduleAliases[id] || id))),
      company: { ...project.company },
      delivery: { ...project.delivery, previewApproved: true },
    };
  }

  function runPreparation(onComplete, onCancel = () => {}) {
    const audit = G.auditProject(project);
    if (!audit.ready) {
      alert('Il progetto non supera ancora il controllo qualità. Correggi gli elementi rossi e approva l’anteprima.');
      onCancel();
      return;
    }
    let cancelled = false;
    const root = $('#generationRoot');
    document.body.style.overflow = 'hidden';
    root.innerHTML = `<div class="process-overlay" role="dialog" aria-modal="true" aria-labelledby="processTitle"><section class="process-sheet">
      <div class="process-head"><div><span class="process-kicker">PREPARAZIONE DEL PROGETTO</span><h2 id="processTitle">Stiamo componendo il pacchetto.</h2><p>Generiamo struttura, fogli Excel, calendario, database e documentazione del progetto.</p></div><div class="process-spinner" aria-label="Elaborazione in corso"><i></i><span></span></div></div>
      <div class="process-indeterminate"><i></i></div>
      <div class="process-stages">${PREPARATION_STAGES.map((stage, index) => `<div class="process-stage ${index === 0 ? 'active' : ''}" data-process-stage="${index}"><b>${index + 1}</b><strong>${stage.label}</strong><small>${stage.note}</small></div>`).join('')}</div>
      <p class="process-note">Il tempo dipende dalla quantità di moduli, campi e automazioni scelti. Non è presente alcun conto alla rovescia.</p>
      <button class="process-cancel" id="cancelPreparation" type="button">Interrompi e torna al progetto</button>
    </section></div>`;
    $('#cancelPreparation').onclick = () => { cancelled = true; root.innerHTML = ''; document.body.style.overflow = ''; onCancel(); };

    const advance = (index) => {
      $$('.process-stage').forEach((element, itemIndex) => {
        element.classList.toggle('done', itemIndex < index);
        element.classList.toggle('active', itemIndex === index);
        if (itemIndex < index) element.querySelector('b').textContent = '✓';
      });
    };

    let preparedResult;
    try {
      preparedResult = SALES.mode === 'customer'
        ? { filename: `${project.company.slug || 'progetto'}-easycome.json`, project: projectForCheckout() }
        : G.generatePackage(project);
      localStorage.setItem('easycome:last-prepared-project', JSON.stringify({ project: projectForCheckout(), preparedAt: new Date().toISOString(), filename: preparedResult.filename }));
    } catch (error) {
      root.innerHTML = '';
      document.body.style.overflow = '';
      alert('Errore durante la preparazione: ' + (error.message || String(error)));
      onCancel();
      return;
    }

    let index = 0;
    const interval = setInterval(() => {
      if (cancelled) { clearInterval(interval); return; }
      index += 1;
      if (index < PREPARATION_STAGES.length) advance(index);
      else {
        clearInterval(interval);
        $$('.process-stage').forEach((element) => { element.classList.remove('active'); element.classList.add('done'); element.querySelector('b').textContent = '✓'; });
        setTimeout(() => {
          if (cancelled) return;
          root.innerHTML = '';
          document.body.style.overflow = '';
          onComplete(preparedResult);
        }, 350);
      }
    }, 420);
  }

  function orderLines(price) {
    return [
      ['Software base', price.base],
      ...(price.implementation ? [['Implementazione assistita (opzionale)', price.implementation]] : []),
      ['Moduli scelti', price.modules],
      ['Sezioni e campi su misura', price.customEntities + price.customFields],
      ['Automazioni', price.automations],
      ['Regole prezzo extra', price.pricingRules],
      ...(price.bundleDiscount ? [['Sconto pacchetto', -price.bundleDiscount]] : []),
    ];
  }

  function openCheckout(preparedResult) {
    const price = G.calculatePrice(project);
    const root = $('#checkoutRoot');
    const lines = orderLines(price).filter(([, value]) => Number(value) !== 0);
    document.body.style.overflow = 'hidden';
    root.innerHTML = `<div class="checkout-overlay" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle"><section class="checkout-sheet">
      <div class="checkout-copy"><div class="checkout-top"><div><span class="process-kicker">ORDINE EASY COME</span><h2 id="checkoutTitle">Il tuo sistema digitale è pronto.</h2><p>Controlla i dati e passa al pagamento sicuro.</p></div><button class="checkout-close" id="closeCheckout" type="button" aria-label="Chiudi">×</button></div>
        <div class="order-company"><span>Sistema configurato per</span><h3>${esc(project.company.name || 'La tua impresa')}</h3><p>${esc(project.company.description || '')}</p></div>
        <div class="order-lines">${lines.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${value < 0 ? '− ' : ''}${money(Math.abs(value))}</strong></div>`).join('')}</div>
        <div class="order-total"><div><span class="checkout-label">TOTALE UNA TANTUM</span><small>Nessun abbonamento Easy Come</small></div><strong>${money(price.total)}</strong></div>
        <div class="checkout-guarantees"><span>✓ Anteprima approvata prima del pagamento</span>${price.implementation ? '<span>✓ Implementazione assistita selezionata</span>' : '<span>✓ Pacchetto software senza servizi obbligatori</span>'}<span>✓ Pagamento protetto tramite Stripe</span><span>✓ Download automatico dopo la conferma Stripe</span></div>
      </div>
      <div class="checkout-form-wrap"><form id="checkoutForm" class="checkout-form"><span class="checkout-label">DATI PER L’ORDINE</span><h3>A chi intestiamo il progetto?</h3><p>Questi dati vengono associati al pagamento e alla consegna del pacchetto software.</p>
        <div class="form-grid two"><label class="field"><span>Nome e cognome</span><input name="customerName" required autocomplete="name" value=""></label><label class="field"><span>Email</span><input name="email" required type="email" autocomplete="email" value="${esc(project.company.email || '')}"></label><label class="field"><span>Telefono</span><input name="phone" autocomplete="tel"></label><label class="field"><span>Partita IVA / CF</span><input name="taxId" autocomplete="off"></label><label class="field full"><span>Ragione sociale</span><input name="companyName" required value="${esc(project.company.name || '')}"></label></div>
        <label class="legal-check"><input type="checkbox" name="terms" required><span>Accetto i <a href="${esc(SALES.termsUrl || '#')}" target="_blank" rel="noopener">termini del servizio</a> e confermo di aver letto la <a href="${esc(SALES.privacyUrl || '#')}" target="_blank" rel="noopener">privacy policy</a>.</span></label>
        <div id="checkoutError"></div><button class="btn btn-primary checkout-button" id="payButton" type="submit">Vai al pagamento sicuro · ${money(price.total)}</button><div class="secure-row"><span>🔒</span><span>I dati della carta vengono gestiti direttamente da Stripe.</span></div>
      </form></div>
    </section></div>`;
    $('#closeCheckout').onclick = () => { root.innerHTML = ''; document.body.style.overflow = ''; };
    $('#checkoutForm').onsubmit = async (event) => {
      event.preventDefault();
      const form = event.currentTarget;
      if (!form.reportValidity()) return;
      const customer = Object.fromEntries(new FormData(form));
      const button = $('#payButton');
      const errorBox = $('#checkoutError');
      button.disabled = true;
      button.textContent = 'Apertura del pagamento…';
      errorBox.innerHTML = '';
      try {
        if (!SALES.checkoutEndpoint && SALES.paymentUrl) {
          window.location.href = SALES.paymentUrl;
          return;
        }
        if (!SALES.checkoutEndpoint) throw new Error('Checkout non configurato. Inserisci checkoutEndpoint in js/sales-config.js.');
        const accessToken = await window.EasyComeAccount?.getAccessToken?.();
        if (!accessToken) throw new Error('Accedi al tuo account Easy Come prima del pagamento.');
        const response = await fetch(SALES.checkoutEndpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            project: projectForCheckout(),
            customer,
            preparedFilename: preparedResult?.filename || '',
            sourceUrl: window.location.href,
          }),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.url) throw new Error(data.error || 'Impossibile avviare il pagamento.');
        window.location.href = data.url;
      } catch (error) {
        console.error(error);
        errorBox.innerHTML = `<div class="checkout-error">${esc(error.message || String(error))}${location.protocol === 'file:' ? '<br>Per provare il checkout devi pubblicare il sito o avviarlo tramite un server locale.' : ''}</div>`;
        button.disabled = false;
        button.textContent = `Vai al pagamento sicuro · ${money(price.total)}`;
      }
    };
  }

  function downloadPreparedPackage(result) {
    const blob = window.EasyZip.createZip(result.files);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = result.filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    toast('Pacchetto completo scaricato.');
  }

  function bindDelivery() {
    if ($('#implementationSelected')) $('#implementationSelected').onchange = (event) => { project.delivery.implementationSelected = event.target.checked; saveDraft(); render(); };
    if ($('#deliveryNotes')) $('#deliveryNotes').oninput = () => { project.delivery.notes = $('#deliveryNotes').value; saveDraft(); };
    $('#reviewPreview').onclick = () => { currentStep = 5; render(); };
    const button = $('#downloadPackage');
    button.onclick = () => {
      button.disabled = true;
      try {
        runPreparation((result) => {
          try {
            if (SALES.mode === 'customer') openCheckout(result);
            else if (SALES.internalDownloadEnabled !== false) downloadPreparedPackage(result);
            else alert('Il download interno è disattivato in js/sales-config.js.');
          } finally {
            button.disabled = false;
          }
        }, () => { button.disabled = false; });
      } catch (error) {
        button.disabled = false;
        console.error(error);
        alert('Errore: ' + (error.message || String(error)));
      }
    };
    $('#printQuote').onclick = printQuote;
  }

  function printQuote() {
    const price = G.calculatePrice(project), modules = project.modules.map((id) => G.MODULES.find((item) => item.id === id)?.name).filter(Boolean), popup = window.open('', '_blank');
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Offerta ${esc(project.company.name)}</title><style>body{font-family:Arial,sans-serif;background:#f4f5f1;margin:0;padding:50px;color:#171815}.sheet{max-width:820px;margin:auto;background:#fff;border-radius:26px;padding:48px;box-shadow:0 25px 80px #0001}.tag{display:inline-block;background:#fff0e9;color:#ff6b35;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:bold}h1{font-size:44px;letter-spacing:-2px;margin:15px 0}.muted{color:#777}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eee}.total{background:#171815;color:#fff;border-radius:19px;padding:23px;margin-top:20px}.total strong{display:block;font-size:35px;margin-top:5px}.modules{columns:2}.footer{margin-top:45px;font-size:11px;color:#888}</style></head><body><div class="sheet"><span class="tag">EASY COME · OFFERTA UNA TANTUM</span><h1>${esc(project.company.name || 'Gestionale personalizzato')}</h1><p class="muted">${esc(project.company.description || '')}</p><h2>Investimento</h2><div class="row"><span>Pacchetto software</span><strong>${money(price.base)}</strong></div>${price.implementation ? `<div class="row"><span>Implementazione assistita (opzionale)</span><strong>${money(price.implementation)}</strong></div>` : ''}<div class="row"><span>Moduli e personalizzazioni</span><strong>${money(price.extras)}</strong></div><div class="total"><span>Totale una tantum</span><strong>${money(price.total)}</strong><small>Nessun canone Easy Come.</small></div><h2>Funzioni incluse</h2><div class="modules">${modules.map((module) => `<p>✓ ${esc(module)}</p>`).join('')}</div>${project.delivery.notes ? `<h2>Note</h2><p>${esc(project.delivery.notes)}</p>` : ''}<p class="footer">Anteprima approvata. L’implementazione è inclusa soltanto quando compare tra le voci dell’offerta.</p></div></body></html>`);
    popup.document.close(); popup.focus(); setTimeout(() => popup.print(), 300);
  }

  function fieldTypeLabel(type) { return { text:'Testo breve', longtext:'Note lunghe', number:'Numero', currency:'Importo', date:'Data', datetime:'Data e ora', email:'Email', phone:'Telefono', boolean:'Sì / No', select:'Elenco di scelte' }[type] || type; }
  function triggerLabel(id) { return G.AUTOMATION_TRIGGERS.find((item) => item.id === id)?.label || id; }
  function actionLabel(id) { return G.AUTOMATION_ACTIONS.find((item) => item.id === id)?.label || id; }
  function ruleSummary(rule) { if (rule.type === 'date_range') return `${rule.from || '?'} → ${rule.to || '?'} · × ${rule.multiplier || 1}`; if (rule.type === 'weekday_multiplier') return `Giorni ${rule.days?.join(', ') || '?'} · × ${rule.multiplier || 1}`; if (rule.type === 'duration_discount') return `Da ${rule.min || 1} unità · -${rule.percent || 0}%`; if (rule.type === 'promo') return `Codice ${rule.code || '?'} · -${rule.percent || 0}%`; return JSON.stringify(rule); }

  $('#previous').onclick = () => { if (currentStep > 0) currentStep -= 1; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  $('#next').onclick = () => { currentStep = currentStep === steps.length - 1 ? 0 : currentStep + 1; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  $('#globalPreview').onclick = openPreviewOverlay;
  $('#globalPreviewMobile').onclick = openPreviewOverlay;

  window.addEventListener('easycome:account-ready', async (event) => {
    const user = event.detail?.user;
    if (user?.email && !project.company.email) project.company.email = user.email;
    const saved = await window.EasyComeAccount?.loadLatestProject?.();
    if (saved) project = normalizeProject(saved);
    saveDraft();
    render();
  }, { once: true });

  render();
}());
