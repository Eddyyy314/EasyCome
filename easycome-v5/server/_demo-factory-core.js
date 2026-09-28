import crypto from 'node:crypto';

export const ITALY_CITIES = [
  'Milano','Roma','Napoli','Torino','Bologna','Firenze','Bari','Palermo','Catania','Verona','Genova','Cagliari','Rimini','Salerno','Lecce','Cosenza','Padova','Venezia','Brescia','Bergamo','Parma','Modena','Reggio Emilia','Perugia','Ancona','Pescara','Taranto','Messina','Siracusa','Sassari','Trento','Bolzano','Trieste','Udine','Vicenza','Treviso','Pisa','Lucca','Livorno','Arezzo','Siena','Como','Monza','Varese','Caserta','Reggio Calabria'
];

export const SEARCH_KEYWORDS = [
  'pizzeria','ristorante','cocktail bar','pub','gelateria','pasticceria','caffetteria','hamburgeria','sushi restaurant',
  'parrucchiere','barbiere','centro estetico','beauty salon','nail salon','palestra','crossfit','pilates','yoga',
  'hotel indipendente','bed and breakfast','agriturismo','agenzia viaggi','boutique','negozio abbigliamento','concept store','discoteca','locale serale'
];

const EFFECT_TEMPLATES = {
  pizza: {
    label:'Pizza Randomizer', icon:'🍕', color:'#d9472f', accent:'#1d1713', price:149,
    headline:'WHAT SHOULD YOU ORDER?', subline:'PIZZA EDITION', mechanic:'Randomizer',
    description:'Un filtro brandizzato che sceglie la pizza della serata e trasforma il menu in contenuto condivisibile.',
    results:['MARGHERITA','DIAVOLA','BUFALINA','CAPRICCIOSA','MARINARA','SPECIAL DELLA CASA'],
    tags:['TikTok','Randomizer','Food'], cta:'Scopri la tua pizza', vibe:'Italian premium'
  },
  restaurant: {
    label:'Menu Picker', icon:'🍽️', color:'#b94f36', accent:'#211713', price:149,
    headline:'WHAT SHOULD YOU ORDER?', subline:'TONIGHT’S PICK', mechanic:'Randomizer',
    description:'Un menu interattivo che suggerisce un piatto diverso a ogni tap, già pronto per essere brandizzato.',
    results:['SIGNATURE DISH','CHEF’S PICK','BEST SELLER','NEW ENTRY','COMFORT FOOD','SURPRISE ME'],
    tags:['TikTok','Menu','UGC'], cta:'Trova il tuo piatto', vibe:'Warm editorial'
  },
  cocktail: {
    label:'Cocktail Match', icon:'🍸', color:'#9b4dff', accent:'#120d1c', price:169,
    headline:'WHICH DRINK ARE YOU?', subline:'TONIGHT EDITION', mechanic:'Randomizer',
    description:'Un filtro nightlife con drink roulette, glow e risultato finale pensato per Stories e TikTok.',
    results:['SPRITZ','NEGRONI','MOJITO','ESPRESSO MARTINI','GIN TONIC','MOSCOW MULE'],
    tags:['TikTok','Nightlife','Randomizer'], cta:'Scopri il tuo drink', vibe:'Neon nightlife'
  },
  dessert: {
    label:'Sweet Picker', icon:'🍦', color:'#ef7aa8', accent:'#2b1721', price:149,
    headline:'WHAT’S YOUR FLAVOR?', subline:'SWEET EDITION', mechanic:'Randomizer',
    description:'Un filtro colorato che abbina ogni persona a un gusto o prodotto del locale.',
    results:['PISTACCHIO','STRACCIATELLA','CIOCCOLATO','FRAGOLA','NOCCIOLA','SPECIAL'],
    tags:['TikTok','Food','Playful'], cta:'Trova il tuo gusto', vibe:'Playful premium'
  },
  beauty: {
    label:'Beauty Match', icon:'✨', color:'#d16a9c', accent:'#24131d', price:199,
    headline:'WHICH LOOK FITS YOU?', subline:'BEAUTY EDITION', mechanic:'Style picker',
    description:'Un effetto pensato per saloni e beauty brand: look picker, trattamento consigliato o style roulette.',
    results:['SOFT GLOW','BOLD LOOK','CLEAN GIRL','GLAM NIGHT','FRESH CUT','SIGNATURE STYLE'],
    tags:['TikTok','Beauty','Style'], cta:'Trova il tuo look', vibe:'Soft luxury'
  },
  fitness: {
    label:'Fitness Challenge', icon:'⚡', color:'#315fce', accent:'#10182d', price:199,
    headline:'YOUR NEXT CHALLENGE', subline:'FITNESS EDITION', mechanic:'Challenge',
    description:'Un filtro challenge brandizzato per palestre: workout, rep challenge o training picker.',
    results:['50 SQUATS','20 PUSH UPS','1 MIN PLANK','BURPEE MODE','LEG DAY','SURPRISE WOD'],
    tags:['TikTok','Challenge','Fitness'], cta:'Accetta la challenge', vibe:'Sport tech'
  },
  travel: {
    label:'Destination Picker', icon:'✈️', color:'#2d83c6', accent:'#102331', price:179,
    headline:'WHERE SHOULD YOU GO NEXT?', subline:'TRAVEL EDITION', mechanic:'Destination picker',
    description:'Una destination roulette per hotel, B&B e agenzie: perfetta per contenuti aspirazionali e condivisioni.',
    results:['CITY BREAK','SEA ESCAPE','MOUNTAIN WEEKEND','ROMANTIC TRIP','FOOD TRIP','SURPRISE DESTINATION'],
    tags:['TikTok','Travel','Randomizer'], cta:'Scopri la destinazione', vibe:'Clean travel'
  },
  retail: {
    label:'Style/Product Picker', icon:'◇', color:'#d26f2d', accent:'#24170f', price:169,
    headline:'WHICH ONE IS YOURS?', subline:'STYLE EDITION', mechanic:'Product picker',
    description:'Un product picker interattivo per boutique e retail, personalizzabile con prodotti reali e collezioni.',
    results:['BEST SELLER','NEW DROP','ICON PIECE','DAILY PICK','BOLD CHOICE','STAFF FAVORITE'],
    tags:['TikTok','Retail','Product'], cta:'Scopri il tuo match', vibe:'Editorial fashion'
  },
  nightlife: {
    label:'Party Mood', icon:'◉', color:'#ff4f9a', accent:'#120914', price:199,
    headline:'WHAT’S YOUR MOOD TONIGHT?', subline:'PARTY EDITION', mechanic:'Mood picker',
    description:'Un filtro per club ed eventi con mood roulette, glow e risultato condivisibile.',
    results:['MAIN CHARACTER','DANCE FLOOR','VIP MODE','CHAOS MODE','CHILL MODE','AFTER PARTY'],
    tags:['TikTok','Nightlife','Event'], cta:'Scopri il mood', vibe:'Dark neon'
  },
  generic: {
    label:'Brand Randomizer', icon:'✦', color:'#275dff', accent:'#10152a', price:149,
    headline:'FIND YOUR MATCH', subline:'BRAND EDITION', mechanic:'Randomizer',
    description:'Un concept social personalizzato sul brand, costruito per generare interazione e UGC.',
    results:['YOUR MATCH','BEST PICK','TRY THIS','TOP CHOICE','NEW FAVORITE','SURPRISE'],
    tags:['TikTok','Interactive','Brand'], cta:'Prova il filtro', vibe:'Modern social'
  }
};

