import crypto from 'node:crypto';
import { ECGenerator } from './_generator-node.js';

export const ITALY_CITIES = [
  'Milano','Roma','Napoli','Torino','Bologna','Firenze','Bari','Palermo','Catania','Verona','Genova','Cagliari',
  'Rimini','Salerno','Lecce','Cosenza','Padova','Venezia','Brescia','Bergamo','Parma','Modena','Reggio Emilia',
  'Perugia','Ancona','Pescara','Taranto','Foggia','Messina','Siracusa','Sassari','Trento','Bolzano','Trieste',
  'Udine','Vicenza','Treviso','Piacenza','Ravenna','Forlì','Cesena','Pisa','Lucca','Livorno','Arezzo','Siena',
  'Prato','Terni','Latina','Caserta','Avellino','Benevento','Potenza','Matera','Catanzaro','Reggio Calabria',
  'Como','Monza','Varese','Novara','Alessandria','Asti','La Spezia','Pavia','Cremona','Mantova','Ferrara','Pesaro',
  'Viterbo','Frosinone','Chieti','Campobasso','Brindisi','Barletta','Andria','Trani','Crotone','Vibo Valentia','Trapani','Ragusa'
];

export const SEARCH_KEYWORDS = [
  'officina auto','carrozzeria','gommista','campeggio','area camper','hotel indipendente','bed and breakfast','agriturismo',
  'parrucchiere','barbiere','centro estetico','palestra','centro fitness','studio dentistico','studio medico','fisioterapia',
  'commercialista','avvocato','studio professionale','agenzia immobiliare','consulenza aziendale','ristorante','pizzeria','bar',
  'negozio abbigliamento','ferramenta','arredamento','negozio elettronica','idraulico','elettricista','impianti','impresa edile',
  'impresa di pulizie','fabbro','serramenti','noleggio','scuola privata','centro formazione','veterinario','agenzia viaggi',
  'tipografia','azienda agricola','cantina vinicola','panificio','pasticceria','centro assistenza','servizi alle imprese'
];

