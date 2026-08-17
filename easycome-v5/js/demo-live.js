(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const slug=new URLSearchParams(location.search).get('d')||'';
  let payload=null;
  let activeIndex=0;

  async function event(name){
    fetch('/api/demo-event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,event:name})}).catch(()=>{});
  }

  function fail(message){
    $('#app').className='';
    $('#app').innerHTML=`<section class="error"><span class="error-kicker">EASY COME DEMO</span><h1>Questa anteprima non è disponibile.</h1><p>${esc(message)}</p><a href="/">Vai a Easy Come →</a></section>`;
  }

  function money(n){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n)}

  function initials(name){
    return String(name||'EC').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
  }

  function sectionIcon(label){
    const s=String(label||'').toLowerCase();
    if(s.includes('dashboard'))return '⌂';
    if(s.includes('client')||s.includes('ospit')||s.includes('pazient')||s.includes('iscritt'))return '◎';
    if(s.includes('agenda')||s.includes('appuntament')||s.includes('prenot')||s.includes('scadenz')||s.includes('turn'))return '◷';
    if(s.includes('pagament')||s.includes('fattur')||s.includes('cassa')||s.includes('vendit'))return '€';
    if(s.includes('magazz')||s.includes('prodott'))return '◇';
    if(s.includes('document'))return '▤';
    if(s.includes('report'))return '↗';
    if(s.includes('veicol'))return '⌁';
    if(s.includes('intervent')||s.includes('pratic')||s.includes('trattament')||s.includes('ordini'))return '▦';
    return '•';
  }

  function topbar(title,subtitle){
    const {place}=payload;
    return `<header class="view-top"><div><span class="crumb">${esc(payload.templateLabel||'GESTIONALE')} / ${esc(title.toUpperCase())}</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="view-user"><span>${esc(initials(place.name))}</span><div><strong>${esc(place.name)}</strong><small>Ambiente dimostrativo</small></div></div></header>`;
  }

  function chartBars(){
    return [48,62,55,79,71,88,76,92,68,84,73,95].map((h,i)=>`<i style="height:${h}%"><span>${i%2===0?'':''}</span></i>`).join('');
  }

  function dashboardView(){
    const {place,model}=payload;
    return `${topbar('Panoramica',`Oggi · ${place.category}${place.address?' · '+place.address:''}`)}
      <section class="hero"><div><span>CENTRO OPERATIVO</span><h2>Tutto sotto controllo, in un solo posto.</h2><p>Una simulazione costruita sul tipo di attività di <b>${esc(place.name)}</b>. Tutti i clienti, importi e operazioni mostrati qui sono fittizi.</p></div><button data-section-jump="1">Apri area operativa →</button></section>
      <section class="kpis">${model.kpis.map((x,i)=>`<article class="kpi"><span>${esc(x)}</span><strong>${esc(model.values[i])}</strong><em>${i===0?'+12% rispetto a ieri':'Aggiornato adesso'}</em></article>`).join('')}</section>
      <section class="dash-grid"><article class="card chart-card"><div class="card-head"><div><span>ANDAMENTO</span><h3>Ultimi 12 periodi</h3></div><b>+18,4%</b></div><div class="chart">${chartBars()}</div><div class="chart-axis"><span>inizio</span><span>oggi</span></div></article><article class="card"><div class="card-head"><div><span>ATTIVITÀ RECENTE</span><h3>Automazioni e aggiornamenti</h3></div><b class="live-dot">LIVE</b></div><div class="timeline">${model.activity.map((x,i)=>`<div><i></i><span><strong>${esc(x)}</strong><small>${['2 minuti fa','18 minuti fa','1 ora fa'][i]||'oggi'}</small></span></div>`).join('')}</div></article></section>
      <section class="card table-card"><div class="card-head"><div><span>OPERATIVITÀ</span><h3>Elementi che richiedono attenzione</h3></div><button data-section-jump="1">Vedi tutto</button></div>${tableHtml(['Cliente / voce','Dettaglio','Info','Stato'],model.rows)}</section>`;
  }

  function tableHtml(headings,rows){
    return `<div class="table-wrap"><table><thead><tr>${headings.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r,idx)=>`<tr>${r.map((c,i)=>`<td>${i===0?`<strong>${esc(c)}</strong>`:i===r.length-1?`<span class="status ${idx%3===2?'neutral':''}">${esc(c)}</span>`:esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function listPreset(label){
    const s=String(label||'').toLowerCase();
    if(s.includes('client'))return {title:'Clienti',sub:'Anagrafiche, attività e stato relazione',heads:['Cliente','Contatto','Ultima attività','Stato'],rows:[['Andrea Romano','+39 333 482 1180','Oggi, 11:20','Attivo'],['Laura Bianchi','+39 347 210 8841','Ieri, 17:42','Da ricontattare'],['Marco De Luca','+39 320 778 0204','14 Ago, 09:15','Attivo'],['Elena Greco','+39 339 421 6207','12 Ago, 16:08','Nuovo']]};
    if(s.includes('pratic'))return {title:'Pratiche',sub:'Stato, scadenze e responsabilità',heads:['Pratica','Cliente','Scadenza','Stato'],rows:[['PR-0248 · Contratto','Rossi Srl','22 Ago','In lavorazione'],['PR-0247 · Consulenza','Bianchi SNC','25 Ago','Da approvare'],['PR-0246 · Verifica','Luca Ferri','28 Ago','In attesa'],['PR-0245 · Revisione','Studio Neri','30 Ago','Completa']]};
    if(s.includes('scadenz'))return {title:'Scadenze',sub:'Le prossime attività da non perdere',heads:['Attività','Cliente','Data','Priorità'],rows:[['Invio documentazione','Rossi Srl','18 Ago','Alta'],['Revisione pratica','Bianchi SNC','20 Ago','Media'],['Rinnovo accordo','Luca Ferri','22 Ago','Alta'],['Follow-up','Studio Neri','26 Ago','Normale']]};
    if(s.includes('document'))return {title:'Documenti',sub:'File, versioni e stato approvazione',heads:['Documento','Collegato a','Aggiornato','Stato'],rows:[['Contratto_servizi.pdf','Rossi Srl','Oggi','Firmato'],['Preventivo_104.pdf','Bianchi SNC','Ieri','Da firmare'],['Allegato_tecnico.pdf','Luca Ferri','13 Ago','Condiviso'],['Verbale_riunione.pdf','Studio Neri','11 Ago','Archiviato']]};
    if(s.includes('fattur')||s.includes('pagament')||s.includes('cassa')||s.includes('vendit'))return {title:label,sub:'Movimenti economici e stato incassi',heads:['Documento','Cliente','Importo','Stato'],rows:[['EC-2026-184','Rossi Srl',money(1280),'Pagato'],['EC-2026-183','Bianchi SNC',money(740),'In scadenza'],['EC-2026-182','Luca Ferri',money(390),'Pagato'],['EC-2026-181','Studio Neri',money(960),'Da incassare']]};
    if(s.includes('preventiv'))return {title:'Preventivi',sub:'Proposte, importi e approvazioni',heads:['Preventivo','Cliente','Importo','Stato'],rows:[['PV-1092','Rossi Srl',money(1480),'Accettato'],['PV-1091','Bianchi SNC',money(860),'Da approvare'],['PV-1090','Luca Ferri',money(420),'Inviato'],['PV-1089','Studio Neri',money(1190),'Bozza']]};
    if(s.includes('veicol'))return {title:'Veicoli',sub:'Mezzi, targhe e stato lavorazione',heads:['Veicolo','Targa','Cliente','Stato'],rows:[['Fiat 500','GA 428 TR','Mario Rossi','In lavorazione'],['Audi A3','FV 219 KC','Luca Bianchi','Pronto'],['Jeep Renegade','GM 882 LP','Sara Conti','Diagnosi'],['Ford Puma','GH 341 NX','Anna Greco','Accettazione']]};
    if(s.includes('intervent'))return {title:'Interventi',sub:'Lavori assegnati e avanzamento operativo',heads:['Cliente','Intervento','Ora','Stato'],rows:payload.model.rows};
    if(s.includes('prenot'))return {title:'Prenotazioni',sub:'Arrivi, permanenze e conferme',heads:['Ospite','Prenotazione','Periodo','Stato'],rows:payload.model.rows};
    if(s.includes('ospit'))return {title:'Ospiti',sub:'Anagrafiche e soggiorni attivi',heads:['Ospite','Arrivo','Partenza','Stato'],rows:[['Fam. Romano','15 Ago','18 Ago','In struttura'],['Marco De Luca','15 Ago','20 Ago','In struttura'],['Giulia Serra','16 Ago','19 Ago','In arrivo'],['Paolo Riva','17 Ago','21 Ago','Confermato']]};
    if(s.includes('disponibil'))return {title:'Disponibilità',sub:'Risorse e occupazione dei prossimi giorni',heads:['Risorsa','Oggi','Domani','Stato'],rows:[['Unità 01','Occupata','Occupata','Libera dal 18'],['Unità 02','Libera','Occupata','Prenotata'],['Unità 03','Occupata','Libera','Disponibile'],['Unità 04','Libera','Libera','Disponibile']]};
    if(s.includes('appuntament')||s.includes('agenda'))return {title:label,sub:'Agenda operativa della giornata',heads:['Ora','Cliente','Attività','Stato'],rows:[['09:00','Andrea Romano','Appuntamento','Confermato'],['10:30','Laura Bianchi','Servizio','In corso'],['12:00','Marco De Luca','Richiesta','Da confermare'],['15:30','Elena Greco','Follow-up','Confermato']]};
    if(s.includes('pazient'))return {title:'Pazienti',sub:'Anagrafiche e prossimi controlli',heads:['Paziente','Prossima visita','Trattamento','Stato'],rows:[['Paziente demo 01','18 Ago, 10:00','Controllo','Confermato'],['Paziente demo 02','18 Ago, 11:15','Trattamento','Attivo'],['Paziente demo 03','19 Ago, 15:30','Prima visita','Nuovo'],['Paziente demo 04','20 Ago, 09:30','Controllo','Confermato']]};
    if(s.includes('trattament'))return {title:'Trattamenti',sub:'Percorsi, sedute e stato',heads:['Trattamento','Paziente','Prossima seduta','Stato'],rows:[['Percorso A','Paziente demo 01','18 Ago','Attivo'],['Percorso B','Paziente demo 02','19 Ago','Attivo'],['Percorso C','Paziente demo 03','21 Ago','Da iniziare'],['Percorso D','Paziente demo 04','23 Ago','In controllo']]};
    if(s.includes('iscritt'))return {title:'Iscritti',sub:'Soci, piani e rinnovi',heads:['Iscritto','Piano','Scadenza','Stato'],rows:[['Andrea Pace','Mensile','31 Ago','Attivo'],['Elena Greco','Trimestrale','15 Set','Attivo'],['Fabio Rizzi','Mensile','18 Ago','In rinnovo'],['Marta Serra','Annuale','04 Nov','Attivo']]};
    if(s.includes('abbonament'))return {title:'Abbonamenti',sub:'Piani attivi, scadenze e rinnovi',heads:['Abbonamento','Iscritto','Scadenza','Stato'],rows:[['Mensile Pro','Andrea Pace','31 Ago','Attivo'],['Trimestrale','Elena Greco','15 Set','Attivo'],['Mensile','Fabio Rizzi','18 Ago','In rinnovo'],['Annuale','Marta Serra','04 Nov','Attivo']]};
    if(s.includes('prodott'))return {title:'Prodotti',sub:'Catalogo, prezzo e disponibilità',heads:['Prodotto','SKU','Prezzo','Stato'],rows:[['Prodotto Alpha','EC-1004',money(89),'Disponibile'],['Prodotto Beta','EC-1003',money(142),'Disponibile'],['Prodotto Gamma','EC-1002',money(64),'Scorta bassa'],['Prodotto Delta','EC-1001',money(119),'Disponibile']]};
    if(s.includes('magazz'))return {title:'Magazzino',sub:'Scorte e riordini suggeriti',heads:['Articolo','Disponibili','Soglia','Stato'],rows:[['Articolo A','18','8','OK'],['Articolo B','4','10','Da riordinare'],['Articolo C','32','12','OK'],['Articolo D','7','9','Sotto soglia']]};
    if(s.includes('ordini'))return {title:'Ordini',sub:'Ordini, clienti e avanzamento',heads:['Ordine','Cliente','Importo','Stato'],rows:payload.model.rows};
    if(s.includes('tecnic'))return {title:'Tecnici',sub:'Squadra, interventi e disponibilità',heads:['Tecnico','Interventi oggi','Zona','Stato'],rows:[['Luca Serra','3','Centro','Operativo'],['Marco Riva','2','Nord','Operativo'],['Gianni Pace','4','Sud','In intervento'],['Elena Greco','1','Centro','Disponibile']]};
    if(s.includes('tavol'))return {title:'Tavoli',sub:'Sala e disponibilità in tempo reale',heads:['Tavolo','Coperti','Prossima prenotazione','Stato'],rows:[['Tavolo 12','4','20:30','Prenotato'],['Tavolo 7','2','21:00','Prenotato'],['Tavolo 4','6','21:15','In attesa'],['Tavolo 2','2','—','Libero']]};
    if(s.includes('turn'))return {title:'Turni',sub:'Presenze e copertura del servizio',heads:['Persona','Ruolo','Orario','Stato'],rows:[['Luca','Sala','18:00–00:00','Confermato'],['Marta','Cucina','17:30–23:30','Confermato'],['Gianni','Sala','19:00–01:00','Confermato'],['Elena','Cassa','18:30–00:30','Confermato']]};
    return {title:label,sub:'Vista operativa personalizzata per questa attività',heads:['Voce','Dettaglio','Info','Stato'],rows:payload.model.rows};
  }

  function calendarView(label){
    const p=listPreset(label);
    return `${topbar(p.title,p.sub)}<section class="calendar-layout"><article class="card calendar-card"><div class="calendar-head"><button>‹</button><div><span>AGOSTO 2026</span><h3>Settimana operativa</h3></div><button>›</button></div><div class="calendar-grid">${['Lun 17','Mar 18','Mer 19','Gio 20','Ven 21'].map((d,di)=>`<div class="day"><b>${d}</b>${Array.from({length:di%3+2},(_,i)=>`<span style="--shift:${15+(i*27)}%"><small>${9+i*2}:30</small>${esc(['Appuntamento','Intervento','Follow-up','Scadenza'][(di+i)%4])}</span>`).join('')}</div>`).join('')}</div></article><article class="card side-summary"><span>OGGI</span><h3>4 attività pianificate</h3><div class="summary-list">${p.rows.slice(0,4).map(r=>`<div><i></i><span><strong>${esc(r[0])}</strong><small>${esc(r[1])} · ${esc(r[2])}</small></span></div>`).join('')}</div><button>+ Nuova attività</button></article></section>`;
  }

  function reportView(label){
    return `${topbar(label,'Indicatori sintetici e andamento operativo')}<section class="report-grid"><article class="card report-main"><div class="card-head"><div><span>PERFORMANCE</span><h3>Andamento mensile</h3></div><b>+21,8%</b></div><div class="big-chart">${[38,52,47,66,58,73,69,81,76,88,84,94].map((h,i)=>`<div><i style="height:${h}%"></i><small>${i+1}</small></div>`).join('')}</div></article><article class="card report-side"><span>RIEPILOGO</span><div><small>Valore mese</small><strong>${money(18640)}</strong></div><div><small>Operazioni concluse</small><strong>128</strong></div><div><small>Tempo risparmiato</small><strong>31 h</strong></div><div><small>Automazioni eseguite</small><strong>246</strong></div></article></section><section class="kpis compact">${payload.model.kpis.map((x,i)=>`<article class="kpi"><span>${esc(x)}</span><strong>${esc(payload.model.values[i])}</strong><em>dato demo</em></article>`).join('')}</section>`;
  }

  function workspaceView(label){
    const s=String(label||'').toLowerCase();
    if(/agenda|appuntament|prenotaz|scadenz|turni|disponibil/.test(s))return calendarView(label);
    if(/report/.test(s))return reportView(label);
    const p=listPreset(label);
    return `${topbar(p.title,p.sub)}<section class="workspace-tools"><label>⌕ <span>Cerca in ${esc(p.title.toLowerCase())}…</span></label><button>Tutti gli stati⌄</button><button>Ordina⌄</button><i>${p.rows.length*8} risultati</i><b>+ Nuova voce</b></section><section class="work-grid"><article class="card table-card work-table">${tableHtml(p.heads,p.rows)}</article><aside class="card detail-card"><span>SCHEDA SELEZIONATA</span><h3>${esc(p.rows[0]?.[0]||p.title)}</h3>${p.heads.slice(1).map((h,i)=>`<div><small>${esc(h)}</small><strong>${esc(p.rows[0]?.[i+1]||'—')}</strong></div>`).join('')}<footer><button>Modifica</button><button>Altre azioni</button></footer></aside></section>`;
  }

  function renderMain(){
    const {model}=payload;
    const label=model.nav[activeIndex]||model.nav[0]||'Dashboard';
    $('#view').innerHTML=activeIndex===0?dashboardView():workspaceView(label);
    $$('[data-section-jump]').forEach(b=>b.onclick=()=>activate(Number(b.dataset.sectionJump||0)));
  }

  function activate(index){
    activeIndex=Math.max(0,Math.min(index,payload.model.nav.length-1));
    $$('.nav button').forEach((b,i)=>b.classList.toggle('active',i===activeIndex));
    renderMain();
    history.replaceState(null,'',`${location.pathname}?d=${encodeURIComponent(slug)}&section=${activeIndex}`);
  }

  async function init(){
    try{
      if(!slug)throw new Error('Link demo incompleto.');
      const r=await fetch(`/api/demo-public?slug=${encodeURIComponent(slug)}`,{cache:'no-store'});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Demo non disponibile.');
      payload=d;
      const {place,model}=d;
      document.documentElement.style.setProperty('--brand',model.color||'#275dff');
      document.documentElement.style.setProperty('--accent',model.accent||'#17213b');
      document.title=`Demo Easy Come — ${place.name}`;
      const exp=d.expiresAt?new Date(d.expiresAt):null;
      const expiry=exp?`DISPONIBILE FINO AL ${exp.toLocaleDateString('it-IT',{day:'2-digit',month:'short'}).toUpperCase()}`:'DEMO GRATUITA';
      const studio=`/studio?demo=${encodeURIComponent(slug)}&source=prospect`;
      const requestedSection=Number(new URLSearchParams(location.search).get('section')||0);
      activeIndex=Number.isFinite(requestedSection)?Math.max(0,Math.min(requestedSection,model.nav.length-1)):0;

      $('#app').className='';
      const quotedPrice=Number(d.price||198);const startingPrice=Number(d.startingPrice||198);
      $('#app').innerHTML=`<div class="demo-shell"><aside class="side"><div class="brand"><span class="brand-mark">EC</span><div><small>ANTEPRIMA CREATA PER</small><strong>${esc(place.name)}</strong></div></div><div class="demo-badge">DEMO INTERATTIVA</div><div class="side-price"><small>QUESTA CONFIGURAZIONE</small><strong>${money(quotedPrice)}</strong><span>una tantum</span></div><nav class="nav">${model.nav.map((x,i)=>`<button class="${i===activeIndex?'active':''}" data-index="${i}"><span>${sectionIcon(x)}</span><b>${esc(x)}</b></button>`).join('')}</nav><div class="side-info"><span>Questa è una simulazione</span><p>I dati operativi sono inventati. Il nome e le informazioni pubbliche dell’attività servono solo a rendere l’anteprima concreta.</p></div><div class="side-footer"><b>Easy Come</b><small>Più ordine. Meno caos.</small></div></aside><main class="main"><div class="demo-topline"><div><span class="pulse"></span> ${esc(expiry)}</div><div class="demo-quote"><span>Gestionali da ${money(startingPrice)}</span><strong>Questa demo: ${money(quotedPrice)}</strong></div><div class="top-actions"><a href="${studio}" id="topCta">Adattalo al tuo lavoro</a></div></div><div id="view"></div><section class="cta"><div><span>PREZZO INDICATIVO · ${money(quotedPrice)} UNA TANTUM</span><h2>Vuoi adattarlo davvero a come lavorate voi?</h2><p>Questa configurazione è già prezzata in base alle funzioni mostrate. Puoi modificarla e vedere il prezzo aggiornarsi prima di acquistare. I gestionali Easy Come partono da ${money(startingPrice)}.</p></div><a id="cta" href="${studio}">Personalizza questa versione →</a></section><div class="meta"><span>Demo Easy Come · dati operativi dimostrativi · prezzo indicativo</span><span class="google" translate="no">Google Maps</span></div></main></div>`;
      $$('.nav button').forEach(b=>b.onclick=()=>activate(Number(b.dataset.index)));
      $('#cta').onclick=()=>event('cta');
      $('#topCta').onclick=()=>event('cta');
      renderMain();
      event('view');
    }catch(e){fail(e.message)}
  }
  init();
})();
