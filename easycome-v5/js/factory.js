(function(){'use strict';const $=s=>document.querySelector(s);const cfg=window.EASYCOME_ADMIN||{};let db=null,session=null,targets=[];const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function toast(t){const n=document.createElement('div');n.className='toast';n.textContent=t;document.body.appendChild(n);setTimeout(()=>n.remove(),2400)}
async function ensureDb(){if(db)return db;let c=cfg;if(!c.supabaseUrl||!c.supabaseAnonKey){const r=await fetch('/api/public-config',{cache:'no-store'});if(!r.ok)throw new Error('Configurazione Easy Come non disponibile.');c=await r.json()}db=supabase.createClient(c.supabaseUrl,c.supabaseAnonKey);return db}
async function token(){const {data}=await db.auth.getSession();return data.session?.access_token||''}
async function api(url,opt={}){const t=await token();const r=await fetch(url,{...opt,headers:{'content-type':'application/json',authorization:`Bearer ${t}`,...(opt.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`Errore ${r.status}`);return d}
function steps(n){document.querySelectorAll('.step').forEach(x=>x.classList.toggle('done',Number(x.dataset.step)<=n))}
function setBusy(on){$('#generate').disabled=on;$('#limit').disabled=on;$('#generate').textContent=on?'GENERAZIONE IN CORSO…':'⚡ TROVA E GENERA LE DEMO'}
function renderRows(){if(!targets.length){$('#rows').innerHTML='<tr><td colspan="5"><div class="empty">Nessuna demo in questo batch.</div></td></tr>';return}$('#rows').innerHTML=targets.map((x,i)=>`<tr><td class="company"><strong>${esc(x.name)}</strong><span>${esc(x.address)}</span></td><td><span class="pill">${esc(x.templateLabel||x.category)}</span><br><small>${esc(x.category||'')}</small></td><td>${x.website?`<a href="${esc(x.website)}" target="_blank" rel="noreferrer">Sito ↗</a>`:'—'}${x.phone?`<br><span>${esc(x.phone)}</span>`:''}</td><td><div class="actions"><a class="mini dark" href="${esc(x.demoUrl)}" target="_blank">Apri demo</a><button class="mini" data-copy-link="${i}">Copia link</button></div></td><td><div class="actions"><button class="mini orange" data-copy-msg="${i}">Copia messaggio</button></div></td></tr>`).join('');document.querySelectorAll('[data-copy-link]').forEach(b=>b.onclick=()=>copy(targets[Number(b.dataset.copyLink)].demoUrl,'Link demo copiato'));document.querySelectorAll('[data-copy-msg]').forEach(b=>b.onclick=()=>copy(targets[Number(b.dataset.copyMsg)].message,'Messaggio copiato'))}
async function copy(text,msg){try{await navigator.clipboard.writeText(text);toast(msg)}catch{prompt('Copia:',text)}}

async function hydrateContacts(){
  const ids=targets.map(x=>x.id).filter(Boolean);
  if(!ids.length)return;
  for(let i=0;i<ids.length;i+=20){
    const batch=ids.slice(i,i+20);
    try{
      const d=await api('/api/demo-factory',{method:'POST',body:JSON.stringify({action:'hydrate',placeIds:batch})});
      for(const place of d.places||[]){
        if(!place?.id||place.error)continue;
        const target=targets.find(x=>x.id===place.id);
        if(!target)continue;
        target.website=place.website||target.website||'';
        target.phone=place.phone||target.phone||'';
        target.address=place.address||target.address||'';
        target.category=place.category||target.category||'';
      }
      renderRows();
    }catch(e){console.warn('Contatti Google non disponibili:',e.message||e)}
  }
}
async function loadCampaigns(){try{const d=await api('/api/demo-factory');$('#campaigns').innerHTML=(d.campaigns||[]).slice(0,5).map(c=>`<div class="campaign"><div><b>${c.generated_count||0}/${c.requested_count} demo</b><span>${new Date(c.created_at).toLocaleString('it-IT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div><span>${esc(c.status)}</span></div>`).join('')||'<span style="color:#888;font-size:11px">Nessuna campagna precedente.</span>'}catch(e){console.warn(e)}}
async function generate(){setBusy(true);steps(1);$('#progress').style.width='14%';$('#statusCopy').textContent='Sto cercando attività reali e scartando quelle già usate…';$('#warning').innerHTML='';try{setTimeout(()=>{steps(2);$('#progress').style.width='38%'},900);setTimeout(()=>{steps(3);$('#progress').style.width='66%';$('#statusCopy').textContent='Sto scegliendo il gestionale più coerente per ogni attività…'},2200);const d=await api('/api/demo-factory',{method:'POST',body:JSON.stringify({action:'generate',limit:Number($('#limit').value||100)})});targets=d.targets||[];steps(4);$('#progress').style.width='100%';$('#mGenerated').textContent=d.stats?.generated||targets.length;$('#mSeen').textContent=d.stats?.alreadySeen||0;$('#mQueries').textContent=d.stats?.queriesRun||0;$('#mRaw').textContent=d.stats?.rawSeen||0;$('#statusCopy').textContent=`Batch completato: ${targets.length} demo personalizzate pronte da inviare.`;$('#resultsTitle').textContent=`${targets.length} demo generate`;$('#resultsCopy').textContent='Ogni attività ha un link univoco. Il prossimo batch escluderà automaticamente questi Place ID.';if(d.warning)$('#warning').innerHTML=`<div class="warn">${esc(d.warning)}</div>`;renderRows();hydrateContacts();loadCampaigns();toast('Batch completato 🔥')}catch(e){$('#progress').style.width='0';$('#statusCopy').textContent=e.message;$('#warning').innerHTML=`<div class="warn">${esc(e.message)}</div>`;toast('Generazione interrotta')}finally{setBusy(false)}}
$('#limit').onchange=()=>$('#requestedCount').textContent=$('#limit').value;$('#generate').onclick=generate;
async function init(){try{await ensureDb();const {data}=await db.auth.getSession();session=data.session;if(!session){location.href='admin.html';return}const {data:admin}=await db.from('easycome_admins').select('user_id').eq('user_id',session.user.id).maybeSingle();if(!admin){location.href='admin.html';return}$('#authState').textContent='ADMIN CONNESSO';loadCampaigns()}catch(e){$('#authState').textContent='SETUP RICHIESTO';$('#warning').innerHTML=`<div class="warn">${esc(e.message)}</div>`}}init();})();
