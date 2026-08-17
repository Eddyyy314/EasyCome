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

const classifierRules = [
  { id:'workshop', name:/(officina|carrozzer|gommist|autoripar|meccanic|autofficina|auto service|garage)/i, types:/(car_repair|auto_parts|tire_shop|car_wash|mechanic)/i },
  { id:'booking', name:/(camping|campeggio|area camper|b&b|bed.?and.?breakfast|hotel|motel|resort|agritur|affittacamere|ostello|guest house)/i, types:/(campground|rv_park|lodging|hotel|motel|bed_and_breakfast|resort)/i },
  { id:'appointments', name:/(parruc|barbier|estetic|beauty|hair|nail|salone|spa\b|wellness)/i, types:/(beauty_salon|hair_salon|barber_shop|spa|nail_salon)/i },
  { id:'membership', name:/(palestr|fitness|crossfit|pilates|yoga|personal trainer|gym\b|sport club)/i, types:/(gym|fitness|yoga|sports_club)/i },
  { id:'health', name:/(dentist|odontoiatr|medic|fisioterap|veterin|poliambulator|clinica|studio dentistico)/i, types:/(dentist|doctor|dental|physiotherapist|medical|veterinary)/i },
  { id:'projects', name:/(electric|elettric|idraulic|impiant|edil|fabbro|serrament|pulizie|manutenz|termoidraul|climatizz|costruzion|ristruttur|service tecnico)/i, types:/(electrician|plumber|general_contractor|roofing|moving_company|locksmith|cleaning)/i },
  { id:'professional', name:/(studio professionale|avvocat|commercialist|consulenz|consulent|architett|ingegner|immobiliar|assicuraz|notai|geometra)/i, types:/(lawyer|accounting|real_estate_agency|insurance_agency|consultant)/i },
  { id:'restaurant', name:/(ristor|pizzeria|trattoria|osteria|panificio|pasticceria|caffè|cafe\b|\bbar\b|bistrot|pub\b|food)/i, types:/(restaurant|cafe|bar|bakery|meal|food)/i },
  { id:'retail', name:/(negozio|boutique|ferramenta|arredamento|abbigliamento|elettronica|store\b|shop\b|emporio)/i, types:/(store|shop|clothing|furniture|hardware|electronics|retail)/i },
];

export function classifyPlace(place = {}) {
  const name = String(place.displayName?.text || '').trim();
  const typeText = [place.primaryType, ...(place.types || []), place.primaryTypeDisplayName?.text].filter(Boolean).join(' ');
  let best = { id:'custom', score:0 };
  for (const rule of classifierRules) {
    // The business name is often more informative than Google's broad primary type.
    // Give it more weight so "Electric Service" cannot become generic consulting.
    const score = (rule.name.test(name) ? 7 : 0) + (rule.types.test(typeText) ? 4 : 0);
    if (score > best.score) best = { id:rule.id, score };
  }
  return best.id;
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
  p.version = '10.0.0-demo';
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
  return `ec-${crypto.createHash('sha256').update(String(placeId)+':easycome-demo-v10').digest('hex').slice(0,18)}`;
}

export function demoPrice(place, templateId) {
  const project = buildProject(place, templateId, '');
  const raw = Number(ECGenerator.calculatePrice(project).total || 99);
  // Tied to the actual generated modules/entities, presented as a clean commercial price.
  return Math.max(99, Math.ceil((raw + 1) / 10) * 10 - 1);
}

export function outreachSubject(place) {
  const name = place.displayName?.text || 'la vostra attività';
  return `Abbiamo preparato una demo Easy Come per ${name}`;
}

export function outreachMessage(place, demoUrl, price = 99) {
  const name = place.displayName?.text || 'la vostra attività';
  return `Buongiorno,\n\nsono Edoardo di Easy Come. Siamo una startup che sta innovando il modo in cui le piccole attività accedono a gestionali su misura: semplici, personalizzati e a costi accessibili.\n\nAbbiamo preparato gratuitamente una demo pensata per ${name}, partendo dal vostro tipo di attività e dai processi che un gestionale potrebbe semplificare.\n\nPotete provarla qui, senza registrazione e senza impegno:\n${demoUrl}\n\nLa configurazione mostrata nella demo ha un prezzo indicativo di €${price} una tantum. I nostri gestionali partono da €99 e il prezzo cambia soltanto in base alle funzioni che servono davvero.\n\nI dati presenti nell’anteprima sono dimostrativi: l’obiettivo è farvi vedere concretamente come potrebbe funzionare prima di acquistare qualsiasi cosa.\n\nSe vi piace, dal link potete personalizzarla sul vostro lavoro.\n\nUn saluto,\nEdoardo La Neve\nEasy Come\ninfoeasycome@libero.it`;
}


const TEMPLATE_POTENTIAL = {
  workshop:78, booking:76, appointments:69, membership:72, health:70,
  professional:66, restaurant:75, retail:70, projects:82, custom:62
};

export function prospectScores(place = {}, templateId = 'custom', contacts = {}) {
  const hasWebsite = Boolean(place.websiteUri || contacts.website);
  const hasEmail = Boolean(contacts.email);
  const hasPhone = Boolean(place.nationalPhoneNumber || contacts.phone);
  const hasSocial = Boolean(contacts.instagram || contacts.facebook);
  const hasWhatsapp = Boolean(contacts.whatsapp);
  const hasContactPage = Boolean(contacts.contactPage);

  let contactability = 0;
  if (hasEmail) contactability += 35;
  if (hasPhone) contactability += 24;
  if (hasWhatsapp) contactability += 20;
  if (contacts.instagram) contactability += 9;
  if (contacts.facebook) contactability += 6;
  if (hasContactPage) contactability += 4;
  if (hasWebsite) contactability += 2;
  contactability = Math.max(0, Math.min(100, contactability));

  // Separate "how easy it is to reach" from "how interesting it is".
  // A low digital footprint can be a positive sales signal for Easy Come.
  let potential = TEMPLATE_POTENTIAL[templateId] ?? 62;
  if (!hasWebsite) potential += 10;
  if (!hasEmail) potential += 6;
  if (!hasSocial) potential += 5;
  if (!hasWhatsapp) potential += 2;
  if (!hasPhone) potential += 2;
  if (hasWebsite && hasEmail && hasSocial) potential -= 5;
  potential = Math.max(35, Math.min(99, potential));

  const reasons = [];
  if (!hasWebsite && !hasSocial) reasons.push('presenza digitale minima');
  else if (!hasWebsite) reasons.push('nessun sito rilevato');
  if (!hasEmail) reasons.push('nessuna email pubblica');
  if (['workshop','projects','booking','restaurant'].includes(templateId)) reasons.push('alto fit operativo');
  if (!reasons.length) reasons.push('buon fit Easy Come');

  return { contactability, potential, reasons: reasons.slice(0,2) };
}

export function outreachShortMessage(place, demoUrl, price = 99) {
  const name = place.displayName?.text || 'la vostra attività';
  return `Buongiorno! Sono Edoardo di Easy Come. Abbiamo preparato gratuitamente una demo di un gestionale già configurato per ${name}. Potete provarla qui: ${demoUrl}\n\nLa configurazione mostrata parte da €${price} una tantum (Easy Come parte da €99) e potete modificarla prima di decidere. Se vi va, mi farebbe piacere sapere cosa ne pensate.`;
}
