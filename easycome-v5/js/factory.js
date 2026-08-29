(function(){'use strict';
const $=s=>document.querySelector(s);const cfg=window.EASYCOME_ADMIN||{};let db=null,session=null,targets=[];
const SENDER_EMAIL='edoardolaneve8@gmail.com';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function toast(t){const n=document.createElement('div');n.className='toast';n.textContent=t;document.body.appendChild(n);setTimeout(()=>n.remove(),2400)}
async function ensureDb(){if(db)return db;let c=cfg;if(!c.supabaseUrl||!c.supabaseAnonKey){const r=await fetch('/api/public-config',{cache:'no-store'});if(!r.ok)throw new Error('Configurazione Easy Come non disponibile.');c=await r.json()}db=supabase.createClient(c.supabaseUrl,c.supabaseAnonKey);return db}
async function token(){const {data}=await db.auth.getSession();return data.session?.access_token||''}
async function api(url,opt={}){const t=await token();const r=await fetch(url,{...opt,headers:{'content-type':'application/json',authorization:`Bearer ${t}`,...(opt.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`Errore ${r.status}`);return d}
function steps(n){document.querySelectorAll('.step').forEach(x=>x.classList.toggle('done',Number(x.dataset.step)<=n))}
function setBusy(on){$('#generate').disabled=on;$('#limit').disabled=on;$('#generate').textContent=on?'GENERAZIONE IN CORSO…':'⚡ TROVA E GENERA LE DEMO'}
function euro(n){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||99)}
function gmailUrl(x){const to=String(x.email||'').trim();if(!to)return'';const subject=x.subject||`Demo Easy Come per ${x.name}`;const body=x.message||'';return `https://mail.google.com/mail/?authuser=${encodeURIComponent(SENDER_EMAIL)}&view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
function emailCell(x){if(x.contactPending)return '<span class="email-state loading-email">Ricerca email…</span>';if(x.email)return `<a class="email-link" href="mailto:${esc(x.email)}">${esc(x.email)}</a>`;return '<span class="email-state">Email non trovata</span>'}
function renderRows(){
  if(!targets.length){$('#rows').innerHTML='<tr><td colspan="6"><div class="empty">Nessuna demo in questo batch.</div></td></tr>';return}
  $('#rows').innerHTML=targets.map((x,i)=>`<tr>
    <td class="company"><strong>${esc(x.name)}</strong><span>${esc(x.address)}</span></td>
    <td><span class="pill">${esc(x.templateLabel||x.category)}</span><br><small>${esc(x.category||'')}</small></td>
    <td><span class="price-pill"><strong>${euro(x.price)}</strong><small>una tantum</small></span></td>
    <td>${emailCell(x)}</td>
    <td><div class="actions"><a class="mini dark" href="${esc(x.demoUrl)}" target="_blank" rel="noreferrer">Apri demo</a><button class="mini" data-copy-link="${i}">Copia link</button></div></td>
    <td><div class="actions"><button class="mini orange send-email" data-send="${i}" ${x.email?'':'disabled'}>Manda email</button><button class="mini" data-copy-msg="${i}">Copia testo</button></div><small class="sender-note">da ${esc(SENDER_EMAIL)}</small></td>
  </tr>`).join('');
  document.querySelectorAll('[data-copy-link]').forEach(b=>b.onclick=()=>copy(targets[Number(b.dataset.copyLink)].demoUrl,'Link demo copiato'));
  document.querySelectorAll('[data-copy-msg]').forEach(b=>b.onclick=()=>copy(targets[Number(b.dataset.copyMsg)].message,'Messaggio copiato'));
  document.querySelectorAll('[data-send]').forEach(b=>b.onclick=()=>{const x=targets[Number(b.dataset.send)];const url=gmailUrl(x);if(!url)return;window.open(url,'_blank','noopener,noreferrer');toast('Email pronta in Gmail')});
}
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
        target.category=place.category||target.category||'';
      }
    }catch(e){console.warn('Ricerca email non disponibile:',e.message||e);for(const id of batch){const target=targets.find(x=>x.id===id);if(target){target.contactPending=false;target.contactError=e.message||String(e)}}}
    renderRows();
  }
}
async function loadCampaigns(){try{const d=await api('/api/demo-factory');$('#campaigns').innerHTML=(d.campaigns||[]).slice(0,5).map(c=>`<div class="campaign"><div><b>${c.generated_count||0}/${c.requested_count} demo</b><span>${new Date(c.created_at).toLocaleString('it-IT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div><span>${esc(c.status)}</span></div>`).join('')||'<span style="color:#888;font-size:11px">Nessuna campagna precedente.</span>'}catch(e){console.warn(e)}}
async function generate(){setBusy(true);steps(1);$('#progress').style.width='14%';$('#statusCopy').textContent='Sto cercando attività reali e scartando quelle già usate…';$('#warning').innerHTML='';try{setTimeout(()=>{steps(2);$('#progress').style.width='38%'},900);setTimeout(()=>{steps(3);$('#progress').style.width='66%';$('#statusCopy').textContent='Sto scegliendo il gestionale e calcolando il prezzo per ogni attività…'},2200);const d=await api('/api/demo-factory',{method:'POST',body:JSON.stringify({action:'generate',limit:Number($('#limit').value||5)})});targets=(d.targets||[]).map(x=>({...x,contactPending:true}));steps(4);$('#progress').style.width='100%';$('#mGenerated').textContent=d.stats?.generated||targets.length;$('#mSeen').textContent=d.stats?.alreadySeen||0;$('#mQueries').textContent=d.stats?.queriesRun||0;$('#mRaw').textContent=d.stats?.rawSeen||0;$('#statusCopy').textContent=`Batch completato: ${targets.length} demo. Sto cercando le email pubbliche delle attività selezionate…`;$('#resultsTitle').textContent=`${targets.length} demo generate`;$('#resultsCopy').textContent='Prezzo calcolato sulla configurazione. Easy Come cerca soltanto email pubblicate sui siti delle attività.';if(d.warning)$('#warning').innerHTML=`<div class="warn">${esc(d.warning)}</div>`;renderRows();hydrateContacts().then(()=>{$('#statusCopy').textContent=`Batch pronto: ${targets.length} demo personalizzate con messaggio commerciale già compilato.`});loadCampaigns();toast('Batch completato 🔥')}catch(e){$('#progress').style.width='0';$('#statusCopy').textContent=e.message;$('#warning').innerHTML=`<div class="warn">${esc(e.message)}</div>`;toast('Generazione interrotta')}finally{setBusy(false)}}
$('#limit').onchange=()=>$('#requestedCount').textContent=$('#limit').value;$('#generate').onclick=generate;
async function init(){try{await ensureDb();const {data}=await db.auth.getSession();session=data.session;if(!session){location.href='admin.html';return}const {data:admin}=await db.from('easycome_admins').select('user_id').eq('user_id',session.user.id).maybeSingle();if(!admin){location.href='admin.html';return}$('#authState').textContent='ADMIN CONNESSO';loadCampaigns()}catch(e){$('#authState').textContent='SETUP RICHIESTO';$('#warning').innerHTML=`<div class="warn">${esc(e.message)}</div>`}}init();})();