const classifierRules = [
  {id:'pizza',name:/(pizzer|pizza|forno napoletano)/i,types:/(pizza_restaurant)/i},
  {id:'cocktail',name:/(cocktail|mixology|lounge|aperitiv|wine bar|enoteca|pub\b|\bbar\b)/i,types:/(bar|night_club)/i},
  {id:'dessert',name:/(gelat|pasticcer|dessert|bakery|cioccolat|yogurt)/i,types:/(ice_cream_shop|bakery|dessert_shop)/i},
  {id:'beauty',name:/(parruc|barbier|beauty|estetic|nail|hair|salone|spa\b)/i,types:/(beauty_salon|hair_salon|barber_shop|spa|nail_salon)/i},
  {id:'fitness',name:/(palestr|fitness|crossfit|pilates|yoga|gym\b|personal trainer)/i,types:/(gym|fitness|sports_club)/i},
  {id:'travel',name:/(hotel|b&b|bed.?and.?breakfast|resort|agritur|hostel|agenzia viaggi|travel)/i,types:/(hotel|lodging|travel_agency|bed_and_breakfast|resort)/i},
  {id:'nightlife',name:/(discotec|night club|club\b|party|event)/i,types:/(night_club)/i},
  {id:'retail',name:/(boutique|abbigliamento|fashion|concept store|negozio|shop\b|store\b)/i,types:/(clothing_store|store|shoe_store|jewelry_store)/i},
  {id:'restaurant',name:/(ristor|trattoria|osteria|bistrot|hamburger|burger|sushi|food)/i,types:/(restaurant|meal_takeaway|food)/i}
];