const TEMPLATE_DEFS = {
  workshop: {
    label:'Officina & assistenza', icon:'⌁', color:'#ef6c2f', accent:'#171815',
    modules:['crm','tasks','quotes','orders','inventory','payments','assets','automations','multiuser','reports','easycome_hub'],
    pricingMode:'manual_quote',
    customEntities:[{key:'vehicles',label:'Veicoli',singular:'Veicolo',fields:[{key:'plate',label:'Targa',type:'text',required:true},{key:'customer',label:'Cliente',type:'text',required:true},{key:'brand',label:'Marca e modello',type:'text'},{key:'mileage',label:'Chilometraggio',type:'number'},{key:'status',label:'Stato intervento',type:'select',options:['Accettazione','In lavorazione','Pronto','Consegnato']},{key:'notes',label:'Note',type:'longtext'}]}],
    nav:['Dashboard','Interventi','Clienti','Preventivi','Agenda','Veicoli'],
    kpis:['Interventi oggi','Preventivi aperti','Veicoli pronti','Ricavi mese'], base:[11,5,3,8420],
    rows:[['Mario Rossi','Fiat 500','Tagliando','In corso'],['Luca Bianchi','Audi A3','Freni','Da approvare'],['Sara Conti','Jeep Renegade','Diagnosi','Pronto']],
    activity:['Preventivo creato','Cliente aggiornato automaticamente','Intervento completato']
  },
  booking: {
    label:'Hospitality & prenotazioni', icon:'▦', color:'#416a54', accent:'#13271d',
    modules:['crm','tasks','bookings','quotes','payments','dynamic_pricing','automations','multiuser','reports','easycome_hub'], pricingMode:'dynamic',
    nav:['Dashboard','Prenotazioni','Ospiti','Disponibilità','Pagamenti','Report'],
    kpis:['Arrivi oggi','Check-out','Disponibilità','Incassi mese'], base:[8,5,11,12780],
    rows:[['Fam. Romano','Prenotazione #184','15–18 Ago','Confermata'],['Marco De Luca','Prenotazione #185','15–20 Ago','Confermata'],['Giulia Serra','Prenotazione #186','16–19 Ago','In attesa']],
    activity:['Nuova prenotazione ricevuta','Risorsa assegnata automaticamente','Pagamento registrato']
  },
  appointments: {
    label:'Beauty & appuntamenti', icon:'◷', color:'#9b5f7b', accent:'#2c2028',
    modules:['crm','tasks','appointments','payments','quotes','automations','multiuser','reports','easycome_hub'], pricingMode:'manual_quote',
    nav:['Dashboard','Appuntamenti','Clienti','Servizi','Cassa','Promemoria'],
    kpis:['Appuntamenti oggi','Nuovi clienti','Slot liberi','Incassi mese'], base:[17,6,4,6930],
    rows:[['Alessia Riva','Servizio premium','14:30','Confermato'],['Chiara Neri','Trattamento','15:10','Confermato'],['Marta Lodi','Consulenza','16:00','In attesa']],
    activity:['Promemoria inviato','Nuovo cliente registrato','Pagamento completato']
  },
  membership: {
    label:'Fitness & membership', icon:'◎', color:'#315fce', accent:'#101b38',
    modules:['crm','tasks','appointments','payments','documents','reports','automations','multiuser','easycome_hub'], pricingMode:'subscription',
    customEntities:[{key:'memberships',label:'Abbonamenti',singular:'Abbonamento',fields:[{key:'customer',label:'Iscritto',type:'text',required:true},{key:'plan',label:'Piano',type:'text',required:true},{key:'start_date',label:'Inizio',type:'date'},{key:'end_date',label:'Scadenza',type:'date'},{key:'status',label:'Stato',type:'select',options:['Attivo','In scadenza','Scaduto']}]}],
    nav:['Dashboard','Iscritti','Corsi','Check-in','Abbonamenti','Pagamenti'],
    kpis:['Check-in oggi','Corsi attivi','Rinnovi vicini','Ricavi mese'], base:[84,9,13,14250],
    rows:[['Andrea Pace','Sala pesi','Mensile','Attivo'],['Elena Greco','Pilates','Trimestrale','Attivo'],['Fabio Rizzi','Training','Mensile','In rinnovo']],
    activity:['Abbonamento rinnovato','Nuovo check-in','Reminder scadenza inviato']
  },
  health: {
    label:'Studio sanitario', icon:'✚', color:'#317b79', accent:'#173535',
    modules:['crm','tasks','appointments','quotes','payments','documents','multiuser','reports','easycome_hub'], pricingMode:'manual_quote',
    customEntities:[{key:'patients',label:'Pazienti',singular:'Paziente',fields:[{key:'name',label:'Nome e cognome',type:'text',required:true},{key:'phone',label:'Telefono',type:'phone'},{key:'birth_date',label:'Data di nascita',type:'date'},{key:'treatment',label:'Trattamento',type:'text'},{key:'next_visit',label:'Prossimo controllo',type:'date'},{key:'notes',label:'Note riservate',type:'longtext'}]}],
    nav:['Dashboard','Pazienti','Appuntamenti','Trattamenti','Documenti','Pagamenti'],
    kpis:['Visite oggi','Pazienti attivi','Controlli settimana','Incassi mese'], base:[14,312,23,16400],
    rows:[['Paziente demo 01','Controllo','10:00','Confermato'],['Paziente demo 02','Trattamento','11:15','In corso'],['Paziente demo 03','Prima visita','15:30','Confermato']],
    activity:['Promemoria visita inviato','Documento aggiornato','Pagamento registrato']
  },
  professional: {
    label:'Studio & consulenza', icon:'§', color:'#6756c8', accent:'#211c3b',
    modules:['crm','tasks','projects','quotes','invoices','payments','documents','automations','multiuser','reports','easycome_hub'], pricingMode:'manual_quote',
    customEntities:[{key:'cases',label:'Pratiche',singular:'Pratica',fields:[{key:'title',label:'Oggetto',type:'text',required:true},{key:'customer',label:'Cliente',type:'text',required:true},{key:'status',label:'Stato',type:'select',options:['Nuova','In lavorazione','In attesa','Chiusa']},{key:'deadline',label:'Scadenza',type:'date'},{key:'notes',label:'Note',type:'longtext'}]}],
    nav:['Dashboard','Clienti','Pratiche','Scadenze','Documenti','Fatture'],
    kpis:['Pratiche aperte','Scadenze settimana','Nuovi clienti','Fatturato mese'], base:[23,7,4,18600],
    rows:[['Rossi Srl','Contratto','22 Ago','In lavorazione'],['Bianchi SNC','Consulenza','25 Ago','Da approvare'],['Luca Ferri','Pratica','28 Ago','Completa']],
    activity:['Documento caricato','Scadenza aggiornata','Fattura preparata']
  },
  restaurant: {
    label:'Ristorazione', icon:'♨', color:'#bb4b36', accent:'#321814',
    modules:['crm','tasks','bookings','orders','inventory','expenses','staff','reports','automations','easycome_hub'], pricingMode:'fixed',
    nav:['Dashboard','Prenotazioni','Tavoli','Ordini','Magazzino','Turni'],
    kpis:['Coperti oggi','Prenotazioni','Tavoli liberi','Incassi mese'], base:[92,31,7,22400],
    rows:[['Tavolo 12','4 coperti','20:30','Confermato'],['Tavolo 7','2 coperti','21:00','Confermato'],['Tavolo 4','6 coperti','21:15','In attesa']],
    activity:['Prenotazione confermata','Scorta sotto soglia rilevata','Turno staff aggiornato']
  },
  retail: {
    label:'Negozio & vendite', icon:'◇', color:'#d06a24', accent:'#332017',
    modules:['crm','tasks','orders','inventory','invoices','payments','expenses','reports','automations','multiuser','easycome_hub'], pricingMode:'fixed',
    nav:['Dashboard','Vendite','Clienti','Prodotti','Magazzino','Ordini'],
    kpis:['Vendite oggi','Ordini aperti','Prodotti da riordinare','Ricavi mese'], base:[31,8,5,16870],
    rows:[['Ordine #1042','Cliente web','€ 89','Pagato'],['Ordine #1041','Negozio','€ 142','Pagato'],['Ordine #1040','Cliente web','€ 64','In attesa']],
    activity:['Stock aggiornato','Nuovo ordine ricevuto','Cliente fidelizzato']
  },
  projects: {
    label:'Servizi, impianti & cantieri', icon:'△', color:'#47745a', accent:'#182b20',
    modules:['crm','tasks','projects','quotes','expenses','staff','documents','assets','reports','automations','multiuser','easycome_hub'], pricingMode:'manual_quote',
    customEntities:[{key:'interventions',label:'Interventi',singular:'Intervento',fields:[{key:'title',label:'Titolo',type:'text',required:true},{key:'customer',label:'Cliente',type:'text',required:true},{key:'date',label:'Data e ora',type:'datetime'},{key:'technician',label:'Tecnico',type:'text'},{key:'status',label:'Stato',type:'select',options:['Da assegnare','Assegnato','In corso','Chiuso']},{key:'cost',label:'Costo',type:'currency'}]}],
    nav:['Dashboard','Interventi','Clienti','Tecnici','Preventivi','Agenda'],
    kpis:['Interventi oggi','Tecnici attivi','Preventivi aperti','Fatturato mese'], base:[9,5,6,10340],
    rows:[['Condominio Aurora','Impianto','10:30','In corso'],['Fam. Rizzo','Intervento urgente','12:00','Assegnato'],['Bar Centrale','Manutenzione','15:00','Da confermare']],
    activity:['Tecnico assegnato','Preventivo accettato','Intervento chiuso']
  },
  custom: {
    label:'Sistema aziendale', icon:'◆', color:'#275dff', accent:'#17213b',
    modules:['crm','tasks','quotes','payments','reports','automations','multiuser','easycome_hub'], pricingMode:'manual_quote',
    nav:['Dashboard','Clienti','Attività','Agenda','Preventivi','Report'],
    kpis:['Attività oggi','Clienti attivi','Da completare','Fatturato mese'], base:[14,128,7,9760],
    rows:[['Cliente demo 01','Richiesta','Oggi','In corso'],['Cliente demo 02','Preventivo','Domani','Da approvare'],['Cliente demo 03','Servizio','18 Ago','Completo']],
    activity:['Nuovo cliente registrato','Attività assegnata','Pagamento registrato']
  }
};

