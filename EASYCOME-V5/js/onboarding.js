 'use strict';
(() => {
  const cfg = window.APP_CONFIG || {};
  const project = cfg.project || {};
  const orgId = project.organizationId || 'easycome';
  const storage = (()=>{try{localStorage.setItem('__ec_guide_test','1');localStorage.removeItem('__ec_guide_test');return localStorage}catch(_){const mem={};return{getItem:k=>mem[k]||null,setItem:(k,v)=>mem[k]=String(v)}}})();
  const isPerformance = Boolean(document.getElementById('performanceApp')) || document.body.classList.contains('intelligence-page');
  const key = `easycome:${orgId}:${isPerformance?'performance':'main'}:guide-hospitality-v2`;
  const steps = isPerformance ? [
    {k:'CONTROLLO',t:'Qui controlli che il lavoro sia davvero chiuso.',d:'Easy Come usa i dati già presenti nel gestionale per evidenziare saldi aperti, anomalie, informazioni mancanti e situazioni da verificare.'},
    {k:'FINANCE',t:'Qui capisci come sta andando la struttura.',d:'Occupazione, ricavi, incassi, costi e performance vengono letti dagli stessi dati operativi. Non devi ricopiare nulla.'},
    {k:'REGOLA',t:'Correggi sempre il dato alla fonte.',d:'Se trovi qualcosa che non torna, torna alla prenotazione, al pagamento o alla voce originale. In questo modo tutto il sistema resta coerente.'}
  ] : [
    {k:'BENVENUTO',t:'Questo è il gestionale della tua struttura.',d:'Parti da Oggi. Qui trovi ciò che richiede attenzione: arrivi, partenze, camere, saldi e attività operative.'},
    {k:'PRENOTAZIONI',t:'Ogni soggiorno resta in un solo posto.',d:'Date, ospite, alloggio, importo, stato e canale restano collegati alla stessa prenotazione. Aggiorni il dato una volta sola.'},
    {k:'GIORNATA',t:'Lavora per eccezioni, non per tabelle.',d:'Apri Easy Come e guarda cosa devi fare oggi. Le sezioni complete servono quando vuoi entrare nel dettaglio o cercare lo storico.'},
    {k:'CONTROLLO E FINANCE',t:'Dopo il lavoro operativo arrivano i controlli e i numeri.',d:'Controllo ti segnala ciò che merita una verifica. Finance trasforma i dati della struttura in informazioni utili per decidere.'}
  ];
  let index=0, open=false;
  function close(done=true){document.querySelector('.ec-tour-card')?.remove();document.querySelector('.ec-tour-backdrop')?.remove();open=false;if(done)storage.setItem(key,'1')}
  function render(){const step=steps[index];let back=document.querySelector('.ec-tour-backdrop'),card=document.querySelector('.ec-tour-card');if(!back){back=document.createElement('div');back.className='ec-tour-backdrop';document.body.appendChild(back)}if(!card){card=document.createElement('section');card.className='ec-tour-card';document.body.appendChild(card)}card.innerHTML=`<div class="ec-kicker">${step.k}</div><h2>${step.t}</h2><p>${step.d}</p><div class="ec-tour-progress">${steps.map((_,i)=>`<i class="${i===index?'current':''}"></i>`).join('')}</div><div class="ec-tour-actions"><button class="skip" data-tour-skip>Chiudi guida</button><div>${index?'<button data-tour-prev>Indietro</button>':''}<button class="primary" data-tour-next>${index===steps.length-1?'Ho capito':'Continua'}</button></div></div>`;card.querySelector('[data-tour-skip]').onclick=()=>close(true);card.querySelector('[data-tour-prev]')?.addEventListener('click',()=>{index=Math.max(0,index-1);render()});card.querySelector('[data-tour-next]').onclick=()=>{if(index===steps.length-1)return close(true);index++;render()}}
  function start(){if(open)return;open=true;index=0;render()}
  function launcher(){if(document.querySelector('.ec-guide-launcher'))return;const b=document.createElement('button');b.className='ec-guide-launcher';b.innerHTML='<b>?</b> Guida';b.onclick=start;document.body.appendChild(b)}
  launcher();
  if(!storage.getItem(key))setTimeout(start,350);
})();