export function classifyPlace(place={}){
  const name=String(place.displayName?.text||'');
  const typeText=[place.primaryType,...(place.types||[]),place.primaryTypeDisplayName?.text].filter(Boolean).join(' ');
  let best={id:'generic',score:0};
  for(const rule of classifierRules){const score=(rule.name.test(name)?8:0)+(rule.types.test(typeText)?5:0);if(score>best.score)best={id:rule.id,score}}
  return best.id;
}
export function templateFor(id){return EFFECT_TEMPLATES[id]||EFFECT_TEMPLATES.generic}
export function hashSeed(value=''){return crypto.createHash('sha256').update(String(value)).digest().readUInt32BE(0)}
export function buildDemoModel(templateId,placeId){
  const t=templateFor(templateId);const seed=hashSeed(placeId||templateId);const rotate=seed%t.results.length;
  const results=[...t.results.slice(rotate),...t.results.slice(0,rotate)];
  return {...t,templateId,results};
}
export function buildProject(place,templateId){
  const t=templateFor(templateId);
  return {version:'effects-1.0',company:{name:place.displayName?.text||'La tua attività',industry:place.primaryTypeDisplayName?.text||t.label,primaryColor:t.color,accentColor:t.accent},templateId,demoSource:{type:'google_places',placeId:place.id||''},effect:{...t}};
}
export function buildQueryPlan(seedValue='0',max=220){
  const seed=hashSeed(seedValue);const pairs=[];const cityOffset=seed%ITALY_CITIES.length;const keywordOffset=(seed>>>8)%SEARCH_KEYWORDS.length;
  for(let i=0;i<max;i++){const city=ITALY_CITIES[(cityOffset+i*17)%ITALY_CITIES.length];const keyword=SEARCH_KEYWORDS[(keywordOffset+i*11+Math.floor(i/ITALY_CITIES.length))%SEARCH_KEYWORDS.length];pairs.push(`${keyword} ${city} Italia`)}
  return [...new Set(pairs)];
}
export function demoSlug(placeId){return `ecfx-${crypto.createHash('sha256').update(String(placeId)+':easycome-effects-v1').digest('hex').slice(0,18)}`}
export function demoPrice(place,templateId){return Number(templateFor(templateId).price||149)}
export function outreachSubject(place){const name=place.displayName?.text||'la vostra attività';return `Abbiamo preparato 3 idee creative per ${name}`}
export function outreachMessage(place,demoUrl,price=149){
  const name=place.displayName?.text||'la vostra attività';
  return `Buongiorno,\n\nsono Edoardo di Easy Come. Abbiamo analizzato la presenza pubblica di ${name} e preparato gratuitamente una mini proposta creativa con 3 direzioni pensate per il vostro brand: contenuto interattivo/TikTok, video UGC-Reel e paid social.\n\nPotete vedere la proposta qui:\n${demoUrl}\n\nNon è un template generico: la direzione viene scelta in base al settore e alle informazioni pubbliche del brand. Se una delle idee vi interessa, la sviluppiamo usando esclusivamente asset, prodotti, offerte e claim approvati da voi.\n\nSe vi va, posso trasformare la direzione che preferite in una proposta esecutiva completa.\n\nUn saluto,\nEdoardo La Neve\nEasy Come Creative\nedoardolaneve8@gmail.com`;
}