const rules = [
  ['workshop', /(car_repair|auto_parts|tire_shop|car_wash|mechanic|officina|carrozzer|gommist|autoripar)/i],
  ['booking', /(campground|rv_park|lodging|hotel|motel|bed_and_breakfast|resort|camping|camper|agritur|affittacamere|ostello)/i],
  ['appointments', /(beauty_salon|hair_salon|barber_shop|spa|nail_salon|parruc|barber|estetic|salone|beauty|hair)/i],
  ['membership', /(gym|fitness|yoga|sports_club|pilates|palestr|crossfit|personal trainer)/i],
  ['health', /(dentist|doctor|dental|physiotherapist|medical|veterinary|veterin|dentist|medic|fisioterap)/i],
  ['professional', /(lawyer|accounting|real_estate_agency|insurance_agency|consult|avvocat|commercialist|architett|ingegner|immobiliar|studio professionale)/i],
  ['restaurant', /(restaurant|cafe|bar|bakery|meal|food|pizzeria|ristor|trattoria|osteria|panificio|pasticceria)/i],
  ['projects', /(electrician|plumber|general_contractor|roofing|moving_company|locksmith|cleaning|idraulic|elettric|impiant|edil|fabbro|serrament|pulizie|manutenz)/i],
  ['retail', /(store|shop|clothing|furniture|hardware|electronics|retail|negozio|boutique|ferramenta|arredamento)/i],
];

