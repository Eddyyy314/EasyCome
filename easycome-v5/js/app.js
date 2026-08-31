(function () {
  'use strict';

  const G = window.ECGenerator;
  const SALES = window.EASYCOME_SALES || { mode: 'customer', generationSeconds: 0, checkoutEndpoint: '/api/create-checkout-session', paymentUrl: '', supportEmail: '', termsUrl: '/termini.html', privacyUrl: '/privacy.html', internalDownloadEnabled: false };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[match]));
  const money = (value) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));
  const URL_PARAMS = new URLSearchParams(location.search);
  const PROSPECT_DEMO_SLUG = URL_PARAMS.get('demo') || '';
  const PROSPECT_MODE = Boolean(PROSPECT_DEMO_SLUG && URL_PARAMS.get('source') === 'prospect');

  const steps = [
    { id: 'idea', label: 'Struttura', subtitle: 'Nome, tipologia e dimensione' },
    { id: 'modules', label: 'Funzioni', subtitle: 'Cosa vuoi automatizzare' },
    { id: 'structure', label: 'Alloggi', subtitle: 'Camere, appartamenti e capacità' },
    { id: 'logic', label: 'Tariffe', subtitle: 'Prezzi, caparra e automazioni' },
    { id: 'design', label: 'Sito', subtitle: 'Identità e stile della struttura' },
    { id: 'preview', label: 'Anteprima', subtitle: 'Sito + gestionale + controllo' },
    { id: 'delivery', label: 'Attivazione', subtitle: 'Riepilogo e acquisto una tantum' },
  ];

  const TEMPLATES = [
    { id: 'hospitality', icon: '⌂', name: 'Easy Come Hospitality', description: 'Sistema completo per B&B, affittacamere, case vacanza e piccoli property manager.', industry: 'Ospitalità indipendente', modules: ['hospitality_core','direct_booking','website','reports','easycome_hub','dynamic_pricing','automations'], pricingMode: 'dynamic' },
  ];

  const HOSPITALITY_MODULES = new Set(['hospitality_core','direct_booking','website','channel_sync','guest_comms','self_checkin','tourist_tax','dynamic_pricing','expenses','reports','finance','audit','brain','automations','multiuser','mobile_app','branding','easycome_hub']);

  const LAYOUT_PRESETS = [
    { id:'studio', name:'Studio', description:'Chiaro, ordinato e autorevole', primary:'#275dff', accent:'#17213b', surface:'#f7f8fb', sample:['#17213b','#275dff','#ffffff'] },
    { id:'atelier', name:'Atelier', description:'Editoriale, caldo e premium', primary:'#e85d36', accent:'#241c18', surface:'#f4eee5', sample:['#241c18','#e85d36','#f4eee5'] },
    { id:'olive', name:'Olive', description:'Naturale, sobrio e accogliente', primary:'#51745b', accent:'#183126', surface:'#f1f3ed', sample:['#183126','#51745b','#f1f3ed'] },
    { id:'cobalt', name:'Cobalt', description:'Tecnologico ma umano', primary:'#2f65e8', accent:'#101c36', surface:'#eef3fb', sample:['#101c36','#2f65e8','#eef3fb'] },
    { id:'graphite', name:'Graphite', description:'Contrasto deciso e operativo', primary:'#ff6b35', accent:'#151515', surface:'#f3f3f0', sample:['#151515','#ff6b35','#f3f3f0'] },
    { id:'calma', name:'Calma', description:'Morbido, elegante e discreto', primary:'#8b6f9e', accent:'#30263a', surface:'#f5f1f6', sample:['#30263a','#8b6f9e','#f5f1f6'] },
  ];

  const SECTION_PRESETS = [
    { id:'rooms', icon:'⌂', label:'Alloggi', singular:'Alloggio', fields:[['Nome','text',true],['Tipologia','select'],['Capacità','number'],['Prezzo base','currency'],['Stato camera','select'],['Note','longtext']] },
    { id:'housekeeping', icon:'✦', label:'Pulizie', singular:'Pulizia', fields:[['Camera / alloggio','text',true],['Data','date',true],['Stato','select'],['Responsabile','text'],['Priorità','select'],['Note','longtext']] },
    { id:'extras', icon:'＋', label:'Extra soggiorno', singular:'Extra', fields:[['Nome extra','text',true],['Prezzo','currency'],['Unità','select'],['Attivo','boolean'],['Note','longtext']] },
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

  let activeUserId = '';
  let project = normalizeProject(G.defaultProject());
  project.templateId='hospitality';
  let currentStep = 0;
  let customFieldDraft = [];
  let sectionDraft = { label: '', singular: '' };
  let sectionComposerOpen = false;
  let selectedSectionPresetId = '';
  let editingSectionKey = '';
  let automationDraft = { name: '', trigger: 'record_created', entity: '', action: 'notify', target: '', message: '', enabled: true };
  let previewMode = 'dashboard';
  let previewDevice = 'desktop';
  let previewEntityKey = '';
  let previewHubTab = 'home';

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
    p.hospitality = { type:'B&B', city:'', address:'', unitCount:4, maxGuests:10, checkinFrom:'15:00', checkoutBy:'10:30', directBooking:true, paymentsEnabled:true, depositMode:'percentage', cancellationPolicy:'Flessibile', airbnbIcal:'', bookingIcal:'', connectorMode:'overlay', unitTypes:[{name:'Camera Matrimoniale',count:2,capacity:2,basePrice:95},{name:'Camera Deluxe',count:1,capacity:2,basePrice:125},{name:'Family',count:1,capacity:4,basePrice:155}], ...(p.hospitality||{}) };
    p.templateId = 'hospitality';
    p.pricing.mode = p.pricing.mode || (p.pricing.enabled ? 'dynamic' : 'none');
    p.delivery.previewApproved = Boolean(p.delivery.previewApproved);
    p.delivery.implementationSelected = true;
    p.delivery.managedServiceSelected = false;
    p.delivery.implementationPrice = 150;
    p.delivery.managedServicePrice = 0;
    p.templateId = p.templateId || 'custom';
    return p;
  }

  let cloudSaveTimer;
  const legacyDraftKey = 'easycome-generator-pro-draft';
  const draftKey = (userId = activeUserId) => userId ? `easycome-generator-pro-draft:${userId}` : '';
  function saveDraft() {
    if (!activeUserId) return;
    try { localStorage.setItem(draftKey(), JSON.stringify(project)); } catch (_) {}
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => window.EasyComeAccount?.saveProject?.(project), 700);
  }
  function loadDraft(userId) {
    if (!userId) return null;
    try { return JSON.parse(localStorage.getItem(draftKey(userId)) || 'null'); } catch (_) { return null; }
  }
  function legacyDraftForUser(user) {
    try {
      const value = JSON.parse(localStorage.getItem(legacyDraftKey) || 'null');
      const draftEmail = String(value?.company?.email || '').trim().toLowerCase();
      const userEmail = String(user?.email || '').trim().toLowerCase();
      if (value && draftEmail && userEmail && draftEmail === userEmail) {
        localStorage.removeItem(legacyDraftKey);
        return value;
      }
    } catch (_) {}
    return null;
  }
  function toast(message) { const node = document.createElement('div'); node.className = 'toast'; node.textContent = message; document.body.appendChild(node); setTimeout(() => node.remove(), 2500); }
  function initials() { return (project.company.name || 'EC').split(/\s+/).slice(0, 2).map((item) => item[0]).join('').toUpperCase(); }
  function logoMarkup() { return project.company.logoData ? `<img src="${project.company.logoData}" alt="">` : esc(initials()); }

  function syncEffects() {
    ['hospitality_core','direct_booking','website','reports','easycome_hub'].forEach(id=>{if(!project.modules.includes(id))project.modules.push(id)});
    project.modules = project.modules.filter(id=>HOSPITALITY_MODULES.has(id));
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

  function prospectBanner() {
    if (!PROSPECT_MODE || !project.demoSource?.generatedForDemo) return '';
    const quoted = Number(project.demoSource?.quotedPrice || G.calculatePrice(project).total || 99);
    return `<div class="prospect-prefill-banner"><span>DEMO GIÀ CARICATA</span><div><strong>Stai personalizzando la configurazione vista nella demo.</strong><small>Le funzioni selezionate sono già quelle dell’anteprima. Puoi toglierle, aggiungerne altre e il prezzo si aggiorna automaticamente.</small></div><b>${money(quoted)}</b></div>`;
  }

  function renderPanel() {
    const functions = [ideaStep, modulesStep, structureStep, logicStep, designStep, previewStep, deliveryStep];
    $('#panel').innerHTML = prospectBanner() + functions[currentStep]();
    bindPanel();
  }

  function ideaStep() {
    const c = project.company, h = project.hospitality || {};
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 1</span><h1>Partiamo dalla tua struttura.</h1><p>Easy Come Hospitality non ti chiede di progettare un software. Ci dici come lavori e prepara il sistema intorno alla struttura.</p></div><div class="heading-badge">Sito + booking + gestionale</div></div>
      <section class="hospitality-intro"><div><b>01</b><strong>Vendita diretta</strong><small>Il sito riceve prenotazioni e pagamenti.</small></div><div><b>02</b><strong>Operatività</strong><small>Calendario, ospiti, camere, pulizie e incassi.</small></div><div><b>03</b><strong>Controllo</strong><small>Easy Come segnala ciò che non torna.</small></div><div><b>04</b><strong>Numeri</strong><small>Occupazione, ADR, ricavi e margini.</small></div></section>
      <div class="form-grid two hospitality-form">
        <label class="field"><span>Nome della struttura *</span><input id="companyName" value="${esc(c.name)}" placeholder="Es. Dimora Aurora" autofocus></label>
        <label class="field"><span>Tipologia</span><select id="hospitalityType">${['B&B','Affittacamere','Casa vacanza','Appartamenti','Guest house','Piccolo residence','Property manager'].map(v=>`<option ${h.type===v?'selected':''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Città / destinazione</span><input id="hospitalityCity" value="${esc(h.city||'')}" placeholder="Es. Roma"></label>
        <label class="field"><span>Indirizzo</span><input id="hospitalityAddress" value="${esc(h.address||'')}" placeholder="Via …"></label>
        <label class="field"><span>Numero camere / alloggi</span><input id="unitCount" type="number" min="1" max="50" value="${Number(h.unitCount||4)}"></label>
        <label class="field"><span>Capienza massima ospiti</span><input id="maxGuests" type="number" min="1" max="200" value="${Number(h.maxGuests||10)}"></label>
        <label class="field"><span>Email titolare *</span><input id="companyEmail" type="email" value="${esc(c.email)}" placeholder="titolare@struttura.it"></label>
        <label class="field"><span>Telefono</span><input id="companyPhone" value="${esc(c.phone)}" placeholder="+39 …"></label>
        <label class="field full"><span>Come lavori oggi?</span><textarea id="description" placeholder="Es. Prenotazioni da Booking e Airbnb, richieste dirette su WhatsApp, pulizie gestite a voce…">${esc(c.description)}</textarea><small>Serve per personalizzare flussi, onboarding e documentazione.</small></label>
        <input id="industry" type="hidden" value="Ospitalità indipendente">
      </div>
      <div class="info-card"><strong>Obiettivo</strong><p>Una prenotazione nasce una volta e alimenta disponibilità, ospite, pagamento, check-in, pulizia, controllo e performance. Nessuna ricopiatura tra sistemi.</p></div>`;
  }

  function modulesStep() {
    const visible = G.MODULES.filter((item)=>HOSPITALITY_MODULES.has(item.id));
    const categories = [...new Set(visible.map((item) => item.category))];
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 2</span><h1>Cosa vuoi far fare a Easy Come?</h1><p>Il cuore Hospitality è già incluso. Qui aggiungi soltanto ciò che rende la gestione più automatica o più intelligente.</p></div><div class="heading-badge">Core incluso</div></div>
      <div class="saving-note">✓ Ospiti, prenotazioni, alloggi, pagamenti, pulizie, sito, booking diretto, dashboard e Hub sono la base del prodotto.</div>
      ${categories.map((category) => `<section class="module-section"><div class="section-title"><h2>${esc(category)}</h2><span>${visible.filter((item) => item.category === category).length}</span></div><div class="module-grid">${visible.filter((item) => item.category === category).map(moduleCard).join('')}</div></section>`).join('')}`;
  }

  function moduleCard(module) {
    const selected = project.modules.includes(module.id);
    return `<button class="module-card ${selected ? 'selected' : ''} ${module.included ? 'included' : ''}" data-module="${module.id}" ${module.included ? 'disabled' : ''}><span class="module-check">${selected ? '✓' : '+'}</span><span class="module-copy"><strong>${esc(module.name)}</strong><small>${esc(module.description)}</small></span><span class="module-price">${module.included ? 'Incluso' : '+' + money(module.price)}</span></button>`;
  }

  function structureStep() {
    const h=project.hospitality||{}, units=Array.isArray(h.unitTypes)?h.unitTypes:[];
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 3</span><h1>Come è fatta la struttura?</h1><p>Non devi creare tabelle. Definisci le tipologie che vendi: Easy Come userà questi dati nel sito, nel booking e nel calendario.</p></div><div class="heading-badge">${Number(h.unitCount||0)} unità</div></div>
      <section class="unit-builder"><header><div><span>CAMERE / ALLOGGI</span><h2>Le unità che il cliente può prenotare</h2></div><button id="addUnitType" class="btn btn-secondary">+ Tipologia</button></header>
      <div class="unit-type-grid">${units.map((u,i)=>`<article class="unit-type"><div class="unit-number">${String(i+1).padStart(2,'0')}</div><label><span>Nome</span><input data-unit-index="${i}" data-unit-key="name" value="${esc(u.name||'')}"></label><div class="unit-row"><label><span>Quante</span><input type="number" min="1" data-unit-index="${i}" data-unit-key="count" value="${Number(u.count||1)}"></label><label><span>Ospiti</span><input type="number" min="1" data-unit-index="${i}" data-unit-key="capacity" value="${Number(u.capacity||2)}"></label><label><span>Da € / notte</span><input type="number" min="0" data-unit-index="${i}" data-unit-key="basePrice" value="${Number(u.basePrice||0)}"></label></div><button class="remove-unit-type" data-unit-remove="${i}">Rimuovi</button></article>`).join('')}</div></section>
      <section class="stay-rules"><div class="section-title"><div><h2>Regole operative</h2><p>Servono al booking e alle attività del giorno.</p></div></div><div class="form-grid two compact"><label class="field"><span>Check-in dalle</span><input id="checkinFrom" type="time" value="${esc(h.checkinFrom||'15:00')}"></label><label class="field"><span>Check-out entro</span><input id="checkoutBy" type="time" value="${esc(h.checkoutBy||'10:30')}"></label><label class="field"><span>Politica cancellazione</span><select id="cancellationPolicy">${['Flessibile','Moderata','Rigida','Personalizzata'].map(v=>`<option ${h.cancellationPolicy===v?'selected':''}>${v}</option>`).join('')}</select></label><label class="field"><span>Caparra standard %</span><input id="hospitalityDeposit" type="number" min="0" max="100" value="${Number(project.pricing.depositPercent||30)}"></label></div></section>`;
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
      <div class="rule-guide"><strong>Variazioni</strong><p>Es. 1–20 agosto +20% · da 7 notti −10%.</p></div>
      <div class="pricing-rules">${(p.rules||[]).map((rule,index)=>`<article class="pricing-rule"><div><strong>${esc(rule.name||rule.type)}</strong><small>${esc(ruleSummary(rule))}</small></div><button class="icon-button remove-pricing-rule" data-index="${index}">×</button></article>`).join('')||'<div class="empty-mini">Nessuna variazione: verrà usato il prezzo di partenza.</div>'}</div>
      <div class="rule-adder guided"><label><span>Quando</span><select id="pricingRuleType"><option value="date_range">Periodo o stagione</option><option value="weekday_multiplier">Giorno della settimana</option><option value="duration_discount">Sconto per durata</option><option value="promo">Codice promozionale</option></select></label><label><span>Nome</span><input id="pricingRuleName" placeholder="Alta stagione"></label><label><span>Variazione</span><input id="pricingRuleValue" placeholder="1.20 oppure 10"></label><label><span>Dettaglio</span><input id="pricingRuleExtra" placeholder="1–20 agosto, 7 notti…"></label><button id="addPricingRule" class="btn btn-secondary">+ Aggiungi</button></div></div>`;
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
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 6</span><h1>Guarda il gestionale prima di acquistarlo.</h1><p>Passa tra dashboard, lavoro, calendario e Hub. Desktop e mobile sono navigabili.</p></div><div class="heading-badge ${canApprove?'success':''}">${canApprove?'Anteprima pronta':`${previewAudit.blockers.length} controlli da risolvere`}</div></div>${previewStage()}
      <section class="audit-panel"><div class="audit-score"><strong>${previewAudit.score}</strong><span>/100</span><small>${esc(previewAudit.grade)}</small></div><div><h3>Controllo prima dell’acquisto</h3><div class="audit-list">${previewAudit.blockers.map((item)=>`<p class="blocker">✕ ${esc(item)}</p>`).join('')}${previewAudit.warnings.slice(0,4).map((item)=>`<p class="warning">! ${esc(item)}</p>`).join('')}${!previewAudit.blockers.length?'<p class="passed">✓ Il progetto è coerente e può essere acquistato.</p>':''}</div></div></section>
      <div class="approval-card"><label class="${canApprove?'':'disabled'}"><input id="approvePreview" type="checkbox" ${project.delivery.previewApproved?'checked':''} ${canApprove?'':'disabled'}><span><strong>Ho provato il gestionale e la struttura mi rappresenta</strong><small>${canApprove?'Potrai ancora cambiare il progetto prima del pagamento.':'Risolvi prima i controlli indicati sopra.'}</small></span></label><button id="fullscreenPreview" class="btn btn-preview">Apri a schermo intero</button></div>`;
  }

  function previewStage() {
    return `<div class="preview-stage"><div class="preview-toolbar"><div class="preview-toolbar-left"><span class="preview-caption">ANTEPRIMA</span><button class="preview-mode ${previewMode==='dashboard'?'active':''}" data-preview-mode="dashboard">Dashboard</button><button class="preview-mode ${previewMode==='workspace'?'active':''}" data-preview-mode="workspace">Operatività</button><button class="preview-mode ${previewMode==='calendar'?'active':''}" data-preview-mode="calendar">Calendario</button><button class="preview-mode ${previewMode==='hub'?'active':''}" data-preview-mode="hub">Easy Come Hub</button></div><div class="preview-toolbar-right"><button class="device-button ${previewDevice==='desktop'?'active':''}" data-device="desktop">Desktop</button><button class="device-button ${previewDevice==='mobile'?'active':''}" data-device="mobile">Mobile</button></div></div><div class="preview-viewport"><div class="preview-window ${previewDevice==='mobile'?'mobile':''}" id="previewWindow">${renderPreviewContent()}</div></div></div>`;
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
    return `<div class="preview-app layout-${esc(project.company.layout||project.company.style||'studio')}" style="--pv-primary:${esc(project.company.primaryColor)};--pv-accent:${esc(project.company.accentColor)};--pv-surface:${esc(project.company.surfaceColor||'#f7f8fb')}"><div class="pv-mobile-topbar"><span class="pv-mobile-brand">${logoMarkup()}<b>${esc(brand)}</b></span><button type="button" data-preview-mode="hub">EC Hub</button></div><aside class="pv-sidebar"><div class="pv-logo"><span class="pv-logo-mark">${logoMarkup()}</span><div><strong>${esc(brand)}</strong><small>Hospitality OS</small></div></div><nav class="pv-nav"><button class="${mode==='dashboard'?'active':''}" data-pv-dashboard>⌂ Panoramica</button>${entities.slice(0,9).map((entity)=>`<button class="${mode==='workspace'&&current?.key===entity.key?'active':''}" data-pv-entity="${entity.key}">${esc(entity.label.slice(0,1))} &nbsp;${esc(entity.label)}</button>`).join('')}</nav><div class="pv-sidebar-system"><button data-preview-mode="hub">EC &nbsp;Easy Come Hub</button><span>Sito, booking e Hub collegati</span></div></aside><main class="pv-main">${body}</main></div>`;
  }

  function dashboardPreviewBody(entities) {
    const brand=project.company.name||'La tua struttura', h=project.hospitality||{};
    return `<div class="pv-top"><div><h2>Oggi</h2><p>${esc(h.city||'La tua destinazione')} · reception e operazioni</p></div><div class="pv-user"><span>${esc(initials())}</span><div><b>${esc(project.company.email||'titolare@struttura.it')}</b><small>Easy Come Hospitality</small></div></div></div><section class="pv-hero"><span>CENTRO OPERATIVO</span><h3>Buongiorno, ${esc(brand.split(' ')[0])}.</h3><p>Arrivi, partenze, camere, pagamenti e priorità nello stesso posto.</p><div class="pv-hero-actions"><b>+ Nuova prenotazione</b><i>Apri calendario</i></div></section><section class="pv-stats"><article class="pv-stat"><span>Arrivi oggi</span><strong>4</strong><small>2 check-in completati</small></article><article class="pv-stat"><span>Partenze</span><strong>3</strong><small>2 camere da pulire</small></article><article class="pv-stat"><span>Occupazione</span><strong>78%</strong><small>${Number(h.unitCount||4)} unità totali</small></article><article class="pv-stat"><span>Da incassare</span><strong>€ 640</strong><small>3 saldi aperti</small></article></section><section class="pv-grid"><article class="pv-card"><div class="pv-card-title"><h4>Prossimi arrivi</h4><span>Oggi</span></div><div class="pv-list">${[['14:30','Giulia Romano','Camera Deluxe'],['16:00','Marco De Luca','Matrimoniale'],['17:30','Anna Klein','Family']].map(x=>`<div><b>${x[0]}</b><span><strong>${x[1]}</strong><small>${x[2]} · check-in da completare</small></span></div>`).join('')}</div></article><article class="pv-card"><div class="pv-card-title"><h4>Da non dimenticare</h4><span>Controllo</span></div><div class="pv-list"><div><b>!</b><span><strong>Saldo €220</strong><small>Prenotazione EC-184</small></span></div><div><b>!</b><span><strong>Camera 3 da pulire</strong><small>Arrivo alle 16:00</small></span></div><div><b>✓</b><span><strong>Nessuna doppia prenotazione</strong><small>Calendario controllato</small></span></div></div></article></section><section class="pv-bottom-grid"><article><span>DIRETTO</span><strong>€ 3.480 questo mese</strong><small>Prenotazioni dal sito collegato</small></article><article><span>ADR</span><strong>€ 118</strong><small>Tariffa media</small></article><article><span>EASY COME HUB</span><strong>Il tuo sistema</strong><small>Manuale e progetto acquistato</small></article></section>`;
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
    const unitNames=(project.hospitality?.unitTypes||[]).flatMap(u=>Array.from({length:Math.max(1,Math.min(Number(u.count||1),4))},(_,i)=>`${u.name} ${i+1}`)).slice(0,6); const resources=unitNames.length?unitNames:['Camera 1','Camera 2','Camera 3','Family 1'];
    const days = Array.from({length:14},(_,index)=>index+3);
    return `<div class="pv-top"><div><h2>Calendario unico</h2><p>Sito diretto, Airbnb, Booking.com e inserimenti manuali nello stesso quadro</p></div><div class="pv-calendar-actions"><span>‹ Settembre 2026 ›</span><b>Oggi</b></div></div><section class="pv-calendar-kpis"><div><span>Occupazione</span><strong>78%</strong></div><div><span>Dirette</span><strong>11</strong></div><div><span>OTA</span><strong>17</strong></div><div><span>Conflitti</span><strong>0</strong></div></section><article class="pv-availability"><div class="pv-av-row pv-av-head"><b>Alloggio</b>${days.map((day)=>`<span>${day}<small>${['L','M','M','G','V','S','D'][(day-3)%7]}</small></span>`).join('')}</div>${resources.map((resource,rowIndex)=>`<div class="pv-av-row"><b>${esc(resource)}<small>${rowIndex%2?'Diretto + OTA':'Disponibilità live'}</small></b>${days.map((day,colIndex)=>{const busy=(rowIndex*3+colIndex)%5===0||(rowIndex+colIndex)%7===0;const request=(rowIndex+colIndex)%9===0;return `<span class="${busy?'busy':request?'request':'free'}">${busy?'●':request?'◐':'✓'}</span>`}).join('')}</div>`).join('')}<footer><i class="free">✓ Libero</i><i class="busy">● Prenotato</i><i class="request">◐ Opzione</i></footer></article><section class="pv-calendar-bottom"><article><span>PROSSIMO ARRIVO</span><strong>Giulia Romano · 14:30</strong><small>Camera Deluxe · sito diretto</small></article><article><span>CONTROLLO</span><strong>Nessuna sovrapposizione</strong><small>Disponibilità coerente tra canali</small></article></section>`;
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
    const brand = project.company.name || 'La tua azienda';
    const tabs = [
      ['home','Panoramica'],['manual','Manuale'],['support','Assistenza'],['features','Nuove funzioni'],['onboarding','Avvio']
    ];
    const labels = Object.fromEntries(tabs);
    const main = hubPreviewView(brand);
    return `<div class="pv-hub"><div class="pv-hub-mobilebar"><span><b>EC</b><strong>${esc(labels[previewHubTab]||'Easy Come Hub')}</strong></span><button type="button" data-hub-tab="home">Menu</button></div><aside><div class="pv-hub-brand"><b>EC</b><span><strong>Easy Come Hub</strong><small>Spazio riservato</small></span></div><nav>${tabs.map(([id,label])=>`<button type="button" data-hub-tab="${id}" class="${previewHubTab===id?'active':''}">${label}</button>`).join('')}</nav><footer><span>Connesso come</span><strong>${esc(project.company.email||'titolare@azienda.it')}</strong></footer></aside><main>${main}</main></div>`;
  }

  function hubPreviewView(brand) {
    const header = (title, subtitle='') => `<header class="pv-hub-head"><div><span>IL TUO SISTEMA</span><h2>${esc(title)}</h2>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div><i>v1.0</i></header>`;
    if (previewHubTab === 'manual') return `${header('Manuale','Guida del tuo gestionale.')}<section class="pv-hub-manual"><article><span>GUIDA RAPIDA</span><h3>Trova subito quello che ti serve.</h3><div>${['Primo accesso','Clienti e dati','Calendario','Backup e sicurezza'].map((item,index)=>`<button type="button"><b>${String(index+1).padStart(2,'0')}</b>${item}</button>`).join('')}</div></article><aside><b>PDF</b><strong>Manuale operativo</strong><small>Incluso nel pacchetto</small></aside></section>`;
    if (previewHubTab === 'support') return `${header('Assistenza','Una richiesta, uno storico.')}<section class="pv-hub-support"><div class="pv-hub-formfake"><label>Tipo<span>Problema tecnico⌄</span></label><label>Oggetto<span>Collegamento calendario</span></label><label class="wide">Descrizione<span>Scrivi cosa non sta funzionando…</span></label><button type="button">Invia richiesta</button></div><article><h3>Richieste recenti</h3><div><b>Report mensile</b><small>In valutazione</small></div><div><b>Calendario</b><small>Risposta inviata</small></div></article></section>`;
    if (previewHubTab === 'features') return `${header('Nuove funzioni','Fai evolvere il sistema.')}<section class="pv-hub-featureview"><article><span>＋</span><h3>Chiedi una funzione</h3><p>Descrivi il risultato. Alla parte tecnica pensiamo noi.</p><button type="button">Nuova richiesta</button></article><article><span>◷</span><h3>Parliamone insieme</h3><p>Per modifiche più ampie puoi chiedere un incontro.</p><button type="button">Richiedi incontro</button></article></section>`;
    if (previewHubTab === 'onboarding') return `${header('Avvio','I passaggi essenziali.')}<section class="pv-hub-checklist">${['Accesso verificato','Prime anagrafiche inserite','Backup iniziale','Manuale condiviso'].map((item,index)=>`<article><b>${index<2?'✓':String(index+1).padStart(2,'0')}</b><span><strong>${item}</strong><small>${index<2?'Completato':'Da completare'}</small></span></article>`).join('')}</section>`;
    return `${header(brand,'Manuale, assistenza e richieste nello stesso spazio.')}<section class="pv-hub-progress"><div><span>AVVIO</span><strong>4 di 6 passaggi completati</strong><i><b style="width:67%"></b></i></div><button type="button" data-hub-tab="onboarding">Continua</button></section><section class="pv-hub-actions"><button type="button" data-hub-tab="manual"><b>?</b><span><strong>Manuale</strong><small>Guida personalizzata</small></span></button><button type="button" data-hub-tab="features"><b>＋</b><span><strong>Nuova funzione</strong><small>Richiedi una modifica</small></span></button><button type="button" data-hub-tab="support"><b>!</b><span><strong>Assistenza</strong><small>Apri una richiesta</small></span></button><button type="button" data-hub-tab="onboarding"><b>→</b><span><strong>Avvio</strong><small>Completa il setup</small></span></button></section><section class="pv-hub-grid"><article><header><h3>Richieste</h3><button type="button" data-hub-tab="support">Vedi tutte</button></header><div><b>Report mensile</b><small>In valutazione · ieri</small></div><div><b>Calendario</b><small>Risposta inviata · 3 giorni fa</small></div></article><article><header><h3>Nel sistema</h3></header><div class="pv-hub-pills">${project.modules.filter(id=>id!=='easycome_hub').slice(0,6).map((id)=>`<span>${esc(G.MODULES.find((item)=>item.id===id)?.name||id)}</span>`).join('')}</div></article></section>`;
  }

  function deliveryStep() {
    const price = G.calculatePrice(project), entities = G.buildEntities(project), audit = G.auditProject(project), ready = audit.ready;
    project.delivery.implementationSelected = true;
    project.delivery.managedServiceSelected = false;
    project.delivery.implementationPrice = 150;
    project.delivery.managedServicePrice = 0;
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 7</span><h1>Hai costruito il sistema della tua struttura.</h1><p>Qui non scegli servizi tecnici separati. Sito, booking engine e gestionale vengono acquistati come un unico pacchetto e l’implementazione Easy Come da €150 è obbligatoria e inclusa nel totale.</p></div><div class="heading-badge ${ready ? 'success' : ''}">${audit.score}/100 · ${esc(audit.grade)}</div></div>
      <div class="quality-grid"><article class="quality-card"><span>FILE CONSEGNATI</span><strong>45+</strong></article><article class="quality-card"><span>SEZIONI</span><strong>${entities.length}</strong></article><article class="quality-card"><span>VISTE OPERATIVE</span><strong>6</strong></article><article class="quality-card"><span>FOGLI EXCEL</span><strong>${Math.max(2, entities.length)}</strong></article></div>
      <section class="audit-panel delivery-audit"><div class="audit-score"><strong>${audit.score}</strong><span>/100</span><small>${esc(audit.grade)}</small></div><div><h3>Esito del controllo automatico</h3><div class="audit-list">${audit.blockers.map((item) => `<p class="blocker">✕ ${esc(item)}</p>`).join('')}${audit.warnings.slice(0, 5).map((item) => `<p class="warning">! ${esc(item)}</p>`).join('')}${audit.strengths.slice(0, 5).map((item) => `<p class="passed">✓ ${esc(item)}</p>`).join('')}</div></div></section>
      <div class="delivery-grid"><section class="package-card"><div class="package-icon">PRO</div><div><h2>${esc(project.company.name || 'Gestionale personalizzato')}</h2><p>Il pacchetto software che hai configurato, completo dell’implementazione Easy Come obbligatoria.</p></div><div class="package-files">${['Dashboard con KPI e indicatori', 'Foglio operativo modificabile tipo Excel', 'Calendario disponibilità e risorse', 'Workbook .xlsx già strutturato', 'Tabella, kanban, agenda e schede', 'Import/export, filtri e azioni massive', 'Preventivi, ordini e documenti stampabili', 'Ruoli, audit log e backup', 'Easy Come Hub: guida, assistenza e richieste', 'Database Supabase e automazioni', 'Manuale operativo', project.modules.includes('finance') ? 'Easy Come Finance' : 'Finance selezionabile', project.modules.includes('brain') ? 'Easy Come Brain' : 'Brain selezionabile', project.modules.includes('audit') ? 'Audit & Controlli' : 'Audit selezionabile'].map((item) => `<span>✓ ${item}</span>`).join('')}</div><button id="reviewPreview" class="btn btn-secondary" style="grid-column:1/-1">Rivedi anteprima</button><button id="downloadPackage" class="btn btn-primary download-button" ${ready ? '' : 'disabled'}>${SALES.mode === 'customer' ? 'Prepara il progetto e continua' : 'Prepara e scarica il pacchetto'}</button>${ready ? '' : `<p class="validation-note">Il pacchetto non è ancora consegnabile: risolvi i controlli rossi e approva l’anteprima.</p>`}</section>
      <section class="quote-card"><span class="eyebrow">Investimento trasparente</span><div class="quote-lines"><div><span>Pacchetto software</span><strong>${money(price.base)}</strong></div><div><span>Moduli scelti</span><strong>${money(price.modules)}</strong></div><div><span>Sezioni e campi su misura</span><strong>${money(price.customEntities + price.customFields)}</strong></div><div><span>Automazioni</span><strong>${money(price.automations)}</strong></div><div><span>Regole prezzo extra</span><strong>${money(price.pricingRules)}</strong></div>${price.bundleDiscount ? `<div><span>Sconto bundle funzioni</span><strong>- ${money(price.bundleDiscount)}</strong></div>` : ''}<div><span>Implementazione Easy Come · obbligatoria</span><strong>${money(price.implementation)}</strong></div></div>
        <div class="quote-total"><span>Totale pacchetto</span><strong>${money(price.total)}</strong><small>Pagamento unico. Nessun canone Easy Come.</small></div><label class="field"><span>Note commerciali</span><textarea id="deliveryNotes" placeholder="Esigenze particolari, migrazione dati, formazione…">${esc(project.delivery.notes)}</textarea></label><button id="printQuote" class="btn btn-secondary" style="width:100%">Stampa offerta professionale</button></section></div>
      <div class="truth-card"><strong>Niente opzioni tecniche nascoste.</strong><p>Il software ha un prezzo una tantum variabile in base a ciò che costruisci. L’implementazione costa €150 ed è obbligatoria. Il totale mostrato è il prezzo del pacchetto Easy Come acquistato.</p></div>`;
  }
  function qualityScore() {
    return G.auditProject(project).score;
  }
  function renderSummary() {
    const price = G.calculatePrice(project), entities = G.buildEntities(project), audit = G.auditProject(project);
    $('#summary').innerHTML = `<div class="summary-brand"><span>${logoMarkup()}</span><div><strong>${esc(project.company.name || 'Nuovo gestionale')}</strong><small>${esc(project.hospitality?.type || project.company.industry || 'Hospitality')}</small></div></div><div class="summary-metrics"><div><span>Moduli</span><strong>${project.modules.length}</strong></div><div><span>Sezioni</span><strong>${entities.length}</strong></div><div><span>Qualità</span><strong>${audit.score}</strong></div></div><div class="summary-quality ${audit.ready ? 'ready' : ''}"><span>${audit.ready ? 'PRONTO ALLA CONSEGNA' : 'CONTROLLO IN CORSO'}</span><strong>${esc(audit.grade)}</strong><small>${audit.blockers.length ? `${audit.blockers.length} elementi bloccanti` : 'Nessun blocco rilevato'}</small></div><div class="summary-capabilities"><span>Sito</span><span>Booking</span><span>PMS</span><span>Controllo</span></div><div class="summary-list"><div><span>Software base</span><strong>${money(price.base)}</strong></div><div><span>Extra scelti</span><strong>${money(price.extras)}</strong></div><div><span>Implementazione obbligatoria</span><strong>${money(price.implementation)}</strong></div></div><div class="summary-total"><span>Totale una tantum</span><strong>${money(price.total)}</strong><small>Pagamento unico · implementazione inclusa nel totale</small></div><button id="summaryPreview" class="btn btn-preview summary-cta">Prova l’anteprima</button><button id="resetProject" class="btn btn-ghost">Ricomincia da zero</button>`;
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
    const bind = (id, setter, eventName='input') => { const input = $('#' + id); if(!input)return; input[eventName==='change'?'onchange':'oninput'] = () => { setter(input.value); project.delivery.previewApproved = false; saveDraft(); renderSummary(); }; };
    bind('companyName', (value) => { project.company.name = value; project.company.slug = G.slugify(value); });
    bind('industry', (value) => project.company.industry = value);
    bind('description', (value) => project.company.description = value);
    bind('companyEmail', (value) => project.company.email = value);
    bind('companyPhone', (value) => project.company.phone = value);
    bind('hospitalityType', v=>project.hospitality.type=v,'change');
    bind('hospitalityCity', v=>project.hospitality.city=v);
    bind('hospitalityAddress', v=>project.hospitality.address=v);
    bind('unitCount', v=>project.hospitality.unitCount=Math.max(1,Number(v||1)));
    bind('maxGuests', v=>project.hospitality.maxGuests=Math.max(1,Number(v||1)));
  }

  function bindModules() {
    $$('.module-card:not([disabled])').forEach((card) => card.onclick = () => {
      const id = card.dataset.module;
      const selected = project.modules.includes(id);
      if (id === 'dynamic_pricing') {
        if (selected) {
          project.modules = project.modules.filter((item) => item !== id);
          if (project.pricing.mode === 'dynamic') project.pricing.mode = 'none';
        } else {
          project.modules = [...project.modules, id];
          project.pricing.mode = 'dynamic';
          project.pricing.enabled = true;
          if (!project.pricing.basePrice) project.pricing.basePrice = 50;
        }
      } else {
        project.modules = selected ? project.modules.filter((item) => item !== id) : [...project.modules, id];
      }
      project.delivery.previewApproved = false;
      render();
    });
  }

  function bindStructure() {
    const h=project.hospitality;
    $$('#addUnitType').forEach(b=>b.onclick=()=>{});
    const add=$('#addUnitType'); if(add)add.onclick=()=>{h.unitTypes=h.unitTypes||[];h.unitTypes.push({name:'Nuova tipologia',count:1,capacity:2,basePrice:Number(project.pricing.basePrice||90)});project.delivery.previewApproved=false;render();};
    $$('[data-unit-index][data-unit-key]').forEach(input=>input.oninput=()=>{const i=Number(input.dataset.unitIndex),k=input.dataset.unitKey;h.unitTypes[i][k]=['count','capacity','basePrice'].includes(k)?Number(input.value||0):input.value;h.unitCount=(h.unitTypes||[]).reduce((sum,u)=>sum+Number(u.count||0),0);project.delivery.previewApproved=false;saveDraft();renderSummary();});
    $$('[data-unit-remove]').forEach(button=>button.onclick=()=>{h.unitTypes.splice(Number(button.dataset.unitRemove),1);h.unitCount=(h.unitTypes||[]).reduce((sum,u)=>sum+Number(u.count||0),0);project.delivery.previewApproved=false;render();});
    const bind=(id,setter,event='input')=>{const el=$('#'+id);if(!el)return;el[event==='change'?'onchange':'oninput']=()=>{setter(el.value);project.delivery.previewApproved=false;saveDraft();renderSummary();}};
    bind('checkinFrom',v=>h.checkinFrom=v);bind('checkoutBy',v=>h.checkoutBy=v);bind('cancellationPolicy',v=>h.cancellationPolicy=v,'change');bind('hospitalityDeposit',v=>project.pricing.depositPercent=Number(v||0));
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
    $$('[data-hub-tab]', root).forEach((button) => button.onclick = () => { previewMode = 'hub'; previewHubTab = button.dataset.hubTab || 'home'; const stage = button.closest('.preview-stage'); stage.outerHTML = previewStage(); bindPreviewControls($('#panel')); });
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
    $$('[data-hub-tab]', root).forEach((button) => button.onclick = () => { previewMode = 'hub'; previewHubTab = button.dataset.hubTab || 'home'; openPreviewOverlay(); });
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
      ['Implementazione Easy Come · obbligatoria', price.implementation],
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
        <div class="order-total"><div><span class="checkout-label">TOTALE DA PAGARE ORA</span><small>Software + implementazione · pagamento unico</small></div><strong>${money(price.total)}</strong></div>        <div class="checkout-guarantees"><span>✓ Anteprima approvata prima del pagamento</span><span>✓ Implementazione Easy Come inclusa e obbligatoria</span><span>✓ Nessun canone Easy Come ricorrente</span><span>✓ Pagamento protetto tramite Stripe</span><span>✓ Pacchetto disponibile dopo la conferma Stripe</span></div>
      </div>
      <div class="checkout-form-wrap"><form id="checkoutForm" class="checkout-form"><span class="checkout-label">DATI PER L’ORDINE</span><h3>A chi intestiamo il progetto?</h3><p>Questi dati vengono associati al pagamento e alla consegna del pacchetto software.</p>
        <div class="form-grid two"><label class="field"><span>Nome e cognome</span><input name="customerName" required autocomplete="name" value=""></label><label class="field"><span>Email</span><input name="email" required type="email" autocomplete="email" value="${esc(project.company.email || '')}"></label><label class="field"><span>Telefono</span><input name="phone" autocomplete="tel"></label><label class="field"><span>Partita IVA / CF</span><input name="taxId" autocomplete="off"></label><label class="field full"><span>Ragione sociale</span><input name="companyName" required value="${esc(project.company.name || '')}"></label></div>
        <label class="legal-check"><input type="checkbox" name="terms" required><span>Accetto i <a href="${esc(SALES.termsUrl || '/termini')}" target="_blank" rel="noopener">Termini e condizioni</a> e confermo di aver letto la <a href="${esc(SALES.privacyUrl || '/privacy')}" target="_blank" rel="noopener">Privacy Policy</a> e la <a href="/rimborsi" target="_blank" rel="noopener">politica rimborsi e recesso</a>.</span></label>
        <label class="legal-check"><input type="checkbox" name="immediatePerformance" required><span>Chiedo che la fornitura digitale e i servizi Easy Come previsti inizino subito dopo il pagamento. Se acquisto come consumatore, riconosco che l'inizio della fornitura del contenuto digitale può comportare la perdita del diritto di recesso nei casi previsti dalla legge e che, per i servizi già iniziati, possono applicarsi le regole sul corrispettivo proporzionale.</span></label>
        <div id="checkoutError"></div><button class="btn btn-primary checkout-button" id="payButton" type="submit">${`Paga ${money(price.total)}`}</button><div class="secure-row"><span>🔒</span><span>I dati della carta vengono gestiti direttamente da Stripe.</span></div>
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
        if (!accessToken) {
          const next = encodeURIComponent(location.pathname + location.search);
          errorBox.innerHTML = `<div class="checkout-error">Per acquistare, crea o accedi al tuo account Easy Come. La demo resta disponibile.<br><a href="/accedi?mode=signup&next=${next}" style="font-weight:900;text-decoration:underline">Crea account e continua →</a></div>`;
          button.disabled = false;
          button.textContent = `Paga ${money(price.total)}`;
          return;
        }
        const response = await fetch(SALES.checkoutEndpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
          body: JSON.stringify({
            project: projectForCheckout(),
            customer,
            legal: {
              termsAccepted: customer.terms === 'on',
              immediatePerformance: customer.immediatePerformance === 'on',
              termsVersion: 'EC-TOS-2026-08-29-v2',
              refundPolicyVersion: 'EC-REF-2026-08-29-v2',
              acceptedAt: new Date().toISOString(),
            },
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
        button.textContent = `Paga ${money(price.total)}`;
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
    project.delivery.implementationSelected = true;
    project.delivery.managedServiceSelected = false;
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
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Offerta ${esc(project.company.name)}</title><style>body{font-family:Arial,sans-serif;background:#f4f5f1;margin:0;padding:50px;color:#171815}.sheet{max-width:820px;margin:auto;background:#fff;border-radius:26px;padding:48px;box-shadow:0 25px 80px #0001}.tag{display:inline-block;background:#fff0e9;color:#ff6b35;padding:7px 10px;border-radius:999px;font-size:11px;font-weight:bold}h1{font-size:44px;letter-spacing:-2px;margin:15px 0}.muted{color:#777}.row{display:flex;justify-content:space-between;padding:12px 0;border-bottom:1px solid #eee}.total{background:#171815;color:#fff;border-radius:19px;padding:23px;margin-top:20px}.total strong{display:block;font-size:35px;margin-top:5px}.modules{columns:2}.footer{margin-top:45px;font-size:11px;color:#888}</style></head><body><div class="sheet"><span class="tag">EASY COME · ATTIVAZIONE</span><h1>${esc(project.company.name || 'Gestionale personalizzato')}</h1><p class="muted">${esc(project.company.description || '')}</p><h2>Investimento</h2><div class="row"><span>Pacchetto software</span><strong>${money(price.base)}</strong></div><div class="row"><span>Implementazione Easy Come · obbligatoria</span><strong>${money(price.implementation)}</strong></div><div class="row"><span>Moduli e personalizzazioni</span><strong>${money(price.extras)}</strong></div><div class="total"><span>Totale pacchetto</span><strong>${money(price.total)}</strong><small>Pagamento unico. Nessun canone Easy Come.</small></div><h2>Funzioni incluse</h2><div class="modules">${modules.map((module) => `<p>✓ ${esc(module)}</p>`).join('')}</div>${project.delivery.notes ? `<h2>Note</h2><p>${esc(project.delivery.notes)}</p>` : ''}<p class="footer">Anteprima approvata. Implementazione obbligatoria €150 inclusa nel totale. Pagamento unico.</p></div></body></html>`);
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


  async function loadDemoProjectFromUrl(user) {
    const slug = PROSPECT_DEMO_SLUG;
    if (!slug) return null;
    try {
      const response = await fetch(`/api/demo-public?slug=${encodeURIComponent(slug)}`, { cache: 'no-store' });
      const data = await response.json();
      if (!response.ok || !data.project) throw new Error(data.error || 'Demo non disponibile.');
      const incoming = data.project;
      // Prospect demos must never inherit the currently logged-in Easy Come account.
      // Contact details stay intentionally empty until the prospect enters their own data.
      incoming.company = { ...(incoming.company || {}), email: '', phone: '' };
      incoming.delivery = { ...(incoming.delivery || {}), previewApproved: true };
      incoming.demoSource = { ...(incoming.demoSource || {}), generatedForDemo: true, slug, quotedPrice: Number(data.price || incoming.demoSource?.quotedPrice || 99) };
      return incoming;
    } catch (error) {
      console.warn('Impossibile precaricare la demo:', error);
      return null;
    }
  }

  window.addEventListener('easycome:account-ready', async (event) => {
    const user = event.detail?.user;
    if (!user?.id) return;
    const switchedAccount = Boolean(activeUserId && activeUserId !== user.id);
    activeUserId = user.id;
    const demoProject = await loadDemoProjectFromUrl(user);
    const saved = demoProject ? null : await window.EasyComeAccount?.loadLatestProject?.();
    const local = demoProject ? null : loadDraft(user.id);
    const legacy = demoProject ? null : legacyDraftForUser(user);
    project = normalizeProject(demoProject || saved || local || legacy || G.defaultProject());
    if (!demoProject && !project.company.email) project.company.email = user.email || '';
    if (demoProject) {
      // A prospect must start from the exact product shown in the demo, not from a fresh configurator.
      currentStep = 1;
      customFieldDraft = [];
      sectionDraft = { label: '', singular: '' };
      automationDraft = { name: '', trigger: 'record_created', entity: '', action: 'notify', target: '', message: '', enabled: true };
      previewMode = 'dashboard';
      previewDevice = 'desktop';
      previewEntityKey = '';
      previewHubTab = 'home';
    } else if (switchedAccount || (!saved && !local && !legacy)) {
      currentStep = 0;
      customFieldDraft = [];
      sectionDraft = { label: '', singular: '' };
      automationDraft = { name: '', trigger: 'record_created', entity: '', action: 'notify', target: '', message: '', enabled: true };
      previewMode = 'dashboard';
      previewDevice = 'desktop';
      previewEntityKey = '';
      previewHubTab = 'home';
    }
    saveDraft();
    render();
  });

  render();
}());
