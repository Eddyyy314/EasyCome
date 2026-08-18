(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
  const slug=new URLSearchParams(location.search).get('d')||'';
  let payload=null;
  let activeIndex=0;
  let selectedRow=0;
  let workspaceQuery='';
  const sandboxKey=()=>`easycome:live-demo:${slug}`;
  let sandbox={sections:{}};

  async function event(name){
    fetch('/api/demo-event',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({slug,event:name})}).catch(()=>{});
  }

  function fail(message){
    $('#app').className='';
    $('#app').innerHTML=`<section class="error"><span class="error-kicker">EASY COME DEMO</span><h1>Questa anteprima non è disponibile.</h1><p>${esc(message)}</p><a href="/">Vai a Easy Come →</a></section>`;
  }

  function money(n){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(n)}


  function loadSandbox(){
    try{sandbox=JSON.parse(localStorage.getItem(sandboxKey())||'{"sections":{}}');if(!sandbox||typeof sandbox!=='object')throw new Error();if(!sandbox.sections)sandbox.sections={}}
    catch(_){sandbox={sections:{}}}
  }
  function persistSandbox(){try{localStorage.setItem(sandboxKey(),JSON.stringify(sandbox))}catch(_){}}
  function sectionData(label){
    const preset=listPreset(label);const key=String(label||'sezione').toLowerCase();
    if(!Array.isArray(sandbox.sections[key]))sandbox.sections[key]=preset.rows.map(r=>[...r]);
    return {key,preset,rows:sandbox.sections[key]};
  }
  function resetSandbox(){try{localStorage.removeItem(sandboxKey())}catch(_){}sandbox={sections:{}};selectedRow=0;workspaceQuery='';renderMain();toastDemo('Dati demo ripristinati.')}
  function toastDemo(message){const n=document.createElement('div');n.className='demo-toast';n.textContent=message;document.body.appendChild(n);requestAnimationFrame(()=>n.classList.add('show'));setTimeout(()=>{n.classList.remove('show');setTimeout(()=>n.remove(),180)},2200)}
  function csvEscape(v){const x=String(v??'');return /[\",\n]/.test(x)?`"${x.replaceAll('\"','\"\"')}"`:x}
  function exportSection(label){const {preset,rows}=sectionData(label);const csv=[preset.heads,...rows].map(r=>r.map(csvEscape).join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));a.download=`${String(label).toLowerCase().replace(/[^a-z0-9]+/gi,'-')}-demo.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);toastDemo('CSV demo esportato.')}

  function initials(name){
    return String(name||'EC').trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase();
  }

  function sectionIcon(label){
    const s=String(label||'').toLowerCase();
    const svg=(body)=>`<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${body}</svg>`;
    if(s.includes('menu'))return svg('<path d="M4 7h16M4 12h16M4 17h16"/>');
    if(s.includes('close'))return svg('<path d="m6 6 12 12M18 6 6 18"/>');
    if(s.includes('search'))return svg('<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>');
    if(s.includes('dashboard'))return svg('<path d="M4 13h6V4H4v9Zm10 7h6V11h-6v9ZM4 20h6v-3H4v3Zm10-13h6V4h-6v3Z"/>');
    if(s.includes('client')||s.includes('ospit')||s.includes('pazient')||s.includes('iscritt'))return svg('<circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.5-4 2.7-6 6.5-6s6 2 6.5 6"/>');
    if(s.includes('agenda')||s.includes('appuntament')||s.includes('prenot')||s.includes('scadenz')||s.includes('turn'))return svg('<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4m8-4v4M4 10h16"/>');
    if(s.includes('pagament')||s.includes('fattur')||s.includes('cassa')||s.includes('vendit'))return svg('<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18m-5 4h2"/>');
    if(s.includes('magazz')||s.includes('prodott'))return svg('<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/>');
    if(s.includes('document'))return svg('<path d="M6 3h8l4 4v14H6V3Z"/><path d="M14 3v5h5M9 13h6m-6 4h6"/>');
    if(s.includes('report'))return svg('<path d="M4 20V10m5 10V4m5 16v-7m5 7V7"/>');
    if(s.includes('veicol'))return svg('<path d="M5 16h14l-1.5-6h-11L5 16Z"/><path d="M7 10 9 6h6l2 4M7 16v2m10-2v2"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>');
    if(s.includes('intervent')||s.includes('pratic')||s.includes('trattament')||s.includes('ordini'))return svg('<path d="M5 4h14v16H5V4Z"/><path d="M8 8h8M8 12h8M8 16h5"/>');
    return svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v8m-4-4h8"/>');
  }

  function topbar(title,subtitle){
    const {place}=payload;
    return `<header class="view-top"><div class="view-title"><span class="crumb">${esc(payload.templateLabel||'GESTIONALE')} / ${esc(title.toUpperCase())}</span><h1>${esc(title)}</h1><p>${esc(subtitle)}</p></div><div class="view-actions"><span class="sync-pill">Salvato in questo dispositivo</span><div class="view-user"><span>${esc(initials(place.name))}</span><div><strong>${esc(place.name)}</strong><small>Ambiente demo operativo</small></div></div></div></header>`;
  }

  function chartBars(){
    return [48,62,55,79,71,88,76,92,68,84,73,95].map((h,i)=>`<i style="height:${h}%"><span>${i%2===0?'':''}</span></i>`).join('');
  }

  function dashboardView(){
    const {place,model}=payload;
    const quick=model.nav.slice(1,4);
    return `${topbar('Panoramica',`Oggi · ${place.category}${place.address?' · '+place.address:''}`)}
      <section class="hero"><div><span class="hero-kicker">CENTRO OPERATIVO</span><h2>Il lavoro di oggi, senza fogli sparsi.</h2><p>Questa è una versione utilizzabile del gestionale pensata per <b>${esc(place.name)}</b>. Puoi entrare nelle sezioni, creare record e modificare i dati demo.</p></div><div class="hero-actions"><button class="secondary-action" data-section-jump="1">Apri operatività</button><button class="primary-action" data-quick-new>+ Nuova voce</button></div></section>
      <section class="kpis">${model.kpis.map((x,i)=>`<article class="kpi"><div class="kpi-top"><span>${esc(x)}</span><i class="kpi-icon">${sectionIcon(model.nav[i+1]||model.nav[1]||'Dashboard')}</i></div><strong>${esc(model.values[i])}</strong><em>${i===0?'+12% rispetto a ieri':i===3?'+8,4% questo mese':'Aggiornato adesso'}</em></article>`).join('')}</section>
      <section class="quick-grid">${quick.map((x,i)=>`<button class="quick-card" data-section-jump="${i+1}"><i class="quick-icon">${sectionIcon(x)}</i><span><strong>${esc(x)}</strong><small>Apri e lavora sui dati</small></span><svg viewBox="0 0 24 24" fill="none"><path d="m9 18 6-6-6-6"/></svg></button>`).join('')}</section>
      <section class="dash-grid"><article class="card chart-card"><div class="card-head"><div><span>ANDAMENTO</span><h3>Attività degli ultimi 12 periodi</h3></div><b>+18,4%</b></div><div class="chart">${chartBars()}</div><div class="chart-axis"><span>inizio</span><span>oggi</span></div></article><article class="card"><div class="card-head"><div><span>ATTIVITÀ RECENTE</span><h3>Automazioni e aggiornamenti</h3></div><b class="live-dot">LIVE</b></div><div class="timeline">${model.activity.map((x,i)=>`<div><i></i><span><strong>${esc(x)}</strong><small>${['2 minuti fa','18 minuti fa','1 ora fa'][i]||'oggi'}</small></span></div>`).join('')}</div></article></section>
      <section class="card table-card"><div class="card-head"><div><span>DA GESTIRE</span><h3>Elementi che richiedono attenzione</h3></div><button data-section-jump="1">Vedi tutto</button></div>${tableHtml(['Cliente / voce','Dettaglio','Info','Stato'],model.rows)}</section>`;
  }

  function tableHtml(headings,rows,interactive=false,sourceIndexes=[]){
    return `<div class="table-wrap"><table><thead><tr>${headings.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map((r,idx)=>`<tr ${interactive?`data-row-index="${sourceIndexes[idx]??idx}" class="demo-data-row ${(sourceIndexes[idx]??idx)===selectedRow?'selected':''}"`:''}>${r.map((c,i)=>`<td data-label="${esc(headings[i]||'Campo')}">${i===0?`<strong>${esc(c)}</strong>`:i===r.length-1?`<span class="status ${idx%3===2?'neutral':''}">${esc(c)}</span>`:esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
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
    const data=sectionData(label),p=data.preset,rows=data.rows;
    return `${topbar(p.title,p.sub)}<section class="sandbox-note"><b>MODALITÀ PROVA</b><span>Crea e modifica le attività: restano solo su questo dispositivo e non toccano dati reali.</span><button data-reset-demo>Ripristina</button></section><section class="workspace-tools"><label class="demo-search">${sectionIcon('agenda')}<input value="" placeholder="Cerca nella giornata…" disabled></label><button data-calendar-nav="prev">← Settimana</button><button data-calendar-nav="next">Settimana →</button><b data-new-row>+ Nuova attività</b></section><section class="calendar-layout"><article class="card calendar-card"><div class="calendar-head"><button data-calendar-nav="prev">‹</button><div><span>AGOSTO 2026</span><h3>Settimana operativa</h3></div><button data-calendar-nav="next">›</button></div><div class="calendar-grid">${['Lun 17','Mar 18','Mer 19','Gio 20','Ven 21'].map((d,di)=>`<div class="day"><b>${d}</b>${Array.from({length:di%3+2},(_,i)=>`<span style="--shift:${15+(i*27)}%"><small>${9+i*2}:30</small>${esc(rows[(di+i)%Math.max(rows.length,1)]?.[0]||'Attività')}</span>`).join('')}</div>`).join('')}</div></article><article class="card side-summary"><span>OGGI</span><h3>${rows.length} attività nella demo</h3><div class="summary-list">${rows.slice(0,5).map((r,i)=>`<button class="summary-demo-row" data-row-index="${i}"><i></i><span><strong>${esc(r[0])}</strong><small>${esc(r[1]||'')} · ${esc(r[2]||'')}</small></span></button>`).join('')}</div><button data-new-row>+ Nuova attività</button></article></section><section class="agenda-mobile">${rows.slice(0,6).map((r,i)=>`<article class="agenda-row"><time>${esc(r[0]&&/^\d/.test(r[0])?r[0]:'09:30')}</time><span><strong>${esc(r[1]||r[0]||'Attività')}</strong><small>${esc(r[2]||'Attività demo')} · ${esc(r[3]||'Confermato')}</small></span><button data-row-index="${i}">Apri</button></article>`).join('')}<button data-new-row class="quick-card"><strong>+ Nuova attività</strong></button></section>`;
  }

  function reportView(label){
    return `${topbar(label,'Indicatori sintetici e andamento operativo')}<section class="sandbox-note"><b>REPORT DEMO</b><span>I valori sono simulati, ma la struttura mostra come potresti leggere il business in tempo reale.</span><button data-reset-demo>Ripristina</button></section><section class="report-grid"><article class="card report-main"><div class="card-head"><div><span>PERFORMANCE</span><h3>Andamento mensile</h3></div><b>+21,8%</b></div><div class="big-chart">${[38,52,47,66,58,73,69,81,76,88,84,94].map((h,i)=>`<div><i style="height:${h}%"></i><small>${i+1}</small></div>`).join('')}</div></article><article class="card report-side"><span>RIEPILOGO</span><div><small>Valore mese</small><strong>${money(18640)}</strong></div><div><small>Operazioni concluse</small><strong>128</strong></div><div><small>Tempo risparmiato</small><strong>31 h</strong></div><div><small>Automazioni eseguite</small><strong>246</strong></div></article></section><section class="kpis compact">${payload.model.kpis.map((x,i)=>`<article class="kpi"><div class="kpi-top"><span>${esc(x)}</span><i class="kpi-icon">${sectionIcon('report')}</i></div><strong>${esc(payload.model.values[i])}</strong><em>dato demo</em></article>`).join('')}</section>`;
  }

  function modalForRow(label,index,isNew=false){
    const {preset,rows}=sectionData(label);const current=isNew?preset.heads.map(()=> ''):(rows[index]||preset.heads.map(()=>''));
    const modal=document.createElement('div');modal.className='demo-modal';modal.innerHTML=`<div class="demo-modal-card"><header><div><span>${isNew?'NUOVO ELEMENTO':'MODIFICA ELEMENTO'}</span><h3>${esc(preset.title)}</h3></div><button type="button" data-close>×</button></header><form id="demoEditForm"><div class="demo-form-grid">${preset.heads.map((h,i)=>`<label><span>${esc(h)}</span><input name="f${i}" value="${esc(current[i]||'')}" ${i===0?'required':''}></label>`).join('')}</div><footer><button type="button" class="ghost" data-close>Annulla</button><button type="submit">${isNew?'Crea elemento':'Salva modifiche'}</button></footer></form></div>`;document.body.appendChild(modal);
    modal.querySelectorAll('[data-close]').forEach(b=>b.onclick=()=>modal.remove());
    modal.querySelector('form').onsubmit=e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const row=preset.heads.map((_,i)=>String(fd.get(`f${i}`)||''));if(isNew){rows.unshift(row);selectedRow=0}else{rows[index]=row;selectedRow=index}persistSandbox();modal.remove();renderMain();toastDemo(isNew?'Elemento creato nella demo.':'Modifiche salvate nella demo.')};
  }
  function deleteRow(label,index){const data=sectionData(label);if(!data.rows[index])return;if(!confirm('Eliminare questo elemento dalla demo?'))return;data.rows.splice(index,1);selectedRow=Math.max(0,Math.min(selectedRow,data.rows.length-1));persistSandbox();renderMain();toastDemo('Elemento eliminato dalla demo.')}
  function duplicateRow(label,index){const data=sectionData(label);if(!data.rows[index])return;data.rows.splice(index+1,0,[...data.rows[index]]);selectedRow=index+1;persistSandbox();renderMain();toastDemo('Elemento duplicato.')}
  function bindWorkspace(label){
    $$('[data-row-index]').forEach(r=>r.onclick=()=>{selectedRow=Number(r.dataset.rowIndex)||0;renderMain()});
    $('#demoSearch')?.addEventListener('input',e=>{workspaceQuery=e.target.value;renderMain();requestAnimationFrame(()=>{const i=$('#demoSearch');if(i){i.focus();i.setSelectionRange(i.value.length,i.value.length)}})});
    $$('[data-new-row]').forEach(b=>b.addEventListener('click',()=>modalForRow(label,0,true)));
    $('[data-edit-row]')?.addEventListener('click',()=>modalForRow(label,selectedRow,false));
    $('[data-delete-row]')?.addEventListener('click',()=>deleteRow(label,selectedRow));
    $('[data-duplicate-row]')?.addEventListener('click',()=>duplicateRow(label,selectedRow));
    $('[data-export-demo]')?.addEventListener('click',()=>exportSection(label));
    $$('[data-calendar-nav]').forEach(b=>b.addEventListener('click',()=>toastDemo(b.dataset.calendarNav==='prev'?'Settimana precedente caricata nella demo.':'Settimana successiva caricata nella demo.')));
  }
  function workspaceView(label){
    const s=String(label||'').toLowerCase();
    if(/agenda|appuntament|prenotaz|scadenz|turni|disponibil/.test(s))return calendarView(label);
    if(/report/.test(s))return reportView(label);
    const {preset:p,rows}=sectionData(label);const q=workspaceQuery.trim().toLowerCase();const indexed=rows.map((r,i)=>({r,i})).filter(x=>!q||x.r.some(c=>String(c).toLowerCase().includes(q)));const shown=indexed.map(x=>x.r),indexes=indexed.map(x=>x.i);if(selectedRow>=rows.length)selectedRow=Math.max(0,rows.length-1);const selected=rows[selectedRow]||[];
    return `${topbar(p.title,p.sub)}<section class="sandbox-note"><b>GESTIONALE IN PROVA</b><span>Questa sezione è operativa: crea, modifica, duplica, elimina, cerca ed esporta i dati demo.</span><button data-reset-demo>Ripristina</button></section><section class="workspace-tools live-tools"><label class="demo-search">${sectionIcon('search')}<input id="demoSearch" value="${esc(workspaceQuery)}" placeholder="Cerca in ${esc(p.title.toLowerCase())}…"></label><button data-export-demo>Esporta CSV</button><i>${shown.length} risultati</i><b data-new-row>+ Nuova voce</b></section><section class="work-grid"><article class="card table-card work-table">${tableHtml(p.heads,shown,true,indexes)}</article><aside class="card detail-card"><span>SCHEDA SELEZIONATA</span>${selected.length?`<h3>${esc(selected[0]||p.title)}</h3>${p.heads.slice(1).map((h,i)=>`<div><small>${esc(h)}</small><strong>${esc(selected[i+1]||'—')}</strong></div>`).join('')}<footer class="demo-detail-actions"><button data-edit-row>Modifica</button><button data-duplicate-row>Duplica</button><button class="danger" data-delete-row>Elimina</button></footer>`:`<h3>Nessun elemento</h3><p>Crea una nuova voce per provare questa sezione.</p><footer><button data-new-row>+ Nuova voce</button></footer>`}</aside></section>`;
  }

  function renderMain(){
    const {model}=payload;
    const label=model.nav[activeIndex]||model.nav[0]||'Dashboard';
    $('#view').innerHTML=activeIndex===0?dashboardView():workspaceView(label);
    $$('[data-section-jump]').forEach(b=>b.onclick=()=>activate(Number(b.dataset.sectionJump||0)));
    $('[data-quick-new]')?.addEventListener('click',()=>{activate(Math.min(1,model.nav.length-1));requestAnimationFrame(()=>modalForRow(model.nav[1]||'Attività',0,true))});
    if(activeIndex>0)bindWorkspace(label);
    $('[data-reset-demo]')?.addEventListener('click',resetSandbox);
  }

  function activate(index){
    activeIndex=Math.max(0,Math.min(index,payload.model.nav.length-1));
    $$('[data-index]').forEach(b=>b.classList.toggle('active',Number(b.dataset.index)===activeIndex));
    const more=$('#mobileMore');if(more)more.classList.toggle('active',activeIndex>3);
    closeMobileMenu();
    renderMain();
    window.scrollTo({top:0,behavior:'smooth'});
    history.replaceState(null,'',`${location.pathname}?d=${encodeURIComponent(slug)}&section=${activeIndex}`);
  }

  
  function openMobileMenu(){
    $('#demoSide')?.classList.add('open');
    $('#sideBackdrop')?.classList.add('show');
    document.body.style.overflow='hidden';
  }
  function closeMobileMenu(){
    $('#demoSide')?.classList.remove('open');
    $('#sideBackdrop')?.classList.remove('show');
    document.body.style.overflow='';
  }

  async function init(){
    try{
      if(!slug)throw new Error('Link demo incompleto.');
      const r=await fetch(`/api/demo-public?slug=${encodeURIComponent(slug)}`,{cache:'no-store'});
      const d=await r.json();
      if(!r.ok)throw new Error(d.error||'Demo non disponibile.');
      payload=d;
      loadSandbox();
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
      const navButtons=model.nav.map((x,i)=>`<button class="${i===activeIndex?'active':''}" data-index="${i}"><span class="nav-icon">${sectionIcon(x)}</span><b>${esc(x)}</b></button>`).join('');
      const mobileTabs=model.nav.slice(0,4).map((x,i)=>`<button class="${i===activeIndex?'active':''}" data-index="${i}">${sectionIcon(x)}<span>${esc(x)}</span></button>`).join('');
      $('#app').innerHTML=`<div class="demo-shell"><aside class="side" id="demoSide"><div class="brand"><span class="brand-mark">EC</span><div><small>GESTIONALE CREATO PER</small><strong>${esc(place.name)}</strong></div><button class="side-close" id="sideClose" aria-label="Chiudi menu">${sectionIcon('close')}</button></div><div class="side-head"><div class="demo-badge">DEMO OPERATIVA</div></div><div class="side-price"><small>QUESTA CONFIGURAZIONE</small><strong>${money(quotedPrice)}</strong><span>una tantum</span></div><div class="nav-label">AREA DI LAVORO</div><nav class="nav">${navButtons}</nav><div class="side-info"><span>Ambiente dimostrativo</span><p>I dati operativi sono inventati. Puoi modificarli liberamente: le prove restano solo sul tuo dispositivo.</p></div><div class="side-footer"><b>Easy Come</b><small>Più ordine. Meno caos.</small></div></aside><div class="side-backdrop" id="sideBackdrop"></div><header class="mobile-appbar"><button class="mobile-menu-btn" id="mobileMenuBtn" aria-label="Apri menu">${sectionIcon('menu')}</button><div class="mobile-brand"><strong>${esc(place.name)}</strong><small>${esc(payload.templateLabel||'Gestionale Easy Come')} · Demo operativa</small></div><span class="mobile-price">${money(quotedPrice)}</span><a href="${studio}" class="mobile-cta" id="mobileCta">Personalizza</a></header><main class="main"><div class="demo-topline"><div class="expiry"><span class="pulse"></span>${esc(expiry)}</div><div class="demo-quote"><span>Gestionali da ${money(startingPrice)}</span><strong>Questa demo: ${money(quotedPrice)}</strong></div><div class="top-actions"><a href="${studio}" id="topCta">Personalizza il gestionale</a></div></div><div id="view"></div><section class="cta"><div><span>PREZZO INDICATIVO · ${money(quotedPrice)} UNA TANTUM</span><h2>Questa base è già pronta. Adesso rendila tua.</h2><p>Nel configuratore ritrovi esattamente questa proposta: puoi aggiungere o togliere funzioni e vedere il prezzo aggiornarsi prima dell’acquisto.</p></div><a id="cta" href="${studio}">Personalizza questa versione →</a></section><div class="meta"><span>Demo Easy Come · dati operativi dimostrativi · prezzo indicativo</span><span class="google" translate="no">Google Maps</span></div></main><nav class="mobile-nav">${mobileTabs}<button id="mobileMore">${sectionIcon('menu')}<span>Altro</span></button></nav></div>`;
      $$('[data-index]').forEach(b=>b.onclick=()=>activate(Number(b.dataset.index)));
      $('#mobileMenuBtn')?.addEventListener('click',openMobileMenu);$('#mobileMore')?.addEventListener('click',openMobileMenu);$('#sideClose')?.addEventListener('click',closeMobileMenu);$('#sideBackdrop')?.addEventListener('click',closeMobileMenu);
      const saveStudioHandoff=()=>{
        try{sessionStorage.setItem(`easycome:demo-handoff:${slug}`,JSON.stringify({project:d.project,price:quotedPrice,savedAt:Date.now()}));}catch(_){ }
        event('cta');
      };
      ['cta','topCta','mobileCta'].forEach(id=>{const el=$('#'+id);if(el)el.onclick=saveStudioHandoff});
      renderMain();
      event('view');
    }catch(e){fail(e.message)}
  }
  init();
})();
