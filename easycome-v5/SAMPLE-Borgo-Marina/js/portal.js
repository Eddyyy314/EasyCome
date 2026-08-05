'use strict';
(() => {
  const cfg = window.APP_CONFIG || {};
  const project = cfg.project || {};
  const company = project.company || {};
  const portal = project.portal || {};
  const pricing = project.pricing || {};
  const root = document.getElementById('portal');
  const cloudReady = Boolean(
    cfg.supabaseUrl && cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.includes('INSERISCI_') &&
    !cfg.supabaseAnonKey.includes('INSERISCI_') &&
    window.supabase
  );
  const db = cloudReady ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const $ = (selector, parent = document) => parent.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
  const uid = () => globalThis.crypto?.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now();
  const storage = (() => {
    try { localStorage.setItem('__ec__', '1'); localStorage.removeItem('__ec__'); return localStorage; }
    catch (_) { const memory = {}; return { getItem: (key) => memory[key] || null, setItem: (key, value) => { memory[key] = String(value); } }; }
  })();
  const clientTokenKey = `easycome:${project.organizationId}:client-token`;
  let clientToken = storage.getItem(clientTokenKey);
  if (!clientToken) { clientToken = uid(); storage.setItem(clientTokenKey, clientToken); }
  let step = 1;
  let draft = {};

  const labels = {
    name: 'Nome e cognome', email: 'Email', phone: 'Telefono', message: 'Dettagli della richiesta',
    start_date: 'Data di inizio', end_date: 'Data di fine', preferred_date: 'Data e ora preferita',
    people: 'Persone / quantità', quantity: 'Quantità', service: 'Servizio richiesto', product: 'Prodotto richiesto',
    subject: 'Oggetto', promo: 'Codice promozionale',
  };
  const types = { email: 'email', phone: 'tel', start_date: 'date', end_date: 'date', preferred_date: 'datetime-local', people: 'number', quantity: 'number' };
  const fieldsByType = {
    request: ['message'], quote: ['service', 'quantity', 'message'], booking: ['start_date', 'end_date', 'people', 'message'],
    appointment: ['service', 'preferred_date', 'message'], order: ['product', 'quantity', 'message'], support: ['subject', 'message'],
  };

  function initials() {
    return String(company.name || 'EC').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
  }

  function brandMark() {
    return company.logoData
      ? `<img src="${company.logoData}" alt="${esc(company.name || 'Logo')}">`
      : esc(initials());
  }

  function money(value) {
    return new Intl.NumberFormat(company.locale || 'it-IT', {
      style: 'currency', currency: company.currency || 'EUR', maximumFractionDigits: 2,
    }).format(Number(value || 0));
  }

  function pricingResult(data) {
    let base = Number(pricing.basePrice || 0);
    const start = data.start_date ? new Date(data.start_date) : null;
    const end = data.end_date ? new Date(data.end_date) : null;
    const people = Math.max(1, Number(data.people || 1));
    let units = 1;
    if (start && end && end > start) units = Math.max(1, Math.ceil((end - start) / 86_400_000));
    let subtotal = base * units;
    const adjustments = [];

    for (const rule of pricing.rules || []) {
      if (rule.type === 'duration_discount' && units >= Number(rule.min || 0)) {
        const amount = subtotal * Number(rule.percent || 0) / 100;
        subtotal -= amount;
        adjustments.push({ label: rule.name || `Sconto ${rule.percent}%`, amount: -amount });
      }
      if (rule.type === 'weekday_multiplier' && start && (rule.days || []).includes(start.getDay())) {
        const before = subtotal;
        subtotal *= Number(rule.multiplier || 1);
        adjustments.push({ label: rule.name || 'Tariffa giorno', amount: subtotal - before });
      }
      if (rule.type === 'date_range' && start && rule.from && rule.to && start >= new Date(rule.from) && start <= new Date(rule.to)) {
        const before = subtotal;
        subtotal *= Number(rule.multiplier || 1);
        adjustments.push({ label: rule.name || 'Tariffa periodo', amount: subtotal - before });
      }
      if (rule.type === 'promo' && data.promo && String(data.promo).trim().toLowerCase() === String(rule.code || '').trim().toLowerCase()) {
        const amount = subtotal * Number(rule.percent || 0) / 100;
        subtotal -= amount;
        adjustments.push({ label: rule.name || `Promozione ${rule.percent}%`, amount: -amount });
      }
    }

    const selectedExtras = (pricing.extras || []).filter((extra) => extra.required || data[`extra_${extra.id || extra.name}`] === 'on');
    const extras = selectedExtras.reduce((sum, extra) => sum + Number(extra.price || 0), 0);
    const taxes = people * Number(pricing.taxPerPerson || 0) * units;
    const total = Math.max(0, subtotal + extras + taxes);
    const deposit = total * Number(pricing.depositPercent || 0) / 100;
    return { base, units, people, subtotal, extras, taxes, total, deposit, adjustments, selectedExtras };
  }

  function fieldInput(key) {
    if (key === 'message') return `<textarea name="message" required placeholder="Descrivi cosa ti serve, date, preferenze o informazioni utili…">${esc(draft.message || '')}</textarea>`;
    const value = draft[key] || '';
    return `<input type="${types[key] || 'text'}" name="${esc(key)}" value="${esc(value)}" ${['name', 'email'].includes(key) ? 'required' : ''} ${['people', 'quantity'].includes(key) ? 'min="1"' : ''}>`;
  }

  function visibleFields() {
    const fields = [...(portal.collect || ['name', 'email', 'phone'])];
    for (const key of fieldsByType[portal.type || 'request'] || fieldsByType.request) if (!fields.includes(key)) fields.push(key);
    if (pricing.enabled) ['start_date', 'end_date', 'people', 'promo'].forEach((key) => { if (!fields.includes(key)) fields.push(key); });
    return fields;
  }

  function render() {
    if (!portal.enabled) {
      root.innerHTML = `<main class="portal-unavailable"><div class="brand-mark">${brandMark()}</div><h1>Portale non attivo</h1><p>Contatta direttamente ${esc(company.name || 'l’azienda')} per ricevere assistenza.</p>${company.email ? `<a href="mailto:${esc(company.email)}">${esc(company.email)}</a>` : ''}</main>`;
      return;
    }

    const fields = visibleFields();
    const contactFields = fields.filter((key) => ['name', 'email', 'phone'].includes(key));
    const detailFields = fields.filter((key) => !['name', 'email', 'phone'].includes(key));
    const result = pricingResult(draft);

    root.innerHTML = `<main class="portal-shell premium-portal">
      <header class="portal-top"><div class="portal-brand"><div class="brand-mark">${brandMark()}</div><div><strong>${esc(company.name || 'Azienda')}</strong><span>Portale clienti</span></div></div><div class="portal-progress"><i class="${step >= 1 ? 'active' : ''}"></i><i class="${step >= 2 ? 'active' : ''}"></i><i class="${step >= 3 ? 'active' : ''}"></i><span>Passaggio ${step} di 3</span></div></header>
      <section class="portal-layout">
        <aside class="portal-story"><div><span class="kicker">RICHIESTA SEMPLICE · RISPOSTA VELOCE</span><h1>${esc(portal.title || 'Raccontaci cosa ti serve.')}</h1><p>${esc(company.description || 'Compila pochi campi: la richiesta arriverà direttamente al team e resterà tracciata.')}</p></div><div class="trust-list"><span><b>01</b> I dati arrivano nel gestionale</span><span><b>02</b> Ricevi una conferma immediata</span><span><b>03</b> Nessun passaggio inutile</span></div>${company.phone || company.email ? `<div class="portal-contact"><small>Preferisci parlare con noi?</small>${company.phone ? `<a href="tel:${esc(company.phone)}">${esc(company.phone)}</a>` : ''}${company.email ? `<a href="mailto:${esc(company.email)}">${esc(company.email)}</a>` : ''}</div>` : ''}</aside>
        <section class="portal-form-wrap">
          ${step === 1 ? `<div class="portal-step"><span class="step-kicker">I TUOI DATI</span><h2>Come possiamo ricontattarti?</h2><p>Inserisci solo le informazioni essenziali.</p><form id="stepForm" class="portal-form">${contactFields.map((key) => `<label class="field"><span>${esc(labels[key] || key)}</span>${fieldInput(key)}</label>`).join('')}<div class="full portal-actions"><button class="btn btn-primary" type="submit">Continua <span>→</span></button></div></form></div>` : ''}
          ${step === 2 ? `<div class="portal-step"><span class="step-kicker">LA RICHIESTA</span><h2>Dicci cosa ti serve</h2><p>Puoi rivedere tutto prima dell’invio.</p>${pricing.enabled ? `<div class="quote-box premium"><div><small>STIMA AGGIORNATA</small><span>${result.units} ${esc(pricing.unit || 'unità')} · ${result.people} persone/quantità</span></div><strong id="quoteTotal">${money(result.total)}</strong></div>` : ''}<form id="stepForm" class="portal-form">${detailFields.map((key) => `<label class="field ${key === 'message' ? 'full' : ''}"><span>${esc(labels[key] || key)}</span>${fieldInput(key)}</label>`).join('')}${(pricing.extras || []).length ? `<fieldset class="full extras-fieldset"><legend>Extra disponibili</legend>${(pricing.extras || []).map((extra) => `<label><input type="checkbox" name="extra_${esc(extra.id || extra.name)}" ${extra.required ? 'checked disabled' : draft[`extra_${extra.id || extra.name}`] === 'on' ? 'checked' : ''}><span>${esc(extra.name)}${extra.required ? ' · obbligatorio' : ''}</span><strong>${money(extra.price)}</strong></label>`).join('')}</fieldset>` : ''}<input class="honeypot" name="website" tabindex="-1" autocomplete="off"><div class="full portal-actions split"><button class="btn btn-secondary" type="button" id="backStep">Indietro</button><button class="btn btn-primary" type="submit">Rivedi richiesta <span>→</span></button></div></form></div>` : ''}
          ${step === 3 ? `<div class="portal-step"><span class="step-kicker">RIEPILOGO</span><h2>Controlla e invia</h2><p>Verifica i dati prima della conferma.</p><div class="review-list">${visibleFields().filter((key) => draft[key]).map((key) => `<div><span>${esc(labels[key] || key)}</span><strong>${esc(draft[key])}</strong></div>`).join('')}</div>${pricing.enabled ? `<div class="price-review"><div><span>Stima totale</span><strong>${money(result.total)}</strong></div>${result.deposit > 0 ? `<small>Caparra prevista: ${money(result.deposit)}</small>` : ''}</div>` : ''}<label class="privacy-check"><input id="privacyConsent" type="checkbox"><span>Confermo che i dati inseriti sono corretti e acconsento al loro utilizzo per gestire questa richiesta.</span></label><div class="portal-actions split"><button class="btn btn-secondary" id="backStep" type="button">Modifica</button><button class="btn btn-primary" id="submitRequest" type="button">Invia richiesta</button></div><div id="result"></div></div>` : ''}
        </section>
      </section>
    </main>`;

    bind(result);
  }

  function collect(form) {
    const data = Object.fromEntries(new FormData(form));
    draft = { ...draft, ...data };
  }

  function bind(result) {
    const form = $('#stepForm');
    if (form) {
      form.oninput = () => {
        collect(form);
        if (pricing.enabled) {
          const value = pricingResult(draft);
          const total = $('#quoteTotal');
          if (total) total.textContent = money(value.total);
        }
      };
      form.onsubmit = (event) => {
        event.preventDefault();
        collect(form);
        step = Math.min(3, step + 1);
        render();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }
    $('#backStep')?.addEventListener('click', () => { step = Math.max(1, step - 1); render(); });
    $('#submitRequest')?.addEventListener('click', () => submit(result));
  }

  async function submit(result) {
    const consent = $('#privacyConsent');
    if (!consent?.checked) {
      const target = $('#result');
      target.innerHTML = '<div class="alert alert-error">Conferma il consenso per procedere.</div>';
      return;
    }
    const button = $('#submitRequest');
    button.disabled = true;
    button.textContent = 'Invio in corso…';
    const payload = {
      ...draft,
      estimated_total: pricing.enabled ? result.total : undefined,
      estimated_deposit: pricing.enabled ? result.deposit : undefined,
      pricing_breakdown: pricing.enabled ? result : undefined,
      submitted_at: new Date().toISOString(),
    };
    try {
      if (cloudReady) {
        const { error } = await db.rpc('submit_public_request', {
          p_organization_id: project.organizationId,
          p_source: portal.type || 'request',
          p_payload: payload,
          p_client_token: clientToken,
          p_website: draft.website || '',
        });
        if (error) throw error;
      } else {
        const key = `easycome:${project.organizationId}:public_submissions`;
        const rows = JSON.parse(storage.getItem(key) || '[]');
        rows.unshift({
          id: uid(), organization_id: project.organizationId, source: portal.type || 'request',
          name: draft.name || '', email: draft.email || '', phone: draft.phone || '',
          message: draft.message || '', status: 'Nuova', payload,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        });
        storage.setItem(key, JSON.stringify(rows));
      }
      root.innerHTML = `<main class="portal-success"><div class="success-mark">✓</div><span>RICHIESTA RICEVUTA</span><h1>${esc(portal.successMessage || 'Grazie, abbiamo ricevuto tutto.')}</h1><p>La richiesta è stata registrata correttamente. ${esc(company.name || 'Il team')} potrà ricontattarti usando i dati indicati.</p>${pricing.enabled ? `<div class="success-total"><small>STIMA SALVATA</small><strong>${money(result.total)}</strong></div>` : ''}<button class="btn btn-secondary" id="newRequest">Invia un’altra richiesta</button></main>`;
      $('#newRequest').onclick = () => { step = 1; draft = {}; render(); };
    } catch (error) {
      const target = $('#result');
      target.innerHTML = `<div class="alert alert-error">${esc(error.message || String(error))}</div>`;
      button.disabled = false;
      button.textContent = 'Invia richiesta';
    }
  }

  window.__EASYCOME_PORTAL_TEST__ = { project, pricingResult, visibleFields };
  render();
})();
