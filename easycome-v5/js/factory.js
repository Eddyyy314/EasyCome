(function(){'use strict';
const $=s=>document.querySelector(s);const cfg=window.EASYCOME_ADMIN||{};let db=null,session=null,targets=[],adminReady=false;
const SENDER_EMAIL='infoeasycome@libero.it';
const esc=v=>String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function toast(t){const n=document.createElement('div');n.className='toast';n.textContent=t;document.body.appendChild(n);setTimeout(()=>n.remove(),2400)}
async function ensureDb(){if(db)return db;let c=cfg;if(!c.supabaseUrl||!c.supabaseAnonKey){const r=await fetch('/api/public-config',{cache:'no-store'});if(!r.ok)throw new Error('Configurazione Easy Come non disponibile.');c=await r.json()}if(!window.supabase?.createClient)throw new Error('Client Supabase non caricato. Ricarica la pagina.');db=window.supabase.createClient(c.supabaseUrl,c.supabaseAnonKey);return db}
async function token(){const client=await ensureDb();const {data,error}=await client.auth.getSession();if(error)throw error;session=data?.session||null;if(!session?.access_token)throw new Error('Sessione admin scaduta. Torna nella Control Room e accedi di nuovo.');return session.access_token}
async function api(url,opt={}){const t=await token();const r=await fetch(url,{...opt,headers:{'content-type':'application/json',authorization:`Bearer ${t}`,...(opt.headers||{})}});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||`Errore ${r.status}`);return d}
function steps(n){document.querySelectorAll('.step').forEach(x=>x.classList.toggle('done',Number(x.dataset.step)<=n))}
function setBusy(on){$('#generate').disabled=on||!adminReady;$('#limit').disabled=on;$('#generate').textContent=on?'GENERAZIONE IN CORSO…':'⚡ TROVA E GENERA LE DEMO'}
function euro(n){return new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Number(n)||198)}
function normalizePhone(raw=''){let d=String(raw).replace(/\D/g,'');if(d.startsWith('00'))d=d.slice(2);if(d && !d.startsWith('39'))d='39'+d;return d}
function whatsappUrl(x){const msg=x.shortMessage||x.message||'';if(x.whatsapp){try{const u=new URL(x.whatsapp);u.searchParams.set('text',msg);return u.href}catch{}}const phone=normalizePhone(x.phone||'');return phone?`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`:''}
function scoreLabel(n){n=Number(n)||0;return n>=82?'ALTISSIMO':n>=70?'ALTO':n>=55?'BUONO':'MEDIO'}
function potentialCell(x){const n=Number(x.potential)||0;const reason=(x.potentialReasons||[]).join(' · ');return `<div class="score-wrap"><span class="score potential-score">${n}/100</span><strong>${scoreLabel(n)}</strong>${reason?`<small>${esc(reason)}</small>`:''}</div>`}
function emailDeliveryMarkup(x){
  const d=x.emailDelivery;if(!d)return '';
  const when=d.sentAt?new Date(d.sentAt).toLocaleString('it-IT',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}):'';
  const id=String(d.messageId||'');
  const shortId=id.length>34?id.slice(0,31)+'…':id;
  return `<div class="smtp-state ok"><strong>✓ Accettata da Libero</strong><span>${esc(when)} · ${esc(d.to||x.email||'')}</span>${shortId?`<small title="${esc(id)}">ID: ${esc(shortId)}</small>`:''}<em>Il server ha preso in carico il messaggio; consegna e apertura dipendono dal provider destinatario.</em></div>`;
}
function channelButtons(x){const parts=[];
  if(x.email)parts.push(`<button class="contact-btn email" data-send-email="${x._i}">✉ Invia email</button>`);
  const wa=whatsappUrl(x);if(wa)parts.push(`<a class="contact-btn whatsapp" href="${esc(wa)}" target="_blank" rel="noreferrer">💬 ${x.whatsapp?'WhatsApp':'Prova WA'}</a>`);
  if(x.phone)parts.push(`<a class="contact-btn" href="tel:${esc(x.phone)}">📞 Chiama</a>`);
  if(x.instagram)parts.push(`<a class="contact-btn" href="${esc(x.instagram)}" target="_blank" rel="noreferrer">◎ Instagram</a>`);
  if(x.facebook)parts.push(`<a class="contact-btn" href="${esc(x.facebook)}" target="_blank" rel="noreferrer">f Facebook</a>`);
  if(x.contactPage||x.website)parts.push(`<a class="contact-btn" href="${esc(x.contactPage||x.website)}" target="_blank" rel="noreferrer">🌐 ${x.contactPage?'Contatti':'Sito'}</a>`);
  if(x.mapsUrl)parts.push(`<a class="contact-btn maps" href="${esc(x.mapsUrl)}" target="_blank" rel="noreferrer">⌖ Maps</a>`);
  const score=Number(x.contactability)||0;
  const label=x.contactPending?'Ricerca canali…':parts.length?`Contattabilità ${score}/100`:'Nessun contatto trovato';
  return `<div class="contact-box"><small>${esc(label)}</small><div class="contact-actions">${parts.join('')}</div>${emailDeliveryMarkup(x)}${!x.contactPending&&!x.email&&!x.phone&&!x.website?'<span class="offline-opportunity">★ Potenziale offline: da verificare manualmente</span>':''}</div>`;
}
function renderRows(){
  if(!targets.length){$('#rows').innerHTML='<tr><td colspan="7"><div class="empty">Nessuna demo in questo batch.</div></td></tr>';return}
  targets.forEach((x,i)=>x._i=i);
  $('#rows').innerHTML=targets.map((x,i)=>`<tr>
    <td class="company"><strong>${esc(x.name)}</strong><span>${esc(x.address)}</span></td>
    <td><span class="pill">${esc(x.templateLabel||x.category)}</span><br><small>${esc(x.category||'')}</small></td>
    <td><span class="price-pill"><strong>${euro(x.price)}</strong><small>una tantum</small></span></td>
    <td>${potentialCell(x)}</td>
    <td>${channelButtons(x)}</td>
    <td><div class="actions"><a class="mini dark" href="${esc(x.demoUrl)}" target="_blank" rel="noreferrer">Apri demo</a><button class="mini" data-copy-link="${i}">Copia link</button></div></td>
    <td><div class="actions"><button class="mini" data-copy-msg="${i}">Copia testo</button></div><small class="sender-note">firma ${esc(SENDER_EMAIL)}</small></td>
  </tr>`).join('');
  document.querySelectorAll('[data-copy-link]').forEach(b=>b.onclick=()=>copy(targets[Number(b.dataset.copyLink)].demoUrl,'Link demo copiato'));
  document.querySelectorAll('[data-copy-msg]').forEach(b=>b.onclick=()=>copy(targets[Number(b.dataset.copyMsg)].shortMessage||targets[Number(b.dataset.copyMsg)].message,'Messaggio copiato'));
  document.querySelectorAll('[data-send-email]').forEach(b=>b.onclick=async()=>{const x=targets[Number(b.dataset.sendEmail)];if(!x?.email)return;if(!confirm(`Inviare la demo a ${x.email} da ${SENDER_EMAIL}?`))return;const original=b.textContent;b.disabled=true;b.textContent='Invio…';try{const d=await api('/api/demo-factory',{method:'POST',body:JSON.stringify({action:'send-email',demoSlug:x.demoSlug,to:x.email,subject:x.subject||`Demo Easy Come per ${x.name}`,message:x.message||''})});x.emailDelivery=d;toast(`Libero SMTP ha accettato l’email per ${d.to||x.email} ✅`);renderRows()}catch(e){toast(e.message||'Invio email non riuscito');b.disabled=false;b.textContent=original}});
}
async function copy(text,msg){try{await navigator.clipboard.writeText(text);toast(msg)}catch{prompt('Copia:',text)}}
async function hydrateContacts(){
  const ids=targets.map(x=>x.id).filter(Boolean);if(!ids.length)return;
  targets.forEach(x=>x.contactPending=true);renderRows();
  for(let i=0;i<ids.length;i+=5){
    const batch=ids.slice(i,i+5);
    try{
      const d=await api('/api/demo-factory',{method:'POST',body:JSON.stringify({action:'hydrate',placeIds:batch})});
      for(const place of d.places||[]){
        const target=targets.find(x=>x.id===place.id);if(!target)continue;target.contactPending=false;
        if(place.error){target.contactError=place.error;continue}
        for(const k of ['email','phone','website','contactPage','instagram','facebook','whatsapp','mapsUrl','contactability','potential','potentialReasons']) if(place[k]!==undefined)target[k]=place[k];
        target.address=place.address||target.address||'';target.category=place.category||target.category||'';
      }
    }catch(e){console.warn('Ricerca contatti non disponibile:',e.message||e);for(const id of batch){const target=targets.find(x=>x.id===id);if(target){target.contactPending=false;target.contactError=e.message||String(e)}}}
    renderRows();
  }
  targets.sort((a,b)=>(Number(b.potential)||0)-(Number(a.potential)||0)||(Number(b.contactability)||0)-(Number(a.contactability)||0));
  renderRows();
}
async function loadCampaigns(){try{const d=await api('/api/demo-factory');$('#campaigns').innerHTML=(d.campaigns||[]).slice(0,5).map(c=>`<div class="campaign"><div><b>${c.generated_count||0}/${c.requested_count} demo</b><span>${new Date(c.created_at).toLocaleString('it-IT',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'})}</span></div><span>${esc(c.status)}</span></div>`).join('')||'<span style="color:#888;font-size:11px">Nessuna campagna precedente.</span>'}catch(e){console.warn(e)}}
async function generate(){setBusy(true);steps(1);$('#progress').style.width='14%';$('#statusCopy').textContent='Sto cercando attività reali e scartando quelle già usate…';$('#warning').innerHTML='';try{setTimeout(()=>{steps(2);$('#progress').style.width='38%'},900);setTimeout(()=>{steps(3);$('#progress').style.width='66%';$('#statusCopy').textContent='Sto scegliendo gestionale, prezzo e potenziale commerciale…'},2200);const d=await api('/api/demo-factory',{method:'POST',body:JSON.stringify({action:'generate',limit:Number($('#limit').value||5)})});targets=(d.targets||[]).map(x=>({...x,contactPending:true}));steps(4);$('#progress').style.width='100%';$('#mGenerated').textContent=d.stats?.generated||targets.length;$('#mSeen').textContent=d.stats?.alreadySeen||0;$('#mQueries').textContent=d.stats?.queriesRun||0;$('#mRaw').textContent=d.stats?.rawSeen||0;$('#statusCopy').textContent=`Batch completato: ${targets.length} demo. Ora cerco telefono, email, sito, WhatsApp e social pubblici…`;$('#resultsTitle').textContent=`${targets.length} demo generate`;$('#resultsCopy').textContent='Contattabilità e potenziale sono separati: anche un’attività quasi offline può essere un prospect ad alto potenziale.';if(d.warning)$('#warning').innerHTML=`<div class="warn">${esc(d.warning)}</div>`;renderRows();await hydrateContacts();$('#statusCopy').textContent=`Batch pronto: ${targets.length} prospect ordinati per potenziale, con tutti i canali pubblici trovati.`;loadCampaigns();toast('Batch completato 🔥')}catch(e){$('#progress').style.width='0';$('#statusCopy').textContent=e.message;$('#warning').innerHTML=`<div class="warn">${esc(e.message)}</div>`;toast('Generazione interrotta')}finally{setBusy(false)}}
$('#limit').onchange=()=>$('#requestedCount').textContent=$('#limit').value;$('#generate').onclick=generate;
async function init(){setBusy(false);try{const client=await ensureDb();const {data,error}=await client.auth.getSession();if(error)throw error;session=data?.session||null;if(!session){location.href='admin.html';return}const {data:admin,error:adminError}=await client.from('easycome_admins').select('user_id').eq('user_id',session.user.id).maybeSingle();if(adminError)throw adminError;if(!admin){location.href='admin.html';return}adminReady=true;setBusy(false);$('#authState').textContent='ADMIN CONNESSO';loadCampaigns()}catch(e){adminReady=false;setBusy(false);$('#authState').textContent='SETUP RICHIESTO';$('#warning').innerHTML=`<div class="warn">${esc(e.message)}</div>`}}init();})();