export function classifyPlace(place = {}) {
  const haystack = [place.primaryType, ...(place.types || []), place.primaryTypeDisplayName?.text, place.displayName?.text].filter(Boolean).join(' ');
  for (const [id, regex] of rules) if (regex.test(haystack)) return id;
  return 'custom';
}

export function templateFor(id) { return TEMPLATE_DEFS[id] || TEMPLATE_DEFS.custom; }

export function hashSeed(value='') {
  return crypto.createHash('sha256').update(String(value)).digest().readUInt32BE(0);
}

function varied(base, seed, index, minDelta=0.08, maxDelta=0.24) {
  const x = ((seed >>> ((index % 4) * 8)) & 255) / 255;
  const sign = index % 2 ? -1 : 1;
  const factor = 1 + sign * (minDelta + x * (maxDelta - minDelta));
  return Math.max(1, Math.round(base * factor));
}

export function buildDemoModel(templateId, placeId) {
  const t = templateFor(templateId); const seed = hashSeed(placeId || templateId);
  const values = t.base.map((v,i)=> i===3 ? `€ ${varied(v,seed,i).toLocaleString('it-IT')}` : String(varied(v,seed,i)));
  return {templateId,label:t.label,icon:t.icon,color:t.color,accent:t.accent,nav:t.nav,kpis:t.kpis,values,rows:t.rows,activity:t.activity};
}

export function buildProject(place, templateId, ownerEmail='') {
  const t = templateFor(templateId); const p = ECGenerator.defaultProject();
  p.version = '9.0.0-demo';
  p.company.name = place.displayName?.text || 'La tua attività';
  p.company.industry = place.primaryTypeDisplayName?.text || t.label;
  p.company.description = `Sistema Easy Come configurato in anteprima per una realtà ${t.label.toLowerCase()}. I dati presenti nella demo sono fittizi.`;
  p.company.email = ownerEmail || '';
  p.company.phone = '';
  p.company.primaryColor = t.color; p.company.accentColor=t.accent; p.company.surfaceColor='#f7f8fb'; p.company.style='studio'; p.company.layout='studio';
  p.modules = [...new Set(t.modules || ['crm','tasks','easycome_hub'])];
  p.customEntities = structuredClone(t.customEntities || []);
  p.pricing.mode = t.pricingMode || 'manual_quote'; p.pricing.enabled = p.pricing.mode !== 'none';
  p.delivery.packagePrice = 99; p.delivery.implementationSelected=false; p.delivery.managedServiceSelected=false; p.delivery.previewApproved=true;
  p.templateId = templateId;
  p.demoSource = { type:'google_places', placeId:place.id || '', generatedForDemo:true };
  return p;
}

export function buildQueryPlan(seedValue='0', max=220) {
  const seed = hashSeed(seedValue); const pairs=[];
  const cityOffset = seed % ITALY_CITIES.length; const keywordOffset = (seed >>> 8) % SEARCH_KEYWORDS.length;
  const cityStep = 17; const keywordStep = 11;
  for (let i=0;i<max;i++) {
    const city = ITALY_CITIES[(cityOffset + i * cityStep) % ITALY_CITIES.length];
    const keyword = SEARCH_KEYWORDS[(keywordOffset + i * keywordStep + Math.floor(i / ITALY_CITIES.length)) % SEARCH_KEYWORDS.length];
    pairs.push(`${keyword} ${city} Italia`);
  }
  return [...new Set(pairs)];
}

export function demoSlug(placeId) {
  return `ec-${crypto.createHash('sha256').update(String(placeId)+':easycome-demo-v9').digest('hex').slice(0,18)}`;
}

export function outreachMessage(place, demoUrl) {
  const name = place.displayName?.text || 'la vostra attività';
  return `Buongiorno,\n\nabbiamo preparato gratuitamente un’anteprima di come potrebbe essere un gestionale Easy Come configurato per ${name}.\n\nPotete provarla qui, senza registrazione e senza impegno:\n${demoUrl}\n\nI dati all’interno sono dimostrativi: serve solo per farvi vedere concretamente come potrebbe funzionare.\n\nSe vi piace, potete poi personalizzarlo sui vostri processi reali.\n\nUn saluto,\nEasy Come`;
}
