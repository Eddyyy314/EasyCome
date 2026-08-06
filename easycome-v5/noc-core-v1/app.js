(() => {
  const STORE_KEY = 'noc-core-v1';
  const today = new Date();
  today.setHours(0,0,0,0);

  const presets = {
    camper: { name:'Area camper', client:'Ospite', booking:'Prenotazione', resource:'Piazzola', start:'Arrivo', end:'Partenza', accent:'#c43a31' },
    hotel: { name:'Hotel / B&B', client:'Ospite', booking:'Prenotazione', resource:'Camera', start:'Check-in', end:'Check-out', accent:'#315f70' },
    salon: { name:'Parrucchiere / Salone', client:'Cliente', booking:'Appuntamento', resource:'Postazione', start:'Inizio', end:'Fine', accent:'#76568b' },
    rental: { name:'Autonoleggio', client:'Cliente', booking:'Noleggio', resource:'Veicolo', start:'Ritiro', end:'Consegna', accent:'#3e6658' },
    sport: { name:'Centro sportivo', client:'Cliente', booking:'Prenotazione', resource:'Campo', start:'Inizio', end:'Fine', accent:'#326b4f' },
    restaurant: { name:'Ristorante', client:'Cliente', booking:'Prenotazione', resource:'Tavolo', start:'Arrivo', end:'Fine turno', accent:'#8c4b36' }
  };

  const fmtDate = d => new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(d));
  const fmtShort = d => new Intl.DateTimeFormat('it-IT',{day:'2-digit',month:'2-digit'}).format(new Date(d));
  const fmtMoney = n => new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||0);
  const iso = d => { const x=new Date(d); const y=x.getFullYear(); const m=String(x.getMonth()+1).padStart(2,'0'); const day=String(x.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; };
  const addDays = (d,n) => { const x=new Date(d); x.setDate(x.getDate()+n); return iso(x); };
  const uid = p => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`;
  const esc = s => String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[c]));

  const demoState = () => ({
    settings:{ businessName:'NOC Demo — Area Camper', type:'camper', currency:'EUR', ...presets.camper },
    clients:[
      {id:'c1',name:'Marco Rossi',phone:'+39 333 123 4567',email:'marco@example.it',notes:'Viaggia con camper 7,20 m'},
      {id:'c2',name:'Giulia Bianchi',phone:'+39 347 555 1020',email:'giulia@example.it',notes:'2 adulti + 1 bambino'},
      {id:'c3',name:'Luca Romano',phone:'+39 320 989 1188',email:'luca@example.it',notes:'Preferisce zona ombreggiata'},
      {id:'c4',name:'Anna Esposito',phone:'+39 328 440 2201',email:'anna@example.it',notes:''}
    ],
    resources:Array.from({length:12},(_,i)=>({id:`r${i+1}`,name:`Piazzola ${i+1}`,category:i<4?'Large':'Standard',capacity:i<4?6:4,notes:i%3===0?'Ombreggiata':''})),
    bookings:[
      {id:'NOC-1001',clientId:'c1',resourceId:'r2',start:addDays(today,-1),end:addDays(today,2),status:'confirmed',total:105,paid:105,paymentMethod:'Bonifico',notes:''},
      {id:'NOC-1002',clientId:'c2',resourceId:'r5',start:iso(today),end:addDays(today,4),status:'confirmed',total:140,paid:70,paymentMethod:'Carta',notes:''},
      {id:'NOC-1003',clientId:'c3',resourceId:'r8',start:addDays(today,1),end:addDays(today,3),status:'pending',total:70,paid:0,paymentMethod:'Contanti',notes:''},
      {id:'NOC-1004',clientId:'c4',resourceId:'r1',start:addDays(today,4),end:addDays(today,8),status:'confirmed',total:140,paid:140,paymentMethod:'Online',notes:''},
      {id:'NOC-0998',clientId:'c1',resourceId:'r9',start:addDays(today,-36),end:addDays(today,-32),status:'completed',total:100,paid:100,paymentMethod:'Carta',notes:''},
      {id:'NOC-0993',clientId:'c2',resourceId:'r4',start:addDays(today,-65),end:addDays(today,-61),status:'completed',total:100,paid:100,paymentMethod:'Bonifico',notes:''},
      {id:'NOC-0988',clientId:'c3',resourceId:'r7',start:addDays(today,-92),end:addDays(today,-88),status:'completed',total:80,paid:80,paymentMethod:'Contanti',notes:''}
    ]
  });

  let state = load();
  let calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);

  function load(){ try { return JSON.parse(localStorage.getItem(STORE_KEY)) || demoState(); } catch { return demoState(); } }
  function save(){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); renderAll(); }
  function s(){ return state.settings; }
  function client(id){ return state.clients.find(x=>x.id===id); }
  function resource(id){ return state.resources.find(x=>x.id===id); }
  function statusLabel(v){ return ({confirmed:'Confermata',pending:'In attesa',completed:'Completata',cancelled:'Annullata'})[v]||v; }
  function isActiveOn(b,date){ const d=iso(date); return b.status!=='cancelled' && b.start<=d && b.end>d; }
  function isTodayStart(b){ return b.start===iso(today) && b.status!=='cancelled'; }
  function overlap(resourceId,start,end,ignoreId=null){ return state.bookings.some(b=>b.id!==ignoreId && b.resourceId===resourceId && b.status!=='cancelled' && start<b.end && end>b.start); }

  function applySettings(){
    document.documentElement.style.setProperty('--accent', s().accent || '#c43a31');
    const setTxt=(id,v)=>{ const el=document.getElementById(id); if(el) el.textContent=v; };
    setTxt('sidebarBusinessName',s().businessName); setTxt('sidebarBusinessType',s().name);
    setTxt('sidebarAvatar',s().businessName.split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase());
    setTxt('navBookingLabel',pluralize(s().booking)); setTxt('navResourceLabel',pluralize(s().resource)); setTxt('navClientLabel',pluralize(s().client));
    setTxt('statTodayLabel',`${pluralize(s().start)} oggi`); setTxt('statOccupiedLabel',`${pluralize(s().resource)} occupate`); setTxt('statUpcomingLabel',`Prossime ${s().booking.toLowerCase()}`);
    setTxt('todayPanelTitle',`${pluralize(s().start)} e attività di oggi`); setTxt('occupancyTitle',`Occupazione ${pluralize(s().resource).toLowerCase()}`);
    setTxt('resourceCopy',`Gestisci ${pluralize(s().resource).toLowerCase()} prenotabili della tua attività.`);
    setTxt('thClient',s().client); setTxt('thResource',s().resource); setTxt('clientNameHead',s().client); setTxt('paymentClientHead',s().client);
    setTxt('bookingClientLabel',s().client); setTxt('bookingResourceLabel',s().resource);
    setTxt('welcomeSubtitle',`Ecco cosa succede oggi in ${s().businessName}.`);
    document.getElementById('quickAddBtn').textContent=`+ Nuova ${s().booking.toLowerCase()}`;
    document.getElementById('bookingModalTitle').textContent=`Nuova ${s().booking.toLowerCase()}`;
  }
  function pluralize(w){ const map={Ospite:'Ospiti',Cliente:'Clienti',Prenotazione:'Prenotazioni',Appuntamento:'Appuntamenti',Noleggio:'Noleggi',Piazzola:'Piazzole',Camera:'Camere',Postazione:'Postazioni',Veicolo:'Veicoli',Campo:'Campi',Tavolo:'Tavoli',Arrivo:'Arrivi','Check-in':'Check-in',Inizio:'Inizi',Ritiro:'Ritiri'}; return map[w]||`${w}`; }

  function renderDashboard(){
    const todayBookings=state.bookings.filter(isTodayStart);
    const activeResources=new Set(state.bookings.filter(b=>isActiveOn(b,today)).map(b=>b.resourceId));
    const occupancy=state.resources.length ? Math.round(activeResources.size/state.resources.length*100):0;
    const monthStart=iso(new Date(today.getFullYear(),today.getMonth(),1)); const nextMonth=iso(new Date(today.getFullYear(),today.getMonth()+1,1));
    const monthPaid=state.bookings.filter(b=>b.start>=monthStart&&b.start<nextMonth).reduce((a,b)=>a+Number(b.paid||0),0);
    const weekEnd=addDays(today,7); const upcoming=state.bookings.filter(b=>b.start>iso(today)&&b.start<=weekEnd&&b.status!=='cancelled').length;
    document.getElementById('statToday').textContent=todayBookings.length; document.getElementById('statTodayHint').textContent=todayBookings.length?`${todayBookings.length} ${s().booking.toLowerCase()} in partenza oggi`:'Nessuna attività prevista';
    document.getElementById('statOccupied').textContent=`${activeResources.size}/${state.resources.length}`; document.getElementById('statOccupiedHint').textContent=`${occupancy}% utilizzo`;
    document.getElementById('statRevenue').textContent=fmtMoney(monthPaid); document.getElementById('statUpcoming').textContent=upcoming;
    document.getElementById('occupancyPct').textContent=`${occupancy}%`; document.getElementById('occupancyDonut').style.background=`conic-gradient(var(--accent) 0% ${occupancy}%, #edede8 ${occupancy}% 100%)`;
    const todayList=document.getElementById('todayList');
    const rows=state.bookings.filter(b=>isActiveOn(b,today)||isTodayStart(b)).sort((a,b)=>a.start.localeCompare(b.start));
    todayList.innerHTML=rows.length?rows.map(b=>`<div class="list-row"><div class="list-icon">${esc(resource(b.resourceId)?.name?.replace(/\D/g,'').slice(-2)||'--')}</div><div class="list-main"><strong>${esc(client(b.clientId)?.name||'—')}</strong><small>${esc(resource(b.resourceId)?.name||'—')} · ${fmtShort(b.start)} → ${fmtShort(b.end)}</small></div><span class="badge ${b.status}">${statusLabel(b.status)}</span></div>`).join(''):`<div class="empty">Nessuna attività per oggi.</div>`;
    const paid=state.bookings.reduce((a,b)=>a+Number(b.paid||0),0), gross=state.bookings.reduce((a,b)=>a+Number(b.total||0),0);
    document.getElementById('paidTotal').textContent=fmtMoney(paid); document.getElementById('dueTotal').textContent=fmtMoney(Math.max(0,gross-paid));
    renderRevenueChart();
  }

  function renderRevenueChart(){
    const months=[]; for(let i=5;i>=0;i--){ const d=new Date(today.getFullYear(),today.getMonth()-i,1); const start=iso(d), end=iso(new Date(d.getFullYear(),d.getMonth()+1,1)); const value=state.bookings.filter(b=>b.start>=start&&b.start<end).reduce((a,b)=>a+Number(b.paid||0),0); months.push({label:new Intl.DateTimeFormat('it-IT',{month:'short'}).format(d),value}); }
    const max=Math.max(...months.map(x=>x.value),1); document.getElementById('revenueChart').innerHTML=months.map(x=>`<div class="bar-item" title="${fmtMoney(x.value)}"><div class="bar" style="height:${Math.max(4,x.value/max*130)}px"></div><small>${x.label}</small></div>`).join('');
  }

  function renderBookings(){
    const q=document.getElementById('bookingSearch').value.toLowerCase(); const status=document.getElementById('bookingStatusFilter').value;
    let data=[...state.bookings].sort((a,b)=>b.start.localeCompare(a.start));
    data=data.filter(b=>{ const txt=`${b.id} ${client(b.clientId)?.name||''} ${resource(b.resourceId)?.name||''} ${statusLabel(b.status)}`.toLowerCase(); return (!q||txt.includes(q))&&(status==='all'||b.status===status); });
    document.getElementById('bookingTable').innerHTML=data.length?data.map(b=>`<tr><td><strong>${esc(b.id)}</strong></td><td>${esc(client(b.clientId)?.name||'—')}</td><td>${esc(resource(b.resourceId)?.name||'—')}</td><td>${fmtDate(b.start)}</td><td>${fmtDate(b.end)}</td><td><span class="badge ${b.status}">${statusLabel(b.status)}</span></td><td><strong>${fmtMoney(b.total)}</strong></td><td>${fmtMoney(b.paid)}</td><td><button class="table-action" data-delete-booking="${b.id}" title="Elimina">×</button></td></tr>`).join(''):`<tr><td colspan="9" class="empty">Nessun risultato.</td></tr>`;
  }

  function renderResources(){
    document.getElementById('resourceGrid').innerHTML=state.resources.map(r=>{ const busy=state.bookings.some(b=>b.resourceId===r.id&&isActiveOn(b,today)); const future=state.bookings.filter(b=>b.resourceId===r.id&&b.start>=iso(today)&&b.status!=='cancelled').length; return `<article class="resource-card"><div class="resource-card-top"><div><h3>${esc(r.name)}</h3><p>${esc(r.category||'Standard')}</p></div><i class="resource-status ${busy?'busy':''}" title="${busy?'Occupata':'Libera'}"></i></div><div class="resource-meta"><div><span>Stato oggi</span><strong>${busy?'Occupata':'Libera'}</strong></div><div><span>Prossime</span><strong>${future}</strong></div><div><span>Capacità</span><strong>${esc(r.capacity||1)}</strong></div><div><span>Note</span><strong>${esc(r.notes||'—')}</strong></div></div></article>`; }).join('') || `<div class="empty">Nessuna ${s().resource.toLowerCase()} configurata.</div>`;
  }

  function renderClients(){
    const q=document.getElementById('clientSearch').value.toLowerCase(); const data=state.clients.filter(c=>`${c.name} ${c.phone} ${c.email}`.toLowerCase().includes(q));
    document.getElementById('clientTable').innerHTML=data.length?data.map(c=>{ const bs=state.bookings.filter(b=>b.clientId===c.id); const val=bs.reduce((a,b)=>a+Number(b.total||0),0); return `<tr><td><strong>${esc(c.name)}</strong></td><td>${esc(c.phone||'—')}</td><td>${esc(c.email||'—')}</td><td>${bs.length}</td><td>${fmtMoney(val)}</td><td>${esc(c.notes||'—')}</td><td><button class="table-action" data-delete-client="${c.id}" title="Elimina">×</button></td></tr>`}).join(''):`<tr><td colspan="7" class="empty">Nessun risultato.</td></tr>`;
  }

  function renderPayments(){
    const gross=state.bookings.reduce((a,b)=>a+Number(b.total||0),0), paid=state.bookings.reduce((a,b)=>a+Number(b.paid||0),0);
    document.getElementById('paymentsGross').textContent=fmtMoney(gross); document.getElementById('paymentsPaid').textContent=fmtMoney(paid); document.getElementById('paymentsDue').textContent=fmtMoney(Math.max(0,gross-paid));
    document.getElementById('paymentTable').innerHTML=[...state.bookings].sort((a,b)=>b.start.localeCompare(a.start)).map(b=>`<tr><td><strong>${esc(b.id)}</strong><br><small>${esc(resource(b.resourceId)?.name||'—')}</small></td><td>${esc(client(b.clientId)?.name||'—')}</td><td>${fmtDate(b.start)}</td><td><strong>${fmtMoney(b.paid)}</strong> / ${fmtMoney(b.total)}</td><td>${esc(b.paymentMethod||'—')}</td><td><span class="badge ${Number(b.paid)>=Number(b.total)?'confirmed':'pending'}">${Number(b.paid)>=Number(b.total)?'Pagato':'Da saldare'}</span></td></tr>`).join('');
  }

  function renderCalendar(){
    const y=calendarCursor.getFullYear(),m=calendarCursor.getMonth(),days=new Date(y,m+1,0).getDate(); document.getElementById('calendarMonth').textContent=new Intl.DateTimeFormat('it-IT',{month:'long',year:'numeric'}).format(calendarCursor);
    const cols=`170px repeat(${days}, minmax(28px, 1fr))`; let html=`<div class="cal-grid" style="grid-template-columns:${cols}"><div class="cal-cell head resource-head">${esc(s().resource)}</div>`;
    for(let d=1;d<=days;d++){ html+=`<div class="cal-cell head">${d}</div>`; }
    for(const r of state.resources){ html+=`<div class="cal-cell resource-head">${esc(r.name)}</div>`; for(let d=1;d<=days;d++){ const date=new Date(y,m,d), booked=state.bookings.find(b=>b.resourceId===r.id&&isActiveOn(b,date)); const isT=iso(date)===iso(today); html+=`<div class="cal-cell ${booked?'occupied':''} ${isT?'today':''}" title="${booked?esc(client(booked.clientId)?.name||'Occupata'):'Libera'}">${booked?'●':''}</div>`; } }
    html+='</div>'; document.getElementById('resourceCalendar').innerHTML=html;
  }

  function renderSettings(){
    const bt=document.getElementById('settingBusinessType'); bt.innerHTML=Object.entries(presets).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('');
    bt.value=s().type; document.getElementById('settingBusinessName').value=s().businessName; document.getElementById('settingAccent').value=s().accent; document.getElementById('settingClientLabel').value=s().client; document.getElementById('settingBookingLabel').value=s().booking; document.getElementById('settingResourceLabel').value=s().resource; document.getElementById('settingStartLabel').value=s().start; document.getElementById('settingEndLabel').value=s().end;
    document.getElementById('presetGrid').innerHTML=Object.entries(presets).map(([k,p])=>`<div class="preset-card" data-preset="${k}"><strong>${p.name}</strong><small>${p.booking} · ${p.resource} · ${p.client}</small></div>`).join('');
  }

  function renderAll(){ applySettings(); renderDashboard(); renderBookings(); renderResources(); renderClients(); renderPayments(); renderCalendar(); renderSettings(); fillSelects(); }
  function fillSelects(){ document.getElementById('bookingClient').innerHTML=state.clients.map(c=>`<option value="${c.id}">${esc(c.name)}</option>`).join(''); document.getElementById('bookingResource').innerHTML=state.resources.map(r=>`<option value="${r.id}">${esc(r.name)}</option>`).join(''); }

  function openModal(id){ const d=document.getElementById(id); if(!d) return; if(id==='bookingModal'){ fillSelects(); document.getElementById('bookingStart').value=iso(today); document.getElementById('bookingEnd').value=addDays(today,1); } d.showModal(); }
  function closeModal(id){ document.getElementById(id)?.close(); }
  function toast(msg){ const t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),1800); }
  function go(view){ document.querySelectorAll('.view').forEach(v=>v.classList.remove('active')); document.getElementById(`view-${view}`).classList.add('active'); document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n.dataset.view===view)); const titles={dashboard:'Dashboard',bookings:pluralize(s().booking),calendar:'Calendario',resources:pluralize(s().resource),clients:pluralize(s().client),payments:'Pagamenti',settings:'Impostazioni'}; document.getElementById('pageTitle').textContent=titles[view]||'NOC Core'; document.getElementById('sidebar').classList.remove('open'); }

  document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.view)));
  document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
  document.getElementById('mobileMenu').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('quickAddBtn').addEventListener('click',()=>openModal('bookingModal')); document.getElementById('addBookingBtn').addEventListener('click',()=>openModal('bookingModal')); document.getElementById('addClientBtn').addEventListener('click',()=>openModal('clientModal')); document.getElementById('addResourceBtn').addEventListener('click',()=>openModal('resourceModal'));
  document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>closeModal(b.dataset.close)));
  document.getElementById('bookingSearch').addEventListener('input',renderBookings); document.getElementById('bookingStatusFilter').addEventListener('change',renderBookings); document.getElementById('clientSearch').addEventListener('input',renderClients);
  document.getElementById('prevMonth').addEventListener('click',()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()-1,1);renderCalendar()}); document.getElementById('nextMonth').addEventListener('click',()=>{calendarCursor=new Date(calendarCursor.getFullYear(),calendarCursor.getMonth()+1,1);renderCalendar()});

  document.getElementById('bookingForm').addEventListener('submit',e=>{ e.preventDefault(); const start=document.getElementById('bookingStart').value,end=document.getElementById('bookingEnd').value,resId=document.getElementById('bookingResource').value; if(!start||!end||end<=start){toast('Controlla le date');return;} if(overlap(resId,start,end)){toast(`${s().resource} già occupata in queste date`);return;} state.bookings.push({id:`NOC-${String(1000+state.bookings.length+1)}`,clientId:document.getElementById('bookingClient').value,resourceId:resId,start,end,total:Number(document.getElementById('bookingTotal').value||0),paid:Number(document.getElementById('bookingPaid').value||0),status:document.getElementById('bookingStatus').value,paymentMethod:document.getElementById('bookingPaymentMethod').value,notes:document.getElementById('bookingNotes').value}); closeModal('bookingModal'); e.target.reset(); save(); toast(`${s().booking} salvata`); });
  document.getElementById('clientForm').addEventListener('submit',e=>{e.preventDefault();state.clients.push({id:uid('c'),name:document.getElementById('clientName').value,phone:document.getElementById('clientPhone').value,email:document.getElementById('clientEmail').value,notes:document.getElementById('clientNotes').value});closeModal('clientModal');e.target.reset();save();toast(`${s().client} aggiunto`)});
  document.getElementById('resourceForm').addEventListener('submit',e=>{e.preventDefault();state.resources.push({id:uid('r'),name:document.getElementById('resourceName').value,category:document.getElementById('resourceCategory').value,capacity:Number(document.getElementById('resourceCapacity').value||1),notes:document.getElementById('resourceNotes').value});closeModal('resourceModal');e.target.reset();save();toast(`${s().resource} aggiunta`)});

  document.addEventListener('click',e=>{
    const delB=e.target.closest('[data-delete-booking]'); if(delB){ if(confirm('Eliminare questa attività?')){state.bookings=state.bookings.filter(b=>b.id!==delB.dataset.deleteBooking);save();toast('Attività eliminata')} }
    const delC=e.target.closest('[data-delete-client]'); if(delC){ const used=state.bookings.some(b=>b.clientId===delC.dataset.deleteClient); if(used){toast('Cliente collegato ad attività: non eliminabile');return;} if(confirm('Eliminare questo cliente?')){state.clients=state.clients.filter(c=>c.id!==delC.dataset.deleteClient);save();toast('Cliente eliminato')} }
    const pr=e.target.closest('[data-preset]'); if(pr){ applyPreset(pr.dataset.preset); }
  });

  function applyPreset(key){ const p=presets[key]; const oldResource=s().resource; state.settings={...state.settings,...p,type:key}; if(confirm(`Applicare anche i nomi delle ${pluralize(p.resource).toLowerCase()} di esempio?`)){ state.resources=state.resources.map((r,i)=>({...r,name:`${p.resource} ${i+1}`})); } save(); toast(`Preset ${p.name} applicato`); }

  ['settingBusinessName','settingAccent','settingClientLabel','settingBookingLabel','settingResourceLabel','settingStartLabel','settingEndLabel'].forEach(id=>document.getElementById(id).addEventListener('change',e=>{ const map={settingBusinessName:'businessName',settingAccent:'accent',settingClientLabel:'client',settingBookingLabel:'booking',settingResourceLabel:'resource',settingStartLabel:'start',settingEndLabel:'end'}; state.settings[map[id]]=e.target.value.trim()||state.settings[map[id]]; save(); toast('Impostazioni salvate'); }));
  document.getElementById('settingBusinessType').addEventListener('change',e=>applyPreset(e.target.value));

  document.getElementById('exportJsonBtn').addEventListener('click',()=>download(`noc-core-backup-${iso(today)}.json`,JSON.stringify(state,null,2),'application/json'));
  document.getElementById('exportCsvBtn').addEventListener('click',()=>{ const rows=[['ID',s().client,s().resource,'Inizio','Fine','Stato','Totale','Pagato','Metodo']]; state.bookings.forEach(b=>rows.push([b.id,client(b.clientId)?.name||'',resource(b.resourceId)?.name||'',b.start,b.end,statusLabel(b.status),b.total,b.paid,b.paymentMethod||''])); const csv=rows.map(r=>r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(';')).join('\n'); download(`noc-core-${iso(today)}.csv`,csv,'text/csv;charset=utf-8'); });
  document.getElementById('importJsonInput').addEventListener('change',e=>{ const f=e.target.files?.[0]; if(!f)return; const reader=new FileReader(); reader.onload=()=>{ try{ const parsed=JSON.parse(reader.result); if(!parsed.settings||!Array.isArray(parsed.clients)||!Array.isArray(parsed.resources)||!Array.isArray(parsed.bookings)) throw new Error(); state=parsed; save(); toast('Backup importato'); }catch{toast('File non valido')} }; reader.readAsText(f); });
  document.getElementById('resetBtn').addEventListener('click',()=>{ if(confirm('Ripristinare tutti i dati demo?')){state=demoState();save();toast('Demo ripristinata')} });
  function download(name,content,type){ const blob=new Blob([content],{type}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob);a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500); }

  document.getElementById('globalSearch').addEventListener('input',e=>{ if(!e.target.value)return; go('bookings'); document.getElementById('bookingSearch').value=e.target.value; renderBookings(); });
  document.getElementById('todayLabel').textContent=new Intl.DateTimeFormat('it-IT',{weekday:'long',day:'numeric',month:'long'}).format(today).toUpperCase();

  renderAll();
})();
