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
  nav:['Oggi','Calendario','Prenotazioni','Ospiti','Camere','Pulizie','Pagamenti','Messaggi','Adempimenti','Canali','Report'],
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
function inferredType(place={}){const text=[place.displayName?.text,place.primaryType,place.primaryTypeDisplayName?.text,...(place.types||[])].filter(Boolean).join(' ');if(/casa.?vacanz|holiday.?home|apartment|appartament|locazione/i.test(text))return 'Casa vacanza';if(/affittacamere|guest.?house/i.test(text))return 'Affittacamere';return 'B&B'}
function inferredCity(place={}){const address=String(place.formattedAddress||'');const parts=address.split(',').map(x=>x.trim()).filter(Boolean);return parts.length>1?parts[parts.length-2].replace(/^\d{5}\s*/,''):''}
export function buildProject(place,_templateId='hospitality',ownerEmail=''){
  const p=ECGenerator.defaultProject(), units=inferredUnits(place), name=place.displayName?.text||'La tua struttura', city=inferredCity(place);
  p.version='9.0.0-hospitality-factory';p.templateId='hospitality';
  p.company.name=name;p.company.industry='B&B · Affittacamere · Case vacanza';p.company.description=`Demo Easy Come Hospitality preparata per ${name}. Il gestionale mostra Oggi, Calendario, Prenotazioni, Ospiti, Camere, Pulizie, Pagamenti, Messaggi, Adempimenti, Canali e Report. I dati operativi della demo sono fittizi.`;p.company.email=ownerEmail||'';p.company.primaryColor='#416a54';p.company.accentColor='#171815';p.company.surfaceColor='#f3efe7';p.company.style='studio';p.company.layout='studio';
  p.modules=['hospitality_core','reports','guest_comms','tourist_tax','audit','easycome_hub'];
  const type=inferredType(place),unitLabel=type==='Casa vacanza'?'Appartamento':'Camera';
  p.hospitality={...(p.hospitality||{}),type,city,address:place.formattedAddress||'',unitCount:units,maxGuests:units*2,checkinFrom:'15:00',checkoutBy:'10:30',paymentsEnabled:true,depositMode:'percentage',cancellationPolicy:'Flessibile',channels:['booking','airbnb','direct'],bookingVolume:units>=7?'high':'medium',teamSize:units>=6?'small':'solo',checkinMode:'in_person',cleaningMode:'internal',currentTool:'manual',unitTypes:[{name:unitLabel,count:units,capacity:2,basePrice:110}]};
  p.pricing.mode='none';p.pricing.enabled=false;p.pricing.basePrice=95;p.pricing.depositPercent=30;
  p.delivery.packagePrice=199;p.delivery.implementationSelected=true;p.delivery.implementationPrice=150;p.delivery.managedServiceSelected=false;p.delivery.managedServicePrice=0;p.delivery.previewApproved=true;
  p.demoSource={type:'google_places',placeId:place.id||'',generatedForDemo:true,publicDataPrefill:true,estimatedUnitCount:true};return p;
}
export function buildQueryPlan(seedValue='0',max=220){const seed=hashSeed(seedValue),pairs=[],cityOffset=seed%ITALY_CITIES.length,keyOffset=(seed>>>8)%SEARCH_KEYWORDS.length;for(let i=0;i<max;i++){const city=ITALY_CITIES[(cityOffset+i*7)%ITALY_CITIES.length],keyword=SEARCH_KEYWORDS[(keyOffset+i*5+Math.floor(i/ITALY_CITIES.length))%SEARCH_KEYWORDS.length];pairs.push(`${keyword} ${city} Italia`)}return [...new Set(pairs)]}
export function demoSlug(placeId){return `ec-h-${crypto.createHash('sha256').update(String(placeId)+':hospitality-v1').digest('hex').slice(0,18)}`}
export function demoPrice(place){return Number(ECGenerator.calculatePrice(buildProject(place)).total||349)}
export function outreachSubject(place){return `Abbiamo preparato Easy Come per ${place.displayName?.text||'la vostra struttura'}`}
export function outreachMessage(place,demoUrl,price=349){const name=place.displayName?.text||'la vostra struttura';return `Buongiorno,\n\nsono Edoardo di Easy Come Hospitality. Abbiamo preparato una demo del gestionale già impostata per ${name}.\n\nNon è una presentazione generica: potete provare direttamente Oggi, Calendario, Prenotazioni, Ospiti, Camere, Pulizie, Pagamenti, Messaggi, Adempimenti, Canali e Report con dati dimostrativi coerenti con una struttura come la vostra.\n\n${demoUrl}\n\nEasy Come Hospitality standard costa €${price} una tantum, implementazione inclusa. Dalla demo potete aprire la configurazione già precompilata e modificare soltanto ciò che serve davvero alla vostra struttura.\n\nNessun acquisto è richiesto per provare la demo.\n\nUn saluto,\nEdoardo\nEasy Come Hospitality`;}
