(function(){'use strict';
const $=s=>document.querySelector(s);const cfg=window.EASYCOME_ADMIN||{};let db=null,session=null,targets=[];
const SENDER_EMAIL='edoardolaneve8@gmail.com';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function toast(t){const n=document.createElement('div');n.className='toast';n.textContent=t;document.body.appendChild(n);setTimeout(()=>n.remove(),2400)}
async function ensureDb(){if(db)return db;let c=cfg;if(!c.supabaseUrl||!c.supabaseAnonKey){const r=await fetch('/api/public-config',{cache:'no-store'});if(!r.ok)throw new Error('Configurazione Easy Come non disponibile.');c=await r.json()}db=supabase.createClient(c.supabaseUrl,c.supabaseAnonKey);return db}
async function token(){const {data}=await db.auth.getSession();return data.session?.access_token||''}
async function api(url,opt={}){const t=await token();const r=await fetch(url,{...opt,headers:{'content-type':'application/json',authorization:`Bearer ${t}`,...(opt.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`Errore ${r.status}`);return d}
function steps(n){document.querySelectorAll('.step').forEach(x=>x.classList.toggle('done',Number(x.dataset.step)<=n))}
function setBusy(on){$('#generate').disabled=on;$('#limit').disabled=on;$('#generate').textContent=on?'ANALISI IN CORSO…':'✦ TROVA E CREA LE STRATEGIE'}
function euro(n){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||99)}
function gmailUrl(x){const to=String(x.email||'').trim();if(!to)return'';const subject=x.subject||`Concept filtro TikTok per ${x.name}`;const body=x.message||'';return `https://mail.google.com/mail/?authuser=${encodeURIComponent(SENDER_EMAIL)}&view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
function emailCell(x){if(x.contactPending)return '<span class="email-state loading-email">Ricerca email…</span>';if(x.email)return `<a class="email-link" href="mailto:${esc(x.email)}">${esc(x.email)}</a>`;return '<span class="email-state">Email non trovata</span>'}
function renderRows(){
  if(!targets.length){$('#rows').innerHTML='<tr><td colspan="6"><div class="empty">Nessuna strategia in questo batch.</div></td></tr>';return}
  $('#rows').innerHTML=targets.map((x,i)=>{const c=x.creative?.campaigns?.[0];return `<tr>
    <td class="company"><strong>${esc(x.name)}</strong><span>${esc(x.address)}</span></td>
    <td><div class="strategy-stack"><span class="pill">${esc(c?.format||x.templateLabel||x.category)}</span><b>${esc(c?.name||x.templateLabel||'Creative concept')}</b><small>${esc(c?.goal||x.category||'')}</small></div></td>
    <td><div class="actions"><button class="mini dark" data-strategy="${i}">Apri 3 campagne</button><button class="mini" data-copy-prompt="${i}">Copia prompt #1</button></div></td>
    <td>${emailCell(x)}</td>
    <td><div class="actions"><a class="mini dark" href="${esc(x.demoUrl)}" target="_blank" rel="noreferrer">Apri proposta</a><button class="mini" data-copy-link="${i}">Copia link</button></div></td>
    <td><div class="actions"><button class="mini orange send-email" data-send="${i}" ${x.email?'':'disabled'}>Manda email</button><button class="mini" data-copy-msg="${i}">Copia testo</button></div><small class="sender-note">da ${esc(SENDER_EMAIL)}</small></td>
  </tr>`}).join('');
  document.querySelectorAll('[data-copy-link]').forEach(b=>b.onclick=()=>copy(targets[Number(b.dataset.copyLink)].demoUrl,'Link proposta copiato'));
  document.querySelectorAll('[data-copy-msg]').forEach(b=>b.onclick=()=>copy(targets[Number(b.dataset.copyMsg)].message,'Messaggio copiato'));
  document.querySelectorAll('[data-copy-prompt]').forEach(b=>b.onclick=()=>copy(targets[Number(b.dataset.copyPrompt)].creative?.campaigns?.[0]?.productionPrompt||'','Prompt copiato'));
  document.querySelectorAll('[data-strategy]').forEach(b=>b.onclick=()=>openStrategy(Number(b.dataset.strategy)));
  document.querySelectorAll('[data-send]').forEach(b=>b.onclick=()=>{const x=targets[Number(b.dataset.send)];const url=gmailUrl(x);if(!url)return;window.open(url,'_blank','noopener,noreferrer');toast('Email pronta in Gmail')});
}
function openStrategy(i){const x=targets[i];const cr=x?.creative;if(!cr)return toast('Analisi creativa non ancora disponibile');const d=cr.diagnosis||{};const brand=cr.brand||{};$('#creativeModal').innerHTML=`<div class="creative-modal-backdrop" data-close-creative><section class="creative-modal" onclick="event.stopPropagation()"><header class="creative-head"><div><span class="eyebrow">EASY COME · CREATIVE STRATEGY</span><h2>${esc(x.name)}</h2><p>${esc(x.category||'')} · ${esc(brand.website||x.website||'analisi Google')}</p></div><button data-close-creative>×</button></header><div class="creative-body"><div class="diagnosis"><div class="diag"><span>BASE REALE</span><strong>${esc(d.positioning||'Da approfondire')}</strong></div><div class="diag"><span>TONO</span><strong>${esc(d.tone||'Moderno')}</strong></div><div class="diag"><span>SEGNALI VERIFICATI</span><strong>${esc((d.verifiedSignals||[]).map(s=>s.value).join(' · ')||'Solo dati Google/categoria')}</strong></div></div><div class="campaign-grid">${(cr.campaigns||[]).map((c,n)=>`<article class="campaign-card ${c.recommended?'recommended':''}"><span class="tag">${esc(c.format)}${c.recommended?' · CONSIGLIATA':''}</span><h3>${esc(c.name)}</h3><p>${esc(c.hook)}</p><div class="campaign-meta"><div><span>Obiettivo</span><b>${esc(c.goal)}</b></div><div><span>Meccanica</span><b>${esc(c.mechanic)}</b></div><div><span>Deliverable</span><b>${esc(c.deliverable)}</b></div></div><div class="prompt-box">${esc(c.productionPrompt)}</div><button class="copy-prompt" data-modal-prompt="${n}">COPIA PROMPT DI PRODUZIONE</button></article>`).join('')}</div><p class="source-note">Personalizzazione leggera: usiamo pochi segnali reali (Google + sito quando disponibile) e una struttura creativa standard. Prodotti, prezzi, offerte, asset e claim non verificati restano placeholder fino alla conferma del cliente.</p></div></section></div>`;document.querySelectorAll('[data-close-creative]').forEach(el=>el.onclick=()=>$('#creativeModal').innerHTML='');document.querySelectorAll('[data-modal-prompt]').forEach(b=>b.onclick=()=>copy(cr.campaigns[Number(b.dataset.modalPrompt)]?.productionPrompt||'','Prompt copiato'));}

async function copy(text,msg){try{await navigator.clipboard.writeText(text);toast(msg)}catch{prompt('Copia:',text)}}

async function hydrateContacts(){
  const ids=targets.map(x=>x.id).filter(Boolean);
  if(!ids.length)return;
  targets.forEach(x=>x.contactPending=true);renderRows();
  for(let i=0;i<ids.length;i+=5){
    const batch=ids.slice(i,i+5);
    try{
      const d=await api('/api/demo-factory',{method:'POST',body:JSON.stringify({action:'hydrate',placeIds:batch})});
      for(const place of d.places||[]){
        const target=targets.find(x=>x.id===place.id);if(!target)continue;
        target.contactPending=false;
        if(place.error){target.contactError=place.error;continue}
        target.email=place.email||'';
        target.address=place.address||target.address||'';
        target.category=place.category||target.category||'';target.website=place.website||target.website||'';target.creative=place.creative||target.creative;
      }
    }catch(e){console.warn('Ricerca email non disponibile:',e.message||e);for(const id of batch){const target=targets.find(x=>x.id===id);if(target){target.contactPending=false;target.contactError=e.message||String(e)}}}
    renderRows();
  }
}
async function loadCampaigns(){try{const d=await api('/api/demo-factory');$('#campaigns').innerHTML=(d.campaigns||[]).slice(0,5).map(c=>`<div class="campaign"><div><b>${c.generated_count||0}/${c.requested_count} demo</b><span>${new Date(c.created_at).toLocaleString('it-IT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div><span>${esc(c.status)}</span></div>`).join('')||'<span style="color:#888;font-size:11px">Nessuna campagna precedente.</span>'}catch(e){console.warn(e)}}
async function generate(){setBusy(true);steps(1);$('#progress').style.width='14%';$('#statusCopy').textContent='Sto cercando attività reali e scartando quelle già usate…';$('#warning').innerHTML='';try{setTimeout(()=>{steps(2);$('#progress').style.width='38%'},900);setTimeout(()=>{steps(3);$('#progress').style.width='66%';$('#statusCopy').textContent='Sto analizzando settore e opportunità creative e preparando le strategie…'},2200);const d=await api('/api/demo-factory',{method:'POST',body:JSON.stringify({action:'generate',limit:Number($('#limit').value||5)})});targets=(d.targets||[]).map(x=>({...x,contactPending:true}));steps(4);$('#progress').style.width='100%';$('#mGenerated').textContent=d.stats?.generated||targets.length;$('#mSeen').textContent=d.stats?.alreadySeen||0;$('#mQueries').textContent=d.stats?.queriesRun||0;$('#mRaw').textContent=d.stats?.rawSeen||0;$('#statusCopy').textContent=`Batch completato: ${targets.length} concept. Sto cercando le email pubbliche delle attività selezionate…`;$('#resultsTitle').textContent=`${targets.length} strategie generate`;$('#resultsCopy').textContent='Ogni prospect riceve 3 campagne: effect/interactive, video/UGC e paid social. Le email sono cercate solo sui siti pubblici.';if(d.warning)$('#warning').innerHTML=`<div class="warn">${esc(d.warning)}</div>`;renderRows();hydrateContacts().then(()=>{$('#statusCopy').textContent=`Batch pronto: ${targets.length} prospect analizzati, ciascuno con 3 campagne e prompt di produzione.`});loadCampaigns();toast('Strategie pronte 🔥')}catch(e){$('#progress').style.width='0';$('#statusCopy').textContent=e.message;$('#warning').innerHTML=`<div class="warn">${esc(e.message)}</div>`;toast('Generazione interrotta')}finally{setBusy(false)}}
$('#limit').onchange=()=>$('#requestedCount').textContent=$('#limit').value;$('#generate').onclick=generate;
async function validateAdmin(){const token=session?.access_token;if(!token)throw new Error('Sessione amministratore assente.');const r=await fetch('/api/admin-session',{headers:{authorization:`Bearer ${token}`},cache:'no-store'});const d=await r.json().catch(()=>({}));if(!r.ok||!d.ok)throw new Error(d.error||'Accesso amministratore negato.');return d}async function init(){try{await ensureDb();const {data}=await db.auth.getSession();session=data.session;if(!session){location.replace('/admin?next=/factory');return}await validateAdmin();$('#authState').textContent='ADMIN CONNESSO';loadCampaigns()}catch(e){$('#authState').textContent='ACCESSO RICHIESTO';$('#warning').innerHTML=`<div class="warn">${esc(e.message)}<br><br><a href="/admin?next=/factory" style="font-weight:900">Apri accesso amministratore →</a></div>`}}init();})();
