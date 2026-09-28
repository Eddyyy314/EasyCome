import net from 'node:net';

function safeUrl(raw=''){
  try{const u=new URL(String(raw).trim());if(!['http:','https:'].includes(u.protocol))return null;const h=u.hostname.toLowerCase();if(!h||h==='localhost'||h.endsWith('.local')||net.isIP(h))return null;return u}catch{return null}
}
function decode(s=''){return String(s).replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&nbsp;/gi,' ').replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')}
function cleanText(html=''){
  return decode(String(html).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi,' ').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim()).slice(0,14000)
}
function meta(html,name){const re=new RegExp(`<meta[^>]+(?:name|property)=["']${name}["'][^>]+content=["']([^"']+)["']|<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["']${name}["']`,'i');const m=String(html).match(re);return decode(m?.[1]||m?.[2]||'').trim()}
function title(html){return decode(String(html).match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/\s+/g,' ').trim()}
async function fetchHtml(url,timeoutMs=3600){const c=new AbortController();const t=setTimeout(()=>c.abort(),timeoutMs);try{const r=await fetch(url,{redirect:'follow',signal:c.signal,headers:{'user-agent':'Mozilla/5.0 (compatible; EasyComeCreativeBot/1.0; +https://www.easy-come.it/)','accept':'text/html,application/xhtml+xml'}});if(!r.ok)return'';const type=r.headers.get('content-type')||'';if(!/text\/html|application\/xhtml\+xml/i.test(type))return'';return (await r.text()).slice(0,900000)}catch{return''}finally{clearTimeout(t)}}
const STOP=new Set('e ed il lo la i gli le un uno una di del della dei delle da dal dalla in con su per tra fra a al alla ai alle che come più non si è sono essere questo questa questi queste nel nella nei nelle sul sulla dei delle o ma anche tua tuo vostri vostro nostra nostro'.split(/\s+/));
function keywords(text='',limit=18){const counts=new Map();for(const raw of String(text).toLowerCase().match(/[a-zàèéìòù0-9][a-zàèéìòù0-9'-]{2,}/gi)||[]){const w=raw.replace(/^[-']+|[-']+$/g,'');if(STOP.has(w)||/^\d+$/.test(w)||w.length<3)continue;counts.set(w,(counts.get(w)||0)+1)}return [...counts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([w])=>w)}
function detectOffers(text=''){const out=[];const patterns=[/\b(?:€|eur)\s?\d+[\d,.]*/gi,/\b\d+[\d,.]*\s?(?:€|eur)\b/gi,/\b(?:sconto|promo|offerta|prenota|booking|menu|delivery|takeaway|spedizione|consulenza|preventivo|prova gratuita)\b[^.!?]{0,80}/gi];for(const re of patterns)for(const m of String(text).matchAll(re)){const v=m[0].replace(/\s+/g,' ').trim();if(v&&!out.includes(v))out.push(v);if(out.length>=8)return out}return out}
function detectTone(text='',category=''){const t=String(text).toLowerCase();if(/luxury|lusso|exclusive|esclusiv|premium|elegan|boutique/.test(t))return'premium ed elegante';if(/family|famigl|tradizion|artigian|dal 19|dal 20/.test(t))return'caldo, autentico e locale';if(/innov|tech|digital|performance|smart/.test(t))return'moderno, diretto e innovativo';if(/young|giovan|party|club|cocktail|aperitiv/.test(t))return'energico, social-first e contemporaneo';if(/beauty|spa|wellness|estetic/.test(t))return'pulito, aspirazionale e premium';return category?'professionale, semplice e coerente con il settore':'moderno e accessibile'}
export async function analyzePublicBrand(place={}){
  const base=safeUrl(place.website||place.websiteUri||'');
  if(!base)return{source:'google_only',website:'',title:'',description:'',keywords:[],offers:[],tone:detectTone('',place.category),summary:`${place.name||'Attività'} · ${place.category||'business locale'} · ${place.address||''}`.trim()};
  const html=await fetchHtml(base.href);const body=cleanText(html);const desc=meta(html,'description')||meta(html,'og:description');const ttl=title(html)||meta(html,'og:title');
  return{source:html?'website+google':'google_only',website:base.href,title:ttl,description:desc,keywords:keywords(`${ttl} ${desc} ${body}`),offers:detectOffers(body),tone:detectTone(`${ttl} ${desc} ${body}`,place.category),summary:[ttl,desc].filter(Boolean).join(' — ').slice(0,700),sample:body.slice(0,2200)};
}

const CAMPAIGN_LIBRARY={
  pizza:[
    {format:'TikTok AR Effect',name:'What Should You Order?',goal:'UGC e visite al locale',hook:'Lascia decidere a TikTok la tua pizza di stasera.',mechanic:'Randomizer con foto reali delle pizze e risultato finale condivisibile',cta:'Prova il risultato e ordinalo stasera',deliverable:'Effect House + cover + preview verticale'},
    {format:'UGC Reel / TikTok Ad',name:'The Pizza Decision',goal:'reach locale e desiderabilità',hook:'POV: siete in 4 e nessuno sa quale pizza ordinare.',mechanic:'Video 15–20s con hook rapido, close-up reali e reveal dei bestseller',cta:'Tagga chi deve scegliere la pizza',deliverable:'Video verticale 9:16 + script creator + shot list'},
    {format:'Meta Carousel',name:'6 Reasons to Come Tonight',goal:'conversione e prenotazioni',hook:'Una pizza per ogni mood.',mechanic:'6 card prodotto, una per pizza, con ingredienti e micro-copy',cta:'Prenota / Ordina ora',deliverable:'Carousel 1080×1350 + copy ads'}
  ],
  cocktail:[
    {format:'TikTok AR Effect',name:'Which Drink Are You Tonight?',goal:'UGC e footfall serale',hook:'Il tuo drink di stasera ti sta già aspettando.',mechanic:'Roulette cocktail con visual neon e drink reali',cta:'Mostra il risultato al bartender',deliverable:'Effect House + cover + preview'},
    {format:'UGC Reel / TikTok Ad',name:'Your Night Starts Here',goal:'awareness e visite',hook:'3 secondi per scegliere dove bere stasera.',mechanic:'Montaggio bartender + signature cocktail + atmosfera',cta:'Salva il posto per stasera',deliverable:'Video 9:16 + script + shot list'},
    {format:'Story Ad',name:'Tonight Only',goal:'conversione immediata',hook:'Stasera: scegli il mood, noi facciamo il drink.',mechanic:'3 stories sequenziali con poll, prodotto e CTA',cta:'Prenota il tavolo',deliverable:'3 story 1080×1920 + copy'}
  ],
  beauty:[
    {format:'TikTok AR Effect',name:'Which Look Fits You?',goal:'engagement e appuntamenti',hook:'Scopri il tuo prossimo look in 3 secondi.',mechanic:'Style picker con risultati ispirati ai servizi reali',cta:'Prenota il look che ti è uscito',deliverable:'Effect House + preview'},
    {format:'Before/After Reel',name:'The Transformation',goal:'social proof e booking',hook:'Non servono parole: guarda il prima e dopo.',mechanic:'Video trasformazione con taglio ritmico e reveal finale',cta:'Prenota la tua trasformazione',deliverable:'Reel 9:16 + shot list + caption'},
    {format:'Meta Lead Ad',name:'Find Your Look',goal:'lead generation',hook:'Non sai quale trattamento scegliere?',mechanic:'Creatività statica/video + promessa consulenza breve',cta:'Richiedi una consulenza',deliverable:'Creative + primary text + headline + CTA'}
  ],
  fitness:[
    {format:'TikTok AR Effect',name:'Your Next Challenge',goal:'UGC e community',hook:'TikTok decide il tuo workout.',mechanic:'Random challenge con esercizi e reps',cta:'Fallo, registralo e tagga la palestra',deliverable:'Effect House + preview'},
    {format:'UGC Reel / TikTok Ad',name:'Can You Finish This?',goal:'reach e prova gratuita',hook:'Se completi questa challenge, devi venire a provarci dal vivo.',mechanic:'challenge progressiva con timer e trainer',cta:'Prenota la prova',deliverable:'Video 9:16 + script'},
    {format:'Meta Lead Ad',name:'7-Day Challenge',goal:'lead generation',hook:'7 giorni per rimetterti in moto.',mechanic:'offerta ingresso/prova + proof + CTA',cta:'Lascia il contatto',deliverable:'Creative + copy + lead form angle'}
  ],
  travel:[
    {format:'TikTok AR Effect',name:'Where Should You Go Next?',goal:'engagement e salvataggi',hook:'Lascia scegliere alla roulette la tua prossima fuga.',mechanic:'Destination picker con esperienze reali della struttura/destinazione',cta:'Scopri l’offerta collegata al risultato',deliverable:'Effect House + preview'},
    {format:'Cinematic Reel',name:'48 Hours Here',goal:'desiderabilità e booking',hook:'Se avessi 48 ore qui, ecco come le passeresti.',mechanic:'itinerario verticale con room/food/experience',cta:'Salva per il prossimo weekend',deliverable:'Reel 20–30s + shot list'},
    {format:'Meta Carousel',name:'Your Weekend, Planned',goal:'booking',hook:'Camera, esperienza, colazione: tutto in un weekend.',mechanic:'carousel narrativo in 5–6 card',cta:'Verifica disponibilità',deliverable:'Carousel + copy'}
  ],
  retail:[
    {format:'TikTok AR Effect',name:'Which One Is Yours?',goal:'product discovery e UGC',hook:'Il tuo prossimo acquisto scelto in 3 secondi.',mechanic:'Product picker con prodotti reali',cta:'Trovalo in store / online',deliverable:'Effect House + preview'},
    {format:'UGC Reel / TikTok Ad',name:'3 Ways to Style It',goal:'consideration e vendite',hook:'Un prodotto, tre look.',mechanic:'creator demo con cambi outfit rapidi',cta:'Quale sei: 1, 2 o 3?',deliverable:'Video 9:16 + creator brief'},
    {format:'Meta Carousel',name:'New Drop',goal:'conversione',hook:'La nuova selezione in 6 swipe.',mechanic:'carousel prodotto con benefit e prezzo',cta:'Acquista ora',deliverable:'Carousel + ad copy'}
  ],
  nightlife:[
    {format:'TikTok AR Effect',name:'What’s Your Mood Tonight?',goal:'UGC e awareness evento',hook:'Scopri che serata ti aspetta.',mechanic:'Mood picker brandizzato + visual club',cta:'Condividi il mood e vieni stasera',deliverable:'Effect House + preview'},
    {format:'Event Reel',name:'Tonight in 12 Seconds',goal:'FOMO e presenze',hook:'Questo è quello che ti perdi se resti a casa.',mechanic:'cut veloci crowd/DJ/light/drinks',cta:'Ultimi ingressi / lista',deliverable:'Reel + edit blueprint'},
    {format:'Story Countdown',name:'Tonight Drop',goal:'conversione same-day',hook:'Mancano poche ore.',mechanic:'countdown + line-up + CTA',cta:'Entra in lista',deliverable:'Story pack + copy'}
  ],
  dessert:[
    {format:'TikTok AR Effect',name:'What’s Your Flavor?',goal:'UGC e visite',hook:'TikTok sceglie il tuo gusto.',mechanic:'Flavor picker con prodotti reali',cta:'Vieni a provare il risultato',deliverable:'Effect House + preview'},
    {format:'Product Reel',name:'Satisfying Scoop',goal:'reach e desiderabilità',hook:'Aspetta il terzo gusto.',mechanic:'macro food shots + texture + reveal',cta:'Quale scegli?',deliverable:'Reel 9:16 + shot list'},
    {format:'Meta Carousel',name:'Pick Your Favorite',goal:'engagement e footfall',hook:'6 gusti. Una scelta impossibile.',mechanic:'6 card prodotto',cta:'Passa a provarli',deliverable:'Carousel + caption'}
  ],
  restaurant:[
    {format:'TikTok AR Effect',name:'Tonight’s Pick',goal:'UGC e visite',hook:'Non scegliere: lascia decidere al filtro.',mechanic:'Menu picker con piatti reali',cta:'Ordina il risultato',deliverable:'Effect House + preview'},
    {format:'UGC Reel / TikTok Ad',name:'Order This First',goal:'reach e prenotazioni',hook:'Se vieni qui per la prima volta, ordina questo.',mechanic:'creator-style recommendation + food closeups',cta:'Salvalo per la prossima cena',deliverable:'Reel + creator script'},
    {format:'Meta Carousel',name:'The Menu in 6 Swipes',goal:'consideration e booking',hook:'Dall’antipasto al dessert.',mechanic:'menu journey visuale',cta:'Prenota il tavolo',deliverable:'Carousel + ad copy'}
  ],
  generic:[
    {format:'TikTok Interactive Effect',name:'Find Your Match',goal:'UGC e brand awareness',hook:'Scopri il tuo match con il brand.',mechanic:'picker interattivo basato sui prodotti/servizi principali',cta:'Condividi il risultato',deliverable:'Effect House + preview'},
    {format:'UGC Reel / TikTok Ad',name:'Why People Choose Us',goal:'awareness e consideration',hook:'Il motivo per cui i clienti tornano.',mechanic:'3 prove concrete + visual del prodotto/servizio',cta:'Scopri di più',deliverable:'Video 9:16 + script'},
    {format:'Meta Ad',name:'One Clear Offer',goal:'lead o conversione',hook:'Una promessa chiara, un’offerta chiara.',mechanic:'creative focalizzata su un singolo beneficio',cta:'Richiedi info',deliverable:'Creative + copy ads'}
  ]
};

function uniq(a=[]){return [...new Set(a.filter(Boolean))]}
function humanSignal(value=''){return String(value).replace(/\s+/g,' ').trim().slice(0,90)}
function groundedSignals(place={},analysis={}){
  const signals=[];
  if(place.address) signals.push({type:'location',label:'Località',value:humanSignal(place.address),source:'Google Places'});
  if(analysis.tone) signals.push({type:'tone',label:'Tono',value:humanSignal(analysis.tone),source:analysis.source==='website+google'?'Sito pubblico':'Settore'});
  for(const k of uniq(analysis.keywords||[]).slice(0,3)) signals.push({type:'keyword',label:'Segnale',value:humanSignal(k),source:'Sito pubblico'});
  if((analysis.offers||[])[0]) signals.push({type:'offer',label:'Segnale commerciale',value:humanSignal(analysis.offers[0]),source:'Sito pubblico'});
  return signals.slice(0,5);
}
function realityLevel(analysis={}){
  if(analysis.source==='website+google') return 'grounded';
  return 'light';
}
function brandFacts(place={},analysis={}){
  const signals=groundedSignals(place,analysis);
  return {
    businessName:place.name||'Il brand',
    category:place.category||'attività locale',
    address:place.address||'',
    website:place.website||analysis.website||'',
    tone:analysis.tone||'moderno',
    keywords:uniq(analysis.keywords||[]).slice(0,5),
    offers:uniq(analysis.offers||[]).slice(0,2),
    websiteTitle:analysis.title||'',
    websiteDescription:analysis.description||'',
    summary:analysis.summary||'',
    signals,
    realityLevel:realityLevel(analysis)
  };
}
export function campaignsFor(templateId,place={},analysis={}){
  const base=CAMPAIGN_LIBRARY[templateId]||CAMPAIGN_LIBRARY.generic;const facts=brandFacts(place,analysis);
  return base.map((c,i)=>({...c,id:`${templateId}-${i+1}`,recommended:i===0,productionPrompt:buildProductionPrompt(c,facts)}));
}
export function buildProductionPrompt(c,facts){
  const realSignals=(facts.signals||[]).map(s=>`- ${s.label}: ${s.value} (${s.source})`).join('\n')||'- No website-level signal verified yet. Use only name, category and location.';
  const offerLine=facts.offers.length?facts.offers.join(' | '):'No verified promotion detected.';
  return `ROLE
You are a senior social creative director preparing a realistic first-pass campaign concept for a real local business.

IMPORTANT REALITY RULE
This is a prospecting brief, not a completed brand audit. Make the concept feel relevant using a SMALL number of verified signals, but do not over-personalize or pretend to know the business deeply. Roughly 70–80% of the execution should come from a proven reusable creative framework and 20–30% from the verified prospect information below.

BUSINESS
Name: ${facts.businessName}
Category: ${facts.category}
Location: ${facts.address||'Not specified'}
Website: ${facts.website||'Not available'}
Reality level: ${facts.realityLevel==='grounded'?'Website + Google signals available':'Light personalization from Google/category only'}

VERIFIED SIGNALS TO USE SPARINGLY
${realSignals}
Verified commercial signal: ${offerLine}

CAMPAIGN
Format: ${c.format}
Concept name: ${c.name}
Primary objective: ${c.goal}
Hook: ${c.hook}
Core mechanic/story: ${c.mechanic}
CTA direction: ${c.cta}
Required deliverable: ${c.deliverable}

CREATIVE DIRECTION
Create a polished, platform-native concept that could genuinely be pitched to this business. Use the business name and only a few verified signals to make it relevant. Do NOT force every keyword into the creative. If real logo, colors, product photos, menu items, services or offers are not verified, mark them as CLIENT ASSET / PLACEHOLDER instead of inventing them. Avoid fake products, fake reviews, fake prices, fake discounts, fake partnerships, fake customer claims and invented brand history.

PERSONALIZATION LIMIT
Use at most 3–5 prospect-specific details in the final execution. Prefer: business name, location/area, one tone cue, and one or two real product/service/category cues. The result should feel plausible and tailored, not creepily specific or fabricated.

IF THIS IS AN AR/TIKTOK EFFECT
Design for TikTok Effect House in vertical 9:16. Keep the face area clear. Define: opening state, user trigger, interaction logic, animation timing, result state, replay behavior, sound cues, branded UI, asset list, text layers, safe zones and technical build notes. Use editable placeholders for product/menu/service results unless real items have been explicitly verified or supplied by the client.

IF THIS IS VIDEO/UGC
Provide a 0–3s hook, shot-by-shot sequence, on-screen text, spoken script, B-roll list, edit rhythm, audio direction, final CTA and caption. Use CLIENT FOOTAGE / PLACEHOLDER whenever a specific venue, product or staff shot has not been verified.

IF THIS IS META/STATIC/CAROUSEL
Provide each frame/card, headline hierarchy, body copy, visual direction, CTA, aspect ratios and ad-copy variants. Keep claims category-level unless a business-specific fact is verified.

OUTPUT
Return: (1) concise campaign concept, (2) which 3–5 real prospect signals were used, (3) exact asset checklist split into VERIFIED / CLIENT NEEDED / PLACEHOLDER, (4) production steps, (5) final on-screen copy, (6) technical specs, (7) CTA/caption, (8) missing information to request before production. Keep the concept executable and realistic rather than hyper-specific.`;
}
export function agencyAnalysis(place={},templateId='generic',analysis={}){
  const campaigns=campaignsFor(templateId,place,analysis);
  const facts=brandFacts(place,analysis);
  const signalLabels=(facts.signals||[]).map(s=>s.value);
  return {
    version:'agency-1.1-grounded',
    brand:facts,
    diagnosis:{
      positioning:`${place.name||'Il brand'} · ${place.category||'attività locale'}${place.address?` · ${place.address}`:''}`,
      tone:analysis.tone||'moderno',
      contentOpportunities:uniq([templateId==='pizza'?'menu/prodotto':templateId==='nightlife'?'atmosfera/evento':'prodotto/servizio', ...signalLabels.slice(0,3), 'social proof']).slice(0,5),
      verifiedSignals:facts.signals||[],
      realityLevel:facts.realityLevel,
      dataSource:analysis.source||'google_only'
    },
    campaigns
  };
}

