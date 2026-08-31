import crypto from 'node:crypto';
import { ECGenerator } from './_generator-node.js';

export const ITALY_CITIES = [
  'Roma','Firenze','Venezia','Milano','Napoli','Bologna','Verona','Torino','Genova','Palermo','Catania','Bari','Lecce','Salerno','Sorrento','Amalfi','Matera','Perugia','Siena','Lucca','Pisa','Rimini','Ravenna','Trieste','Cagliari','Alghero','Olbia','Taormina','Siracusa','Cefalù','Como','Bergamo','Trento','Bolzano','Merano','La Spezia','Monterosso al Mare','Sanremo','Orvieto','Assisi'
];

export const SEARCH_KEYWORDS = [
  'bed and breakfast','b&b','affittacamere','guest house','casa vacanze','holiday apartments','appartamenti vacanze','residence turistico','boutique hotel','dimora storica','locazione turistica','agriturismo con camere'
];

const HOSPITALITY_TEMPLATE = {
  label:'Easy Come Hospitality', icon:'⌂', color:'#416a54', accent:'#171815',
  nav:['Oggi','Calendario','Prenotazioni','Operazioni','Numeri'],
  kpis:['Arrivi oggi','Partenze','Occupazione','Da incassare'], base:[3,2,74,860],
  rows:[['Giulia Romano','Camera Deluxe','Oggi','Diretta'],['Marco De Luca','Matrimoniale 2','Oggi','Booking.com'],['Anna Klein','Family 1','Domani','Airbnb']],
  activity:['Prenotazione diretta ricevuta','Check-in pronto','Camera segnata da pulire']
};

export function classifyPlace(place={}) {
  const text=[place.displayName?.text,place.primaryType,place.primaryTypeDisplayName?.text,...(place.types||[])].filter(Boolean).join(' ');
  return /(bed.?and.?breakfast|\bb&b\b|affittacamere|guest.?house|casa.?vacanz|holiday|apartment|residence|lodging|hotel|agritur|dimora|locazione)/i.test(text)?'hospitality':'hospitality';
}
export function templateFor(){ return HOSPITALITY_TEMPLATE; }
export function hashSeed(value=''){return crypto.createHash('sha256').update(String(value)).digest().readUInt32BE(0)}
function varied(base,seed,index){const x=((seed>>>((index%4)*8))&255)/255;return Math.max(1,Math.round(base*(.88+x*.25)))}
export function buildDemoModel(_templateId,placeId){const t=HOSPITALITY_TEMPLATE,seed=hashSeed(placeId||'hospitality');return{templateId:'hospitality',label:t.label,icon:t.icon,color:t.color,accent:t.accent,nav:t.nav,kpis:t.kpis,values:t.base.map((v,i)=>i===2?varied(v,seed,i)+'%':i===3?'€ '+varied(v,seed,i).toLocaleString('it-IT'):String(varied(v,seed,i))),rows:t.rows,activity:t.activity}}

function inferredUnits(place){const seed=hashSeed(place.id||place.displayName?.text||'hospitality');return 3+(seed%6)}
export function buildProject(place,_templateId='hospitality',ownerEmail=''){
  const p=ECGenerator.defaultProject(), units=inferredUnits(place), name=place.displayName?.text||'La tua struttura', city=String(place.formattedAddress||'').split(',').slice(-2,-1)[0]?.trim()||'';
  p.version='2.0.0-hospitality-demo';p.templateId='hospitality';
  p.company.name=name;p.company.industry='B&B · Affittacamere · Case vacanza';p.company.description=`Gestionale Easy Come Hospitality per ${name}: Oggi, calendario, prenotazioni, operazioni e numeri in un'unica applicazione. I dati della demo sono fittizi.`;p.company.email=ownerEmail||'';p.company.primaryColor='#416a54';p.company.accentColor='#171815';p.company.surfaceColor='#f3efe7';p.company.style='studio';p.company.layout='studio';
  p.modules=['hospitality_core','dynamic_pricing','reports','audit','finance','easycome_hub','automations','channel_sync'];
  p.hospitality={...(p.hospitality||{}),type:'B&B / Affittacamere',city,address:place.formattedAddress||'',unitCount:units,maxGuests:units*2,checkinFrom:'15:00',checkoutBy:'10:30',paymentsEnabled:true,depositMode:'percentage',cancellationPolicy:'Flessibile',channels:['booking','airbnb','direct'],teamSize:'small',unitTypes:[{name:'Camera Matrimoniale',count:Math.max(1,units-2),capacity:2,basePrice:95},{name:'Camera Deluxe',count:1,capacity:2,basePrice:125},{name:'Family',count:1,capacity:4,basePrice:155}]};
  p.pricing.mode='dynamic';p.pricing.enabled=true;p.pricing.basePrice=95;p.pricing.depositPercent=30;
  p.delivery.packagePrice=99;p.delivery.implementationSelected=true;p.delivery.managedServiceSelected=false;p.delivery.previewApproved=true;
  p.demoSource={type:'google_places',placeId:place.id||'',generatedForDemo:true};return p;
}
export function buildQueryPlan(seedValue='0',max=220){const seed=hashSeed(seedValue),pairs=[],cityOffset=seed%ITALY_CITIES.length,keyOffset=(seed>>>8)%SEARCH_KEYWORDS.length;for(let i=0;i<max;i++){const city=ITALY_CITIES[(cityOffset+i*7)%ITALY_CITIES.length],keyword=SEARCH_KEYWORDS[(keyOffset+i*5+Math.floor(i/ITALY_CITIES.length))%SEARCH_KEYWORDS.length];pairs.push(`${keyword} ${city} Italia`)}return [...new Set(pairs)]}
export function demoSlug(placeId){return `ec-h-${crypto.createHash('sha256').update(String(placeId)+':hospitality-v1').digest('hex').slice(0,18)}`}
export function demoPrice(place){const raw=Number(ECGenerator.calculatePrice(buildProject(place)).total||249);return Math.max(249,Math.ceil((raw+1)/10)*10-1)}
export function outreachSubject(place){return `Abbiamo preparato una demo gestionale per ${place.displayName?.text||'la vostra struttura'}`}
export function outreachMessage(place,demoUrl,price=249){const name=place.displayName?.text||'la vostra struttura';return `Buongiorno,\n\nsono Edoardo di Easy Come Hospitality. Abbiamo preparato gratuitamente una demo per ${name}: un gestionale pensato per B&B e strutture indipendenti: oggi, calendario, prenotazioni, operazioni e numeri in un'unica interfaccia semplice.\n\nLa demo usa dati fittizi e serve solo a mostrarvi come potrebbe funzionare:\n${demoUrl}\n\nLa configurazione mostrata ha un prezzo indicativo di €${price} una tantum, inclusa l'implementazione prevista nel progetto. Nessun acquisto è richiesto per vedere la demo.\n\nSe l'idea vi interessa, dal link potete partire dalla configurazione e adattarla alla vostra struttura.\n\nUn saluto,\nEdoardo\nEasy Come Hospitality`;}
