'use strict';
(() => {
  const cfg = window.APP_CONFIG || {};
  const project = cfg.project || {};
  const orgId = project.organizationId || 'easycome';
  const isIntel = document.body.classList.contains('intelligence-page') || Boolean(document.getElementById('intelligenceApp'));
  const storage = (()=>{try{localStorage.setItem('__ec_guide_test','1');localStorage.removeItem('__ec_guide_test');return localStorage}catch(_){const mem={};return{getItem:k=>mem[k]||null,setItem:(k,v)=>mem[k]=String(v)}}})();
  const tourKey = `easycome:${orgId}:${isIntel?'intelligence':'main'}:tour-v2`;
  let tourIndex = 0;
  let lastTarget = null;
  let tourOpen = false;

  const mainSteps = [
    {k:'BENVENUTO',t:'Easy Come ti accompagna, non ti abbandona in una dashboard.',d:'Al primo accesso ti mostriamo il percorso corretto. Non devi imparare tutto insieme: prima raccogli i dati, poi li leggi, poi controlli i rischi, infine decidi cosa fare.'},
    {k:'IL FLOW',t:'Il sistema segue sempre la stessa logica.',d:'1. Dati operativi → 2. Finance → 3. Audit → 4. Brain → 5. Azioni. Se rispetti questo ordine, ogni numero e ogni suggerimento ha un’origine chiara.',visual:2},
    {k:'PASSO 1 · DATI',t:'Tutto nasce dai dati del lavoro quotidiano.',d:'Clienti, fatture, pagamenti e spese sono la materia prima. Easy Come non inventa i numeri: Finance e Brain leggono ciò che è registrato nel gestionale.',target:'[data-entity="invoices"]',visual:1},
    {k:'PASSO 2 · FINANCE',t:'Finance trasforma i movimenti in controllo.',d:'Qui trovi ricavi, costi, margine, crediti aperti, cash flow, andamento mensile e forecast. È la prima schermata da guardare quando vuoi capire come sta andando l’azienda.',target:'[data-intel="finance"]',visual:2},
    {k:'PASSO 3 · AUDIT',t:'Audit cerca ciò che merita attenzione.',d:'Scaduti, possibili duplicati, spese anomale, dati incompleti e concentrazione clienti diventano rilievi spiegabili, con evidenza e raccomandazione.',target:'[data-intel="audit"]',visual:3},
    {k:'PASSO 4 · BRAIN',t:'Brain mette insieme i pezzi e risponde.',d:'Puoi chiedere “come stanno andando i margini?”, “che rischi vedi?” o “cosa devo fare?”. Le risposte finanziarie partono dai dati e mostrano le evidenze utilizzate.',target:'[data-intel="brain"]',visual:4},
    {k:'PASSO 5 · AZIONI',t:'Un consiglio diventa utile solo quando entra in un flow.',d:'Brain e Audit possono preparare un’azione. Tu la trovi nell’Action Center come Bozza, poi la approvi, la esegui e infine la archivi. Le decisioni restano sempre al titolare.',visual:5},
    {k:'ROUTINE',t:'La routine ideale richiede pochi minuti.',d:'Aggiorna i dati → guarda Finance → verifica Audit → chiedi a Brain → approva solo le azioni che hanno senso. In ogni schermata trovi il percorso in alto e il pulsante Guida per rivedere questa spiegazione.'}
  ];
  const intelSteps = [
    {k:'INTELLIGENCE OS',t:'Qui Easy Come passa dai dati alle decisioni.',d:'Questa area non sostituisce il gestionale: lo legge. Il flow consigliato è Finance → Audit → Brain → Azioni.',visual:2},
    {k:'1 · FINANCE',t:'Prima guarda i numeri.',d:'Finance costruisce una vista gestionale su ricavi, costi, risultato, crediti, cash flow, concentrazione e forecast.',target:'[data-view="finance"]',visual:2},
    {k:'2 · AUDIT',t:'Poi verifica i rischi.',d:'Audit non dà un voto generico: ogni rilievo contiene l’evidenza osservata e cosa conviene controllare.',target:'[data-view="audit"]',visual:3},
    {k:'3 · BRAIN',t:'Adesso fai le domande.',d:'Brain usa Finance e Audit per spiegare cosa sta succedendo e indicare priorità. Usa sempre i dati disponibili come base.',target:'[data-view="brain"]',visual:4},
    {k:'4 · ACTION CENTER',t:'Infine trasformi l’analisi in lavoro.',d:'Le azioni preparate finiscono qui. Bozza → Approvata → Eseguita → Archiviata. Nessun passaggio sensibile viene deciso automaticamente.',target:'[data-view="actions"]',visual:5}
  ];
  const steps = isIntel ? intelSteps : mainSteps;

  function clearTarget(){ if(lastTarget){lastTarget.classList.remove('ec-guide-target');lastTarget=null;} }
  function flowVisual(current){
    const labels=['Dati','Finance','Audit','Brain','Azioni'];
    return `<div class="ec-tour-visual">${labels.map((x,i)=>`<span class="${current===i+1?'current':''}">${i+1}. ${x}</span>`).join('')}</div>`;
  }
  function paintTarget(step){
    clearTarget();
    if(!step.target) return;
    const node=document.querySelector(step.target);
    if(node){lastTarget=node;node.classList.add('ec-guide-target');node.scrollIntoView({block:'center',behavior:'smooth'});}
  }
  function closeTour(done=true){
    clearTarget();
    document.querySelector('.ec-tour-card')?.remove();
    document.querySelector('.ec-tour-backdrop')?.remove();
    tourOpen=false;
    if(done) storage.setItem(tourKey,'1');
  }
  function renderTour(){
    const step=steps[tourIndex];
    let backdrop=document.querySelector('.ec-tour-backdrop');
    let card=document.querySelector('.ec-tour-card');
    if(!backdrop){backdrop=document.createElement('div');backdrop.className='ec-tour-backdrop';document.body.appendChild(backdrop);}
    if(!card){card=document.createElement('section');card.className='ec-tour-card';document.body.appendChild(card);}
    card.innerHTML=`<div class="ec-kicker">${step.k}</div><h2>${step.t}</h2><p>${step.d}</p>${step.visual?flowVisual(step.visual):''}<div class="ec-tour-progress">${steps.map((_,i)=>`<i class="${i<=tourIndex?'done':''}"></i>`).join('')}</div><div class="ec-tour-actions"><button class="skip" data-tour-skip>Salta guida</button><div>${tourIndex?'<button data-tour-prev>Indietro</button>':''}<button class="primary" data-tour-next>${tourIndex===steps.length-1?'Ho capito':'Continua'}</button></div></div>`;
    card.querySelector('[data-tour-skip]').onclick=()=>closeTour(true);
    card.querySelector('[data-tour-prev]')?.addEventListener('click',()=>{tourIndex=Math.max(0,tourIndex-1);renderTour();});
    card.querySelector('[data-tour-next]').onclick=()=>{if(tourIndex>=steps.length-1){closeTour(true);return;}tourIndex++;renderTour();};
    paintTarget(step);
  }
  function startTour(){ if(tourOpen)return;tourOpen=true;tourIndex=0;renderTour(); }

  function addLauncher(){
    if(document.querySelector('.ec-guide-launcher')) return;
    const b=document.createElement('button');b.className='ec-guide-launcher';b.innerHTML='<b>?</b> Guida';b.onclick=startTour;document.body.appendChild(b);
  }
  function dashboardFlow(){
    if(isIntel) return;
    const main=document.querySelector('#main');
    const top=main?.querySelector('.topbar');
    if(!main||!top||main.querySelector('.ec-flowbar')) return;
    const bar=document.createElement('section');bar.className='ec-flowbar';
    bar.innerHTML=`<div class="ec-flowbar-copy"><strong>Il flow Easy Come</strong><small>Segui l’ordine: i dati alimentano ogni analisi.</small></div><div class="ec-flowsteps"><button data-flow-data>1 · Dati</button><em>→</em><a href="intelligence.html?view=finance">2 · Finance</a><em>→</em><a href="intelligence.html?view=audit">3 · Audit</a><em>→</em><a href="intelligence.html?view=brain">4 · Brain</a><em>→</em><a href="intelligence.html?view=actions">5 · Azioni</a></div>`;
    top.insertAdjacentElement('afterend',bar);
    bar.querySelector('[data-flow-data]').onclick=()=>document.querySelector('[data-entity="invoices"]')?.click();
    if(!main.querySelector('.ec-start-card')){
      const start=document.createElement('section');start.className='ec-start-card';start.innerHTML='<div><h3>Da dove comincio oggi?</h3><p>Controlla che fatture, incassi e spese siano aggiornati. Poi apri Finance: il resto del percorso si costruisce da lì.</p></div><a href="intelligence.html?view=finance">Apri Finance →</a>';
      bar.insertAdjacentElement('afterend',start);
    }
  }
  function intelligenceFlow(){
    if(!isIntel) return;
    const main=document.querySelector('.intel-main');
    const top=main?.querySelector('.intel-top');
    if(!main||!top||main.querySelector('.ec-flowbar')) return;
    const current=new URLSearchParams(location.search).get('view')||'brain';
    const bar=document.createElement('section');bar.className='ec-flowbar';
    bar.innerHTML=`<div class="ec-flowbar-copy"><strong>Decision flow</strong><small>Prima numeri, poi controlli, poi decisioni.</small></div><div class="ec-flowsteps"><a href="index.html">1 · Dati</a><em>→</em><button data-go="finance" class="${current==='finance'?'active':''}">2 · Finance</button><em>→</em><button data-go="audit" class="${current==='audit'?'active':''}">3 · Audit</button><em>→</em><button data-go="brain" class="${current==='brain'?'active':''}">4 · Brain</button><em>→</em><button data-go="actions" class="${current==='actions'?'active':''}">5 · Azioni</button></div>`;
    top.insertAdjacentElement('afterend',bar);
    bar.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>document.querySelector(`[data-view="${b.dataset.go}"]`)?.click());
  }
  function maintain(){addLauncher();dashboardFlow();intelligenceFlow();}

  const observer=new MutationObserver(()=>maintain());observer.observe(document.documentElement,{subtree:true,childList:true});
  maintain();
  if(cfg.demoAutostart){
    const auto=new MutationObserver(()=>{const b=document.getElementById('demoEnter');if(b){auto.disconnect();setTimeout(()=>b.click(),80);}});auto.observe(document.documentElement,{subtree:true,childList:true});
    const existing=document.getElementById('demoEnter');if(existing)setTimeout(()=>existing.click(),80);
  }
  const tryFirstTour=()=>{
    if(storage.getItem(tourKey)) return;
    const ready=isIntel?document.querySelector('.intel-shell'):document.querySelector('.shell');
    if(ready){setTimeout(startTour,260);return;}
    setTimeout(tryFirstTour,120);
  };
  tryFirstTour();
})();
