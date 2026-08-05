(function () {
  'use strict';

  const G = window.ECGenerator;
  const SALES = window.EASYCOME_SALES || { mode: 'customer', generationSeconds: 0, checkoutEndpoint: '/api/create-checkout-session', paymentUrl: '', supportEmail: '', termsUrl: '/termini.html', privacyUrl: '/privacy.html', internalDownloadEnabled: false };
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (match) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[match]));
  const money = (value) => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' }).format(Number(value || 0));

  const steps = [
    { id: 'idea', label: 'Attività', subtitle: 'Obiettivo e modello' },
    { id: 'modules', label: 'Funzioni', subtitle: 'Cosa deve fare' },
    { id: 'structure', label: 'Dati', subtitle: 'Sezioni e campi' },
    { id: 'logic', label: 'Logiche', subtitle: 'Prezzi e automazioni' },
    { id: 'design', label: 'Esperienza', subtitle: 'Brand e portale' },
    { id: 'preview', label: 'Anteprima', subtitle: 'Prova il risultato' },
    { id: 'delivery', label: 'Consegna', subtitle: 'Prezzo e pacchetto' },
  ];

  const TEMPLATES = [
    { id: 'custom', icon: '✦', name: 'Da zero', description: 'Parti dal pacchetto universale e costruisci liberamente.', modules: ['crm', 'tasks'] },
    { id: 'booking', icon: '▦', name: 'Prenotazioni', description: 'Camere, spazi, noleggi, strutture e servizi su disponibilità.', industry: 'Attività con prenotazioni', modules: ['crm', 'tasks', 'bookings', 'quotes', 'payments', 'portal', 'dynamic_pricing', 'automations', 'multiuser'], portal: { type: 'booking', title: 'Prenota o richiedi disponibilità' }, pricing: true },
    { id: 'appointments', icon: '◷', name: 'Appuntamenti', description: 'Saloni, studi, centri, consulenti e professionisti.', industry: 'Servizi su appuntamento', modules: ['crm', 'tasks', 'appointments', 'payments', 'portal', 'automations', 'multiuser'], portal: { type: 'appointment', title: 'Prenota un appuntamento' } },
    { id: 'restaurant', icon: '♨', name: 'Ristorazione', description: 'Prenotazioni, ordini, tavoli, fornitori e turni.', industry: 'Ristorazione', modules: ['crm', 'tasks', 'bookings', 'orders', 'inventory', 'expenses', 'staff', 'reports', 'portal', 'automations'] },
    { id: 'workshop', icon: '⌁', name: 'Officina e interventi', description: 'Veicoli, lavori, preventivi, ricambi e stato intervento.', industry: 'Officina o assistenza tecnica', modules: ['crm', 'tasks', 'quotes', 'orders', 'inventory', 'payments', 'assets', 'portal', 'automations', 'multiuser'], custom: [{ key: 'vehicles', label: 'Veicoli', singular: 'Veicolo', fields: [{ key: 'plate', label: 'Targa', type: 'text', required: true }, { key: 'customer', label: 'Cliente', type: 'text', required: true }, { key: 'brand', label: 'Marca e modello', type: 'text' }, { key: 'mileage', label: 'Chilometraggio', type: 'number' }, { key: 'notes', label: 'Note', type: 'longtext' }] }] },
    { id: 'professional', icon: '§', name: 'Studio professionale', description: 'Clienti, pratiche, documenti, scadenze e attività.', industry: 'Studio professionale', modules: ['crm', 'tasks', 'projects', 'quotes', 'invoices', 'payments', 'documents', 'automations', 'multiuser'], custom: [{ key: 'cases', label: 'Pratiche', singular: 'Pratica', fields: [{ key: 'title', label: 'Oggetto', type: 'text', required: true }, { key: 'customer', label: 'Cliente', type: 'text', required: true }, { key: 'status', label: 'Stato', type: 'select', options: ['Nuova', 'In lavorazione', 'In attesa', 'Chiusa'] }, { key: 'deadline', label: 'Scadenza', type: 'date' }, { key: 'notes', label: 'Note', type: 'longtext' }] }] },
    { id: 'retail', icon: '◇', name: 'Negozio e vendite', description: 'Prodotti, ordini, scorte, clienti, pagamenti e report.', industry: 'Commercio', modules: ['crm', 'tasks', 'orders', 'inventory', 'invoices', 'payments', 'expenses', 'reports', 'automations', 'multiuser'] },
    { id: 'projects', icon: '△', name: 'Progetti e cantieri', description: 'Commesse, sopralluoghi, materiali, documenti e avanzamento.', industry: 'Impresa a commessa', modules: ['crm', 'tasks', 'projects', 'quotes', 'expenses', 'staff', 'documents', 'assets', 'reports', 'automations', 'multiuser'] },
    { id: 'membership', icon: '◎', name: 'Iscrizioni e abbonati', description: 'Palestre, scuole, corsi, associazioni e membership.', industry: 'Attività con iscritti', modules: ['crm', 'tasks', 'appointments', 'payments', 'documents', 'reports', 'portal', 'automations', 'multiuser'], custom: [{ key: 'memberships', label: 'Abbonamenti', singular: 'Abbonamento', fields: [{ key: 'customer', label: 'Iscritto', type: 'text', required: true }, { key: 'plan', label: 'Piano', type: 'text', required: true }, { key: 'start_date', label: 'Inizio', type: 'date' }, { key: 'end_date', label: 'Scadenza', type: 'date' }, { key: 'status', label: 'Stato', type: 'select', options: ['Attivo', 'In scadenza', 'Scaduto'] }] }] },
  ];

  let project = normalizeProject(loadDraft() || G.defaultProject());
  let currentStep = 0;
  let customFieldDraft = [];
  let automationDraft = { name: '', trigger: 'record_created', entity: '', action: 'notify', target: '', message: '', enabled: true };
  let previewMode = 'dashboard';
  let previewDevice = 'desktop';
  let previewEntityKey = '';

  function normalizeProject(value) {
    const base = G.defaultProject();
    const p = { ...base, ...value, company: { ...base.company, ...(value.company || {}) }, portal: { ...base.portal, ...(value.portal || {}) }, pricing: { ...base.pricing, ...(value.pricing || {}) }, delivery: { ...base.delivery, ...(value.delivery || {}) } };
    p.modules = Array.from(new Set([...(p.modules || []), 'crm', 'tasks']));
    p.customEntities = p.customEntities || [];
    p.automations = p.automations || [];
    p.pricing.rules = p.pricing.rules || [];
    p.pricing.extras = p.pricing.extras || [];
    p.company.style = p.company.style || 'signature';
    p.company.logoData = p.company.logoData || '';
    p.delivery.previewApproved = Boolean(p.delivery.previewApproved);
    p.delivery.implementationSelected = Boolean(p.delivery.implementationSelected);
    p.templateId = p.templateId || 'custom';
    return p;
  }

  function saveDraft() { try { localStorage.setItem('easycome-generator-pro-draft', JSON.stringify(project)); } catch (_) {} }
  function loadDraft() { try { return JSON.parse(localStorage.getItem('easycome-generator-pro-draft') || 'null'); } catch (_) { return null; } }
  function toast(message) { const node = document.createElement('div'); node.className = 'toast'; node.textContent = message; document.body.appendChild(node); setTimeout(() => node.remove(), 2500); }
  function initials() { return (project.company.name || 'EC').split(/\s+/).slice(0, 2).map((item) => item[0]).join('').toUpperCase(); }
  function logoMarkup() { return project.company.logoData ? `<img src="${project.company.logoData}" alt="">` : esc(initials()); }

  function syncEffects() {
    project.portal.enabled = project.modules.includes('portal') || Boolean(project.portal.enabled);
    project.pricing.enabled = project.modules.includes('dynamic_pricing') || Boolean(project.pricing.enabled);
  }

  function applyTemplate(id) {
    const template = TEMPLATES.find((item) => item.id === id);
    if (!template) return;
    project.templateId = id;
    project.modules = Array.from(new Set(template.modules || ['crm', 'tasks']));
    project.customEntities = JSON.parse(JSON.stringify(template.custom || []));
    if (template.industry && !project.company.industry.trim()) project.company.industry = template.industry;
    if (template.description && !project.company.description.trim()) project.company.description = template.description;
    if (template.portal) project.portal = { ...project.portal, enabled: true, ...template.portal };
    else project.portal.enabled = project.modules.includes('portal');
    if (template.pricing) { project.pricing.enabled = true; if (!project.pricing.basePrice) project.pricing.basePrice = 50; }
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
        <label class="field full"><span>Quale lavoro deve rendere più semplice?</span><textarea id="description" placeholder="Racconta cosa viene fatto oggi a mano, cosa si perde e cosa deve diventare automatico…">${esc(c.description)}</textarea><small>Questo testo aiuta a rendere il pacchetto e il portale più credibili.</small></label>
        <label class="field"><span>Email titolare *</span><input id="companyEmail" type="email" value="${esc(c.email)}" placeholder="titolare@azienda.it"><small>Serve per creare in sicurezza il primo account amministratore.</small></label>
        <label class="field"><span>Telefono</span><input id="companyPhone" value="${esc(c.phone)}" placeholder="+39 …"></label>
      </div>
      <div class="info-card"><strong>Risultato finale</strong><p>Riceverai un’app gestionale responsive, database Supabase, portale pubblico, automazioni, documentazione, preventivo e file di deploy nello stesso ZIP.</p></div>`;
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
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 3</span><h1>I dati devono parlare la lingua dell’impresa.</h1><p>Ogni sezione diventa una vera area del gestionale con tabella, ricerca, inserimento, modifica ed eliminazione.</p></div><div class="heading-badge">${entities.length} sezioni</div></div>
      <div class="entity-list">${entities.map((entity) => `<article class="entity-card ${entity.custom ? 'custom' : ''}"><div><span class="entity-icon">${entity.custom ? 'C' : entity.label.slice(0, 1)}</span><div><strong>${esc(entity.label)}</strong><small>${entity.fields.length} campi · ${entity.custom ? 'Personalizzata' : 'Inclusa dai moduli'}</small></div></div>${entity.custom ? `<button class="icon-button remove-entity" data-key="${esc(entity.key)}">×</button>` : '<span class="locked">Inclusa</span>'}</article>`).join('')}</div>
      <section class="builder-card"><div class="section-title"><div><h2>Aggiungi una sezione su misura</h2><p>Pratiche, veicoli, immobili, corsi, cantieri, interventi o qualsiasi altra cosa.</p></div><span class="price-pill">+ ${money(10)}</span></div>
        <div class="form-grid two compact"><label class="field"><span>Nome sezione</span><input id="entityLabel" placeholder="Es. Pratiche"></label><label class="field"><span>Nome singolare</span><input id="entitySingular" placeholder="Es. Pratica"></label></div>
        <div class="field-builder"><div class="field-builder-head"><strong>Campi</strong><span>${customFieldDraft.length} aggiunti · primi 6 inclusi</span></div><div class="draft-fields">${customFieldDraft.map((field, index) => `<div class="draft-field"><span><strong>${esc(field.label)}</strong><small>${esc(field.type)}${field.required ? ' · obbligatorio' : ''}</small></span><button class="icon-button remove-draft-field" data-index="${index}">×</button></div>`).join('') || '<div class="empty-mini">Aggiungi i campi che devono essere compilati.</div>'}</div>
          <div class="field-adder"><input id="fieldLabel" placeholder="Nome campo"><select id="fieldType"><option value="text">Testo</option><option value="longtext">Testo lungo</option><option value="number">Numero</option><option value="currency">Importo</option><option value="date">Data</option><option value="datetime">Data e ora</option><option value="email">Email</option><option value="phone">Telefono</option><option value="boolean">Sì / No</option><option value="select">Scelta multipla</option></select><input id="fieldOptions" class="hidden" placeholder="Opzioni separate da virgola"><label class="inline-check"><input id="fieldRequired" type="checkbox"> Obbligatorio</label><button id="addField" class="btn btn-secondary">Aggiungi</button></div>
        </div><button id="addEntity" class="btn btn-primary">Crea sezione</button></section>`;
  }

  function logicStep() {
    const entities = G.buildEntities(project).filter((item) => !item.system);
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 4</span><h1>Fai lavorare il gestionale al posto tuo.</h1><p>Configura prezzi, scadenze e automazioni. Ogni flusso aggiuntivo costa soltanto ${money(8)} una tantum.</p></div><div class="heading-badge">${project.automations.length} automazioni</div></div>
      <section class="builder-card ${project.pricing.enabled ? '' : 'disabled-card'}"><div class="section-title"><div><h2>Prezzi e preventivi dinamici</h2><p>Periodo, durata, persone, promozioni, tasse e caparre.</p></div>${project.pricing.enabled ? '<span class="status-dot on">Attivo</span>' : `<button id="activatePricing" class="btn btn-secondary">Attiva + ${money(20)}</button>`}</div>${project.pricing.enabled ? pricingBuilder() : '<div class="empty-mini">Attiva il modulo per configurare il calcolo automatico.</div>'}</section>
      <section class="builder-card"><div class="section-title"><div><h2>Automazioni</h2><p>Nuovo dato → email, notifica, task, cambio stato, Make, n8n o AI.</p></div><span class="price-pill">${money(8)} ciascuna</span></div>
        <div class="automation-list">${project.automations.map((flow, index) => `<article class="automation-row"><span class="automation-bolt">⚡</span><div><strong>${esc(flow.name)}</strong><small>${esc(triggerLabel(flow.trigger))} → ${esc(actionLabel(flow.action))}</small></div><button class="icon-button remove-automation" data-index="${index}">×</button></article>`).join('') || '<div class="empty-mini">Nessuna automazione. Il gestionale può funzionare anche senza.</div>'}</div>
        <div class="form-grid two compact automation-form"><label class="field"><span>Nome automazione</span><input id="automationName" value="${esc(automationDraft.name)}" placeholder="Es. Conferma nuova richiesta"></label><label class="field"><span>Sezione</span><select id="automationEntity"><option value="">Qualsiasi sezione</option>${entities.map((entity) => `<option value="${entity.key}" ${automationDraft.entity === entity.key ? 'selected' : ''}>${esc(entity.label)}</option>`).join('')}</select></label><label class="field"><span>Quando</span><select id="automationTrigger">${G.AUTOMATION_TRIGGERS.map((item) => `<option value="${item.id}" ${automationDraft.trigger === item.id ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select></label><label class="field"><span>Cosa fa</span><select id="automationAction">${G.AUTOMATION_ACTIONS.map((item) => `<option value="${item.id}" ${automationDraft.action === item.id ? 'selected' : ''}>${esc(item.label)}</option>`).join('')}</select></label><label class="field full"><span>Destinatario, URL o nuovo stato</span><input id="automationTarget" value="${esc(automationDraft.target)}" placeholder="Email, webhook, stato…"></label><label class="field full"><span>Messaggio o istruzione</span><textarea id="automationMessage" placeholder="Testo email, titolo task o istruzione…">${esc(automationDraft.message)}</textarea></label></div><button id="addAutomation" class="btn btn-primary">Aggiungi automazione</button></section>`;
  }

  function pricingBuilder() {
    const p = project.pricing;
    return `<div class="form-grid four compact"><label class="field"><span>Prezzo base</span><input id="basePrice" type="number" step="0.01" value="${esc(p.basePrice)}"></label><label class="field"><span>Unità</span><input id="priceUnit" value="${esc(p.unit)}" placeholder="notte, ora, servizio"></label><label class="field"><span>Tassa per persona</span><input id="taxPerPerson" type="number" step="0.01" value="${esc(p.taxPerPerson)}"></label><label class="field"><span>Caparra %</span><input id="depositPercent" type="number" min="0" max="100" value="${esc(p.depositPercent)}"></label></div>
      <div class="pricing-rules">${(p.rules || []).map((rule, index) => `<article class="pricing-rule"><div><strong>${esc(rule.name || rule.type)}</strong><small>${esc(ruleSummary(rule))}</small></div><button class="icon-button remove-pricing-rule" data-index="${index}">×</button></article>`).join('') || '<div class="empty-mini">Le prime tre regole avanzate sono incluse nel modulo.</div>'}</div>
      <div class="rule-adder"><select id="pricingRuleType"><option value="date_range">Periodo / stagione</option><option value="weekday_multiplier">Giorno della settimana</option><option value="duration_discount">Sconto per durata</option><option value="promo">Codice promozionale</option></select><input id="pricingRuleName" placeholder="Nome regola"><input id="pricingRuleValue" placeholder="Moltiplicatore o %"><input id="pricingRuleExtra" placeholder="Periodo, giorni, codice o soglia"><button id="addPricingRule" class="btn btn-secondary">Aggiungi</button></div>`;
  }

  function designStep() {
    const c = project.company, p = project.portal;
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 5</span><h1>Deve sembrare creato davvero per loro.</h1><p>Logo, colori, stile e portale vengono applicati sia all’anteprima sia ai file consegnati.</p></div><div class="heading-badge">Brand personalizzato</div></div>
      <div class="design-grid"><div>
        <section class="builder-card"><div class="section-title"><h2>Identità</h2><span>Inclusa</span></div><div class="upload-field"><div class="upload-preview" id="logoPreview">${logoMarkup()}</div><div><label for="logoUpload">Carica il logo</label><small>PNG, JPG o SVG. Facoltativo.</small><input id="logoUpload" type="file" accept="image/*"></div>${c.logoData ? '<button id="removeLogo" class="icon-button">×</button>' : ''}</div><div class="form-grid two compact" style="margin-top:13px"><label class="field"><span>Colore principale</span><div class="color-field"><input id="primaryColor" type="color" value="${esc(c.primaryColor)}"><input id="primaryColorText" value="${esc(c.primaryColor)}"></div></label><label class="field"><span>Colore scuro</span><div class="color-field"><input id="accentColor" type="color" value="${esc(c.accentColor)}"><input id="accentColorText" value="${esc(c.accentColor)}"></div></label></div></section>
        <section class="builder-card"><div class="section-title"><h2>Stile visivo</h2><span>Incluso</span></div><div class="style-grid">${[['signature','Signature','Pulito e premium'],['corporate','Corporate','Blu e professionale'],['warm','Warm','Accogliente e umano']].map(([id, name, desc]) => `<button class="style-card ${c.style === id ? 'active' : ''}" data-style="${id}"><span class="style-swatch"><i></i><i></i></span><strong>${name}</strong><small>${desc}</small></button>`).join('')}</div></section>
        <section class="builder-card"><div class="switch-row"><div><strong>Portale pubblico</strong><small>Riceve richieste, prenotazioni, ordini o appuntamenti.</small></div><label class="switch"><input id="portalEnabled" type="checkbox" ${p.enabled ? 'checked' : ''}><span></span></label></div><label class="field" style="margin-top:13px"><span>Tipo di richiesta</span><select id="portalType"><option value="request" ${p.type === 'request' ? 'selected' : ''}>Richiesta generica</option><option value="quote" ${p.type === 'quote' ? 'selected' : ''}>Preventivo</option><option value="booking" ${p.type === 'booking' ? 'selected' : ''}>Prenotazione</option><option value="appointment" ${p.type === 'appointment' ? 'selected' : ''}>Appuntamento</option><option value="order" ${p.type === 'order' ? 'selected' : ''}>Ordine</option><option value="support" ${p.type === 'support' ? 'selected' : ''}>Assistenza</option></select></label><label class="field"><span>Titolo portale</span><input id="portalTitle" value="${esc(p.title)}"></label><label class="field"><span>Messaggio di conferma</span><input id="portalSuccess" value="${esc(p.successMessage)}"></label><div class="field"><span>Dati di contatto</span><small>I campi specifici cambiano automaticamente in base al tipo di richiesta.</small><div class="check-grid">${['name', 'email', 'phone'].map((key) => `<label><input class="portal-field" type="checkbox" value="${key}" ${(p.collect || []).includes(key) ? 'checked' : ''}> ${portalFieldLabel(key)}</label>`).join('')}</div></div></section>
      </div><div><div class="portal-mini" style="--preview-primary:${esc(c.primaryColor)}"><div class="preview-brand"><span>${logoMarkup()}</span><strong>${esc(c.name || 'La tua azienda')}</strong></div><div class="portal-mini-content"><span>PORTALE CLIENTI</span><h2>${esc(p.title || 'Raccontaci cosa ti serve.')}</h2><p>${esc(c.description || 'Una pagina elegante e semplice per ricevere richieste direttamente nel gestionale.')}</p><div class="preview-fields"><i></i><i></i><i class="wide"></i></div><button>Invia richiesta</button></div></div></div></div>`;
  }

  function previewStep() {
    const previewAudit = G.auditProject({ ...project, delivery: { ...project.delivery, previewApproved: true } });
    const canApprove = previewAudit.blockers.length === 0;
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 6</span><h1>Provalo prima di spendere un euro.</h1><p>Naviga il gestionale e il portale come farebbe il cliente. L’anteprima usa nome, logo, colori, moduli e sezioni configurate.</p></div><div class="heading-badge ${canApprove ? 'success' : ''}">${canApprove ? 'Anteprima pronta' : `${previewAudit.blockers.length} controlli da risolvere`}</div></div>${previewStage()}
      <section class="audit-panel"><div class="audit-score"><strong>${previewAudit.score}</strong><span>/100</span><small>${esc(previewAudit.grade)}</small></div><div><h3>Controllo qualità prima dell’approvazione</h3><div class="audit-list">${previewAudit.blockers.map((item) => `<p class="blocker">✕ ${esc(item)}</p>`).join('')}${previewAudit.warnings.slice(0, 4).map((item) => `<p class="warning">! ${esc(item)}</p>`).join('')}${!previewAudit.blockers.length ? '<p class="passed">✓ Nessun problema bloccante rilevato.</p>' : ''}</div></div></section>
      <div class="approval-card"><label class="${canApprove ? '' : 'disabled'}"><input id="approvePreview" type="checkbox" ${project.delivery.previewApproved ? 'checked' : ''} ${canApprove ? '' : 'disabled'}><span><strong>Questa anteprima rappresenta il risultato che voglio ottenere</strong><small>${canApprove ? 'Potrai comunque modificare il progetto prima di scaricare il pacchetto.' : 'Risolvi prima i controlli bloccanti indicati sopra.'}</small></span></label><button id="fullscreenPreview" class="btn btn-preview">Apri a schermo intero</button></div>`;
  }
  function previewStage() {
    return `<div class="preview-stage"><div class="preview-toolbar"><div class="preview-toolbar-left"><i class="preview-dot"></i><i class="preview-dot"></i><i class="preview-dot"></i><button class="preview-mode ${previewMode === 'dashboard' ? 'active' : ''}" data-preview-mode="dashboard">Dashboard</button><button class="preview-mode ${previewMode === 'sheet' ? 'active' : ''}" data-preview-mode="sheet">Foglio operativo</button><button class="preview-mode ${previewMode === 'calendar' ? 'active' : ''}" data-preview-mode="calendar">Calendario</button><button class="preview-mode ${previewMode === 'portal' ? 'active' : ''}" data-preview-mode="portal">Portale</button></div><div class="preview-toolbar-right"><button class="device-button ${previewDevice === 'desktop' ? 'active' : ''}" data-device="desktop">Desktop</button><button class="device-button ${previewDevice === 'mobile' ? 'active' : ''}" data-device="mobile">Mobile</button></div></div><div class="preview-window ${previewDevice === 'mobile' ? 'mobile' : ''}" id="previewWindow">${renderPreviewContent()}</div></div>`;
  }

  function renderPreviewContent() {
    if (previewMode === 'portal') return portalPreviewHtml();
    return appPreviewHtml(previewMode);
  }

  function appPreviewHtml(mode) {
    const entities = G.buildEntities(project).filter((item) => !item.system);
    if (!previewEntityKey || !entities.some((item) => item.key === previewEntityKey)) previewEntityKey = entities[0]?.key || '';
    const current = entities.find((item) => item.key === previewEntityKey) || entities[0];
    const brand = project.company.name || 'La tua azienda';
    const operational = mode !== 'dashboard';
    const body = mode === 'sheet' && current ? spreadsheetPreviewBody(current)
      : mode === 'calendar' ? calendarPreviewBody(entities)
      : dashboardPreviewBody(entities);
    return `<div class="preview-app" style="--pv-primary:${esc(project.company.primaryColor)};--pv-accent:${esc(project.company.accentColor)}"><aside class="pv-sidebar"><div class="pv-logo"><span class="pv-logo-mark">${logoMarkup()}</span><div><strong>${esc(brand)}</strong><small>Gestionale operativo</small></div></div><nav class="pv-nav"><button class="${mode === 'dashboard' ? 'active' : ''}" data-pv-dashboard>⌂ Panoramica</button>${entities.slice(0, 9).map((entity) => `<button class="${operational && current?.key === entity.key ? 'active' : ''}" data-pv-entity="${entity.key}">${esc(entity.label.slice(0, 1))} &nbsp;${esc(entity.label)}</button>`).join('')}</nav><div class="pv-sidebar-note"><b>Excel collegato</b><span>Import, export e backup inclusi</span></div></aside><main class="pv-main">${body}</main></div>`;
  }

  function dashboardPreviewBody(entities) {
    const brand = project.company.name || 'Azienda';
    return `<div class="pv-top"><div><h2>Panoramica</h2><p>Oggi · Dati, scadenze e disponibilità</p></div><span class="pv-avatar">${esc(initials())}</span></div><section class="pv-hero"><span>CENTRO OPERATIVO</span><h3>Buon lavoro, ${esc(brand.split(' ')[0])}.</h3><p>${esc(project.company.description || 'Clienti, disponibilità, incassi e attività in un unico spazio.')}</p><div class="pv-hero-actions"><b>+ Nuova voce</b><i>Esporta Excel</i></div></section><section class="pv-stats"><article class="pv-stat"><span>Operazioni aperte</span><strong>${Math.max(18, entities.length * 7)}</strong><small>6 da completare oggi</small></article><article class="pv-stat"><span>Valore del mese</span><strong>€ 8.420</strong><small>+12% sul mese scorso</small></article><article class="pv-stat"><span>Occupazione / carico</span><strong>74%</strong><small>Capacità aggiornata</small></article><article class="pv-stat"><span>Automazioni</span><strong>${Math.max(3, project.automations.length)}</strong><small>Flussi attivi</small></article></section><section class="pv-grid"><article class="pv-card"><div class="pv-card-title"><h4>Andamento operativo</h4><span>Ultimi 7 giorni</span></div><div class="pv-chart">${[42, 61, 48, 77, 59, 91, 72].map((height) => `<i style="height:${height}%"></i>`).join('')}</div></article><article class="pv-card"><div class="pv-card-title"><h4>Agenda di oggi</h4><span>5 impegni</span></div><div class="pv-list">${entities.slice(0, 4).map((entity, index) => `<div><b>${String(9 + index).padStart(2,'0')}:00</b><span><strong>${esc(entity.label)}</strong><small>${4 + index * 2} elementi da gestire</small></span></div>`).join('')}</div></article></section><section class="pv-bottom-grid"><article><span>SCADENZE</span><strong>3 attività urgenti</strong><small>Preventivi, pagamenti e richieste</small></article><article><span>FOGLI EXCEL</span><strong>Importazione pronta</strong><small>Modello con tutte le colonne</small></article><article><span>BACKUP</span><strong>Ultimo: oggi</strong><small>Ripristino completo in un clic</small></article></section>`;
  }

  function spreadsheetPreviewBody(entity) {
    const rows = sampleRows(entity);
    const fields = entity.fields.slice(0, 7);
    return `<div class="pv-top"><div><h2>${esc(entity.label)} · Foglio operativo</h2><p>Modifica rapida come in Excel · salvataggio automatico</p></div><div class="pv-sheet-actions"><span>Importa Excel</span><b>Esporta .xlsx</b><i>+ Riga</i></div></div><section class="pv-sheet-summary"><div><span>Righe</span><strong>${rows.length * 6}</strong></div><div><span>Selezionate</span><strong>3</strong></div><div><span>Totale colonna</span><strong>€ 4.825</strong></div><div><span>Filtri attivi</span><strong>2</strong></div></section><article class="pv-sheet"><div class="pv-formula"><b>fx</b><span>=SOMMA(F2:F25)</span><em>€ 4.825,00</em></div><div class="pv-gridtable"><div class="pv-gridrow pv-gridhead"><i></i>${fields.map((field) => `<b>${esc(field.label)}</b>`).join('')}</div>${Array.from({length:8},(_,index)=>{const row=rows[index%rows.length];return `<div class="pv-gridrow"><i>${index+1}</i>${fields.map((field,fieldIndex)=>`<span class="${fieldIndex===0?'selected':''}">${field.key.toLowerCase().includes('status') ? `<u>${esc(row[field.key])}</u>` : esc(row[field.key])}</span>`).join('')}</div>`}).join('')}</div><footer><span>Foglio 1 · ${esc(entity.label)}</span><b>+ Nuovo foglio</b></footer></article>`;
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

  function portalPreviewHtml() {
    return `<div class="pv-portal" style="--pv-primary:${esc(project.company.primaryColor)};--pv-accent:${esc(project.company.accentColor)}"><section class="pv-portal-story"><span>ESPERIENZA CLIENTE</span><h2>${esc(project.portal.title || 'Raccontaci cosa ti serve.')}</h2><p>${esc(project.company.description || 'La richiesta entra direttamente nel gestionale e il cliente riceve conferma.')}</p></section><section class="pv-portal-form"><h3>Inizia da qui</h3><p>Campi essenziali, nessun passaggio inutile.</p><div class="pv-form-grid"><i class="pv-input"></i><i class="pv-input"></i><i class="pv-input"></i><i class="pv-input"></i><i class="pv-input wide"></i></div><div class="pv-submit">Invia richiesta</div></section></div>`;
  }

  function deliveryStep() {
    const price = G.calculatePrice(project), entities = G.buildEntities(project), audit = G.auditProject(project), ready = audit.ready;
    return `<div class="panel-heading"><div><span class="eyebrow">Passaggio 7</span><h1>Il pacchetto operativo, non una demo vuota.</h1><p>Il prodotto include database, fogli Excel, calendario, viste operative, automazioni e documentazione. L’implementazione assistita resta facoltativa.</p></div><div class="heading-badge ${ready ? 'success' : ''}">${audit.score}/100 · ${esc(audit.grade)}</div></div>
      <div class="quality-grid"><article class="quality-card"><span>FILE CONSEGNATI</span><strong>32+</strong></article><article class="quality-card"><span>SEZIONI</span><strong>${entities.length}</strong></article><article class="quality-card"><span>VISTE OPERATIVE</span><strong>6</strong></article><article class="quality-card"><span>FOGLI EXCEL</span><strong>${Math.max(2, entities.length)}</strong></article></div>
      <section class="audit-panel delivery-audit"><div class="audit-score"><strong>${audit.score}</strong><span>/100</span><small>${esc(audit.grade)}</small></div><div><h3>Esito del controllo automatico</h3><div class="audit-list">${audit.blockers.map((item) => `<p class="blocker">✕ ${esc(item)}</p>`).join('')}${audit.warnings.slice(0, 5).map((item) => `<p class="warning">! ${esc(item)}</p>`).join('')}${audit.strengths.slice(0, 5).map((item) => `<p class="passed">✓ ${esc(item)}</p>`).join('')}</div></div></section>
      <div class="delivery-grid"><section class="package-card"><div class="package-icon">PRO</div><div><h2>${esc(project.company.name || 'Gestionale personalizzato')}</h2><p>Un sistema di lavoro completo, pronto per essere configurato sul database dell’impresa.</p></div><div class="package-files">${['Dashboard con KPI e indicatori', 'Foglio operativo modificabile tipo Excel', 'Calendario disponibilità e risorse', 'Workbook .xlsx già strutturato', 'Tabella, kanban, agenda e schede', 'Import/export, filtri e azioni massive', 'Preventivi, ordini e documenti stampabili', 'Ruoli, audit log e backup', 'Portale clienti multi-step', 'Database Supabase e automazioni'].map((item) => `<span>✓ ${item}</span>`).join('')}</div><button id="reviewPreview" class="btn btn-secondary" style="grid-column:1/-1">Rivedi anteprima</button><button id="downloadPackage" class="btn btn-primary download-button" ${ready ? '' : 'disabled'}>${SALES.mode === 'customer' ? 'Prepara il progetto e continua' : 'Prepara e scarica il pacchetto'}</button>${ready ? '' : `<p class="validation-note">Il pacchetto non è ancora consegnabile: risolvi i controlli rossi e approva l’anteprima.</p>`}</section>
      <section class="quote-card"><span class="eyebrow">Prezzo una tantum</span><div class="quote-lines"><div><span>Pacchetto software</span><strong>${money(price.base)}</strong></div><div><span>Moduli</span><strong>${money(price.modules)}</strong></div><div><span>Sezioni e campi su misura</span><strong>${money(price.customEntities + price.customFields)}</strong></div><div><span>Automazioni</span><strong>${money(price.automations)}</strong></div><div><span>Regole prezzo extra</span><strong>${money(price.pricingRules)}</strong></div>${price.bundleDiscount ? `<div><span>Sconto bundle funzioni</span><strong>- ${money(price.bundleDiscount)}</strong></div>` : ''}${price.implementation ? `<div><span>Implementazione assistita</span><strong>${money(price.implementation)}</strong></div>` : ''}</div><label class="implementation-addon"><input id="implementationSelected" type="checkbox" ${project.delivery.implementationSelected ? 'checked' : ''}><span><strong>Aggiungi implementazione assistita</strong><small>Installazione Supabase, configurazione, test, pubblicazione e consegna guidata.</small></span><b>+ ${money(project.delivery.implementationPrice || 150)}</b></label><div class="quote-total"><span>Totale cliente</span><strong>${money(price.total)}</strong><small>Nessun canone Easy Come</small></div><label class="field"><span>Note commerciali</span><textarea id="deliveryNotes" placeholder="Tempi, formazione, condizioni…">${esc(project.delivery.notes)}</textarea></label><button id="printQuote" class="btn btn-secondary" style="width:100%">Stampa offerta professionale</button></section></div>
      <div class="truth-card"><strong>${SALES.mode === 'customer' ? 'Anteprima prima dell’acquisto' : 'Modalità Builder Easy Come'}</strong><p>${SALES.mode === 'customer' ? 'Il pacchetto software si acquista da solo. L’implementazione non viene mai aggiunta automaticamente: il cliente la seleziona soltanto quando desidera il servizio.' : 'Il pacchetto contiene anche workbook Excel, calendario operativo, database e checklist. L’implementazione è un servizio separato e facoltativo.'}</p></div>`;
  }

  function qualityScore() {
    return G.auditProject(project).score;
  }
  function renderSummary() {
    const price = G.calculatePrice(project), entities = G.buildEntities(project), audit = G.auditProject(project);
    $('#summary').innerHTML = `<div class="summary-brand"><span>${logoMarkup()}</span><div><strong>${esc(project.company.name || 'Nuovo gestionale')}</strong><small>${esc(project.company.industry || 'Progetto universale')}</small></div></div><div class="summary-metrics"><div><span>Moduli</span><strong>${project.modules.length}</strong></div><div><span>Sezioni</span><strong>${entities.length}</strong></div><div><span>Qualità</span><strong>${audit.score}</strong></div></div><div class="summary-quality ${audit.ready ? 'ready' : ''}"><span>${audit.ready ? 'PRONTO ALLA CONSEGNA' : 'CONTROLLO IN CORSO'}</span><strong>${esc(audit.grade)}</strong><small>${audit.blockers.length ? `${audit.blockers.length} elementi bloccanti` : 'Nessun blocco rilevato'}</small></div><div class="summary-capabilities"><span>Foglio Excel</span><span>Calendario</span><span>Database</span><span>Backup</span></div><div class="summary-list"><div><span>Software base</span><strong>${money(price.base)}</strong></div><div><span>Extra scelti</span><strong>${money(price.extras)}</strong></div>${price.implementation ? `<div><span>Implementazione opzionale</span><strong>${money(price.implementation)}</strong></div>` : ''}</div><div class="summary-total"><span>Totale una tantum</span><strong>${money(price.total)}</strong><small>${price.implementation ? 'Implementazione selezionata' : 'Implementazione non inclusa'}</small></div><button id="summaryPreview" class="btn btn-preview summary-cta">Prova l’anteprima</button><button id="resetProject" class="btn btn-ghost">Ricomincia da zero</button>`;
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
    $$('.remove-entity').forEach((button) => button.onclick = () => { project.customEntities = project.customEntities.filter((entity) => entity.key !== button.dataset.key); project.delivery.previewApproved = false; render(); });
    $$('.remove-draft-field').forEach((button) => button.onclick = () => { customFieldDraft.splice(Number(button.dataset.index), 1); renderPanel(); });
    $('#fieldType').onchange = (event) => $('#fieldOptions').classList.toggle('hidden', event.target.value !== 'select');
    $('#addField').onclick = () => { const label = $('#fieldLabel').value.trim(); if (!label) return toast('Inserisci il nome del campo.'); const type = $('#fieldType').value; customFieldDraft.push({ key: G.sqlName(label), label, type, required: $('#fieldRequired').checked, options: type === 'select' ? $('#fieldOptions').value.split(',').map((item) => item.trim()).filter(Boolean) : undefined }); renderPanel(); };
    $('#addEntity').onclick = () => { const label = $('#entityLabel').value.trim(), singular = $('#entitySingular').value.trim() || label; if (!label) return toast('Inserisci il nome della sezione.'); if (!customFieldDraft.length) return toast('Aggiungi almeno un campo.'); const key = G.sqlName(label); if (G.buildEntities(project).some((entity) => entity.key === key)) return toast('Esiste già una sezione con questo nome.'); project.customEntities.push({ key, label, singular, fields: customFieldDraft }); customFieldDraft = []; project.delivery.previewApproved = false; toast('Sezione creata.'); render(); };
  }

  function bindLogic() {
    if ($('#activatePricing')) $('#activatePricing').onclick = () => { if (!project.modules.includes('dynamic_pricing')) project.modules.push('dynamic_pricing'); project.pricing.enabled = true; project.delivery.previewApproved = false; render(); };
    if (project.pricing.enabled) {
      [['basePrice', 'basePrice'], ['priceUnit', 'unit'], ['taxPerPerson', 'taxPerPerson'], ['depositPercent', 'depositPercent']].forEach(([id, key]) => $('#' + id).oninput = (event) => { project.pricing[key] = ['basePrice', 'taxPerPerson', 'depositPercent'].includes(key) ? Number(event.target.value || 0) : event.target.value; project.delivery.previewApproved = false; saveDraft(); renderSummary(); });
      $$('.remove-pricing-rule').forEach((button) => button.onclick = () => { project.pricing.rules.splice(Number(button.dataset.index), 1); project.delivery.previewApproved = false; render(); });
      $('#addPricingRule').onclick = () => { const type = $('#pricingRuleType').value, name = $('#pricingRuleName').value.trim() || 'Nuova regola', value = Number($('#pricingRuleValue').value || 0), extra = $('#pricingRuleExtra').value.trim(); let rule = { type, name }; if (type === 'date_range') { const [from, to] = extra.split(',').map((item) => item.trim()); rule = { ...rule, from, to, multiplier: value || 1 }; } if (type === 'weekday_multiplier') rule = { ...rule, days: extra.split(',').map(Number).filter((item) => !Number.isNaN(item)), multiplier: value || 1 }; if (type === 'duration_discount') rule = { ...rule, min: Number(extra || 1), percent: value }; if (type === 'promo') rule = { ...rule, code: extra, percent: value }; project.pricing.rules.push(rule); project.delivery.previewApproved = false; render(); };
    }
    $$('.remove-automation').forEach((button) => button.onclick = () => { project.automations.splice(Number(button.dataset.index), 1); project.delivery.previewApproved = false; render(); });
    const map = { automationName: 'name', automationEntity: 'entity', automationTrigger: 'trigger', automationAction: 'action', automationTarget: 'target', automationMessage: 'message' };
    Object.keys(map).forEach((id) => { const input = $('#' + id); if (input) input.oninput = () => automationDraft[map[id]] = input.value; });
    $('#addAutomation').onclick = () => { if (!automationDraft.name.trim()) return toast('Dai un nome all’automazione.'); if (!project.modules.includes('automations')) project.modules.push('automations'); project.automations.push({ ...automationDraft, id: G.uuidv4() }); automationDraft = { name: '', trigger: 'record_created', entity: '', action: 'notify', target: '', message: '', enabled: true }; project.delivery.previewApproved = false; toast('Automazione aggiunta.'); render(); };
  }

  function bindDesign() {
    const upload = $('#logoUpload');
    upload.onchange = () => { const file = upload.files?.[0]; if (!file) return; if (file.size > 900000) return toast('Usa un logo più leggero di 900 KB.'); const reader = new FileReader(); reader.onload = () => { project.company.logoData = reader.result; project.delivery.previewApproved = false; render(); }; reader.readAsDataURL(file); };
    if ($('#removeLogo')) $('#removeLogo').onclick = () => { project.company.logoData = ''; project.delivery.previewApproved = false; render(); };
    [['primaryColor', 'primaryColorText', 'primaryColor'], ['accentColor', 'accentColorText', 'accentColor']].forEach(([pickerId, textId, key]) => { const picker = $('#' + pickerId), text = $('#' + textId); picker.oninput = () => { text.value = picker.value; project.company[key] = picker.value; project.delivery.previewApproved = false; saveDraft(); renderSummary(); }; text.oninput = () => { if (/^#[0-9a-f]{6}$/i.test(text.value)) picker.value = text.value; project.company[key] = text.value; project.delivery.previewApproved = false; saveDraft(); renderSummary(); }; });
    $$('.style-card').forEach((button) => button.onclick = () => { project.company.style = button.dataset.style; project.delivery.previewApproved = false; render(); });
    $('#portalEnabled').onchange = (event) => { project.portal.enabled = event.target.checked; if (event.target.checked && !project.modules.includes('portal')) project.modules.push('portal'); if (!event.target.checked) project.modules = project.modules.filter((id) => id !== 'portal'); project.delivery.previewApproved = false; render(); };
    $('#portalType').onchange = (event) => { project.portal.type = event.target.value; project.portal.collect = [...new Set(['name', 'email', ...(project.portal.collect || []).filter((key) => ['phone'].includes(key))])]; project.delivery.previewApproved = false; saveDraft(); renderPanel(); };
    $('#portalTitle').oninput = (event) => { project.portal.title = event.target.value; project.delivery.previewApproved = false; saveDraft(); renderSummary(); };
    $('#portalSuccess').oninput = (event) => { project.portal.successMessage = event.target.value; project.delivery.previewApproved = false; saveDraft(); };
    $$('.portal-field').forEach((checkbox) => checkbox.onchange = () => { project.portal.collect = $$('.portal-field:checked').map((item) => item.value); project.delivery.previewApproved = false; saveDraft(); });
  }

  function bindPreview() {
    bindPreviewControls($('#panel'));
    $('#approvePreview').onchange = (event) => { project.delivery.previewApproved = event.target.checked; saveDraft(); renderSummary(); };
    $('#fullscreenPreview').onclick = openPreviewOverlay;
  }

  function bindPreviewControls(root) {
    $$('[data-preview-mode]', root).forEach((button) => button.onclick = () => { previewMode = button.dataset.previewMode; const stage = button.closest('.preview-stage'); stage.outerHTML = previewStage(); bindPreviewControls($('#panel')); });
    $$('[data-device]', root).forEach((button) => button.onclick = () => { previewDevice = button.dataset.device; const stage = button.closest('.preview-stage'); stage.outerHTML = previewStage(); bindPreviewControls($('#panel')); });
    $$('[data-pv-entity]', root).forEach((button) => button.onclick = () => { previewMode = 'sheet'; previewEntityKey = button.dataset.pvEntity; const stage = button.closest('.preview-stage'); stage.outerHTML = previewStage(); bindPreviewControls($('#panel')); });
    $$('[data-pv-dashboard]', root).forEach((button) => button.onclick = () => { previewMode = 'dashboard'; const stage = button.closest('.preview-stage'); stage.outerHTML = previewStage(); bindPreviewControls($('#panel')); });
  }

  function openPreviewOverlay() {
    $('#previewRoot').innerHTML = `<div class="preview-overlay"><div class="preview-overlay-head"><div><h2>Anteprima live · ${esc(project.company.name || 'Nuovo gestionale')}</h2><p>Naviga dashboard, sezione e portale. Passa da desktop a mobile.</p></div><button class="close-preview" id="closePreview">×</button></div>${previewStage()}</div>`;
    $('#closePreview').onclick = () => $('#previewRoot').innerHTML = '';
    bindOverlayPreview();
  }

  function bindOverlayPreview() {
    const root = $('#previewRoot');
    $$('[data-preview-mode]', root).forEach((button) => button.onclick = () => { previewMode = button.dataset.previewMode; openPreviewOverlay(); });
    $$('[data-device]', root).forEach((button) => button.onclick = () => { previewDevice = button.dataset.device; openPreviewOverlay(); });
    $$('[data-pv-entity]', root).forEach((button) => button.onclick = () => { previewMode = 'sheet'; previewEntityKey = button.dataset.pvEntity; openPreviewOverlay(); });
    $$('[data-pv-dashboard]', root).forEach((button) => button.onclick = () => { previewMode = 'dashboard'; openPreviewOverlay(); });
  }

  const PREPARATION_STAGES = [
    { at: 0.00, label: 'Lettura della configurazione', note: 'Controllo dati, moduli e obiettivi' },
    { at: 0.18, label: 'Progettazione della struttura', note: 'Sezioni, campi e relazioni' },
    { at: 0.40, label: 'Verifica dei flussi', note: 'Prezzi, portale e automazioni' },
    { at: 0.63, label: 'Preparazione della specifica', note: 'Requisiti, dati e documenti di progetto' },
    { at: 0.84, label: 'Controllo finale', note: 'Qualità, sicurezza e preventivo' },
  ];

  function projectForCheckout() {
    return {
      ...project,
      company: { ...project.company, logoData: '' },
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
      <div class="checkout-copy"><div class="checkout-top"><div><span class="process-kicker">ORDINE EASY COME</span><h2 id="checkoutTitle">Il progetto è pronto.</h2><p>Controlla i dati e passa al pagamento sicuro.</p></div><button class="checkout-close" id="closeCheckout" type="button" aria-label="Chiudi">×</button></div>
        <div class="order-company"><span>Gestionale configurato per</span><h3>${esc(project.company.name || 'La tua impresa')}</h3><p>${esc(project.company.description || '')}</p></div>
        <div class="order-lines">${lines.map(([label, value]) => `<div><span>${esc(label)}</span><strong>${value < 0 ? '− ' : ''}${money(Math.abs(value))}</strong></div>`).join('')}</div>
        <div class="order-total"><div><span class="checkout-label">TOTALE UNA TANTUM</span><small>Nessun abbonamento Easy Come</small></div><strong>${money(price.total)}</strong></div>
        <div class="checkout-guarantees"><span>✓ Anteprima approvata prima del pagamento</span>${price.implementation ? '<span>✓ Implementazione assistita selezionata</span>' : '<span>✓ Pacchetto software senza servizi obbligatori</span>'}<span>✓ Pagamento protetto tramite Stripe</span><span>✓ Riepilogo dell’ordine associato all’email</span></div>
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
        const response = await fetch(SALES.checkoutEndpoint, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
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

  function triggerLabel(id) { return G.AUTOMATION_TRIGGERS.find((item) => item.id === id)?.label || id; }
  function actionLabel(id) { return G.AUTOMATION_ACTIONS.find((item) => item.id === id)?.label || id; }
  function portalFieldLabel(key) { return { name: 'Nome', email: 'Email', phone: 'Telefono', message: 'Messaggio' }[key] || key; }
  function ruleSummary(rule) { if (rule.type === 'date_range') return `${rule.from || '?'} → ${rule.to || '?'} · × ${rule.multiplier || 1}`; if (rule.type === 'weekday_multiplier') return `Giorni ${rule.days?.join(', ') || '?'} · × ${rule.multiplier || 1}`; if (rule.type === 'duration_discount') return `Da ${rule.min || 1} unità · -${rule.percent || 0}%`; if (rule.type === 'promo') return `Codice ${rule.code || '?'} · -${rule.percent || 0}%`; return JSON.stringify(rule); }

  $('#previous').onclick = () => { if (currentStep > 0) currentStep -= 1; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  $('#next').onclick = () => { currentStep = currentStep === steps.length - 1 ? 0 : currentStep + 1; render(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  $('#globalPreview').onclick = openPreviewOverlay;
  $('#globalPreviewMobile').onclick = openPreviewOverlay;

  render();
}());
