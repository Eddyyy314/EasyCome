(function(){
'use strict';
const G=window.ECGenerator;
const T=window.ECHospitalityTemplates;
const SALES=window.EASYCOME_SALES||{mode:'customer',checkoutEndpoint:'/api/create-checkout-session',termsUrl:'/termini',privacyUrl:'/privacy'};
const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money=v=>new Intl.NumberFormat('it-IT',{style:'currency',currency:'EUR'}).format(Number(v||0));
const DEMO_SLUG=new URLSearchParams(location.search).get('demo')||'';
const STEPS=[
 {label:'La struttura',sub:'Raccontaci come lavori'},
 {label:'Come vuoi partire',sub:'Una scelta chiara'},
 {label:'Prova Easy Come',sub:'Tutto cliccabile'},
 {label:'Il pacchetto',sub:'Prezzo una tantum'}
];
const CHANNELS=[['booking','Booking.com'],['airbnb','Airbnb'],['direct','Dirette / telefono'],['other','Altri portali']];
const FEATURES=[
 {id:'audit',title:'Controllo automatico',question:'Avvisami quando qualcosa non torna',desc:'Sovrapposizioni, saldi aperti, dati ospite mancanti e attività dimenticate.',tag:'MENO ERRORI'},
 {ids:['finance','expenses'],title:'Costi e margini',question:'Fammi capire quanto resta davvero',desc:'Costi, commissioni, fornitori e margine gestionale dentro Numeri.',tag:'PIÙ CONTROLLO'},
 {id:'channel_sync',title:'Calendari dei portali',question:'Tieni allineati i calendari dei canali',desc:'Più ordine quando le prenotazioni arrivano da Booking, Airbnb e altri portali.',tag:'CALENDARI'},
 {ids:['guest_comms','self_checkin'],title:'Accoglienza ospiti',question:'Semplifica il pre-arrivo e il check-in',desc:'Dati ospite, documenti, messaggi e checklist restano collegati al soggiorno.',tag:'OSPITI'},
 {id:'tourist_tax',title:'Tassa di soggiorno',question:'Tieni ordinata la tassa di soggiorno',desc:'Importi, esenzioni e stato restano collegati alla prenotazione corretta.',tag:'ADEMPIMENTI'},
 {id:'dynamic_pricing',title:'Tariffe e regole',question:'Gestisci meglio prezzi e regole di soggiorno',desc:'Stagioni, durata minima, occupazione ed eccezioni configurate con te.',tag:'RICAVI'},
 {id:'multiuser',title:'Team e permessi',question:'Dai a ogni persona il suo accesso',desc:'Titolare, reception, pulizie e collaboratori vedono ciò che serve.',tag:'TEAM'},
 {id:'automations',title:'Automazioni',question:'Fai partire da sole le attività ripetitive',desc:'Routine su prenotazioni, arrivi, partenze, messaggi, incassi e pulizie.',tag:'TEMPO'}
];
const CORE_MODULES=['hospitality_core','reports','easycome_hub'];
const PRIORITIES=[
 ['payments','Pagamenti','Acconti, saldi e importi aperti sempre visibili.'],
 ['guest_data','Dati ospiti','Documenti e informazioni del soggiorno ordinati.'],
 ['tax','Tassa di soggiorno','Importi ed esenzioni collegati alla prenotazione.'],
 ['messages','Messaggi ospiti','Meno messaggi ripetitivi prima e dopo il soggiorno.'],
 ['numbers','Report e numeri','Occupazione, ADR, RevPAR, costi e margini.'],
 ['pricing','Tariffe','Più controllo su stagioni, prezzi e regole.']
];
let activeUserId='guest',currentStep=0,project=null,customizeOpen=false,previewMode='desktop';

function featureIds(f){return f.ids||[f.id]}
function modulePrice(id){return Number(G.MODULES.find(m=>m.id===id)?.price||0)}
function featurePrice(f){return featureIds(f).reduce((s,id)=>s+modulePrice(id),0)}
function featureActive(f){return featureIds(f).every(id=>(project.modules||[]).includes(id))}
function selectedFeatures(){return FEATURES.filter(featureActive)}
function setFeatureOn(p,f,on){f.ids?f.ids.forEach(id=>toggleModule(p,id,on)):toggleModule(p,f.id,on)}
function toggleModule(p,id,on){p.modules=(p.modules||[]).filter(x=>x!==id);if(on)p.modules.push(id);p.modules=[...new Set(p.modules)]}
function normalizedHospitality(h={}){
 const count=Math.max(1,Number(h.unitCount||h.unitTypes?.reduce((s,u)=>s+Number(u.count||1),0)||4));
 return {...h,type:h.type||'B&B',city:h.city||'',unitCount:count,channels:Array.isArray(h.channels)?h.channels:['booking','direct'],bookingVolume:h.bookingVolume||'medium',teamSize:h.teamSize||'solo',checkinMode:h.checkinMode||'presence',cleaningMode:h.cleaningMode||'internal',paymentMode:h.paymentMode||'mixed',depositPolicy:h.depositPolicy||'direct',taxMode:h.taxMode||'yes',guestDocs:h.guestDocs||'manual',rateMode:h.rateMode||'seasonal',currentTool:h.currentTool||'manual',automationLevel:h.automationLevel||'light',priorities:Array.isArray(h.priorities)?h.priorities:['payments','guest_data'],preset:h.preset||'recommended',unitTypes:[{name:'Camera / alloggio',count,capacity:2,basePrice:Number(h.unitTypes?.[0]?.basePrice||95)}],checkinFrom:h.checkinFrom||'15:00',checkoutBy:h.checkoutBy||'10:30'};
}
function normalize(input){
 const base=G.defaultProject();
 const p={...base,...(input||{}),company:{...base.company,...(input?.company||{})},pricing:{...base.pricing,...(input?.pricing||{})},delivery:{...base.delivery,...(input?.delivery||{})}};
 const allowed=new Set([...CORE_MODULES,...FEATURES.flatMap(featureIds)]);
 p.modules=[...new Set([...(p.modules||[]).filter(id=>allowed.has(id)),...CORE_MODULES])];
 p.customEntities=[];p.hospitality=normalizedHospitality(p.hospitality||{});p.templateId='hospitality';p.company.industry='Ospitalità indipendente';
 p.delivery.implementationSelected=true;p.delivery.implementationPrice=150;p.delivery.managedServiceSelected=false;p.delivery.managedServicePrice=0;
 syncProject(p);
 if(!input?.hospitality?.preset){p.hospitality.preset='recommended';p.modules=presetModulesFor(p,'recommended')}
 return p;
}
function syncProject(p=project){
 if(!p)return;const h=p.hospitality,count=Math.max(1,Number(h.unitCount||1));
 h.unitTypes=[{name:'Camera / alloggio',count,capacity:2,basePrice:Number(h.unitTypes?.[0]?.basePrice||95)}];h.maxGuests=Math.max(2,count*2);
 p.company.description=`Easy Come Hospitality per ${h.type||'struttura ricettiva'} con ${count} camere o alloggi.`;p.pricing.mode='none';p.pricing.enabled=false;
 p.delivery.implementationSelected=true;p.delivery.implementationPrice=150;p.delivery.managedServiceSelected=false;p.delivery.managedServicePrice=0;
}
function draftKey(){return `easycome-hospitality-v5:${activeUserId||'guest'}`}
function save(){syncProject();try{localStorage.setItem(draftKey(),JSON.stringify(project))}catch(_){}window.EasyComeAccount?.saveProject?.(project)}
function localDraft(){try{return JSON.parse(localStorage.getItem(draftKey())||'null')}catch(_){return null}}
function toast(text){const n=document.createElement('div');n.className='toast';n.textContent=text;document.body.appendChild(n);setTimeout(()=>n.remove(),1600)}
function heading(k,title,desc){return `<div class="heading"><div><span class="eyebrow">${k}</span><h1>${title}</h1><p>${desc}</p></div><span class="step-count">${currentStep+1} / ${STEPS.length}</span></div>`}

function recommendedSet(p=project){
 const h=p.hospitality,r=new Set(['audit']);
 const ota=(h.channels||[]).filter(x=>x!=='direct');
 if(ota.length>=2 || (ota.length>=1 && Number(h.unitCount)>=4))r.add('channel_sync');
 if(['medium','high'].includes(h.bookingVolume) || Number(h.unitCount)>=4){r.add('guest_comms');r.add('self_checkin')}
 if(h.checkinMode==='self'||h.checkinMode==='mixed'){r.add('guest_comms');r.add('self_checkin')}
 if((h.priorities||[]).includes('messages')){r.add('guest_comms');r.add('self_checkin')}
 if((h.priorities||[]).includes('tax')||h.taxMode==='yes')r.add('tourist_tax');
 if((h.priorities||[]).includes('numbers')){r.add('finance');r.add('expenses')}
 if((h.priorities||[]).includes('pricing') || h.rateMode==='seasonal' || h.rateMode==='dynamic' || Number(h.unitCount)>=6 || h.bookingVolume==='high')r.add('dynamic_pricing');
 if(h.teamSize!=='solo')r.add('multiuser');
 if(h.automationLevel==='high'||h.bookingVolume==='high'||Number(h.unitCount)>=7)r.add('automations');
 if((h.priorities||[]).includes('payments') && (h.bookingVolume==='high'||h.depositPolicy!=='none'))r.add('automations');
 if(h.guestDocs==='manual' && h.checkinMode!=='presence'){r.add('guest_comms');r.add('self_checkin')}
 if(h.paymentMode==='mixed' && h.bookingVolume==='high')r.add('audit');
 return r;
}
function recommendationFeatures(){const r=recommendedSet();return FEATURES.filter(f=>featureIds(f).some(id=>r.has(id)))}
function recommendationReason(){
 const h=project.hospitality,reasons=[];
 if(Number(h.unitCount)>=5)reasons.push(`${h.unitCount} camere/alloggi`);
 if((h.channels||[]).filter(x=>x!=='direct').length>=2)reasons.push('più canali di prenotazione');
 if(h.teamSize!=='solo')reasons.push('lavoro in team');
 if(h.checkinMode!=='presence')reasons.push('check-in anche autonomo');
 if(h.bookingVolume==='high')reasons.push('molte prenotazioni ogni mese');
 if(h.currentTool==='sheets')reasons.push('passaggio da fogli/Excel');
 if(h.rateMode==='seasonal'||h.rateMode==='dynamic')reasons.push('tariffe che cambiano durante l’anno');
 if(h.taxMode==='yes')reasons.push('tassa di soggiorno da gestire');
 return reasons.length?reasons.slice(0,3).join(' · '):'una struttura snella che vuole lavorare con più ordine';
}
function presetModulesFor(p,mode){
 if(mode==='base')return [...CORE_MODULES];
 if(mode==='full')return [...new Set([...CORE_MODULES,...FEATURES.flatMap(featureIds)])];
 const r=recommendedSet(p);return [...new Set([...CORE_MODULES,...FEATURES.filter(f=>featureIds(f).some(id=>r.has(id))).flatMap(featureIds)])];
}
function presetPrice(mode){const clone=JSON.parse(JSON.stringify(project));clone.modules=presetModulesFor(clone,mode);return G.calculatePrice(clone).total}
function applyPreset(mode){project.hospitality.preset=mode;project.modules=presetModulesFor(project,mode);project.delivery.previewApproved=false;save();render();toast(mode==='base'?'Hai scelto Essenziale':mode==='full'?'Hai scelto Completo':'Applicata la soluzione consigliata')}
function keepRecommendationFresh(){if(project.hospitality.preset==='recommended')project.modules=presetModulesFor(project,'recommended')}
function setFeature(f,on){setFeatureOn(project,f,on);project.hospitality.preset='custom';project.delivery.previewApproved=false;save();render()}

function render(){syncProject();document.body.dataset.step=String(currentStep);document.body.classList.toggle('previewing',currentStep===2);renderSteps();$('#panel').innerHTML=[stepStructure,stepNeeds,stepPreview,stepPrice][currentStep]();renderSummary();updateNav();bindCurrent();save()}
function renderSteps(){$('#stepList').innerHTML=STEPS.map((s,i)=>`<button class="step-tab ${i===currentStep?'active':''}" data-step="${i}"><small>0${i+1}</small><span><strong>${s.label}</strong><em>${s.sub}</em></span></button>`).join('');$$('[data-step]').forEach(b=>b.onclick=()=>{currentStep=Number(b.dataset.step);render();scrollTo(0,0)})}
function typeCopy(v){return v==='B&B'?'Camere e ospitalità gestite direttamente':v==='Affittacamere'?'Più camere o unità indipendenti':'Uno o più appartamenti / case'}
function choiceButtons(items,attr,current,multi=false){return items.map(([id,label])=>`<button type="button" data-${attr}="${id}" class="choice ${multi?(current||[]).includes(id):current===id?'active':''}">${label}</button>`).join('')}
function recSidebar(){const list=recommendationFeatures().slice(0,6);return `<aside class="recommendation recommendation-v5"><span class="eyebrow">LA NOSTRA LETTURA</span><h3>Per la tua struttura<br><em>partiremmo così.</em></h3><p class="rec-intro">Le risposte servono solo a evitare funzioni inutili. Puoi cambiare tutto nel passaggio successivo.</p><div class="recommendation-list">${list.map(f=>`<div class="rec-item"><span class="rec-dot"></span><div><b>${esc(f.title)}</b><span>${esc(f.desc)}</span></div></div>`).join('')||'<div class="rec-item"><span class="rec-dot"></span><div><b>Gestione essenziale</b><span>Le cinque aree principali sono già incluse.</span></div></div>'}</div><div class="rec-reason"><b>Perché</b><span>${esc(recommendationReason())}.</span></div><button type="button" class="btn-rec" id="goPlans">Vedi cosa ti consigliamo</button></aside>`}
function stepStructure(){const h=project.hospitality,c=project.company;return `${heading('CONFIGURAZIONE GUIDATA','Raccontaci come lavori.','Non stai progettando un software. Rispondi a domande semplici sulla tua struttura: Easy Come userà le risposte per proporti una configurazione sensata.')}
<div class="interview-note"><b>Circa 2 minuti</b><span>Non servono dati tecnici.</span><span>Puoi modificare tutto dopo.</span></div>
<div class="interview-layout"><div class="interview-form">
<section class="card interview-card"><div class="section-title"><div class="number-title"><span class="section-num">1</span><div><span class="section-kicker">LA BASE</span><h2>La tua struttura</h2></div></div><p>Ci serve solo per dimensionare il gestionale.</p></div><div class="types v5-types">${['B&B','Affittacamere','Casa vacanza'].map(v=>`<button type="button" class="type-btn ${h.type===v?'active':''}" data-type="${v}"><span class="type-symbol">${v==='B&B'?'▦':v==='Affittacamere'?'▥':'⌂'}</span><b>${v}</b><small>${typeCopy(v)}</small></button>`).join('')}</div><div class="fields v5-fields"><label class="field"><span>Nome della struttura</span><input id="companyName" value="${esc(c.name||'')}" placeholder="Es. Dimora Aurora"></label><label class="field"><span>Città</span><input id="city" value="${esc(h.city||'')}" placeholder="Es. Roma"></label><label class="field compact"><span>Camere / alloggi</span><input id="unitCount" type="number" min="1" max="100" value="${Number(h.unitCount||4)}"></label></div></section>
<section class="card interview-card"><div class="section-title"><div class="number-title"><span class="section-num">2</span><div><span class="section-kicker">PRENOTAZIONI</span><h2>Come arrivano oggi?</h2></div></div><p>Seleziona tutto ciò che usi normalmente.</p></div><div class="question-stack"><div class="question-row"><div class="question-copy"><h3>Canali</h3><p>Da dove ricevi le prenotazioni?</p></div><div class="choices large-choices">${choiceButtons(CHANNELS,'channel',h.channels,true)}</div></div><div class="question-row"><div class="question-copy"><h3>Volume</h3><p>Quante prenotazioni gestisci in un mese normale?</p></div><div class="choices">${choiceButtons([['low','Meno di 15'],['medium','15–50'],['high','Più di 50']],'bookings',h.bookingVolume)}</div></div></div></section>
<section class="card interview-card"><div class="section-title"><div class="number-title"><span class="section-num">3</span><div><span class="section-kicker">GIORNATA OPERATIVA</span><h2>Come lavori ogni giorno?</h2></div></div><p>Queste risposte cambiano soprattutto Operazioni.</p></div><div class="question-grid v5-grid"><div class="question"><div class="question-copy"><h3>Team</h3><p>Quante persone lavorano con te?</p></div><div class="choices">${choiceButtons([['solo','Solo io'],['small','2–3 persone'],['team','4+ persone']],'team',h.teamSize)}</div></div><div class="question"><div class="question-copy"><h3>Check-in</h3><p>Come accogli più spesso gli ospiti?</p></div><div class="choices">${choiceButtons([['presence','In presenza'],['self','Self check-in'],['mixed','Entrambi']],'checkin',h.checkinMode)}</div></div><div class="question"><div class="question-copy"><h3>Pulizie</h3><p>Chi prepara camere o alloggi?</p></div><div class="choices">${choiceButtons([['internal','Noi'],['external','Esterni'],['mixed','Entrambi']],'cleaning',h.cleaningMode)}</div></div></div></section>
<section class="card interview-card"><div class="section-title"><div class="number-title"><span class="section-num">4</span><div><span class="section-kicker">INCASSI E PREZZI</span><h2>Come gestisci i soldi?</h2></div></div><p>Serve a capire quanto controllo e automazione ti conviene avere.</p></div><div class="question-grid v5-grid"><div class="question"><div class="question-copy"><h3>Incassi</h3><p>Come ricevi normalmente i pagamenti?</p></div><div class="choices">${choiceButtons([['ota','Soprattutto portali'],['direct','Diretti / bonifico'],['mixed','Un po’ di tutto']],'payment',h.paymentMode)}</div></div><div class="question"><div class="question-copy"><h3>Caparre</h3><p>Le chiedi prima dell’arrivo?</p></div><div class="choices">${choiceButtons([['none','Mai'],['direct','Sulle dirette'],['always','Quasi sempre']],'deposit',h.depositPolicy)}</div></div><div class="question"><div class="question-copy"><h3>Tariffe</h3><p>Quanto cambiano durante l’anno?</p></div><div class="choices">${choiceButtons([['simple','Quasi fisse'],['seasonal','Per stagione'],['dynamic','Spesso']],'rate',h.rateMode)}</div></div></div></section>
<section class="card interview-card"><div class="section-title"><div class="number-title"><span class="section-num">5</span><div><span class="section-kicker">OSPITI E ADEMPIMENTI</span><h2>Cosa vuoi avere sempre in ordine?</h2></div></div><p>Seleziona le aree che oggi richiedono più attenzione.</p></div><div class="question-grid v5-grid"><div class="question"><div class="question-copy"><h3>Tassa di soggiorno</h3><p>La gestisci nella tua struttura?</p></div><div class="choices">${choiceButtons([['yes','Sì'],['no','No / non prevista']],'taxmode',h.taxMode)}</div></div><div class="question"><div class="question-copy"><h3>Dati ospiti</h3><p>Come raccogli oggi documenti e informazioni?</p></div><div class="choices">${choiceButtons([['manual','A mano'],['forms','Moduli digitali'],['pms','Altro software']],'guestdocs',h.guestDocs)}</div></div><div class="question wide"><div class="question-copy"><h3>Cosa vuoi tenere sotto controllo?</h3><p>Puoi scegliere più cose.</p></div><div class="choices priority-choices">${PRIORITIES.map(([id,label])=>`<button type="button" data-priority="${id}" class="choice icon-choice ${(h.priorities||[]).includes(id)?'active':''}"><span>${label}</span></button>`).join('')}</div></div></div></section>
<section class="card interview-card"><div class="section-title"><div class="number-title"><span class="section-num">6</span><div><span class="section-kicker">OGGI</span><h2>Da cosa stai partendo?</h2></div></div><p>Ci aiuta a rendere l’implementazione più semplice.</p></div><div class="question-grid v5-grid"><div class="question"><div class="question-copy"><h3>Strumento attuale</h3><p>Dove tieni prenotazioni e dati?</p></div><div class="choices">${choiceButtons([['manual','Agenda / manuale'],['sheets','Excel / fogli'],['pms','Altro gestionale']],'tool',h.currentTool)}</div></div><div class="question"><div class="question-copy"><h3>Quanto vuoi automatizzare?</h3><p>Easy Come può limitarsi ad aiutarti o fare di più.</p></div><div class="choices">${choiceButtons([['light','Solo promemoria'],['medium','Le routine'],['high','Il più possibile']],'automation',h.automationLevel)}</div></div></div></section>
</div>${recSidebar()}</div>`}

function packageFeatureLines(mode){
 if(mode==='base')return ['Prenotazioni e fascicolo soggiorno','Calendario e disponibilità','Oggi e attività operative','Dati ospiti sempre collegati'];
 if(mode==='full')return ['Tutto del Consigliato','Costi, margini e tariffe','Automazioni e controlli avanzati','Team, canali e accoglienza completa'];
 const rec=recommendationFeatures();return ['Tutto ciò che include Essenziale',...rec.slice(0,4).map(f=>f.title)];
}
function packageIdeal(mode){const h=project.hospitality;if(mode==='base')return Number(h.unitCount)<=3?'B&B piccoli e gestione molto lineare.':'Chi vuole iniziare solo dal nucleo operativo.';if(mode==='full')return 'Strutture che vogliono attivare tutte le capacità disponibili.';return `La scelta più equilibrata per ${recommendationReason()}.`}
function presetCard(mode,title,kicker,icon){const selected=project.hospitality.preset===mode,rec=mode==='recommended';const lines=packageFeatureLines(mode);return `<article class="preset-card plan-v5 ${selected?'selected':''} ${rec?'recommended':''}" data-plan-card="${mode}">${rec?'<div class="recommend-badge">SCELTA CONSIGLIATA</div>':''}<div class="plan-head"><div class="preset-icon">${icon}</div><div><span class="eyebrow">${kicker}</span><h3>${title}</h3></div><span class="plan-radio">${selected?'✓':''}</span></div><p class="plan-sub">${mode==='base'?'La versione più semplice per partire ordinati.':mode==='full'?'Tutto Easy Come, senza lasciare capacità fuori.':'La configurazione costruita sulle risposte che ci hai dato.'}</p>${rec?`<div class="why-this"><span>PERCHÉ TE LO CONSIGLIAMO</span><b>${esc(recommendationReason())}</b></div>`:''}<div class="preset-features">${lines.map(x=>`<span>${esc(x)}</span>`).join('')}</div><div class="ideal"><b>IDEALE PER</b><span>${esc(packageIdeal(mode))}</span></div><div class="preset-price"><div><small>TOTALE UNA TANTUM</small><strong>${money(presetPrice(mode))}</strong><span>implementazione inclusa</span></div><button type="button" class="select-plan" data-preset="${mode}">${selected?'Selezionato':`Scegli ${title}`}</button></div></article>`}
function stepNeeds(){const rec=project.hospitality.preset==='recommended';return `${heading('LA TUA CONFIGURAZIONE','Da dove vuoi partire?','Ti mostriamo tre livelli molto diversi tra loro. Quello centrale è costruito sulle risposte che ci hai dato; puoi scegliere altro o personalizzare dopo.')}
<section class="plan-intro"><div><span class="eyebrow">LA NOSTRA RACCOMANDAZIONE</span><h2>${rec?'Partiremmo dal Consigliato.':'Puoi cambiare configurazione quando vuoi.'}</h2><p>${esc(recommendationReason())}. Per questo abbiamo attivato solo le capacità che hanno davvero senso per il tuo modo di lavorare.</p></div><div class="plan-summary"><span>${Number(project.hospitality.unitCount||1)} camere/alloggi</span><span>${(project.hospitality.channels||[]).length} canali</span><span>${project.hospitality.teamSize==='solo'?'1 persona':project.hospitality.teamSize==='small'?'2–3 persone':'4+ persone'}</span></div></section>
<section class="preset-stage v5-presets"><div class="preset-grid">${presetCard('base','Essenziale','PARTENZA SEMPLICE','◇')}${presetCard('recommended','Consigliato','PIÙ ADATTO A TE','★')}${presetCard('full','Completo','TUTTO ATTIVO','♛')}</div><div class="included-strip"><b>Sempre incluso</b><span>Oggi</span><span>Calendario</span><span>Prenotazioni</span><span>Operazioni</span><span>Numeri base</span><span>Dati ospiti</span></div></section>
<section class="plan-difference"><div><b>Essenziale</b><span>Ordine operativo.</span></div><div class="active"><b>Consigliato</b><span>Ordine + controllo + capacità utili per te.</span></div><div><b>Completo</b><span>Massimo livello di automazione e analisi.</span></div></section>
<section class="customize"><button type="button" class="customize-toggle" id="customizeToggle"><div><b>Vuoi personalizzare ancora?</b><span>È opzionale. Apri solo se vuoi aggiungere o togliere una singola capacità.</span></div><strong>${customizeOpen?'−':'+'}</strong></button>${customizeOpen?`<div class="feature-grid">${FEATURES.map((f,i)=>`<button type="button" class="feature ${featureActive(f)?'active':''}" data-feature="${i}"><div class="feature-top"><span>${f.tag}</span><i>${featureActive(f)?'Attivo':'Aggiungi'}</i></div><h3>${f.question}</h3><p>${f.desc}</p><footer><b>${f.title}</b><strong>+${money(featurePrice(f))}</strong></footer></button>`).join('')}</div>`:''}</section>`}

function previewProject(){syncProject();const p=JSON.parse(JSON.stringify(project));p.company.name=p.company.name||'La tua struttura';p.organizationId=`pv-${G.slugify(p.company.name)||'easycome'}-${p.hospitality.unitCount}-${p.modules.length}`;p.entities=G.buildEntities(p);return p}
function previewFallbackMarkup(){return `<div class="preview-fallback" id="previewFallback"><section class="preview-fallback-card"><span class="eyebrow">ANTEPRIMA</span><h3>Stiamo preparando il tuo Easy Come.</h3><p>Se il browser impiega qualche secondo, il prodotto comparirà qui senza aprire altre pagine.</p></section></div>`}
function stepPreview(){return `${heading('PROVALO DAVVERO','Il tuo Easy Come, prima di comprarlo.','Questa non è un’immagine: puoi cliccare Oggi, Calendario, Prenotazioni, Operazioni e Numeri, aprire un soggiorno e provare il flusso.')}
<section class="live-preview"><div class="live-toolbar"><div><span class="live-dot"></span><b>ANTEPRIMA LIVE</b><small>La stessa interfaccia del prodotto finale</small></div><div class="device-switch"><button type="button" data-device="desktop" class="${previewMode==='desktop'?'active':''}">Desktop</button><button type="button" data-device="mobile" class="${previewMode==='mobile'?'active':''}">Mobile</button></div><div><button id="reloadPreview">Ripristina</button><button id="expandPreview" class="dark">Schermo intero</button></div></div><div class="preview-frame-wrap ${previewMode==='mobile'?'mobile':''}" id="previewFrameWrap">${previewFallbackMarkup()}<iframe id="productPreview" title="Anteprima Easy Come Hospitality"></iframe></div></section><div class="preview-promise"><span>ANTEPRIMA = PRODOTTO</span><h3>Non cambiamo interfaccia dopo l’acquisto.</h3><p>Le funzioni che hai scelto potenziano le cinque aree principali senza aggiungere menu inutili. Il prodotto resta semplice anche quando diventa più completo.</p></div>`}

function stepPrice(){const price=G.calculatePrice(project),sel=selectedFeatures();return `${heading('IL TUO PACCHETTO','Sai esattamente cosa compri.','Easy Come è un acquisto una tantum. L’implementazione da €150 è obbligatoria perché configuriamo e testiamo il gestionale insieme a te.')}
<section class="checkout-preview"><div class="package-main"><span class="eyebrow">EASY COME HOSPITALITY</span><h2>${esc(project.company.name||'La tua struttura')}</h2><p>${esc(project.hospitality.type)} · ${Number(project.hospitality.unitCount||1)} camere/alloggi · ${esc(project.hospitality.preset==='custom'?'Configurazione personalizzata':project.hospitality.preset==='base'?'Essenziale':project.hospitality.preset==='full'?'Completo':'Consigliato')}</p><div class="package-lines"><div><span>Gestionale Hospitality</span><b>${money(price.base)}</b></div>${sel.map(f=>`<div><span>${esc(f.title)}</span><b>+${money(featurePrice(f))}</b></div>`).join('')}<div><span>Implementazione e messa a punto</span><b>${money(price.implementation)}</b></div></div><div class="package-total"><span>TOTALE UNA TANTUM</span><strong>${money(price.total)}</strong><small>Nessun canone Easy Come obbligatorio.</small></div><button id="buy" class="buy">Acquista Easy Come</button></div><aside class="implementation"><span class="eyebrow">COSA FACCIAMO NOI</span><h3>Non ti consegniamo un software vuoto.</h3><ol><li><b>Definiamo il flusso reale</b><span>Camere, canali, check-in, pagamenti, pulizie e adempimenti.</span></li><li><b>Configuriamo Easy Come</b><span>Regole, utenti, tariffe e dati iniziali.</span></li><li><b>Testiamo i passaggi importanti</b><span>Prenotazione, arrivo, saldo, pulizia e chiusura soggiorno.</span></li><li><b>Te lo consegniamo pronto</b><span>Apri Easy Come e inizi a lavorare.</span></li></ol></aside></section>`}

function renderSummary(){if(!project)return;const h=project.hospitality,p=G.calculatePrice(project),sel=selectedFeatures();const plan=h.preset==='custom'?'Personalizzato':h.preset==='base'?'Essenziale':h.preset==='full'?'Completo':'Consigliato';$('#summary').innerHTML=`<div class="summary-title"><small>IL TUO EASY COME</small><h2>${esc(project.company.name||'La tua struttura')}</h2><p>${esc(h.type)} · ${Number(h.unitCount||1)} camere/alloggi</p></div><div class="summary-plan"><small>CONFIGURAZIONE</small><b>${plan}</b></div><div class="summary-core"><span>SEMPRE INCLUSO</span><p>Oggi · Calendario · Prenotazioni · Operazioni · Numeri</p></div>${sel.length?`<div class="summary-selected"><span>CAPACITÀ ATTIVE</span>${sel.slice(0,6).map(f=>`<div><b>${esc(f.title)}</b><em>+${money(featurePrice(f))}</em></div>`).join('')}</div>`:''}<div class="summary-total"><span>TOTALE CON IMPLEMENTAZIONE</span><strong>${money(p.total)}</strong><small>una tantum</small></div>`}
function updateNav(){const prev=$('#previous'),next=$('#next');prev.disabled=currentStep===0;next.textContent=currentStep===3?'Modifica configurazione':currentStep===2?'Vedi il prezzo':'Continua';$('#progressMobile').textContent=`${currentStep+1} / ${STEPS.length}`}
function bindInput(id,fn,{rerender=false,event='input'}={}){const el=$('#'+id);if(!el)return;el.addEventListener(event,()=>{fn(el.value);project.delivery.previewApproved=false;keepRecommendationFresh();save();if(rerender)render();else renderSummary()})}
function toggleArrayValue(arr,id){const a=new Set(arr||[]);a.has(id)?a.delete(id):a.add(id);return [...a]}
function responseChange(fn){fn();project.delivery.previewApproved=false;keepRecommendationFresh();save();render()}
function loadPreview(iframe=$('#productPreview')){if(!iframe)return;const fallback=$('#previewFallback');fallback?.classList.remove('hidden');if(!T?.previewHtml){iframe.style.display='none';return}try{const html=T.previewHtml(previewProject());iframe.onload=()=>{iframe.style.display='block';fallback?.classList.add('hidden')};iframe.srcdoc=html;setTimeout(()=>{try{if(iframe.contentDocument?.getElementById('hospitalityApp')?.children.length){iframe.style.display='block';fallback?.classList.add('hidden')}}catch(_){}},650)}catch(_){iframe.style.display='none'}}
function expandPreview(){const host=$('#previewOverlay');host.innerHTML=`<div class="preview-overlay"><section><header><div><b>Easy Come Hospitality · Anteprima live</b><span>È la stessa interfaccia del prodotto finale</span></div><button id="closeBigPreview">×</button></header><iframe id="bigProductPreview"></iframe></section></div>`;const frame=$('#bigProductPreview');try{frame.srcdoc=T.previewHtml(previewProject())}catch(_){frame.outerHTML='<div style="color:white;padding:50px">Anteprima non disponibile in questo browser.</div>'}$('#closeBigPreview').onclick=()=>host.innerHTML=''}
function setPreviewMode(mode){previewMode=mode;const wrap=$('#previewFrameWrap');wrap?.classList.toggle('mobile',mode==='mobile');$$('[data-device]').forEach(b=>b.classList.toggle('active',b.dataset.device===mode))}

function bindCurrent(){
 if(currentStep===0){
  $$('[data-type]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.type=b.dataset.type));
  $$('[data-channel]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.channels=toggleArrayValue(project.hospitality.channels,b.dataset.channel)));
  $$('[data-bookings]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.bookingVolume=b.dataset.bookings));
  $$('[data-team]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.teamSize=b.dataset.team));
  $$('[data-checkin]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.checkinMode=b.dataset.checkin));
  $$('[data-cleaning]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.cleaningMode=b.dataset.cleaning));
  $$('[data-payment]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.paymentMode=b.dataset.payment));
  $$('[data-deposit]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.depositPolicy=b.dataset.deposit));
  $$('[data-rate]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.rateMode=b.dataset.rate));
  $$('[data-taxmode]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.taxMode=b.dataset.taxmode));
  $$('[data-guestdocs]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.guestDocs=b.dataset.guestdocs));
  $$('[data-priority]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.priorities=toggleArrayValue(project.hospitality.priorities,b.dataset.priority)));
  $$('[data-tool]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.currentTool=b.dataset.tool));
  $$('[data-automation]').forEach(b=>b.onclick=()=>responseChange(()=>project.hospitality.automationLevel=b.dataset.automation));
  bindInput('companyName',v=>{project.company.name=v;project.company.slug=G.slugify(v)});bindInput('city',v=>project.hospitality.city=v);bindInput('unitCount',v=>project.hospitality.unitCount=Math.max(1,Number(v||1)),{rerender:true,event:'change'});
  $('#goPlans')?.addEventListener('click',()=>{currentStep=1;render();scrollTo(0,0)});
 }
 if(currentStep===1){
  $$('[data-preset]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset));
  $$('[data-plan-card]').forEach(card=>card.onclick=e=>{if(e.target.closest('[data-preset]'))return;applyPreset(card.dataset.planCard)});
  $('#customizeToggle')?.addEventListener('click',()=>{customizeOpen=!customizeOpen;render()});
  $$('[data-feature]').forEach(b=>b.onclick=()=>{const f=FEATURES[Number(b.dataset.feature)];setFeature(f,!featureActive(f))});
 }
 if(currentStep===2){setTimeout(loadPreview,0);$('#reloadPreview')?.addEventListener('click',()=>loadPreview());$('#expandPreview')?.addEventListener('click',expandPreview);$$('[data-device]').forEach(b=>b.onclick=()=>setPreviewMode(b.dataset.device));setPreviewMode(previewMode)}
 if(currentStep===3)$('#buy')?.addEventListener('click',openCheckout);
}
function next(){if(currentStep===3)currentStep=1;else{if(currentStep===2)project.delivery.previewApproved=true;currentStep++}render();scrollTo(0,0)}
function prev(){if(currentStep>0){currentStep--;render();scrollTo(0,0)}}
function projectForCheckout(){syncProject();return {...project,company:{...project.company},delivery:{...project.delivery,previewApproved:true,implementationSelected:true,implementationPrice:150,managedServiceSelected:false,managedServicePrice:0}}}
function openCheckout(){const price=G.calculatePrice(project),root=$('#checkoutRoot');root.innerHTML=`<div class="checkout-overlay"><section class="checkout-sheet"><div class="checkout-copy"><div class="checkout-top"><div><span class="checkout-label">ORDINE EASY COME</span><h2>${esc(project.company.name||'La tua struttura')}</h2><p>Hai già configurato e provato il prodotto. Qui servono solo i dati per completare l’ordine.</p></div><button class="checkout-close" id="closeCheckout">×</button></div><div class="order-lines"><div><span>Gestionale Hospitality</span><strong>${money(price.base)}</strong></div>${selectedFeatures().map(f=>`<div><span>${esc(f.title)}</span><strong>+${money(featurePrice(f))}</strong></div>`).join('')}<div><span>Implementazione</span><strong>${money(price.implementation)}</strong></div></div><div class="order-total"><div><span class="checkout-label">TOTALE UNA TANTUM</span><small>Nessun canone Easy Come obbligatorio</small></div><strong>${money(price.total)}</strong></div></div><div class="checkout-form-wrap"><form id="checkoutForm"><span class="eyebrow">DATI ORDINE</span><h3>Completiamo l’acquisto.</h3><div class="fields checkout-fields"><label class="field"><span>Nome e cognome</span><input name="customerName" required></label><label class="field"><span>Email</span><input name="email" type="email" required value="${esc(project.company.email||'')}"></label><label class="field"><span>Telefono</span><input name="phone"></label><label class="field"><span>Partita IVA / CF</span><input name="taxId"></label><label class="field full"><span>Struttura / ragione sociale</span><input name="companyName" required value="${esc(project.company.name||'')}"></label></div><label class="legal-check"><input type="checkbox" name="terms" required><span>Accetto i <a href="${esc(SALES.termsUrl||'/termini')}" target="_blank">Termini e condizioni</a> e ho letto la <a href="${esc(SALES.privacyUrl||'/privacy')}" target="_blank">Privacy Policy</a>.</span></label><label class="legal-check"><input type="checkbox" name="immediatePerformance" required><span>Chiedo che l’implementazione inizi dopo il pagamento.</span></label><div id="checkoutError"></div><button id="payButton" class="buy" type="submit">Continua al pagamento · ${money(price.total)}</button><div class="secure-row">Pagamento gestito tramite Stripe.</div></form></div></section></div>`;$('#closeCheckout').onclick=()=>root.innerHTML='';$('#checkoutForm').onsubmit=submitCheckout}
async function submitCheckout(e){e.preventDefault();const form=e.currentTarget;if(!form.reportValidity())return;const customer=Object.fromEntries(new FormData(form)),button=$('#payButton'),error=$('#checkoutError');project.company.name=String(customer.companyName||project.company.name||'').trim();project.company.slug=G.slugify(project.company.name);project.company.email=String(customer.email||'').trim();project.delivery.previewApproved=true;syncProject();save();const audit=G.auditProject(project);if(!audit.ready){error.innerHTML=`<div class="checkout-error">${esc(audit.blockers[0]||'Completa i dati dell’ordine.')}</div>`;return}button.disabled=true;button.textContent='Controllo account…';error.innerHTML='';try{const token=await window.EasyComeAccount?.getAccessToken?.();if(!token){save();location.href=`/accedi.html?mode=login&next=${encodeURIComponent('/studio.html')}`;return}button.textContent='Apertura del pagamento…';const response=await fetch(SALES.checkoutEndpoint,{method:'POST',headers:{'content-type':'application/json',authorization:`Bearer ${token}`},body:JSON.stringify({project:projectForCheckout(),customer,legal:{termsAccepted:customer.terms==='on',immediatePerformance:customer.immediatePerformance==='on',termsVersion:'EC-TOS-HOSPITALITY-V5',acceptedAt:new Date().toISOString()},sourceUrl:location.href})});const data=await response.json().catch(()=>({}));if(!response.ok||!data.url)throw new Error(data.error||'Impossibile avviare il pagamento.');location.href=data.url}catch(err){error.innerHTML=`<div class="checkout-error">${esc(err.message||String(err))}</div>`;button.disabled=false;button.textContent=`Continua al pagamento · ${money(G.calculatePrice(project).total)}`}}
async function loadDemo(){if(!DEMO_SLUG)return null;try{const r=await fetch(`/api/demo-public?slug=${encodeURIComponent(DEMO_SLUG)}`,{cache:'no-store'}),d=await r.json();if(!r.ok||!d.project)return null;const p=d.project;p.company={...(p.company||{}),email:''};p.delivery={...(p.delivery||{}),previewApproved:false};return p}catch(_){return null}}
async function initialize(user){activeUserId=user?.id||'guest';const demo=await loadDemo(),cloud=demo?null:await window.EasyComeAccount?.loadLatestProject?.(),local=demo?null:localDraft();project=normalize(demo||cloud||local||G.defaultProject());currentStep=demo?1:0;render()}
window.addEventListener('easycome:account-ready',e=>initialize(e.detail?.user));$('#previous').onclick=prev;$('#next').onclick=next;$('#homeLink').onclick=()=>location.href='index.html';setTimeout(()=>{if(!$('#stepList').children.length)initialize(null)},350);
})();
