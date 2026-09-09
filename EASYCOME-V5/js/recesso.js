(function(){
'use strict';
const form=document.getElementById('withdrawalForm');if(!form)return;
const submit=document.getElementById('withdrawalSubmit');const out=document.getElementById('withdrawalResult');
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
form.addEventListener('submit',async e=>{
  e.preventDefault();if(!form.reportValidity())return;
  const fd=new FormData(form);const payload=Object.fromEntries(fd.entries());
  payload.confirm=fd.get('confirm')==='on';
  submit.disabled=true;submit.textContent='Invio in corso…';out.className='legal-result';out.innerHTML='';
  try{
    const r=await fetch('/api/withdrawal-request',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)});
    const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.error||'Invio non riuscito.');
    out.className='legal-result show success';
    out.innerHTML=`<strong>Dichiarazione ricevuta.</strong><br>Riferimento: <b>${esc(d.referenceCode||'—')}</b><br>Data e ora: ${esc(new Date(d.submittedAt).toLocaleString('it-IT'))}<br>${d.acknowledgementEmailSent?'Ti abbiamo inviato anche una conferma via email.':'La richiesta è registrata. La conferma email automatica non è ancora disponibile: conserva questo riferimento.'}`;
    form.reset();out.scrollIntoView({behavior:'smooth',block:'center'});
  }catch(err){
    out.className='legal-result show error';out.textContent=err.message||String(err);
  }finally{submit.disabled=false;submit.textContent='Conferma recesso'}
});
})();