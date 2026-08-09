(function () {
  'use strict';

  const gate = document.getElementById('accountGate');
  const shell = document.querySelector('.app-shell');
  const state = {
    client: null,
    session: null,
    config: null,
    ready: false,
    tab: 'login',
    initPromise: null,
    initError: null,
  };

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));

  const emit = () => window.dispatchEvent(new CustomEvent('easycome:account-ready', {
    detail: { session: state.session, user: state.session?.user || null }
  }));

  const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  function humanConfigError(err) {
    const raw = String(err?.message || err || '');
    if (/configurazione account|supabase|public-config|fetch/i.test(raw)) {
      return 'Collegamento account non disponibile. Controlla SUPABASE_URL e SUPABASE_ANON_KEY (o SUPABASE_PUBLISHABLE_KEY) su Vercel, poi esegui un Redeploy.';
    }
    return 'Non riesco a collegare il tuo account in questo momento. Riprova tra qualche secondo.';
  }

  function redirectToAuth() {
    const next = encodeURIComponent('/studio');
    location.replace(`/accedi?mode=login&next=${next}`);
  }

  function renderStudioLoading(text = 'Apro il tuo Studio…') {
    shell?.classList.add('account-pending');
    gate.classList.remove('hidden');
    gate.innerHTML = `<div class="studio-auth-state"><span class="studio-auth-spinner"></span><strong>${esc(text)}</strong></div>`;
  }

  function renderStudioError(text) {
    shell?.classList.add('account-pending');
    gate.classList.remove('hidden');
    gate.innerHTML = `<div class="studio-auth-state studio-auth-error"><b>EC</b><strong>Studio non disponibile.</strong><p>${esc(text)}</p><div><button id="retryStudioAuth">Riprova</button><a href="/">Torna alla home</a></div></div>`;
    gate.querySelector('#retryStudioAuth')?.addEventListener('click', () => init(true));
  }

  function showShell() {
    if (!state.session) return;
    gate.innerHTML = '';
    gate.classList.add('hidden');
    shell?.classList.remove('account-pending');
    renderBadge();
    emit();
  }

  function message(text, type = 'error') {
    const box = gate.querySelector('[data-account-message]');
    if (!box) return;
    box.className = `account-message ${type}`;
    box.textContent = text || '';
  }

  function loginForm(disabled = false) {
    return `<form id="accountLogin" class="account-form">
      <div><span>Il tuo spazio Easy Come</span><h2>Bentornato.</h2><p>Usa le stesse credenziali che userai nel tuo gestionale.</p></div>
      <label>Email<input name="email" type="email" required autocomplete="email" ${disabled ? 'disabled' : ''}></label>
      <label>Password<input name="password" type="password" required minlength="8" autocomplete="current-password" ${disabled ? 'disabled' : ''}></label>
      <button type="submit" ${disabled ? 'disabled' : ''}>${disabled ? 'Collegamento account…' : 'Accedi e continua'}</button>
      <button id="forgotPassword" type="button" class="account-link" ${disabled ? 'disabled' : ''}>Password dimenticata?</button>
    </form>`;
  }

  function signupForm(disabled = false) {
    return `<form id="accountSignup" class="account-form">
      <div><span>Il tuo account centrale</span><h2>Partiamo da te.</h2><p>Crealo una volta: resterà valido per sito, gestionale e Hub.</p></div>
      <div class="account-two">
        <label>Nome e cognome<input name="fullName" required autocomplete="name" ${disabled ? 'disabled' : ''}></label>
        <label>Nome attività<input name="companyName" required autocomplete="organization" ${disabled ? 'disabled' : ''}></label>
      </div>
      <label>Email<input name="email" type="email" required autocomplete="email" ${disabled ? 'disabled' : ''}></label>
      <label>Password<input name="password" type="password" required minlength="8" autocomplete="new-password" ${disabled ? 'disabled' : ''}><small>Almeno 8 caratteri.</small></label>
      <button type="submit" ${disabled ? 'disabled' : ''}>${disabled ? 'Collegamento account…' : 'Crea account gratuito'}</button>
    </form>`;
  }

  function renderGate(note = '', options = {}) {
    const disabled = Boolean(options.disabled);
    const retry = Boolean(options.retry);
    shell?.classList.add('account-pending');
    gate.classList.remove('hidden');
    gate.innerHTML = `<div class="account-gate">
      <section class="account-story">
        <a class="account-brand" href="/"><b>EC</b><span><strong>Easy Come</strong><small>Studio per imprese</small></span></a>
        <div><span>UN SOLO ACCOUNT</span><h1>Costruisci oggi.<br>Accedi domani con le stesse credenziali.</h1><p>Il tuo account collega configuratore, acquisti, gestionale, manuale e Easy Come Hub.</p></div>
        <div class="account-points"><span>✓ Progetti salvati online</span><span>✓ Accesso al gestionale acquistato</span><span>✓ Assistenza e nuove funzioni nello stesso spazio</span></div>
      </section>
      <section class="account-panel">
        <div class="account-card">
          <div class="account-tabs">
            <button data-account-tab="login" class="${state.tab === 'login' ? 'active' : ''}" ${disabled ? 'disabled' : ''}>Accedi</button>
            <button data-account-tab="signup" class="${state.tab === 'signup' ? 'active' : ''}" ${disabled ? 'disabled' : ''}>Crea account</button>
          </div>
          <div data-account-message class="account-message ${note ? (retry ? 'error' : 'info') : ''}">${esc(note)}</div>
          ${state.tab === 'login' ? loginForm(disabled) : signupForm(disabled)}
          ${retry ? '<button id="retryAccount" type="button" class="account-link">Riprova collegamento</button>' : ''}
          <small class="account-privacy">Continuando accetti <a href="/termini.html">Termini</a> e <a href="/privacy.html">Privacy</a>.</small>
        </div>
      </section>
    </div>`;

    if (!disabled) {
      gate.querySelectorAll('[data-account-tab]').forEach(btn => btn.onclick = () => {
        state.tab = btn.dataset.accountTab;
        renderGate();
      });
      gate.querySelector('#accountLogin')?.addEventListener('submit', login);
      gate.querySelector('#accountSignup')?.addEventListener('submit', signup);
      gate.querySelector('#forgotPassword')?.addEventListener('click', forgot);
    }
    gate.querySelector('#retryAccount')?.addEventListener('click', () => init(true));
  }

  function busy(form, on, label) {
    const b = form.querySelector('button[type="submit"]');
    if (!b) return;
    b.disabled = on;
    if (on) {
      b.dataset.old = b.textContent;
      b.textContent = label;
    } else {
      b.textContent = b.dataset.old || 'Continua';
    }
  }

  async function waitForSupabaseLibrary() {
    for (let i = 0; i < 30; i += 1) {
      if (window.supabase?.createClient) return window.supabase;
      await sleep(100);
    }
    throw new Error('Libreria Supabase non caricata.');
  }

  async function ensureClient(force = false) {
    if (state.client && !force) return state.client;
    if (state.initPromise && !force) return state.initPromise;

    state.initPromise = (async () => {
      const response = await fetch('/api/public-config', { cache: 'no-store' });
      let payload = {};
      try { payload = await response.json(); } catch (_) {}
      if (!response.ok) throw new Error(payload.error || 'Configurazione account non disponibile.');
      if (!payload.supabaseUrl || !payload.supabaseAnonKey) throw new Error('Configurazione Supabase incompleta.');

      const lib = await waitForSupabaseLibrary();
      state.config = payload;
      state.client = lib.createClient(payload.supabaseUrl, payload.supabaseAnonKey, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      state.initError = null;
      return state.client;
    })();

    try {
      return await state.initPromise;
    } finally {
      state.initPromise = null;
    }
  }

  async function login(e) {
    e.preventDefault();
    const form = e.currentTarget;
    busy(form, true, 'Accesso…');
    try {
      const client = await ensureClient();
      const v = Object.fromEntries(new FormData(form));
      const { data, error } = await client.auth.signInWithPassword({ email: v.email, password: v.password });
      if (error) throw error;
      state.session = data.session;
      showShell();
    } catch (err) {
      message(state.client ? (err.message || String(err)) : humanConfigError(err));
    } finally {
      busy(form, false);
    }
  }

  async function signup(e) {
    e.preventDefault();
    const form = e.currentTarget;
    busy(form, true, 'Creazione account…');
    try {
      const client = await ensureClient();
      const v = Object.fromEntries(new FormData(form));
      const { data, error } = await client.auth.signUp({
        email: v.email,
        password: v.password,
        options: {
          data: { full_name: v.fullName, company_name: v.companyName },
          emailRedirectTo: location.origin
        }
      });
      if (error) throw error;
      if (data.session) {
        state.session = data.session;
        showShell();
      } else {
        state.tab = 'login';
        renderGate('Account creato. Controlla la tua email per confermarlo, poi accedi.');
      }
    } catch (err) {
      message(state.client ? (err.message || String(err)) : humanConfigError(err));
    } finally {
      busy(form, false);
    }
  }

  async function forgot() {
    const email = gate.querySelector('input[name="email"]')?.value?.trim();
    if (!email) {
      message('Inserisci prima la tua email.');
      return;
    }
    try {
      const client = await ensureClient();
      const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin });
      message(error ? error.message : 'Ti abbiamo inviato il link per reimpostare la password.', error ? 'error' : 'success');
    } catch (err) {
      message(humanConfigError(err));
    }
  }

  function renderBadge() {
    if (!state.session) return;
    const email = state.session.user.email || '';
    const name = state.session.user.user_metadata?.full_name || email.split('@')[0];
    const initial = esc(name.slice(0, 1).toUpperCase());

    const mountBadge = (slotSelector, suffix, compact = false) => {
      const slot = document.querySelector(slotSelector);
      if (!slot) return;
      let el = slot.querySelector('.account-badge');
      if (!el) {
        el = document.createElement('div');
        el.className = `account-badge${compact ? ' account-badge-compact' : ''}`;
        slot.appendChild(el);
      }
      const menuId = `accountMenu-${suffix}`;
      const logoutId = `accountLogout-${suffix}`;
      el.innerHTML = `<button id="${menuId}" class="account-trigger" aria-label="Apri account"><b>${initial}</b>${compact ? '' : `<span><strong>${esc(name)}</strong><small>Account</small></span>`}<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7.5 10 12l5-4.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg></button><div class="account-menu hidden"><a href="/profilo.html">Profilo e ordini</a><a href="/profilo.html?tab=support">Assistenza</a><button id="${logoutId}">Esci</button></div>`;
      el.querySelector(`#${CSS.escape(menuId)}`).onclick = (event) => {
        event.stopPropagation();
        document.querySelectorAll('.account-menu').forEach(menu => {
          if (menu !== el.querySelector('.account-menu')) menu.classList.add('hidden');
        });
        el.querySelector('.account-menu').classList.toggle('hidden');
      };
      el.querySelector(`#${CSS.escape(logoutId)}`).onclick = async () => {
        const client = await ensureClient();
        await client.auth.signOut();
        state.session = null;
        location.href = '/';
      };
    };

    mountBadge('#desktopAccountSlot', 'desktop');
    mountBadge('#mobileAccountSlot', 'mobile', true);

    if (!state.accountMenuOutsideBound) {
      document.addEventListener('click', (event) => {
        if (!event.target.closest('.account-badge')) document.querySelectorAll('.account-menu').forEach(menu => menu.classList.add('hidden'));
      });
      state.accountMenuOutsideBound = true;
    }
  }

  async function accessToken() {
    try {
      const client = await ensureClient();
      const { data } = await client.auth.getSession();
      state.session = data.session;
      return data.session?.access_token || '';
    } catch (_) {
      return '';
    }
  }

  async function saveProject(project) {
    if (!state.session) return;
    const client = await ensureClient();
    const payload = {
      user_id: state.session.user.id,
      name: project.company?.name || 'Nuovo progetto',
      project,
      updated_at: new Date().toISOString()
    };
    const { error } = await client.from('easycome_projects').upsert(payload, { onConflict: 'user_id' });
    if (error) console.warn('Salvataggio cloud:', error.message);
  }

  async function loadLatestProject() {
    if (!state.session) return null;
    const client = await ensureClient();
    const { data, error } = await client.from('easycome_projects').select('project').eq('user_id', state.session.user.id).maybeSingle();
    if (error) {
      console.warn(error.message);
      return null;
    }
    return data?.project || null;
  }

  async function init(force = false) {
    state.ready = false;
    state.initError = null;
    renderStudioLoading();
    try {
      const client = await ensureClient(force);
      const { data, error } = await client.auth.getSession();
      if (error) throw error;
      state.session = data.session;
      client.auth.onAuthStateChange((_event, session) => {
        state.session = session;
        if (session) showShell();
        else if (state.ready) redirectToAuth();
      });
      state.ready = true;
      if (state.session) showShell();
      else redirectToAuth();
    } catch (err) {
      state.initError = err;
      state.client = null;
      state.ready = false;
      renderStudioError(humanConfigError(err));
    }
  }

  window.EasyComeAccount = {
    getSession: () => state.session,
    getAccessToken: accessToken,
    saveProject,
    loadLatestProject,
    getUser: () => state.session?.user || null,
    getClient: () => state.client,
    retry: () => init(true),
  };

  init();
})();
