'use strict';
(() => {
  const cfg = window.APP_CONFIG || {};
  const project = cfg.project || {};
  const company = project.company || {};
  const entities = (project.entities || []).filter(Boolean);
  const modules = new Set(project.modules || []);
  const orgId = project.organizationId;
  const app = document.getElementById('app');
  const cloudReady = Boolean(
    cfg.supabaseUrl && cfg.supabaseAnonKey &&
    !cfg.supabaseUrl.includes('INSERISCI_') &&
    !cfg.supabaseAnonKey.includes('INSERISCI_') &&
    window.supabase
  );
  const db = cloudReady ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;

  const state = {
    session: null,
    role: cloudReady ? 'guest' : 'owner',
    view: 'dashboard',
    entity: entities.find((item) => !item.system) || entities[0],
    entityMode: {},
    rows: [],
    query: '',
    statusFilter: '',
    sortKey: 'created_at',
    sortDir: 'desc',
    busy: false,
    selectedRows: new Set(),
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;',
  }[char]));
  const uid = () => globalThis.crypto?.randomUUID?.() || 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.random() * 16 | 0;
    const value = char === 'x' ? random : (random & 3 | 8);
    return value.toString(16);
  });
  const storage = (() => {
    try {
      const key = '__easycome_storage_test__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return localStorage;
    } catch (_) {
      const memory = {};
      return {
        getItem: (key) => Object.prototype.hasOwnProperty.call(memory, key) ? memory[key] : null,
        setItem: (key, value) => { memory[key] = String(value); },
        removeItem: (key) => { delete memory[key]; },
      };
    }
  })();

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

  function dateLabel(value, withTime = false) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(company.locale || 'it-IT', withTime
      ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
      : { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  }

  function relativeTime(value) {
    if (!value) return '';
    const diff = Date.now() - new Date(value).getTime();
    if (diff < 60_000) return 'adesso';
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} min fa`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} h fa`;
    return `${Math.floor(diff / 86_400_000)} gg fa`;
  }

  function keyFor(entity) {
    return `easycome:${orgId}:${entity.key}`;
  }

  function can(action) {
    if (!cloudReady) return true;
    if (state.role === 'owner' || state.role === 'admin') return true;
    if (action === 'read') return ['member', 'viewer'].includes(state.role);
    if (action === 'write') return state.role === 'member';
    return false;
  }

  function toast(message, type = 'success') {
    const node = document.createElement('div');
    node.className = `toast toast-${type}`;
    node.innerHTML = `<span>${type === 'error' ? '!' : '✓'}</span><div>${esc(message)}</div>`;
    document.body.appendChild(node);
    requestAnimationFrame(() => node.classList.add('show'));
    setTimeout(() => {
      node.classList.remove('show');
      setTimeout(() => node.remove(), 220);
    }, 2800);
  }

  function download(filename, content, type = 'text/plain;charset=utf-8') {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2500);
  }

  function fieldValue(field, row) {
    const value = row?.[field.key];
    if (value === null || value === undefined || value === '') return '—';
    if (field.type === 'currency') return money(value);
    if (field.type === 'date') return dateLabel(value);
    if (field.type === 'datetime') return dateLabel(value, true);
    if (field.type === 'boolean') return value ? 'Sì' : 'No';
    return String(value);
  }

  function sampleValue(entity, field, index) {
    const key = `${entity.key} ${field.key} ${field.label}`.toLowerCase();
    const names = ['Giulia Romano', 'Marco De Luca', 'Sofia Conti', 'Andrea Marino', 'Elena Greco', 'Luca Bianchi', 'Sara Esposito', 'Davide Russo'];
    const companies = ['Alba Srl', 'Studio Nord', 'Bottega 21', 'Linea Verde', 'Nova Lab', 'Casa Blu', 'Orizzonte', 'Forma Studio'];
    const statuses = field.options?.length ? field.options : ['Nuovo', 'In corso', 'Completato'];
    const today = new Date();
    const future = new Date(today.getTime() + (index - 2) * 86_400_000);
    const past = new Date(today.getTime() - index * 3 * 86_400_000);

    if (field.type === 'select') return statuses[index % statuses.length];
    if (field.type === 'boolean') return index % 4 !== 3;
    if (field.type === 'currency') return [120, 245, 89, 460, 780, 165, 320, 1120][index % 8];
    if (field.type === 'number') {
      if (key.includes('stock') || key.includes('giacenza')) return [2, 18, 4, 35, 7, 22, 1, 14][index % 8];
      if (key.includes('progress')) return [15, 35, 58, 80, 100, 24, 67, 42][index % 8];
      if (key.includes('people') || key.includes('quantity')) return [2, 4, 1, 6, 3, 5, 2, 8][index % 8];
      return [1, 3, 5, 8, 12, 18, 24, 30][index % 8];
    }
    if (field.type === 'date') return (key.includes('due') || key.includes('scaden') || key.includes('end'))
      ? future.toISOString().slice(0, 10)
      : past.toISOString().slice(0, 10);
    if (field.type === 'datetime') {
      future.setHours(9 + (index % 7), index % 2 ? 30 : 0, 0, 0);
      return future.toISOString();
    }
    if (key.includes('email')) return `cliente${index + 1}@esempio.it`;
    if (key.includes('phone') || key.includes('telefono')) return `+39 333 45${String(2100 + index).slice(-4)}`;
    if (key.includes('customer') || key.includes('cliente')) return index % 3 ? names[index % names.length] : companies[index % companies.length];
    if (key.includes('name') || key.includes('nome')) {
      if (entity.key === 'products') return ['Crema viso', 'Kit manutenzione', 'Lampada LED', 'Filtro Pro', 'Pack Premium', 'Ricambio A12', 'Servizio Plus', 'Starter Kit'][index];
      if (entity.key === 'resources') return ['Sala A', 'Postazione 2', 'Camera 3', 'Veicolo 4', 'Tavolo 5', 'Operatore 6', 'Spazio 7', 'Unità 8'][index];
      if (entity.key === 'services') return ['Consulenza iniziale', 'Trattamento completo', 'Revisione', 'Intervento rapido', 'Pacchetto Premium', 'Controllo', 'Assistenza', 'Sessione individuale'][index];
      return names[index % names.length];
    }
    if (key.includes('title') || key.includes('subject') || key.includes('oggetto')) return ['Richiamare il cliente', 'Confermare la richiesta', 'Preparare il preventivo', 'Controllo qualità', 'Inviare documenti', 'Verifica scadenza', 'Aggiornare pratica', 'Consegna finale'][index];
    if (key.includes('number') || key.includes('numero')) return `${new Date().getFullYear()}-${String(index + 1).padStart(3, '0')}`;
    if (key.includes('sku') || key.includes('code') || key.includes('codice')) return `EC-${String(100 + index)}`;
    if (key.includes('resource')) return ['Sala A', 'Postazione 2', 'Camera 3', 'Tavolo 4'][index % 4];
    if (key.includes('operator') || key.includes('assignee') || key.includes('responsabile')) return ['Chiara', 'Matteo', 'Francesca', 'Paolo'][index % 4];
    if (key.includes('service')) return ['Consulenza', 'Trattamento', 'Revisione', 'Assistenza'][index % 4];
    if (key.includes('category') || key.includes('categoria')) return ['Premium', 'Standard', 'Servizi', 'Materiali'][index % 4];
    if (key.includes('status') || key.includes('stato')) return statuses[index % statuses.length];
    if (field.type === 'longtext' || key.includes('notes') || key.includes('note')) return ['Cliente da ricontattare nel pomeriggio.', 'Richiesta verificata e pronta per il prossimo passaggio.', 'Documentazione ricevuta correttamente.', 'Priorità concordata con il team.'][index % 4];
    return ['Informazione verificata', 'Dato operativo', 'Aggiornamento interno', 'Voce personalizzata'][index % 4];
  }

  function seed(entity) {
    const rows = Array.from({ length: 8 }, (_, index) => {
      const record = {
        id: uid(),
        organization_id: orgId,
        created_at: new Date(Date.now() - index * 2 * 86_400_000).toISOString(),
        updated_at: new Date(Date.now() - index * 3_600_000).toISOString(),
      };
      entity.fields.forEach((field) => { record[field.key] = sampleValue(entity, field, index); });
      return record;
    });
    storage.setItem(keyFor(entity), JSON.stringify(rows));
    return rows;
  }

  async function list(entity) {
    if (!entity) return [];
    if (!cloudReady) {
      let rows = JSON.parse(storage.getItem(keyFor(entity)) || '[]');
      if (!rows.length) rows = seed(entity);
      return rows;
    }
    const { data, error } = await db.from(entity.key).select('*').eq('organization_id', orgId).order('created_at', { ascending: false }).limit(2500);
    if (error) throw error;
    return data || [];
  }

  async function uploadDocument(file, recordId) {
    if (!file) return '';
    if (!cloudReady) return `Documento locale: ${file.name}`;
    const extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
    const path = `${orgId}/${recordId || uid()}/${Date.now()}.${extension}`;
    const { error } = await db.storage.from('easycome-documents').upload(path, file, { upsert: false });
    if (error) throw error;
    const { data, error: signedError } = await db.storage.from('easycome-documents').createSignedUrl(path, 60 * 60 * 24 * 365);
    if (signedError) throw signedError;
    return data.signedUrl;
  }

  async function validateRecord(entity, record, id) {
    const start = record.start_at || record.start_date;
    let end = record.end_at || record.end_date;
    if (!end && entity.key === 'appointments' && record.start_at) {
      end = new Date(new Date(record.start_at).getTime() + Number(record.duration_minutes || 30) * 60_000).toISOString();
    }
    if (start && end && new Date(end) <= new Date(start)) throw new Error('La data finale deve essere successiva a quella iniziale.');

    const overlapEntities = ['bookings', 'appointments', 'shifts'];
    if (!overlapEntities.includes(entity.key) || !start) return;
    const endValue = end || new Date(new Date(start).getTime() + 30 * 60_000).toISOString();
    const resourceKey = entity.key === 'appointments' ? 'operator_name' : entity.key === 'shifts' ? 'staff_name' : 'resource_name';
    const resource = record[resourceKey];
    if (!resource) return;
    const rows = await list(entity);
    const conflict = rows.find((row) => {
      if (row.id === id || row[resourceKey] !== resource || String(row.status || '').toLowerCase().includes('annull')) return false;
      const rowStart = row.start_at || row.start_date;
      let rowEnd = row.end_at || row.end_date;
      if (!rowEnd && entity.key === 'appointments' && row.start_at) rowEnd = new Date(new Date(row.start_at).getTime() + Number(row.duration_minutes || 30) * 60_000).toISOString();
      if (!rowStart || !rowEnd) return false;
      return new Date(start) < new Date(rowEnd) && new Date(endValue) > new Date(rowStart);
    });
    if (conflict) throw new Error(`${resource} risulta già occupato in questo intervallo.`);
  }

  async function save(entity, record, id) {
    await validateRecord(entity, record, id);
    if (!cloudReady) {
      const rows = await list(entity);
      if (id) {
        const index = rows.findIndex((row) => row.id === id);
        if (index === -1) throw new Error('Elemento non trovato.');
        rows[index] = { ...rows[index], ...record, updated_at: new Date().toISOString() };
      } else {
        rows.unshift({ id: uid(), organization_id: orgId, ...record, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
      }
      storage.setItem(keyFor(entity), JSON.stringify(rows));
      return;
    }
    const payload = { ...record, organization_id: orgId };
    const response = id
      ? await db.from(entity.key).update(payload).eq('id', id).eq('organization_id', orgId)
      : await db.from(entity.key).insert(payload);
    if (response.error) throw response.error;
  }

  async function remove(entity, id) {
    if (!cloudReady) {
      const rows = (await list(entity)).filter((row) => row.id !== id);
      storage.setItem(keyFor(entity), JSON.stringify(rows));
      return;
    }
    const { error } = await db.from(entity.key).delete().eq('id', id).eq('organization_id', orgId);
    if (error) throw error;
  }

  function statusField(entity) {
    return entity.fields.find((field) => field.key === 'status' || field.key.toLowerCase().includes('stato'));
  }

  function dateField(entity) {
    return entity.fields.find((field) => ['start_at', 'start_date', 'appointment_date', 'due_date', 'deadline', 'order_date', 'issue_date', 'movement_date', 'payment_date', 'expense_date', 'maintenance_date'].includes(field.key))
      || entity.fields.find((field) => field.type === 'datetime')
      || entity.fields.find((field) => field.type === 'date');
  }

  function availableModes(entity) {
    const modes = [{ id: 'table', label: 'Tabella' }, { id: 'sheet', label: 'Foglio' }];
    if (statusField(entity)) modes.push({ id: 'board', label: 'Bacheca' });
    if (dateField(entity)) {
      modes.push({ id: 'agenda', label: 'Agenda' });
      modes.push({ id: 'month', label: 'Mese' });
    }
    if (['bookings', 'appointments', 'shifts'].includes(entity.key)) modes.push({ id: 'availability', label: 'Disponibilità' });
    if (['customers', 'products', 'resources', 'staff', 'services', 'assets'].includes(entity.key)) modes.push({ id: 'cards', label: 'Schede' });
    return modes;
  }

  function currentMode(entity) {
    const choices = availableModes(entity);
    const saved = state.entityMode[entity.key];
    return choices.some((item) => item.id === saved) ? saved : choices[0].id;
  }

  function filterRows(entity, rows) {
    const query = state.query.toLowerCase().trim();
    const status = state.statusFilter;
    const filtered = rows.filter((row) => {
      if (status && String(row[statusField(entity)?.key] || '') !== status) return false;
      if (!query) return true;
      return JSON.stringify(row).toLowerCase().includes(query);
    });
    return filtered.sort((a, b) => {
      const left = a[state.sortKey];
      const right = b[state.sortKey];
      const direction = state.sortDir === 'asc' ? 1 : -1;
      if (left === right) return 0;
      return String(left ?? '').localeCompare(String(right ?? ''), undefined, { numeric: true }) * direction;
    });
  }

  function sidebar() {
    const visibleEntities = entities.filter((entity) => !entity.system);
    return `<aside class="sidebar">
      <div class="brand"><div class="brand-mark">${brandMark()}</div><div class="brand-copy"><strong>${esc(company.name || 'Gestionale')}</strong><span>${cloudReady ? 'Spazio cloud' : 'Demo interattiva'}</span></div></div>
      <div class="nav-label">Panoramica</div>
      <nav class="nav">
        <button data-view="dashboard" class="${state.view === 'dashboard' ? 'active' : ''}"><span class="nav-icon">⌂</span>Panoramica</button>
      </nav>
      <div class="nav-label">Lavoro</div>
      <nav class="nav">${visibleEntities.map((entity) => `<button data-entity="${esc(entity.key)}" class="${state.view === 'entity' && state.entity?.key === entity.key ? 'active' : ''}"><span class="nav-icon">${esc(entity.label[0] || '•')}</span>${esc(entity.label)}</button>`).join('')}</nav>
      <div class="nav-label">Sistema</div>
      <nav class="nav">
        ${project.portal?.enabled ? '<button data-portal><span class="nav-icon">↗</span>Portale clienti</button>' : ''}
        <button data-view="settings" class="${state.view === 'settings' ? 'active' : ''}"><span class="nav-icon">⚙</span>Impostazioni</button>
      </nav>
      <div class="sidebar-footer"><strong>${esc(state.role.toUpperCase())}</strong><br>${cloudReady ? 'Dati protetti da Supabase RLS.' : 'I dati della demo restano in questo browser.'}</div>
    </aside>`;
  }

  function shell() {
    app.innerHTML = `<div class="shell">${sidebar()}<main class="main" id="main"><div class="empty">Caricamento…</div></main></div><div id="modal"></div>`;
    $$('[data-view]').forEach((button) => button.onclick = () => {
      state.view = button.dataset.view;
      state.query = '';
      state.statusFilter = '';
      shell();
    });
    $$('[data-entity]').forEach((button) => button.onclick = () => {
      state.view = 'entity';
      state.entity = entities.find((entity) => entity.key === button.dataset.entity);
      state.query = '';
      state.statusFilter = '';
      shell();
    });
    $('[data-portal]')?.addEventListener('click', () => window.open('portal.html', '_blank', 'noopener'));
    if (state.view === 'dashboard') renderDashboard();
    if (state.view === 'entity') loadEntity();
    if (state.view === 'settings') renderSettings();
  }

  async function renderDashboard() {
    const main = $('#main');
    try {
      const relevant = entities.filter((entity) => !entity.system).slice(0, 14);
      const datasets = await Promise.all(relevant.map(async (entity) => ({ entity, rows: await list(entity) })));
      const allRows = datasets.flatMap((item) => item.rows.map((row) => ({ entity: item.entity, row })));
      const total = allRows.length;
      const recent = allRows.filter(({ row }) => new Date(row.created_at) > new Date(Date.now() - 7 * 86_400_000)).length;
      const revenue = allRows.reduce((sum, { row }) => sum + Number(row.total || row.amount || row.price || 0), 0);
      const open = allRows.filter(({ row }) => /nuov|apert|da fare|in corso|richiest|prenotat|confermat/i.test(String(row.status || ''))).length;
      const upcoming = allRows.filter(({ row }) => {
        const value = row.start_at || row.start_date || row.due_date || row.deadline;
        return value && new Date(value) >= new Date() && new Date(value) <= new Date(Date.now() + 7 * 86_400_000);
      }).slice(0, 7);
      const lowStock = allRows.filter(({ entity, row }) => entity.key === 'products' && Number(row.stock) <= 5);
      const chart = Array.from({ length: 7 }, (_, index) => {
        const from = new Date(Date.now() - (6 - index) * 86_400_000);
        const key = from.toISOString().slice(0, 10);
        return allRows.filter(({ row }) => String(row.created_at || '').slice(0, 10) === key).length;
      });
      const maxChart = Math.max(...chart, 1);
      const today = new Intl.DateTimeFormat(company.locale || 'it-IT', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

      main.innerHTML = `<header class="topbar"><div><h1>Panoramica</h1><p>${esc(today.charAt(0).toUpperCase() + today.slice(1))} · dati aggiornati</p></div><div class="top-actions"><span class="sync-pill ${cloudReady ? 'online' : 'demo'}">${cloudReady ? '● Cloud attivo' : '● Demo locale'}</span><button class="btn btn-secondary" id="quickBackup">Backup</button><div class="avatar">${esc(initials())}</div></div></header>
        <section class="hero-strip"><div><span>IL TUO SPAZIO OPERATIVO</span><h2>Buon lavoro, ${esc((company.name || 'azienda').split(' ')[0])}.</h2><p>${esc(company.description || 'Clienti, attività e numeri importanti in un unico spazio ordinato.')}</p></div><button class="hero-action" id="quickNew">+ Nuova voce</button></section>
        <section class="grid"><article class="stat"><div class="stat-top"><span>Record gestiti</span><i>Σ</i></div><strong>${total}</strong><small>+${recent} negli ultimi 7 giorni</small></article><article class="stat"><div class="stat-top"><span>Valore registrato</span><i>€</i></div><strong>${money(revenue)}</strong><small>Somma di importi e totali</small></article><article class="stat"><div class="stat-top"><span>Da seguire</span><i>!</i></div><strong>${open}</strong><small>Attività e richieste aperte</small></article><article class="stat"><div class="stat-top"><span>Automazioni</span><i>⚡</i></div><strong>${(project.automations || []).length}</strong><small>${project.portal?.enabled ? 'Portale collegato' : 'Uso interno'}</small></article></section>
        <section class="dashboard-grid"><article class="card"><div class="card-head"><div><h2>Movimenti della settimana</h2><p>Nuovi elementi registrati giorno per giorno</p></div><span class="badge">Tempo reale</span></div><div class="card-body"><div class="chart">${chart.map((value) => `<div class="chart-bar" data-value="${value}" style="height:${Math.max(9, Math.round(value / maxChart * 100))}%"></div>`).join('')}</div></div></article><article class="card"><div class="card-head"><div><h2>Prossimi impegni</h2><p>Sette giorni</p></div></div><div class="card-body activity-list">${upcoming.length ? upcoming.map(({ entity, row }) => `<button class="activity activity-button" data-open-entity="${esc(entity.key)}" data-open-id="${row.id}"><div class="activity-icon">${esc(entity.label[0])}</div><div><strong>${esc(primaryLabel(entity, row))}</strong><small>${esc(entity.label)} · ${esc(dateLabel(row.start_at || row.start_date || row.due_date || row.deadline, true))}</small></div><time>→</time></button>`).join('') : '<div class="empty compact">Nessuna scadenza imminente.</div>'}</div></article></section>
        ${(lowStock.length || project.portal?.enabled) ? `<section class="insight-grid">${lowStock.length ? `<article class="insight danger"><span>SCORTE DA CONTROLLARE</span><strong>${lowStock.length} prodotti sotto soglia</strong><p>${lowStock.slice(0, 4).map(({ row }) => esc(row.name || row.sku || 'Prodotto')).join(' · ')}</p><button data-open-section="products">Apri magazzino</button></article>` : ''}${project.portal?.enabled ? `<article class="insight"><span>PORTALE CLIENTI</span><strong>Il canale pubblico è pronto</strong><p>Le richieste entrano direttamente nel gestionale.</p><button data-open-portal>Apri portale</button></article>` : ''}</section>` : ''}
        <section class="card" style="margin-top:14px"><div class="card-head"><div><h2>Accessi rapidi</h2><p>Le sezioni più usate</p></div></div><div class="card-body entity-cards">${datasets.slice(0, 8).map(({ entity, rows }) => `<button class="entity-link" data-open-section="${esc(entity.key)}"><b>${esc(entity.label)}</b><small>${rows.length} elementi · ${availableModes(entity).map((mode) => mode.label).join(', ')}</small></button>`).join('')}</div></section>`;

      $('#quickNew').onclick = () => {
        state.view = 'entity';
        state.entity = relevant[0];
        shell();
        setTimeout(() => openForm(), 50);
      };
      $('#quickBackup').onclick = exportBackup;
      $$('[data-open-section]').forEach((button) => button.onclick = () => {
        state.view = 'entity';
        state.entity = entities.find((entity) => entity.key === button.dataset.openSection);
        shell();
      });
      $('[data-open-portal]')?.addEventListener('click', () => window.open('portal.html', '_blank', 'noopener'));
      $$('[data-open-entity]').forEach((button) => button.onclick = async () => {
        state.view = 'entity';
        state.entity = entities.find((entity) => entity.key === button.dataset.openEntity);
        shell();
        const rows = await list(state.entity);
        const row = rows.find((item) => item.id === button.dataset.openId);
        if (row) setTimeout(() => openForm(row), 50);
      });
    } catch (error) {
      main.innerHTML = errorState(error);
    }
  }

  function primaryLabel(entity, row) {
    const preferred = ['name', 'title', 'subject', 'number', 'customer_name', 'description'];
    for (const key of preferred) if (row?.[key]) return String(row[key]);
    const first = entity.fields[0];
    return first ? fieldValue(first, row) : 'Elemento';
  }

  async function loadEntity() {
    const main = $('#main');
    if (!state.entity) return renderDashboard();
    main.innerHTML = '<div class="empty">Caricamento dati…</div>';
    try {
      state.rows = await list(state.entity);
      renderEntity();
    } catch (error) {
      main.innerHTML = errorState(error);
    }
  }

  function entityKpis(entity, rows) {
    const amount = rows.reduce((sum, row) => sum + Number(row.total || row.amount || row.price || row.cost || row.budget || 0), 0);
    const recent = rows.filter((row) => new Date(row.created_at) > new Date(Date.now() - 30 * 86_400_000)).length;
    const status = statusField(entity);
    const attention = status ? rows.filter((row) => /nuov|apert|urgente|in corso|richiest|scadut/i.test(String(row[status.key] || ''))).length : 0;
    return { amount, recent, attention };
  }

  function renderEntity() {
    const entity = state.entity;
    const rows = filterRows(entity, state.rows);
    const mode = currentMode(entity);
    const status = statusField(entity);
    const kpis = entityKpis(entity, state.rows);
    const main = $('#main');
    main.innerHTML = `<header class="topbar"><div><h1>${esc(entity.label)}</h1><p>${state.rows.length} elementi · ${cloudReady ? 'sincronizzati online' : 'demo modificabile'}</p></div><div class="top-actions"><button class="btn btn-secondary" id="exportExcel">Esporta Excel</button><button class="btn btn-secondary" id="exportCsv">CSV</button><button class="btn btn-secondary" id="importCsv">Importa</button>${can('write') ? '<button class="btn btn-primary" id="newRecord">+ Nuovo</button>' : ''}<div class="avatar">${esc(initials())}</div></div></header>
      <section class="grid compact-grid"><article class="stat"><div class="stat-top"><span>Totale</span><i>Σ</i></div><strong>${state.rows.length}</strong><small>Elementi registrati</small></article><article class="stat"><div class="stat-top"><span>Ultimi 30 giorni</span><i>↗</i></div><strong>${kpis.recent}</strong><small>Nuovi o aggiornati</small></article><article class="stat"><div class="stat-top"><span>Valore</span><i>€</i></div><strong>${money(kpis.amount)}</strong><small>Importi rilevati</small></article><article class="stat"><div class="stat-top"><span>Da seguire</span><i>!</i></div><strong>${kpis.attention}</strong><small>Stati aperti o urgenti</small></article></section>
      <section class="entity-toolbar"><div class="toolbar-search"><input id="search" class="search" placeholder="Cerca in ${esc(entity.label.toLowerCase())}…" value="${esc(state.query)}">${status ? `<select id="statusFilter"><option value="">Tutti gli stati</option>${(status.options || []).map((option) => `<option ${state.statusFilter === option ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select>` : ''}</div><div class="segmented">${availableModes(entity).map((item) => `<button data-mode="${item.id}" class="${mode === item.id ? 'active' : ''}">${item.label}</button>`).join('')}</div></section>
      <section id="entityContent">${renderMode(entity, rows, mode)}</section>
      <input id="csvFile" type="file" accept=".csv,text/csv" hidden>`;

    $('#newRecord')?.addEventListener('click', () => openForm());
    $('#search').oninput = (event) => { state.query = event.target.value; renderEntity(); };
    $('#statusFilter')?.addEventListener('change', (event) => { state.statusFilter = event.target.value; renderEntity(); });
    $$('[data-mode]').forEach((button) => button.onclick = () => { state.entityMode[entity.key] = button.dataset.mode; renderEntity(); });
    $('#exportExcel').onclick = () => exportExcel(entity, state.rows);
    $('#exportCsv').onclick = () => exportCsv(entity, state.rows);
    $('#importCsv').onclick = () => $('#csvFile').click();
    $('#csvFile').onchange = (event) => importCsv(entity, event.target.files?.[0]);
    bindEntityActions(entity, rows, mode);
  }

  function renderMode(entity, rows, mode) {
    if (mode === 'sheet') return renderSheet(entity, rows);
    if (mode === 'board') return renderBoard(entity, rows);
    if (mode === 'agenda') return renderAgenda(entity, rows);
    if (mode === 'month') return renderMonth(entity, rows);
    if (mode === 'availability') return renderAvailability(entity, rows);
    if (mode === 'cards') return renderCards(entity, rows);
    return renderTable(entity, rows);
  }

  function renderTable(entity, rows) {
    const fields = entity.fields.slice(0, 6);
    if (!rows.length) return emptyState(entity);
    return `<section class="card"><div class="table-wrap"><table class="data-table"><thead><tr>${fields.map((field) => `<th><button class="sort-button" data-sort="${esc(field.key)}">${esc(field.label)}${state.sortKey === field.key ? (state.sortDir === 'asc' ? ' ↑' : ' ↓') : ''}</button></th>`).join('')}<th>Azioni</th></tr></thead><tbody>${rows.map((row) => `<tr data-row="${row.id}">${fields.map((field, index) => `<td class="${index === 0 ? 'cell-title' : ''}">${field.key.toLowerCase().includes('status') || field.key.toLowerCase().includes('stato') ? `<span class="status-badge">${esc(fieldValue(field, row))}</span>` : esc(fieldValue(field, row))}</td>`).join('')}<td><div class="row-actions"><button data-edit="${row.id}" title="Apri">Apri</button>${isDocumentEntity(entity) ? `<button data-print="${row.id}" title="Stampa">Stampa</button>` : ''}${can('write') ? `<button data-duplicate="${row.id}" title="Duplica">Duplica</button>` : ''}${can('delete') ? `<button class="danger" data-delete="${row.id}" title="Elimina">Elimina</button>` : ''}</div></td></tr>`).join('')}</tbody></table></div></section>`;
  }

  function renderSheet(entity, rows) {
    const fields = entity.fields.slice(0, 10);
    if (!rows.length) return emptyState(entity);
    const numeric = fields.filter((field) => ['number', 'currency'].includes(field.type));
    const totals = Object.fromEntries(numeric.map((field) => [field.key, rows.reduce((sum, row) => sum + Number(row[field.key] || 0), 0)]));
    return `<section class="sheet-shell"><div class="sheet-bar"><div><strong>Foglio operativo</strong><span>Modifica le celle direttamente. Le variazioni vengono salvate al termine della modifica.</span></div><div class="sheet-formula"><b>fx</b><span>${numeric.length ? `${numeric[0].label}: ${numeric[0].type === 'currency' ? money(totals[numeric[0].key]) : totals[numeric[0].key]}` : `${rows.length} righe visibili`}</span></div></div><div class="sheet-scroll"><div class="sheet-grid" style="--sheet-cols:${fields.length}"><div class="sheet-row sheet-head"><i><input type="checkbox" id="sheetSelectAll" aria-label="Seleziona tutto"></i>${fields.map((field) => `<b>${esc(field.label)}</b>`).join('')}<em>Azioni</em></div>${rows.map((row, rowIndex) => `<div class="sheet-row ${state.selectedRows.has(row.id) ? 'selected' : ''}" data-sheet-row="${row.id}"><i><input type="checkbox" data-sheet-select="${row.id}" ${state.selectedRows.has(row.id) ? 'checked' : ''}><small>${rowIndex + 1}</small></i>${fields.map((field) => `<span contenteditable="${can('write') && !['boolean','select'].includes(field.type) ? 'true' : 'false'}" data-sheet-id="${row.id}" data-sheet-field="${esc(field.key)}" data-sheet-type="${esc(field.type)}" title="${esc(field.label)}">${field.key.toLowerCase().includes('status') ? `<u>${esc(fieldValue(field, row))}</u>` : esc(fieldValue(field, row))}</span>`).join('')}<em><button data-edit="${row.id}">Apri</button></em></div>`).join('')}</div></div><footer class="sheet-footer"><div><span>Righe: <b>${rows.length}</b></span><span>Selezionate: <b>${state.selectedRows.size}</b></span>${numeric.slice(0,3).map((field) => `<span>${esc(field.label)}: <b>${field.type === 'currency' ? money(totals[field.key]) : totals[field.key]}</b></span>`).join('')}</div>${can('delete') ? '<button id="bulkDelete" class="btn btn-danger" '+(state.selectedRows.size ? '' : 'disabled')+'>Elimina selezionate</button>' : ''}</footer></section>`;
  }

  function renderMonth(entity, rows) {
    const field = dateField(entity);
    if (!field) return renderTable(entity, rows);
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const first = new Date(year, month, 1);
    const days = new Date(year, month + 1, 0).getDate();
    const leading = (first.getDay() + 6) % 7;
    const byDay = {};
    rows.forEach((row) => {
      const value = row[field.key];
      if (!value) return;
      const date = new Date(value);
      if (date.getFullYear() === year && date.getMonth() === month) (byDay[date.getDate()] ||= []).push(row);
    });
    const cells = [];
    for (let i = 0; i < leading; i += 1) cells.push('<div class="month-day muted"></div>');
    for (let day = 1; day <= days; day += 1) {
      const items = byDay[day] || [];
      cells.push(`<div class="month-day ${day === now.getDate() ? 'today' : ''}" data-month-day="${day}"><header><b>${day}</b><span>${items.length || ''}</span></header>${items.slice(0,3).map((row) => `<button data-edit="${row.id}"><i></i><strong>${esc(primaryLabel(entity,row))}</strong><small>${esc(secondaryLabel(entity,row))}</small></button>`).join('')}${items.length > 3 ? `<em>+${items.length - 3} altri</em>` : ''}</div>`);
    }
    return `<section class="month-shell"><header class="month-toolbar"><div><span>Calendario mensile</span><h3>${new Intl.DateTimeFormat(company.locale || 'it-IT',{month:'long',year:'numeric'}).format(now)}</h3></div><div><button class="btn btn-secondary">‹</button><button class="btn btn-secondary">Oggi</button><button class="btn btn-secondary">›</button></div></header><div class="month-weekdays">${['Lun','Mar','Mer','Gio','Ven','Sab','Dom'].map((day)=>`<b>${day}</b>`).join('')}</div><div class="month-grid">${cells.join('')}</div></section>`;
  }

  function renderAvailability(entity, rows) {
    const today = new Date();
    const days = Array.from({length:14},(_,index)=>new Date(today.getFullYear(),today.getMonth(),today.getDate()+index));
    const resourceNames = [...new Set(rows.map((row)=>row.resource_name || row.operator_name || row.assignee).filter(Boolean))];
    while (resourceNames.length < 8) resourceNames.push(`Risorsa ${String(resourceNames.length + 1).padStart(2,'0')}`);
    const isBusy = (resource, day) => rows.some((row) => {
      const name = row.resource_name || row.operator_name || row.assignee;
      if (name && name !== resource) return false;
      const start = new Date(row.start_at || row.start_date || row.due_date || 0);
      const end = new Date(row.end_at || row.end_date || row.start_at || row.start_date || 0);
      const from = new Date(day.getFullYear(),day.getMonth(),day.getDate());
      const to = new Date(day.getFullYear(),day.getMonth(),day.getDate()+1);
      return start < to && end >= from && !/annull/i.test(String(row.status || ''));
    });
    return `<section class="availability-shell"><header><div><span>Disponibilità risorse</span><h3>Prossimi 14 giorni</h3></div><div class="availability-legend"><i class="free">Libero</i><i class="busy">Occupato</i><i class="request">Richiesta</i></div></header><div class="availability-scroll"><div class="availability-grid"><div class="availability-row head"><b>Risorsa</b>${days.map((day)=>`<span>${new Intl.DateTimeFormat(company.locale||'it-IT',{weekday:'short'}).format(day)}<strong>${day.getDate()}</strong></span>`).join('')}</div>${resourceNames.slice(0,10).map((resource,rowIndex)=>`<div class="availability-row"><b>${esc(resource)}<small>${rowIndex%2?'Standard':'Premium'}</small></b>${days.map((day,colIndex)=>{const busy=isBusy(resource,day);const request=!busy&&(rowIndex+colIndex)%11===0;return `<button class="${busy?'busy':request?'request':'free'}" data-availability-date="${day.toISOString().slice(0,10)}" data-availability-resource="${esc(resource)}">${busy?'●':request?'◐':'✓'}</button>`}).join('')}</div>`).join('')}</div></div><footer><span>${resourceNames.slice(0,10).length} risorse</span><strong>Nessuna doppia assegnazione consentita</strong></footer></section>`;
  }

  function renderBoard(entity, rows) {
    const status = statusField(entity);
    const columns = status?.options?.length ? status.options : [...new Set(rows.map((row) => row[status?.key]).filter(Boolean))];
    if (!columns.length) return renderTable(entity, rows);
    return `<div class="kanban">${columns.map((column) => {
      const items = rows.filter((row) => String(row[status.key] || '') === String(column));
      return `<section class="kanban-column" data-drop-status="${esc(column)}"><header><span>${esc(column)}</span><b>${items.length}</b></header><div class="kanban-list">${items.map((row) => `<article class="kanban-card" draggable="${can('write') ? 'true' : 'false'}" data-drag-id="${row.id}"><strong>${esc(primaryLabel(entity, row))}</strong><p>${esc(secondaryLabel(entity, row))}</p><div><small>${esc(dateLabel(row.updated_at))}</small><button data-edit="${row.id}">Apri</button></div></article>`).join('') || '<div class="kanban-empty">Trascina qui</div>'}</div></section>`;
    }).join('')}</div>`;
  }

  function renderAgenda(entity, rows) {
    const field = dateField(entity);
    if (!field) return renderTable(entity, rows);
    const groups = {};
    rows.forEach((row) => {
      const value = row[field.key];
      const key = value ? new Date(value).toISOString().slice(0, 10) : 'senza-data';
      (groups[key] ||= []).push(row);
    });
    const keys = Object.keys(groups).sort();
    if (!keys.length) return emptyState(entity);
    return `<section class="agenda">${keys.map((key) => `<div class="agenda-day"><header><span>${key === 'senza-data' ? 'Senza data' : esc(dateLabel(key))}</span><b>${groups[key].length}</b></header><div>${groups[key].map((row) => `<button class="agenda-item" data-edit="${row.id}"><time>${field.type === 'datetime' ? esc(new Intl.DateTimeFormat(company.locale || 'it-IT', { hour: '2-digit', minute: '2-digit' }).format(new Date(row[field.key]))) : '•'}</time><span><strong>${esc(primaryLabel(entity, row))}</strong><small>${esc(secondaryLabel(entity, row))}</small></span><em>Apri</em></button>`).join('')}</div></div>`).join('')}</section>`;
  }

  function renderCards(entity, rows) {
    if (!rows.length) return emptyState(entity);
    return `<div class="record-grid">${rows.map((row) => `<article class="record-card"><div class="record-avatar">${esc(primaryLabel(entity, row).slice(0, 2).toUpperCase())}</div><div class="record-card-copy"><strong>${esc(primaryLabel(entity, row))}</strong><p>${esc(secondaryLabel(entity, row))}</p></div><dl>${entity.fields.slice(1, 5).map((field) => `<div><dt>${esc(field.label)}</dt><dd>${esc(fieldValue(field, row))}</dd></div>`).join('')}</dl><div class="record-card-actions"><button class="btn btn-secondary" data-edit="${row.id}">Apri scheda</button>${can('delete') ? `<button class="icon-danger" data-delete="${row.id}">×</button>` : ''}</div></article>`).join('')}</div>`;
  }

  function secondaryLabel(entity, row) {
    const candidates = ['customer_name', 'email', 'phone', 'category', 'service_name', 'status', 'notes'];
    for (const key of candidates) if (row?.[key]) return String(row[key]);
    const field = entity.fields[1];
    return field ? fieldValue(field, row) : 'Aggiornato ' + relativeTime(row.updated_at || row.created_at);
  }

  function emptyState(entity) {
    return `<section class="card"><div class="empty"><div class="empty-icon">+</div><h3>Nessun elemento trovato</h3><p>Crea la prima ${esc((entity.singular || 'voce').toLowerCase())} oppure modifica i filtri.</p>${can('write') ? '<button class="btn btn-primary" data-empty-new>+ Crea ora</button>' : ''}</div></section>`;
  }

  function bindEntityActions(entity, rows, mode) {
    $$('[data-edit]').forEach((button) => button.onclick = () => openForm(state.rows.find((row) => row.id === button.dataset.edit)));
    $$('[data-delete]').forEach((button) => button.onclick = () => confirmAction('Eliminare definitivamente questo elemento?', async () => {
      await remove(entity, button.dataset.delete);
      toast('Elemento eliminato.');
      await loadEntity();
    }));
    $$('[data-duplicate]').forEach((button) => button.onclick = async () => {
      const original = state.rows.find((row) => row.id === button.dataset.duplicate);
      const copy = { ...original };
      delete copy.id; delete copy.created_at; delete copy.updated_at; delete copy.organization_id; delete copy.created_by;
      if (copy.number) copy.number = `${copy.number}-COPIA`;
      await save(entity, copy);
      toast('Copia creata.');
      await loadEntity();
    });
    $$('[data-print]').forEach((button) => button.onclick = () => printRecord(entity, state.rows.find((row) => row.id === button.dataset.print)));
    $$('[data-sort]').forEach((button) => button.onclick = () => {
      if (state.sortKey === button.dataset.sort) state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
      else { state.sortKey = button.dataset.sort; state.sortDir = 'asc'; }
      renderEntity();
    });
    $('[data-empty-new]')?.addEventListener('click', () => openForm());

    if (mode === 'sheet') {
      $('#sheetSelectAll')?.addEventListener('change', (event) => {
        state.selectedRows = event.target.checked ? new Set(rows.map((row) => row.id)) : new Set();
        renderEntity();
      });
      $$('[data-sheet-select]').forEach((input) => input.onchange = () => {
        if (input.checked) state.selectedRows.add(input.dataset.sheetSelect);
        else state.selectedRows.delete(input.dataset.sheetSelect);
        renderEntity();
      });
      $$('[data-sheet-field][contenteditable="true"]').forEach((cell) => cell.addEventListener('blur', async () => {
        const field = entity.fields.find((item) => item.key === cell.dataset.sheetField);
        let value = cell.textContent.trim();
        if (field && ['number','currency'].includes(field.type)) value = Number(value.replace(/[^0-9,.-]/g,'').replace(',','.')) || 0;
        try { await save(entity, { [cell.dataset.sheetField]: value }, cell.dataset.sheetId); toast('Cella salvata.'); await loadEntity(); }
        catch (error) { toast(error.message || String(error), 'error'); }
      }));
      $('#bulkDelete')?.addEventListener('click', () => confirmAction(`Eliminare ${state.selectedRows.size} elementi?`, async () => {
        for (const id of state.selectedRows) await remove(entity, id);
        state.selectedRows = new Set();
        toast('Elementi eliminati.');
        await loadEntity();
      }));
    }

    if (mode === 'month') {
      $$('[data-month-day]').forEach((cell) => cell.addEventListener('dblclick', () => {
        const field = dateField(entity); const row = {};
        if (field) row[field.key] = new Date(new Date().getFullYear(), new Date().getMonth(), Number(cell.dataset.monthDay), 9, 0).toISOString();
        openForm(row);
      }));
    }

    if (mode === 'availability') {
      $$('[data-availability-date]').forEach((cell) => cell.addEventListener('click', () => {
        if (!can('write') || cell.classList.contains('busy')) return;
        const row = { resource_name: cell.dataset.availabilityResource, operator_name: cell.dataset.availabilityResource, start_date: cell.dataset.availabilityDate, end_date: cell.dataset.availabilityDate, start_at: `${cell.dataset.availabilityDate}T09:00`, end_at: `${cell.dataset.availabilityDate}T10:00` };
        openForm(row);
      }));
    }

    if (mode === 'board' && can('write')) {
      let dragId = '';
      $$('[data-drag-id]').forEach((card) => {
        card.addEventListener('dragstart', () => { dragId = card.dataset.dragId; card.classList.add('dragging'); });
        card.addEventListener('dragend', () => card.classList.remove('dragging'));
      });
      $$('[data-drop-status]').forEach((column) => {
        column.addEventListener('dragover', (event) => { event.preventDefault(); column.classList.add('drag-over'); });
        column.addEventListener('dragleave', () => column.classList.remove('drag-over'));
        column.addEventListener('drop', async (event) => {
          event.preventDefault();
          column.classList.remove('drag-over');
          if (!dragId) return;
          await save(entity, { [statusField(entity).key]: column.dataset.dropStatus }, dragId);
          toast('Stato aggiornato.');
          await loadEntity();
        });
      });
    }
  }

  function inputFor(field, value) {
    const required = field.required ? ' required' : '';
    const safeValue = value ?? '';
    if (field.type === 'longtext') return `<textarea name="${esc(field.key)}"${required}>${esc(safeValue)}</textarea>`;
    if (field.type === 'select') return `<select name="${esc(field.key)}"${required}><option value="">Seleziona</option>${(field.options || []).map((option) => `<option value="${esc(option)}" ${String(safeValue) === String(option) ? 'selected' : ''}>${esc(option)}</option>`).join('')}</select>`;
    if (field.type === 'boolean') return `<select name="${esc(field.key)}"><option value="false" ${!safeValue ? 'selected' : ''}>No</option><option value="true" ${safeValue ? 'selected' : ''}>Sì</option></select>`;
    const types = { email: 'email', phone: 'tel', number: 'number', currency: 'number', date: 'date', datetime: 'datetime-local' };
    let normalized = safeValue;
    if (field.type === 'datetime' && safeValue) normalized = String(safeValue).slice(0, 16);
    return `<input type="${types[field.type] || 'text'}" name="${esc(field.key)}" value="${esc(normalized)}" ${field.type === 'currency' ? 'step="0.01"' : ''}${required}>`;
  }


  function itemConfig(parentEntity) {
    const map = {
      quotes: { entity: 'quote_items', foreign: 'quote_number' },
      orders: { entity: 'order_items', foreign: 'order_number' },
      invoices: { entity: 'invoice_items', foreign: 'invoice_number' },
    };
    return map[parentEntity.key] || null;
  }

  async function documentItems(parentEntity, row) {
    const config = itemConfig(parentEntity);
    if (!config || !row?.number) return [];
    const itemEntity = entities.find((entity) => entity.key === config.entity);
    if (!itemEntity) return [];
    const rows = await list(itemEntity);
    return rows.filter((item) => String(item[config.foreign] || '') === String(row.number));
  }

  async function syncDocumentTotal(parentEntity, parentRow) {
    if (!parentRow?.id) return;
    const items = await documentItems(parentEntity, parentRow);
    const total = items.reduce((sum, item) => sum + Number(item.total || (Number(item.quantity || 0) * Number(item.unit_price || 0))), 0);
    await save(parentEntity, { total }, parentRow.id);
    parentRow.total = total;
  }

  async function renderLineItemsPanel(parentEntity, parentRow) {
    const panel = $('#lineItemsPanel');
    if (!panel) return;
    const config = itemConfig(parentEntity);
    const itemEntity = config ? entities.find((entity) => entity.key === config.entity) : null;
    if (!itemEntity || !parentRow?.number) {
      panel.innerHTML = '<p class="line-help">Salva prima il documento con un numero per aggiungere le righe.</p>';
      return;
    }
    const items = await documentItems(parentEntity, parentRow);
    const total = items.reduce((sum, item) => sum + Number(item.total || 0), 0);
    panel.innerHTML = `<div class="line-head"><div><span>RIGHE DOCUMENTO</span><h3>Prodotti e servizi</h3></div><button class="btn btn-secondary" id="addLine">+ Aggiungi riga</button></div>${items.length ? `<div class="line-table">${items.map((item) => `<div><span><strong>${esc(item.description || 'Riga')}</strong><small>${Number(item.quantity || 0)} × ${money(item.unit_price || 0)}</small></span><b>${money(item.total || 0)}</b><button data-edit-line="${item.id}">Modifica</button><button class="danger" data-delete-line="${item.id}">×</button></div>`).join('')}</div>` : '<div class="line-empty">Nessuna riga aggiunta.</div>'}<div class="line-total"><span>Totale documento</span><strong>${money(total)}</strong></div>`;
    $('#addLine').onclick = () => openLineItemForm(parentEntity, parentRow, itemEntity, config);
    $$('[data-edit-line]', panel).forEach((button) => button.onclick = () => openLineItemForm(parentEntity, parentRow, itemEntity, config, items.find((item) => item.id === button.dataset.editLine)));
    $$('[data-delete-line]', panel).forEach((button) => button.onclick = () => confirmAction('Eliminare questa riga?', async () => {
      await remove(itemEntity, button.dataset.deleteLine);
      await syncDocumentTotal(parentEntity, parentRow);
      await renderLineItemsPanel(parentEntity, parentRow);
    }));
  }

  function openLineItemForm(parentEntity, parentRow, itemEntity, config, row = {}) {
    const container = document.createElement('div');
    container.className = 'nested-modal';
    container.innerHTML = `<div class="modal"><div class="modal-card line-modal"><div class="modal-head"><div><span class="modal-kicker">RIGA DOCUMENTO</span><h2>${row.id ? 'Modifica' : 'Aggiungi'} riga</h2></div><button class="close" data-line-close>×</button></div><form id="lineForm"><div class="form-grid"><div class="field full"><label>Descrizione *</label><input name="description" value="${esc(row.description || '')}" required></div><div class="field"><label>Quantità *</label><input type="number" min="0.01" step="0.01" name="quantity" value="${esc(row.quantity ?? 1)}" required></div><div class="field"><label>Prezzo unitario *</label><input type="number" min="0" step="0.01" name="unit_price" value="${esc(row.unit_price ?? 0)}" required></div>${itemEntity.key === 'invoice_items' ? `<div class="field"><label>IVA %</label><input type="number" min="0" step="0.01" name="vat_rate" value="${esc(row.vat_rate ?? 0)}"></div>` : ''}</div><div class="form-actions"><button type="button" class="btn btn-secondary" data-line-close>Annulla</button><button type="submit" class="btn btn-primary">Salva riga</button></div></form></div></div>`;
    document.body.appendChild(container);
    const close = () => container.remove();
    $$('[data-line-close]', container).forEach((button) => button.onclick = close);
    $('#lineForm', container).onsubmit = async (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(event.target));
      const quantity = Number(data.quantity || 0);
      const unitPrice = Number(data.unit_price || 0);
      const vatRate = Number(data.vat_rate || 0);
      const net = quantity * unitPrice;
      const record = {
        [config.foreign]: parentRow.number,
        description: data.description,
        quantity,
        unit_price: unitPrice,
        total: itemEntity.key === 'invoice_items' ? net * (1 + vatRate / 100) : net,
      };
      if (itemEntity.key === 'invoice_items') record.vat_rate = vatRate;
      try {
        await save(itemEntity, record, row.id);
        await syncDocumentTotal(parentEntity, parentRow);
        close();
        await renderLineItemsPanel(parentEntity, parentRow);
        toast('Riga salvata.');
      } catch (error) { toast(error.message || String(error), 'error'); }
    };
  }

  function openForm(row = {}) {
    if (!can('write')) return toast('Il tuo ruolo consente solo la visualizzazione.', 'error');
    const entity = state.entity;
    const editingId = row.id || null;
    const modal = $('#modal');
    modal.innerHTML = `<div class="modal"><div class="modal-card"><div class="modal-head"><div><span class="modal-kicker">${editingId ? 'MODIFICA' : 'NUOVO ELEMENTO'}</span><h2>${editingId ? 'Modifica' : 'Nuova'} ${esc(entity.singular || 'voce')}</h2></div><button class="close" data-close>×</button></div><form id="recordForm"><div class="form-grid">${entity.fields.map((field) => `<div class="field ${field.type === 'longtext' ? 'full' : ''}"><label>${esc(field.label)}${field.required ? ' *' : ''}</label>${inputFor(field, row[field.key])}</div>`).join('')}${entity.key === 'documents' ? '<div class="field full"><label>Carica un file (opzionale)</label><input type="file" name="__file"><small>PDF, immagini o documenti. In cloud viene salvato in uno spazio privato.</small></div>' : ''}</div><div class="form-actions"><button type="button" class="btn btn-secondary" data-close>Annulla</button>${editingId && isDocumentEntity(entity) ? '<button type="button" class="btn btn-secondary" id="printCurrent">Stampa</button>' : ''}<button type="submit" class="btn btn-primary">Salva</button></div></form>${editingId && isDocumentEntity(entity) ? '<section class="line-items-panel" id="lineItemsPanel"><div class="empty compact">Caricamento righe…</div></section>' : ''}</div></div>`;
    const close = () => { modal.innerHTML = ''; };
    $$('[data-close]', modal).forEach((button) => button.onclick = close);
    $('#printCurrent')?.addEventListener('click', () => printRecord(entity, row));
    if (editingId && isDocumentEntity(entity)) renderLineItemsPanel(entity, row).catch((error) => toast(error.message || String(error), 'error'));
    $('#recordForm').onsubmit = async (event) => {
      event.preventDefault();
      const submit = event.submitter;
      if (submit) { submit.disabled = true; submit.textContent = 'Salvataggio…'; }
      const formData = new FormData(event.target);
      const record = {};
      entity.fields.forEach((field) => {
        let value = formData.get(field.key);
        if (field.type === 'number' || field.type === 'currency') value = value === '' ? null : Number(value);
        if (field.type === 'boolean') value = value === 'true';
        if (field.type === 'datetime' && value) value = new Date(value).toISOString();
        record[field.key] = value;
      });
      try {
        const file = formData.get('__file');
        if (file instanceof File && file.size) record.url = await uploadDocument(file, editingId);
        await save(entity, record, editingId);
        close();
        toast('Salvato correttamente.');
        await loadEntity();
      } catch (error) {
        toast(error.message || String(error), 'error');
        if (submit) { submit.disabled = false; submit.textContent = 'Salva'; }
      }
    };
  }

  function confirmAction(message, action) {
    const modal = $('#modal');
    modal.innerHTML = `<div class="modal"><div class="confirm-card"><div class="confirm-icon">!</div><h2>Sei sicuro?</h2><p>${esc(message)}</p><div><button class="btn btn-secondary" data-cancel>Annulla</button><button class="btn btn-danger" data-confirm>Conferma</button></div></div></div>`;
    $('[data-cancel]', modal).onclick = () => { modal.innerHTML = ''; };
    $('[data-confirm]', modal).onclick = async () => {
      try { await action(); } catch (error) { toast(error.message || String(error), 'error'); }
      modal.innerHTML = '';
    };
  }

  function isDocumentEntity(entity) {
    return ['quotes', 'invoices', 'orders'].includes(entity.key);
  }

  async function printRecord(entity, row) {
    if (!row) return;
    const items = await documentItems(entity, row);
    const popup = window.open('', '_blank', 'noopener');
    if (!popup) return toast('Consenti i popup per stampare il documento.', 'error');
    popup.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(entity.singular)} ${esc(row.number || '')}</title><style>body{font-family:Arial,sans-serif;margin:0;color:#171717}.page{max-width:820px;margin:auto;padding:55px}.head{display:flex;justify-content:space-between;border-bottom:3px solid ${company.primaryColor || '#ff6b35'};padding-bottom:25px}.brand{font-size:26px;font-weight:900}.type{text-align:right;color:#777}.type strong{display:block;color:#171717;font-size:30px}.details{margin:35px 0;border:1px solid #ddd;border-radius:14px;overflow:hidden}.row{display:flex;justify-content:space-between;gap:30px;padding:13px 17px;border-bottom:1px solid #eee}.row:last-child{border:0}.row span{color:#777}.row strong{text-align:right}.total{margin-left:auto;width:300px;background:#171717;color:#fff;border-radius:14px;padding:20px}.total strong{display:block;font-size:31px;margin-top:6px}.footer{margin-top:70px;color:#888;font-size:11px}</style></head><body><div class="page"><div class="head"><div class="brand">${esc(company.name || 'Azienda')}</div><div class="type"><span>${esc(entity.singular)}</span><strong>${esc(row.number || '')}</strong></div></div><div class="details">${entity.fields.filter((field) => field.type !== 'longtext' && !['total', 'amount'].includes(field.key)).map((field) => `<div class="row"><span>${esc(field.label)}</span><strong>${esc(fieldValue(field, row))}</strong></div>`).join('')}</div>${items.length ? `<h3>Dettaglio</h3><div class="details">${items.map((item) => `<div class="row"><span>${esc(item.description || 'Riga')} · ${esc(item.quantity || 0)} × ${money(item.unit_price || 0)}</span><strong>${money(item.total || 0)}</strong></div>`).join('')}</div>` : ''}${row.notes ? `<h3>Note</h3><p>${esc(row.notes)}</p>` : ''}<div class="total"><span>Totale</span><strong>${money(row.total || row.amount || 0)}</strong></div><div class="footer">Documento generato dal gestionale ${esc(company.name || '')}.</div></div></body></html>`);
    popup.document.close();
    setTimeout(() => popup.print(), 250);
  }

  function csvEscape(value) {
    const text = String(value ?? '');
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }

  function exportExcel(entity, rows) {
    const fields = entity.fields;
    const xmlEsc = (value) => String(value ?? '').replace(/[&<>]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[char]));
    const cell = (value, type = 'String') => `<Cell><Data ss:Type="${type}">${xmlEsc(value)}</Data></Cell>`;
    const header = fields.map((field) => cell(field.label)).join('');
    const body = rows.map((row) => `<Row>${fields.map((field) => {
      const raw = row[field.key] ?? '';
      const numeric = ['number','currency'].includes(field.type) && raw !== '';
      return cell(numeric ? Number(raw) : fieldValue(field,row), numeric ? 'Number' : 'String');
    }).join('')}</Row>`).join('');
    const workbook = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#EDEDE8" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="${xmlEsc(entity.label).slice(0,31)}"><Table><Row ss:StyleID="Header">${header}</Row>${body}</Table></Worksheet></Workbook>`;
    download(`${entity.key}-${new Date().toISOString().slice(0,10)}.xls`, workbook, 'application/vnd.ms-excel');
    toast('File Excel esportato.');
  }

  function exportCsv(entity, rows) {
    const headers = entity.fields.map((field) => field.key);
    const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => csvEscape(row[key])).join(','))].join('\n');
    download(`${entity.key}-${new Date().toISOString().slice(0, 10)}.csv`, '\ufeff' + csv, 'text/csv;charset=utf-8');
    toast('CSV esportato.');
  }

  function parseCsv(text) {
    const rows = [];
    let current = '', row = [], quoted = false;
    for (let index = 0; index < text.length; index += 1) {
      const char = text[index];
      if (char === '"' && quoted && text[index + 1] === '"') { current += '"'; index += 1; }
      else if (char === '"') quoted = !quoted;
      else if (char === ',' && !quoted) { row.push(current); current = ''; }
      else if ((char === '\n' || char === '\r') && !quoted) {
        if (char === '\r' && text[index + 1] === '\n') index += 1;
        row.push(current); current = '';
        if (row.some((cell) => cell !== '')) rows.push(row);
        row = [];
      } else current += char;
    }
    row.push(current);
    if (row.some((cell) => cell !== '')) rows.push(row);
    return rows;
  }

  async function importCsv(entity, file) {
    if (!file) return;
    if (!can('write')) return toast('Non hai i permessi per importare dati.', 'error');
    try {
      const matrix = parseCsv(await file.text());
      if (matrix.length < 2) throw new Error('Il CSV non contiene righe dati.');
      const headers = matrix[0].map((item) => item.trim());
      const map = headers.map((header) => entity.fields.find((field) => field.key.toLowerCase() === header.toLowerCase() || field.label.toLowerCase() === header.toLowerCase()));
      let imported = 0;
      for (const cells of matrix.slice(1).slice(0, 500)) {
        const record = {};
        map.forEach((field, index) => {
          if (!field) return;
          let value = cells[index] ?? '';
          if (field.type === 'number' || field.type === 'currency') value = value === '' ? null : Number(String(value).replace(',', '.'));
          if (field.type === 'boolean') value = /^(1|true|sì|si|yes)$/i.test(value);
          record[field.key] = value;
        });
        if (Object.keys(record).length) { await save(entity, record); imported += 1; }
      }
      toast(`${imported} righe importate.`);
      await loadEntity();
    } catch (error) {
      toast(error.message || String(error), 'error');
    }
  }

  async function exportBackup() {
    try {
      const data = { version: 2, organizationId: orgId, exportedAt: new Date().toISOString(), entities: {} };
      for (const entity of entities.filter((item) => !item.system)) data.entities[entity.key] = await list(entity);
      download(`${company.slug || 'gestionale'}-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(data, null, 2), 'application/json');
      toast('Backup completo creato.');
    } catch (error) {
      toast(error.message || String(error), 'error');
    }
  }

  async function restoreBackup(file) {
    if (!file || !can('write')) return;
    try {
      const data = JSON.parse(await file.text());
      if (!data.entities || typeof data.entities !== 'object') throw new Error('Backup non valido.');
      let count = 0;
      for (const entity of entities) {
        const rows = data.entities[entity.key];
        if (!Array.isArray(rows)) continue;
        for (const source of rows.slice(0, 2500)) {
          const record = { ...source };
          delete record.id; delete record.created_at; delete record.updated_at; delete record.organization_id; delete record.created_by;
          await save(entity, record);
          count += 1;
        }
      }
      toast(`${count} elementi ripristinati.`);
    } catch (error) {
      toast(error.message || String(error), 'error');
    }
  }


  async function loadMembers() {
    const card = $('#membersCard');
    if (!card || !cloudReady) return;
    try {
      const { data, error } = await db.from('organization_members').select('user_id,email,role,created_at').eq('organization_id', orgId).order('created_at');
      if (error) throw error;
      const members = data || [];
      card.innerHTML = `<div class="card-head"><div><h2>Collaboratori</h2><p>${members.length} accessi configurati</p></div></div><div class="card-body"><div class="member-list">${members.map((member) => `<div><span><strong>${esc(member.email || member.user_id)}</strong><small>${esc(member.role)}</small></span>${can('delete') && member.user_id !== state.session?.user?.id ? `<select data-member-role="${member.user_id}"><option value="admin" ${member.role === 'admin' ? 'selected' : ''}>Admin</option><option value="member" ${member.role === 'member' ? 'selected' : ''}>Collaboratore</option><option value="viewer" ${member.role === 'viewer' ? 'selected' : ''}>Solo lettura</option></select><button class="icon-danger" data-remove-member="${member.user_id}">×</button>` : '<em>Account corrente</em>'}</div>`).join('')}</div>${can('delete') ? `<form id="inviteForm" class="invite-form"><label>Email<input type="email" name="email" required placeholder="collaboratore@azienda.it"></label><label>Ruolo<select name="role"><option value="member">Collaboratore</option><option value="viewer">Solo lettura</option><option value="admin">Admin</option></select></label><button class="btn btn-primary" type="submit">Invita</button></form>` : ''}</div>`;
      $$('[data-member-role]', card).forEach((select) => select.onchange = async () => {
        const { error: updateError } = await db.from('organization_members').update({ role: select.value }).eq('organization_id', orgId).eq('user_id', select.dataset.memberRole);
        if (updateError) toast(updateError.message, 'error'); else toast('Ruolo aggiornato.');
      });
      $$('[data-remove-member]', card).forEach((button) => button.onclick = () => confirmAction('Rimuovere l’accesso di questo collaboratore?', async () => {
        const { error: deleteError } = await db.from('organization_members').delete().eq('organization_id', orgId).eq('user_id', button.dataset.removeMember);
        if (deleteError) throw deleteError;
        await loadMembers();
        toast('Accesso rimosso.');
      }));
      $('#inviteForm', card)?.addEventListener('submit', async (event) => {
        event.preventDefault();
        const button = event.submitter;
        button.disabled = true; button.textContent = 'Invio…';
        const data = Object.fromEntries(new FormData(event.target));
        const { data: result, error: inviteError } = await db.functions.invoke('invite-member', { body: {
          organizationId: orgId, email: data.email, role: data.role, redirectTo: location.origin + location.pathname,
        } });
        if (inviteError || result?.error) toast(inviteError?.message || result.error, 'error');
        else { toast('Invito inviato.'); event.target.reset(); await loadMembers(); }
        button.disabled = false; button.textContent = 'Invita';
      });
    } catch (error) {
      card.innerHTML = `<div class="card-body"><div class="alert alert-error">${esc(error.message || String(error))}</div></div>`;
    }
  }

  function renderSettings() {
    const main = $('#main');
    main.innerHTML = `<header class="topbar"><div><h1>Impostazioni</h1><p>Controllo, sicurezza e portabilità dei dati</p></div><div class="top-actions"><div class="avatar">${esc(initials())}</div></div></header>
      <section class="settings-grid"><article class="card settings-card"><div class="card-head"><div><h2>Stato del sistema</h2><p>Verifica rapida della configurazione</p></div></div><div class="card-body status-list"><div><span>Database</span><strong class="${cloudReady ? 'ok' : 'warn'}">${cloudReady ? 'Supabase collegato' : 'Modalità demo'}</strong></div><div><span>Accesso</span><strong class="ok">${esc(state.role)}</strong></div><div><span>Sezioni</span><strong>${entities.filter((item) => !item.system).length}</strong></div><div><span>Portale</span><strong class="${project.portal?.enabled ? 'ok' : ''}">${project.portal?.enabled ? 'Attivo' : 'Non attivo'}</strong></div><div><span>Automazioni</span><strong>${(project.automations || []).length}</strong></div></div></article>
      <article class="card settings-card"><div class="card-head"><div><h2>Backup e importazione</h2><p>I dati restano sempre esportabili</p></div></div><div class="card-body button-stack"><button class="btn btn-primary" id="backupAll">Scarica backup JSON</button><button class="btn btn-secondary" id="restoreAll">Ripristina da backup</button><input id="restoreFile" type="file" accept=".json,application/json" hidden><small>Il ripristino aggiunge i record presenti nel file. Prima di usarlo in produzione, scarica sempre un backup aggiornato.</small></div></article>
      <article class="card settings-card"><div class="card-head"><div><h2>Moduli attivi</h2><p>Funzioni incluse nel progetto</p></div></div><div class="card-body module-pills">${(project.modules || []).map((module) => `<span>${esc(module.replace(/_/g, ' '))}</span>`).join('')}</div></article>
      <article class="card settings-card"><div class="card-head"><div><h2>Account</h2><p>${cloudReady ? esc(state.session?.user?.email || '') : 'Sessione dimostrativa'}</p></div></div><div class="card-body button-stack">${project.portal?.enabled ? '<button class="btn btn-secondary" id="openPortalSettings">Apri portale clienti</button>' : ''}${cloudReady ? '<button class="btn btn-danger" id="logout">Esci dal gestionale</button>' : '<button class="btn btn-secondary" id="resetDemo">Ripristina dati demo</button>'}</div></article>${modules.has('multiuser') && cloudReady ? '<article class="card settings-card" id="membersCard"><div class="card-body"><div class="empty compact">Caricamento collaboratori…</div></div></article>' : ''}</section>
      <section class="card setup-card"><div><span>PRIMA DELLA CONSEGNA</span><h2>Checklist operativa</h2><p>Collega Supabase, prova ogni ruolo, invia una richiesta dal portale, verifica le automazioni e scarica un backup iniziale.</p></div><ol><li>Login del titolare verificato</li><li>Permessi collaboratori testati</li><li>Portale e prezzi controllati</li><li>Backup iniziale consegnato</li></ol></section>`;
    $('#backupAll').onclick = exportBackup;
    $('#restoreAll').onclick = () => $('#restoreFile').click();
    $('#restoreFile').onchange = (event) => restoreBackup(event.target.files?.[0]);
    $('#openPortalSettings')?.addEventListener('click', () => window.open('portal.html', '_blank', 'noopener'));
    $('#logout')?.addEventListener('click', async () => { await db.auth.signOut(); state.session = null; auth(); });
    if (modules.has('multiuser') && cloudReady) loadMembers();
    $('#resetDemo')?.addEventListener('click', () => confirmAction('Ripristinare tutti i dati dimostrativi?', () => {
      entities.forEach((entity) => storage.removeItem(keyFor(entity)));
      toast('Demo ripristinata.');
      shell();
    }));
  }

  function errorState(error) {
    return `<section class="error-page"><div>!</div><h2>Non siamo riusciti a caricare questa sezione</h2><p>${esc(error?.message || String(error))}</p><button class="btn btn-primary" onclick="location.reload()">Riprova</button></section>`;
  }

  async function fetchRole() {
    if (!cloudReady || !state.session) { state.role = 'owner'; return; }
    const { data, error } = await db.from('organization_members').select('role').eq('organization_id', orgId).eq('user_id', state.session.user.id).maybeSingle();
    if (error) throw error;
    state.role = data?.role || 'guest';
  }

  function auth(mode = 'login', message = '') {
    app.innerHTML = `<section class="auth"><div class="auth-hero"><div class="brand-mark">${brandMark()}</div><span class="auth-kicker">SPAZIO OPERATIVO RISERVATO</span><h1>${esc(company.name || 'Il tuo gestionale')}</h1><p>${esc(company.description || 'Tutto il lavoro della tua azienda in un unico spazio semplice, veloce e protetto.')}</p><div class="auth-features"><span>✓ Dati sempre esportabili</span><span>✓ Accessi e ruoli separati</span><span>✓ Utilizzabile anche da smartphone</span></div></div><div class="auth-panel"><div class="auth-card"><span class="auth-logo">${esc(initials())}</span><h2>${mode === 'login' ? 'Bentornato' : 'Crea il tuo accesso'}</h2><p>${cloudReady ? 'Accedi allo spazio riservato della tua azienda.' : 'Esplora il prodotto completo in modalità dimostrativa.'}</p>${message ? `<div class="alert alert-error">${esc(message)}</div>` : ''}<form id="authForm"><label>Email<input type="email" name="email" autocomplete="email" required></label><label>Password<input type="password" name="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" minlength="8" required></label><button class="btn btn-primary" type="submit">${mode === 'login' ? 'Accedi' : 'Crea account'}</button></form><div class="auth-links"><button id="switchAuth" type="button">${mode === 'login' ? 'Crea il primo account' : 'Ho già un account'}</button>${cloudReady && mode === 'login' ? '<button id="forgotPassword" type="button">Password dimenticata?</button>' : ''}</div>${!cloudReady ? '<div class="demo-box"><strong>Anteprima completa</strong><p>Puoi inserire, modificare, esportare e provare tutte le viste.</p><button class="btn btn-primary" id="demoEnter">Apri la demo</button></div>' : ''}</div></div></section>`;
    $('#switchAuth').onclick = () => auth(mode === 'login' ? 'signup' : 'login');
    $('#demoEnter')?.addEventListener('click', () => { state.session = { user: { email: 'demo@easycome.it' } }; state.role = 'owner'; shell(); });
    $('#forgotPassword')?.addEventListener('click', async () => {
      const email = $('#authForm input[name=email]').value;
      if (!email) return toast('Inserisci prima la tua email.', 'error');
      const { error } = await db.auth.resetPasswordForEmail(email, { redirectTo: location.href });
      if (error) toast(error.message, 'error'); else toast('Email di recupero inviata.');
    });
    $('#authForm').onsubmit = async (event) => {
      event.preventDefault();
      const credentials = Object.fromEntries(new FormData(event.target));
      const button = event.submitter;
      button.disabled = true; button.textContent = 'Attendi…';
      try {
        if (!cloudReady) { state.session = { user: { email: credentials.email } }; state.role = 'owner'; shell(); return; }
        const response = mode === 'login'
          ? await db.auth.signInWithPassword(credentials)
          : await db.auth.signUp(credentials);
        if (response.error) throw response.error;
        state.session = response.data.session;
        if (!state.session) { auth('login', 'Account creato. Controlla la tua email, conferma e poi accedi.'); return; }
        try { await db.rpc('claim_owner_by_email', { p_organization_id: orgId }); } catch (_) {}
        await fetchRole();
        if (!can('read')) throw new Error('Questo account non è ancora stato autorizzato dal titolare.');
        shell();
      } catch (error) {
        auth(mode, error.message || String(error));
      }
    };
  }

  async function init() {
    if (cloudReady) {
      const { data } = await db.auth.getSession();
      state.session = data.session;
      if (state.session) {
        try { await db.rpc('claim_owner_by_email', { p_organization_id: orgId }); } catch (_) {}
        try {
          await fetchRole();
          if (can('read')) { shell(); return; }
        } catch (_) {}
      }
    }
    auth();
  }

  window.addEventListener('online', () => toast('Connessione ripristinata.'));
  window.addEventListener('offline', () => toast('Sei offline. Alcune funzioni cloud saranno sospese.', 'error'));
  window.__EASYCOME_TEST__ = { project, entities, modules, list, save, validateRecord, availableModes };
  init();
})();
