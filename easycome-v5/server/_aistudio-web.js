const clean=(v,max=4000)=>String(v??'').trim().slice(0,max);
function safeUrl(v){try{const u=new URL(String(v||'').trim());return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
function listUrls(raw){
  const arr=Array.isArray(raw)?raw:String(raw||'').split(/[\n,]+/);
  return [...new Set(arr.map(safeUrl).filter(Boolean))].slice(0,12);
}
function sectorLens(templateId='',category=''){
  const k=String(templateId||'').toLowerCase();
  const c=String(category||'').toLowerCase();
  if(k==='restaurant'||/ristor|food|bar|cafe|caff|pizzeria|trattoria|osteria|forna|forno|panif|bakery|pastic|focacc|gelat|aliment/.test(c))return {
    business:'Food / hospitality',
    conversion:'Turn discovery into a reservation, call, directions request or menu exploration with very little friction.',
    experience:'The site should feel sensorial and specific to the place: food, materiality, atmosphere, neighbourhood, table culture and rhythm. Photography should carry emotion; typography should carry personality.',
    avoid:'Do not default to a black restaurant theme, menu-card grids, gold accents, chef clichés, fake review carousels or generic food icons.'
  };
  if(k==='booking'||/hotel|camp|resort|bed|tour|travel|vacan|b&b|affitt|ospital/.test(c))return {
    business:'Hospitality / travel',
    conversion:'Make a direct stay/request decision feel obvious: understand the place, trust it, see what matters, then contact or book.',
    experience:'Sell the feeling of being there. Use destination storytelling, useful logistics and immersive imagery without becoming a booking portal clone.',
    avoid:'Avoid generic travel cards, blue booking widgets, fake availability, invented room types or tourism clichés.'
  };
  if(k==='professional'||/consult|avvocat|commercial|studio|account|legal|notaio|architett|ingegner/.test(c))return {
    business:'Professional services',
    conversion:'Build trust quickly, make the expertise legible and move qualified visitors toward a call or contact request.',
    experience:'Authority should come from typography, structure, clarity, restraint and proof—not corporate decoration. It should feel like a respected contemporary practice.',
    avoid:'No corporate blue gradients, handshake photos, fake case studies, fake metrics, generic icon grids or SaaS-style cards.'
  };
  if(k==='health'||/medic|clinic|dent|health|physio|psicolog|terap|farmac/.test(c))return {
    business:'Health / care',
    conversion:'Help people understand the service, feel safe, and take the correct next step without pressure.',
    experience:'Human, calm, accessible and precise. Strong hierarchy and reassuring whitespace; warmth without wellness clichés.',
    avoid:'No invented medical claims, fake doctors, fake accreditations, sterile hospital-blue templates or fear-based conversion patterns.'
  };
  if(k==='retail'||/shop|store|boutique|retail|fashion|negozio|gioiell|arredo/.test(c))return {
    business:'Retail / brand',
    conversion:'Create desire, explain what is distinctive, then drive store visits, product enquiries or purchases where appropriate.',
    experience:'Treat it as a digital flagship. Strong art direction, collection rhythm, photography, merchandising logic and deliberate whitespace.',
    avoid:'Avoid ecommerce-template sameness, endless product-card grids, fake products, discount banners and generic lifestyle branding.'
  };
  if(k==='workshop'||/officin|repair|auto|mechanic|carrozzer|elettric|idraulic|falegn/.test(c))return {
    business:'Workshop / technical service',
    conversion:'Prove competence fast and make calling, messaging or requesting service effortless.',
    experience:'Confident, tactile and direct. Show craft, work, process, equipment and local trust with a strong practical information hierarchy.',
    avoid:'No corporate blue cards, wrench-icon rows, fake before/after results, stock mechanics posing at camera or macho visual clichés.'
  };
  if(k==='appointments'||/beauty|wellness|salon|spa|hair|parruc|estetic|barber/.test(c))return {
    business:'Beauty / wellness',
    conversion:'Create desire and trust, show the experience clearly, then make appointment intent frictionless.',
    experience:'Tactile, refined and human. Strong editorial imagery and type; calm motion and a mobile-first appointment journey.',
    avoid:'No beige-on-beige template, gold script logo treatment, generic leaf line-art, beauty icon grids or fake testimonials.'
  };
  return {
    business:'Local SME',
    conversion:'Clarify why this business is worth choosing and create one obvious real-world next action.',
    experience:'Derive the visual language from the actual business, place, audience and offer rather than from a category template.',
    avoid:'No generic local-business template, stock icon wall, card soup, fake social proof or default SaaS aesthetics.'
  };
}
function hashString(value=''){
  let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0;
}
function pick(list,seed,offset=0){return list[(seed+offset)%list.length]}
function typographyDNA(name='',templateId='',category='',personality=''){
  const seed=hashString(`type|${name}|${templateId}|${category}|${personality}`);
  const t=`${category} ${templateId} ${personality}`.toLowerCase();
  const isFood=/ristor|food|bar|cafe|caff|pizz|trattor|oster|forna|forno|panif|bakery|pastic|focacc|gelat|aliment/.test(t)||templateId==='restaurant';
  const isTravel=/hotel|camp|resort|bed|tour|travel|vacan|b&b|affitt|ospital/.test(t)||templateId==='booking';
  const isPro=/consult|avvocat|commercial|studio|account|legal|notaio|architett|ingegner/.test(t)||templateId==='professional';
  const isHealth=/medic|clinic|dent|health|physio|psicolog|terap|farmac/.test(t)||templateId==='health';
  const isRetail=/shop|store|boutique|retail|fashion|negozio|gioiell|arredo/.test(t)||templateId==='retail';
  const isCraft=/officin|repair|auto|mechanic|carrozzer|elettric|idraulic|falegn|artigian|laborator/.test(t)||templateId==='workshop';
  const pools=isFood?[
    {display:'Newsreader',body:'Libre Franklin',treatment:'Warm editorial food identity: expressive but not precious. Use Newsreader for short display statements and Libre Franklin for practical information. No scripted accents, no italic word inserted just for decoration.'},
    {display:'Fraunces',body:'Work Sans',treatment:'Tactile contemporary craft: use Fraunces selectively at strong optical sizes, paired with calm Work Sans. Avoid the cliché of making every second word italic.'},
    {display:'Bricolage Grotesque',body:'Source Serif 4',treatment:'Contemporary artisan identity with an unexpected reversal: characterful grotesque display type and warm editorial reading text. Let real product imagery, not a giant serif headline, own the first impression.'},
    {display:'DM Serif Display',body:'IBM Plex Sans',treatment:'Confident local editorial voice. Use the display face in a few memorable moments, not as a wall of giant serif text. IBM Plex Sans keeps details direct and useful.'}
  ]:(isTravel?[
    {display:'Cormorant Garamond',body:'Manrope',treatment:'Destination-led, elegant and atmospheric without looking like a booking template. Use the serif for place-led storytelling; keep logistics crisp in Manrope.'},
    {display:'Newsreader',body:'Source Sans 3',treatment:'Editorial travel journal rather than travel portal. Moderate contrast, generous reading rhythm, strong captions and practical labels.'},
    {display:'Fraunces',body:'Libre Franklin',treatment:'Characterful hospitality with a tactile human feel. Use variable weight/optical size intentionally and avoid decorative italics as a recurring motif.'}
  ]:(isPro?[
    {display:'Source Serif 4',body:'IBM Plex Sans',treatment:'Serious contemporary practice: sober authority, excellent readability and typographic discipline. Use thin rules and measured hierarchy instead of decorative cards.'},
    {display:'Libre Baskerville',body:'Source Sans 3',treatment:'Established editorial authority with a modern operational layer. Keep headings concise and body copy calm; avoid corporate-blue visual conventions.'},
    {display:'Newsreader',body:'IBM Plex Sans',treatment:'High-trust editorial system. Use Newsreader for statements and section titles, IBM Plex Sans for details, forms and navigation. No oversized quote-like hero by default.'}
  ]:(isHealth?[
    {display:'Source Serif 4',body:'Atkinson Hyperlegible',treatment:'Human, precise and highly readable. The serif adds warmth without wellness clichés; Atkinson Hyperlegible prioritizes clarity in practical information.'},
    {display:'Lora',body:'Source Sans 3',treatment:'Reassuring editorial tone with approachable detail. Keep typography calm, never ornamental or luxury-coded.'},
    {display:'Newsreader',body:'Public Sans',treatment:'Contemporary care identity: soft editorial headings with exceptionally clear utility typography.'}
  ]:(isRetail?[
    {display:'Bodoni Moda',body:'Work Sans',treatment:'Fashion/flagship contrast: campaign-like display type with clean retail utility. Let product imagery dominate and keep UI chrome minimal.'},
    {display:'Syne',body:'Libre Franklin',treatment:'Graphic contemporary brand voice. Use Syne as a deliberate display system, not everywhere; use Libre Franklin for product and practical copy.'},
    {display:'Cormorant Garamond',body:'Manrope',treatment:'Curated boutique/editorial character. Strong typography, quiet interface, selective large-scale moments.'}
  ]:(isCraft?[
    {display:'Archivo Black',body:'Archivo',treatment:'Direct, crafted and confident. Use condensed/strong display hierarchy sparingly, with practical body copy and strong alignment to real work imagery.'},
    {display:'Barlow Condensed',body:'IBM Plex Sans',treatment:'Technical but designed: compact display type, crisp information hierarchy and zero fake-industrial decoration.'},
    {display:'Bricolage Grotesque',body:'Source Sans 3',treatment:'Contemporary maker identity with character in headlines and neutral clarity everywhere else. No tech-startup styling.'}
  ]:[
    {display:'Bricolage Grotesque',body:'Source Sans 3',treatment:'Distinctive contemporary voice without a SaaS look. Use the display family for rhythm and shape, with Source Sans 3 for clarity.'},
    {display:'Newsreader',body:'Libre Franklin',treatment:'Editorial local identity: expressive display moments, restrained body type and strong reading rhythm.'},
    {display:'Syne',body:'Manrope',treatment:'Graphic, confident and modern. Use asymmetry and scale carefully; never turn it into a tech landing page.'},
    {display:'Fraunces',body:'IBM Plex Sans',treatment:'Human, tactile and specific. Use variable features deliberately and keep the body typography practical.'}
  ])))));
  const chosen=pick(pools,seed,13);
  return {...chosen,source:'Google Fonts',rule:`Load ${chosen.display} and ${chosen.body} explicitly. Use no more than these two families unless a supplied brand font is genuinely present. System fonts are fallbacks only, never the visual identity.`};
}
function designDNA(name='',templateId='',category='',personality=''){
  const seed=hashString(`${name}|${templateId}|${category}`);
  const c=String(category||'').toLowerCase();
  const isFood=/ristor|food|bar|cafe|caff|pizzeria|trattoria|osteria|forna|forno|panif|bakery|pastic|focacc|gelat|aliment/.test(c)||templateId==='restaurant';
  const isTravel=/hotel|camp|resort|bed|tour|travel|vacan|b&b|affitt|ospital/.test(c)||templateId==='booking';
  const isPro=/consult|avvocat|commercial|studio|account|legal|notaio|architett|ingegner/.test(c)||templateId==='professional';
  const isHealth=/medic|clinic|dent|health|physio|psicolog|terap|farmac/.test(c)||templateId==='health';
  const isRetail=/shop|store|boutique|retail|fashion|negozio|gioiell|arredo/.test(c)||templateId==='retail';
  const composition=(isFood||isTravel)?[
    'Cinematic editorial opening: image and type overlap across a non-symmetrical grid; the first fold feels like a magazine cover, not a landing-page component.',
    'Chapter-based scroll: a strong full-bleed opening followed by alternating quiet and immersive chapters; no repeated section shell.',
    'Photographic contact sheet: one dominant image, cropped detail fragments and oversized type create a tactile story rather than a card grid.'
  ]:isPro||isHealth?[
    'Editorial document system: oversized type, disciplined margins, thin rules and asymmetric columns; authority comes from composition rather than decoration.',
    'Typographic architecture: a restrained but unusual grid with one dominant statement, side annotations and occasional full-width evidence/content moments.',
    'Spatial minimalism: generous negative space, deliberate off-grid moments and a small number of strong blocks; almost no containers.'
  ]:isRetail?[
    'Digital flagship composition: campaign-scale imagery, editorial product/story moments and varied pacing; avoid ecommerce catalogue sameness.',
    'Gallery wall rhythm: asymmetric image sizes, captions and typographic interventions arranged like a curated exhibition.',
    'Poster-to-gallery journey: graphic first viewport, then large visual stories with minimal UI chrome and strong merchandising hierarchy.'
  ]:[
    'Editorial asymmetry: a strong type-led first viewport, off-grid image placement and section rhythm that changes as the story progresses.',
    'Poster system: the site behaves like a series of art-directed posters connected by a simple navigation and one clear conversion path.',
    'Tactile local story: large real-world details, texture, generous type and documentary pacing; almost no conventional UI cards.'
  ];
  const image=(isFood||isTravel||isRetail)?[
    'Photography is the primary medium. Prefer large crops, details, atmosphere and imperfect human-scale moments. Never use a stock-photo mosaic.',
    'Use images as editorial objects: full bleed, unexpected crops, edge-to-edge transitions and occasional small captioned details.',
    'Build visual tension with one hero image and a few carefully sized supporting images; fewer, better images beat a gallery of equal cards.'
  ]:[
    'Use imagery sparingly and intentionally. One excellent contextual image or material detail is better than decorative stock photography.',
    'Let typography lead; images appear as evidence, context or texture, never as generic smiling-people filler.',
    'If imagery is weak or unavailable, lean into typography, rules, spacing and graphic composition rather than inventing stock-photo sections.'
  ];
  const navigation=[
    'Navigation is quiet and almost invisible until needed; avoid a giant rounded navbar capsule.',
    'Use a precise editorial header with plain text links and one unobtrusive action; no floating app-style navigation.',
    'Keep navigation minimal and architectural, with strong alignment to the page grid and no decorative pills.'
  ];
  const motion=[
    'Motion language: restrained cinematic reveals, image masks and subtle type/line transitions. No floating blobs, bouncing cards or perpetual movement.',
    'Motion language: mostly still. Use one or two purposeful transitions to make the page feel crafted, then get out of the way.',
    'Motion language: scroll-linked only where it clarifies hierarchy; otherwise crisp fades/transforms under 500ms with reduced-motion support.'
  ];
  const signature=[
    'Signature moment: one unexpected but usable composition in the first two viewports that could become a screenshot-worthy brand moment.',
    'Signature moment: a section transition where typography and imagery interact in a way unique to this business, without becoming a gimmick.',
    'Signature moment: one memorable full-width typographic or photographic pause that breaks the normal web rhythm and anchors the identity.'
  ];
  const typography=typographyDNA(name,templateId,category,personality);
  return {
    composition:pick(composition,seed,1),image:pick(image,seed,3),navigation:pick(navigation,seed,5),motion:pick(motion,seed,7),signature:pick(signature,seed,11),typography,
    antiPattern:'Never use the default AI-site sequence: centered eyebrow + huge gradient headline + two rounded CTA buttons + three feature cards + icon grid + testimonials + final CTA panel.'
  };
}
function joinList(value,fallback='Not provided'){
  const s=clean(value,3500);return s||fallback;
}
function normalizeImageManifest(raw=[]){
  const items=Array.isArray(raw)?raw:[];
  const out=[];const seen=new Set();
  for(const item of items){
    const url=safeUrl(item?.url||item);if(!url||seen.has(url))continue;seen.add(url);
    out.push({url,role:clean(item?.role||'approved business image',80),source:clean(item?.source||'approved',80),name:clean(item?.name||'',120)});
    if(out.length>=12)break;
  }
  return out;
}
function conversionContract({category='',templateId='',phone='',email='',whatsapp='',features='',cta='',actionMode='auto'}={}){
  const text=`${category} ${templateId} ${features} ${cta}`.toLowerCase();
  const requested=String(actionMode||'auto').toLowerCase();
  const bookingLike=/prenot|booking|appuntament|reservation|tavol|soggiorn|camera|hotel|camp|b&b|salon|parruc|estetic|barber|visita|consulenza/.test(text);
  const orderLike=/ordin|carrello|cart|menu|catalog|focacc|pizza|ristor|food|bakery|pan|pastic|take.?away|asporto/.test(text);
  const quoteLike=/preventiv|richiest|contatt|servizio|officin|ripar|impiant|consul|studio|profession/.test(text);
  const digits=String(phone||'').replace(/\D/g,'');
  const waUrl=safeUrl(whatsapp)|| (digits?`https://wa.me/${digits}`:'');
  let mode=requested;
  if(!['auto','whatsapp','booking','request','call','none'].includes(mode))mode='auto';
  if(mode==='auto')mode=bookingLike?'booking':orderLike&&waUrl?'whatsapp':quoteLike?'request':waUrl?'whatsapp':phone?'call':email?'request':'none';
  const destinations=`Verified phone: ${phone||'NONE'}\nVerified email: ${email||'NONE'}\nWhatsApp destination: ${waUrl||'NONE'}`;
  const universal=`REAL ACTION CONTRACT — HARD FUNCTIONAL RULE\n- Never build a fake cart, fake checkout, fake booking engine, clipboard-only order flow, dead form or decorative interaction.\n- NEVER make the visitor press a button whose main result is “copy message”, “copy order”, “copy booking” or similar. Clipboard may be a secondary convenience only, never the conversion path.\n- Every primary CTA must complete a real action with the verified contact data below. If the required destination is missing, remove the function instead of faking it.\n- Do not claim a reservation/order is confirmed unless a real confirmation backend exists. Use “richiesta di prenotazione” / “richiesta ordine” when confirmation is manual.\n${destinations}`;
  if(mode==='whatsapp')return `${universal}\nPRIMARY ACTION MODE: WHATSAPP.\n- Use a direct WhatsApp action. Final CTA must open the verified WhatsApp destination with encodeURIComponent() of a useful pre-filled Italian message.\n- If the UI lets users select products, quantities or options, keep that state only to build the WhatsApp message. The final CTA must be “Invia ordine su WhatsApp” / “Invia richiesta su WhatsApp”, NOT “Copia messaggio”.\n- Include the selected items/options, quantities and any notes in the WhatsApp text.\n- If WhatsApp destination is NONE, do not simulate WhatsApp: fall back to ${phone?'a direct phone call':email?'a real email action':'no transactional UI'}.`;
  if(mode==='booking')return `${universal}\nPRIMARY ACTION MODE: BOOKING REQUEST.\n- Build a proper, mobile-first booking/request form only with fields that make sense (e.g. name, phone/email, date, time/arrival-departure, party size/service, notes). Validate required fields and show clear errors.\n- Submission must actually leave the page toward a verified destination: ${waUrl?'open WhatsApp with the complete structured booking request':email?'open a pre-filled email with the complete structured booking request':phone?'offer the verified call action after validation':'there is no verified destination, therefore DO NOT build the form'}.\n- Label it clearly as a request if there is no live availability/confirmation backend. Never display fake available slots or “prenotazione confermata”.`;
  if(mode==='request')return `${universal}\nPRIMARY ACTION MODE: REQUEST / QUOTE.\n- Build a short real request form only if there is a verified destination. On submit, ${waUrl?'open WhatsApp with all form fields pre-filled':email?'open a pre-filled email with all form fields':phone?'route to the verified call action':'remove the form and show no fake submission'}.\n- No fake success toast before the user is transferred to the real destination.`;
  if(mode==='call')return `${universal}\nPRIMARY ACTION MODE: DIRECT CALL.\n- The primary CTA must be a real tel: link using the verified phone. Do not add a fake cart/form around it. Secondary directions/contact actions are allowed only if real.`;
  return `${universal}\nPRIMARY ACTION MODE: NONE.\n- Do not invent carts, forms, booking widgets or pseudo-checkouts. Keep the site informative with only verified contact/navigation links.`;
}

function activityBlueprint({name='',category='',templateId='',goal='',offer='',notes='',phone='',email='',whatsapp=''}={}){
  const t=`${category} ${templateId} ${offer} ${notes}`.toLowerCase();
  const food=/ristor|food|bar|cafe|caff|pizz|trattor|oster|forna|forno|panif|bakery|pastic|focacc|gelat|aliment/.test(t);
  const hospitality=/hotel|camp|resort|bed|b&b|vacan|ospital|affitt|tour|travel/.test(t);
  const pro=/consult|avvocat|commercial|studio|account|legal|notaio|architett|ingegner/.test(t);
  const health=/medic|clinic|dent|health|physio|psicolog|terap|farmac/.test(t);
  const retail=/shop|store|boutique|retail|fashion|negozio|gioiell|arredo/.test(t);
  const craft=/officin|repair|auto|mechanic|carrozzer|elettric|idraulic|falegn|artigian|laborator/.test(t);
  const beauty=/beauty|wellness|salon|spa|hair|parruc|estetic|barber/.test(t);
  const base={
    decision:'The visitor must understand what this business actually does, why it is credible, what to do next and how to reach it without decoding marketing language.',
    priorities:['what the business actually offers','the strongest truthful reason to choose it','practical location/contact information','one real conversion path'],
    questions:['What is this place/business?','Is it relevant to me?','Why should I trust/choose it?','What should I do next?'],
    proof:'Use only real proof present in supplied facts/assets. If proof is missing, rely on clarity, specificity, process and real imagery rather than invented social proof.',
    photoHierarchy:'Use imagery only where it proves or evokes something real. Never use people, products or places as interchangeable decoration.'
  };
  if(food)return {...base,
    decision:'A hungry/local visitor should immediately understand what kind of place it is, what it is known for, whether it feels worth visiting, where it is and the easiest real way to order/call/visit.',
    priorities:['signature products or product families ONLY if supplied','craft/material/process cues ONLY when supported','the physical place and local context','practical opening/contact/location cues when supplied','a real order/contact action'],
    questions:['What do they actually make/serve?','What makes it distinctive without fake claims?','Can I see the real product/place?','Where is it?','How do I order, reserve or call?'],
    proof:'For food/craft, real product and place photography is stronger than reviews or generic claims. Do not invent menu items, ingredients, fermentation hours, awards or tradition dates.',
    photoHierarchy:'PRODUCT/CIBO is highest priority for product storytelling. LOCALE can establish place/atmosphere. TEAM is only for a real people/story section. TERRITORIO is contextual, never a product substitute.'};
  if(hospitality)return {...base,decision:'The visitor should feel the place, understand the stay/use case and logistics, then make a truthful direct availability/contact request.',priorities:['sense of place','actual accommodation/service facts supplied','location and practical logistics','real direct request/contact path'],questions:['What is it like to stay/be there?','What do I actually get?','Where is it?','How do I request availability?'],proof:'Use real place/room/territory imagery. Never invent availability, room types, sea distance, ratings or amenities.',photoHierarchy:'LOCALE/AMBIENTE and TERRITORIO lead. PRODUCT only if it genuinely represents an included service. TEAM is optional human context.'};
  if(pro)return {...base,decision:'A qualified visitor should quickly understand expertise, scope, working method and whether to start a conversation.',priorities:['area of expertise','real services','method/process if supplied','credibility through clarity and restraint','qualified contact'],questions:['Can they solve my kind of problem?','How do they work?','Why do they feel credible?','How do I start?'],proof:'Specific services, process and real professional context are proof. Do not invent clients, case studies, results or credentials.',photoHierarchy:'TEAM/PERSON and LAVORO/PROGETTO can be useful when real; generic office photography is secondary and must not become filler.'};
  if(health)return {...base,decision:'The visitor should understand the service safely, feel oriented and know how to request the correct next step.',priorities:['services actually offered','clear practical information','reassuring professional context','truthful appointment/contact request'],questions:['Is this the right service?','Who/what will I encounter?','What is the next step?'],proof:'Use only supplied professional facts. No diagnosis promises, outcomes, fake credentials or medical claims.',photoHierarchy:'TEAM/PROFESSIONAL and LOCALE are useful if authentic. Avoid unrelated wellness/medical imagery.'};
  if(retail)return {...base,decision:'The visitor should recognize the brand/product world, understand what can be found there and know how to visit or ask about availability.',priorities:['product world/category','distinctive taste/selection if evident','store/place','availability/contact path'],questions:['What do they sell?','Is this my taste?','What should I explore first?','Where/how can I get it?'],proof:'Real products and real retail environment are primary proof. Never invent products or prices.',photoHierarchy:'PRODUCT and LOCALE lead; TEAM only if there is a genuine brand story.'};
  if(craft)return {...base,decision:'The visitor should immediately recognize competence, type of work and the fastest real way to request service.',priorities:['work/services handled','real work/process evidence','local trust through practical clarity','call/message/request action'],questions:['Do they handle my problem?','Do they look competent?','How do I reach them now?'],proof:'LAVORO/PROGETTO imagery and real workshop context beat stock people or generic icons.',photoHierarchy:'LAVORO/PROGETTO and LOCALE lead. TEAM is supporting. Never substitute unrelated equipment/people.'};
  if(beauty)return {...base,decision:'The visitor should understand services and atmosphere, desire the experience, then make a truthful appointment request.',priorities:['services actually supplied','real visual atmosphere','practical location/contact','appointment request'],questions:['Does this feel right for me?','What can I book/request?','How do I make contact?'],proof:'Authentic work/place imagery is proof. Never invent treatments, prices or testimonials.',photoHierarchy:'LAVORO/PROGETTO and LOCALE lead; TEAM can humanize; TERRITORIO is rarely necessary.'};
  return base;
}
function assetCoveragePlan(manifest=[]){
  const assets=Array.isArray(manifest)?manifest:[];const counts={};for(const a of assets){const r=String(a.role||'altro').toLowerCase();counts[r]=(counts[r]||0)+1}
  const inventory=Object.entries(counts).map(([k,v])=>`${k.toUpperCase()}: ${v}`).join(' · ')||'NESSUN ASSET APPROVATO';
  const total=assets.length;
  const density=total===0?'NO-PHOTO MODE: there are no approved business images. Build a complete, beautiful composition using type, spacing, rules, color and verified information. Do not leave image-shaped holes or placeholders.':total===1?'SINGLE-HERO MODE: there is only one approved image. Use it once as a deliberate flagship visual moment (or at most one subtle echo), then build the rest without photo placeholders.':total<=3?'CURATED-SPARSE MODE: there are few approved images. Use them as 1–3 editorial moments, not as partial coverage for a repeated card grid.': 'CURATED-RICH MODE: there are enough assets for multiple moments, but semantic role matching still overrides quantity.';
  return `ASSET INVENTORY: ${inventory}\n${density}\nVISUAL CONSISTENCY LAW:\n- Decide the image system BEFORE laying out repeated content.\n- A repeated group (service cards, product tiles, team cards, rooms, treatments, projects, menu categories) may use per-item imagery ONLY when every visible item in that repeated group has a semantically correct approved asset.\n- If a group has 4 items but only 3 correct images, DO NOT create 3 image cards and 1 empty/text-only card. Recompose the whole group consistently: make all items text-led, use one shared contextual image outside the group, reduce/reframe the group using only verified content, or choose a different editorial structure.\n- Never fill a missing slot with an unrelated image. Never stretch one image across unrelated meanings. Never repeat the same photo across multiple unrelated items just to create symmetry.\n- If an image is absent, the design must look intentionally complete without it; no blank media boxes, broken rhythm or obvious missing-photo slots.\n- Image count is not a target. Coherence is the target.`;
}

function buildReviewPrompts(name,dna,assets=[],conversionRules='',assetPlan=''){
  const approved=assets.map(a=>a.url);
  const assetLock=approved.length?`APPROVED ASSET LOCK: the only business photography/logo URLs allowed in this project are: ${approved.join(' | ')}. Inspect the code and remove every business image/background URL that is not on this list. Never generate, search for, or substitute stock or substitute imagery. If a section has no suitable approved image, redesign it without an image.`:`ASSET LOCK: no approved business photography exists. Remove stock or substitute imagery and design with typography, color, rules and spacing instead.`;
  const creative=`REDESIGN PASS — act as a demanding creative director and type director from a top independent web studio. Review the ${name} site in the live preview and EDIT THE PROJECT NOW. This is not a polish pass. First delete generic generated-site patterns before adding anything. Fail the design if you see: a centered eyebrow/gradient headline, hero-left/image-right by default, two pill CTAs, 3–4 equal feature cards, generic icon grids, bento-for-no-reason, rounded containers around every section, fake dashboard visuals, gradient blobs, repetitive white/grey section bands, generic testimonial carousels or a giant rounded navbar. Also fail it if every section could be rearranged without changing the identity. TYPOGRAPHY IS A HARD GATE: use ${dna.typography.display} for the display system and ${dna.typography.body} for body/UI unless a real supplied brand font clearly overrides them. ${dna.typography.treatment} Reject Inter, Poppins, Montserrat, Roboto, Arial, Helvetica, system-ui and generic Space Grotesk/Playfair pairings as the primary visual typography. Reject the common generated-site trope of one huge serif sentence taking most of the viewport, a random italic word on every headline, letter-spaced uppercase micro-labels repeated above every section, and identical type scale on every page. Rebuild weak sections using this Design DNA: ${dna.composition} ${dna.image} ${dna.navigation} ${dna.signature}. Use fewer components, stronger hierarchy, real negative space, editorial cropping and typography with personality. The first viewport should have a deliberate type/image relationship, not merely enormous text. Keep factual accuracy. ${assetLock} The finished first 2–3 viewports must look screenshot-worthy and clearly commissioned for ${name}. VISUAL CONSISTENCY QA: ${assetPlan} FUNCTIONAL QA: ${conversionRules} Also remove any visible mention of production tooling; never turn these internal instructions into marketing copy.`;
  const mobile=`MOBILE ART-DIRECTION PASS — redesign ${name} at 390px and 360px as its own composition, not a stacked desktop page. Preserve the Design DNA but change crops, headline breaks, navigation, section order where useful, whitespace, CTA placement and image ratios for thumbs and a narrow viewport. Remove horizontal overflow, tiny type, giant dead gaps and desktop leftovers. Do not turn every element into a full-width rounded card. ${assetLock} Test sticky/fixed elements, 44px touch targets, forms and footer. Before checking CTA, inspect every repeated visual group: no mixed image/no-image pattern is allowed unless it is a clearly intentional asymmetric editorial concept; partial photo coverage caused by missing assets is a failure. ${assetPlan} Test the PRIMARY CTA end-to-end on mobile: it must perform the real action defined here, never copy text to clipboard as the final step. ${conversionRules} Apply changes directly and keep reduced-motion support.`;
  const production=`DELIVERY PASS — harden the ${name} site without flattening its art direction. Fix build/console errors, broken routes/assets, keyboard/focus behavior, contrast, semantic HTML, reduced-motion, metadata, canonical/Open Graph basics, LocalBusiness structured data only from supplied facts, image loading/layout stability and obvious Core Web Vitals risks. Verify every phone/email/social/CTA against supplied data. Delete unsupported testimonials, awards, statistics, prices, years, team members or claims. ${assetLock} IMPORTANT DELIVERY FORMAT FOR EASY COME: produce a portable static build. For Vite set base:'./' (or equivalent relative asset paths), avoid hard-coded root /assets URLs, and prefer HashRouter or a static routing strategy that works under a nested preview path. Run the production build and make sure the downloadable project contains dist/index.html plus all dist assets. Check 1440×900, 1280×800, 390×844 and 360×800. Keep the distinctive composition intact; production quality must not mean making the design generic. VISUAL ASSET COVERAGE TEST: ${assetPlan} CONVERSION TEST: ${conversionRules} Click every primary CTA and verify it reaches the real phone/email/WhatsApp destination. Delete fake carts, clipboard-only flows, fake booking confirmations and dead forms. CLIENT COPY TEST: visible copy must not mention AI, prompts, generators, models or how the site was produced.`;
  return {creative,mobile,production};
}
export function buildAiStudioBrief(place={},templateId='custom',override={}){
  const name=clean(place.name||'Attività',180);
  const address=clean(place.address,320);
  const category=clean(place.category||templateId,180);
  const phone=clean(place.phone,90);
  const email=clean(place.email,180);
  const instagram=clean(place.instagram,500);
  const facebook=clean(place.facebook,500);
  const platformUrl=clean(place.platformUrl||place.listedUrl,600);
  const whatsapp=clean(place.whatsapp,600);
  const goal=clean(override.goal||'Trasformare visite in contatti reali e far percepire l’attività come credibile, distintiva e curata.',900);
  const audience=clean(override.audience||'Inferisci il pubblico più plausibile dai dati forniti, ma non inventare segmenti troppo specifici.',900);
  const differentiator=clean(override.differentiator||'Non inventato: se non è fornito, usa il modo in cui l’attività si presenta, il luogo e l’offerta come base della narrazione.',1200);
  const offer=clean(override.offer||'Usa solo servizi/offerta deducibili con sicurezza dai dati forniti o esplicitamente indicati nelle note.',1800);
  const personality=clean(override.personality||'Scegli 3–5 tratti di brand coerenti con questa attività e traducili in tipografia, ritmo, immagini e interazioni.',700);
  const territory=clean(override.territory||address||'Usa il contesto locale solo se supportato dai dati; niente folklore inventato.',900);
  const notes=clean(override.notes,4200);
  const tone=clean(override.tone||'Trova una direzione creativa unica e specifica; non scegliere un template o una palette preconfezionata.',600);
  const cta=clean(override.cta||'Scegli la CTA reale più adatta al business usando telefono, email, WhatsApp o richiesta informazioni solo se disponibili.',500);
  const features=clean(override.features||'Contatto reale, SEO locale, responsive impeccabile, performance, accessibilità e privacy placeholder da completare.',1800);
  const anti=clean(override.anti||'Evita qualsiasi soluzione che sembri un template generico o un tema marketplace.',1500);
  const actionMode=clean(override.actionMode||'auto',40).toLowerCase();
  const refs=listUrls(override.references);
  const imageManifest=normalizeImageManifest(override.imageManifest);
  const images=listUrls(imageManifest.length?imageManifest.map(x=>x.url):override.images);
  const brandColors=[...new Set((Array.isArray(override.brandColors)?override.brandColors:String(override.brandColors||'').split(/[\s,;]+/)).map(v=>String(v||'').trim()).filter(v=>/^#[0-9a-f]{6}$/i.test(v)))].slice(0,6);
  const uploadedAssets=clean(override.uploadedAssets,1200);
  const lens=sectorLens(templateId,category);
  const dna=designDNA(name,templateId,category,personality);
  const conversionRules=conversionContract({category,templateId,phone,email,whatsapp,features,cta,actionMode});
  const intelligence=activityBlueprint({name,category,templateId,goal,offer,notes,phone,email,whatsapp});
  const assetPlan=assetCoveragePlan(imageManifest);
  const reviewPrompts=buildReviewPrompts(name,dna,imageManifest,conversionRules,assetPlan);
  const referenceBlock=refs.length?refs.map((u,i)=>`${i+1}. ${u}`).join('\n'):'None supplied. Do not imitate a random trend site.';
  const imageBlock=images.length?images.map((u,i)=>`${i+1}. ${u}`).join('\n'):'No approved business imagery supplied. Do NOT invent or fetch replacement stock or substitute imagery.';
  const assetManifestBlock=imageManifest.length?imageManifest.map((a,i)=>`${i+1}. [${String(a.role||'approved').toUpperCase()}] ${a.url}${a.name?` — ${a.name}`:''} (${a.source||'approved'})`).join('\n'):'NONE. No business image is approved for use.';
  const colorBlock=brandColors.length?brandColors.join(' · '):'No reliable palette extracted. Derive color choices from the supplied logo/reference photos if available; otherwise keep the palette restrained and easy to retune.';
  const prompt=`You are not a generic website generator. You are the creative director, conversion strategist, UX lead and senior frontend engineer of an excellent independent digital studio.

MISSION
Design and build an exceptional, production-quality website for a real Italian SME. It must feel commissioned, art-directed and specific to this business. The output should be impressive enough to present to a paying client, while remaining truthful, usable and easy to maintain.

IMPORTANT WORKING METHOD
Before writing UI code, perform a silent BUSINESS + EXPERIENCE PASS. Establish: (1) what the business actually sells or enables, (2) the visitor's top 3 questions, (3) the single most valuable real-world action, (4) what information builds trust for THIS category, (5) what supplied facts are missing and therefore must NOT be invented, (6) the approved image inventory by semantic role and whether it can fully cover any repeated visual group, (7) a content hierarchy and page architecture that fit this business rather than a standard sitemap, (8) three genuinely different visual concepts, (9) reject the two that feel most like familiar web templates, (10) commit to one strong brand idea that can be described in one sentence, (11) a type/spacing/color system derived from the real brand material, (12) an image placement plan, (13) 2–3 signature visual moments, and (14) the mobile composition. Only then build. Do not show this internal reasoning or the rejected concepts in the website.

REAL BUSINESS DATA — NEVER CONTRADICT OR EMBELLISH
Name: ${name}
Category: ${category}
Address: ${address||'Not provided'}
Phone: ${phone||'Not provided'}
Email: ${email||'Not provided'}
Instagram: ${instagram||'Not provided'}
Facebook: ${facebook||'Not provided'}
WhatsApp: ${whatsapp||'Not provided'}
External platform presence: ${platformUrl||'None'}

STRATEGY FROM EASY COME
Primary business goal: ${goal}
Target audience: ${audience}
Real differentiator / positioning: ${differentiator}
Offer / services to communicate: ${offer}
Brand personality: ${personality}
Local / territorial cues: ${territory}
Main CTA: ${cta}
Extra notes: ${notes||'None'}
Requested creative direction: ${tone}
Requested features: ${features}
Specific things to avoid: ${anti}

${conversionRules}

EASY COME ACTIVITY UNDERSTANDING — USE THIS AS A STRATEGIC CHECK, NOT AS VISIBLE COPY
Decision job: ${intelligence.decision}
Visitor questions: ${intelligence.questions.map((x,i)=>`${i+1}. ${x}`).join(' | ')}
Content priorities: ${intelligence.priorities.map((x,i)=>`${i+1}. ${x}`).join(' | ')}
Truth/proof rule: ${intelligence.proof}
Photo hierarchy: ${intelligence.photoHierarchy}

${assetPlan}

SECTOR LENS
Business type: ${lens.business}
Conversion lens: ${lens.conversion}
Experience lens: ${lens.experience}
Category clichés to avoid: ${lens.avoid}

DESIGN DNA — THIS IS A COMPOSITION BRIEF, NOT A TEMPLATE
Composition: ${dna.composition}

TYPOGRAPHY DIRECTOR — HARD ART-DIRECTION SYSTEM
Display family: ${dna.typography.display}
Body / UI family: ${dna.typography.body}
Treatment: ${dna.typography.treatment}
Font source: ${dna.typography.source}
Rule: ${dna.typography.rule}
- Load the selected families explicitly and actually use them in the rendered project. Do not leave the browser/system font as the visual result.
- If a supplied logo contains a wordmark, show the real logo asset; do not recreate the logo by typing the business name in the display font.
- Do not make a giant serif headline the whole concept. Typography must work together with imagery, brand colors, whitespace and content.
- Avoid the recurring generated-site styling of a single italic accent word inside every large headline. Italics are allowed only when the type concept genuinely calls for them.
- Avoid tiny uppercase letter-spaced labels above every section. Use them rarely, if at all.
- Keep body copy highly readable (roughly 16–20px desktop depending on face, comfortable line height and sensible line length).
- Create a real scale hierarchy: display, section title, body, utility. Do not simply use one huge heading size and one tiny body size.
- On mobile, recompose line breaks and scale. Never let a headline become a 5–7 line wall of text.
APPROVED VISUAL ASSET MANIFEST — HARD LOCK
${assetManifestBlock}

NON-NEGOTIABLE IMAGE RULES
- Every business photo, logo image and CSS background-image in the site MUST come from the approved manifest above.
- Never generate, search, scrape or substitute a different person/product/location image.
- Asset roles are binding: a TEAM/PERSON image must never stand in for a PRODUCT, food or location; a PRODUCT image must not be presented as a person/team image; an ALTRA FOTO ORIGINALE is general brand material only unless the role is clarified. Never infer a more specific role than the manifest says.
- If a section needs a photo but there is no approved asset with the correct role, redesign that section without a photo. Empty space, typography or color is always better than a wrong image.
- This rule is stricter than aesthetics. A beautiful but wrong image is a failed build.
- Never design the content structure first and then force the available images into it. Let verified image coverage influence the structure.
- Never create a visual grammar that requires more role-correct photos than the manifest can supply.
- Repeated modules must have deliberate parity. Partial accidental image coverage (3 cards with photos + 1 without because no fourth photo exists) is forbidden.
- If an approved photo is ambiguous, use it only as general atmosphere if its role permits; never reinterpret it as a more specific subject.

${assetPlan}

Image behavior: ${dna.image}
Navigation: ${dna.navigation}
Motion: ${dna.motion}
Signature moment: ${dna.signature}
Hard anti-pattern: ${dna.antiPattern}

VISUAL REFERENCES — INSPIRATION ONLY, NEVER COPY
${referenceBlock}

APPROVED / REFERENCE IMAGES — THESE SHOULD DRIVE THE ART DIRECTION
${imageBlock}

REAL BRAND COLOR DNA
${colorBlock}
${uploadedAssets?`\nLOCAL ASSETS THE OPERATOR WILL ALSO UPLOAD TO AI STUDIO\n${uploadedAssets}\n`:''}
BRAND FIDELITY RULES
- Treat the supplied business photos/logo as the primary creative source, not decoration added after layout. Study their dominant colors, contrast, materials, light, crop opportunities and visual mood BEFORE choosing typography or page composition.
- When real brand colors are supplied, build the palette from them. You may create darker/lighter neutrals for readability, but do not replace the identity with a fashionable unrelated palette.
- Use only the APPROVED VISUAL ASSET MANIFEST. Do not add any unapproved stock, generated, scraped or substitute image even if it looks better.
- For the PRIVATE PROPOSAL build, when the supplied image URLs are reachable, use those actual URLs in the site so the prospect immediately recognizes their own place/work/products. Keep all image URLs centralized in one data/config file so they can be replaced in minutes after purchase.
- Do not recolor the business into an Easy Come identity. This site must visually belong to the client.
- If the photos are visually inconsistent, curate them: choose a dominant photographic language, crop them consistently and let the strongest 3–5 images lead.
- Public listing/social images are reference material for a private proposal unless usage rights are confirmed; keep the project easy to swap to approved originals before public launch.

CUSTOMER-FACING LANGUAGE LOCK
- Never mention artificial intelligence, AI, Google AI Studio, prompts, models, generators, builders, automation tools or Easy Come's production workflow anywhere in visible website copy, metadata, alt text, structured data or customer-facing UI.
- The finished website must speak only as the client's brand. The visitor should see the business, its identity, products, services and contact paths—never how the website was produced.
- Never turn an internal constraint into customer copy. Do not write sentences such as ‘non sembra fatto con AI’, ‘non è generato’, ‘creato con tecnologia’, ‘costruito da un generatore’ or any variation. Simply write excellent brand copy.

NON-NEGOTIABLE CREATIVE RULES
- This is a business website, NOT a SaaS dashboard and NOT a software-demo landing page.
- Do not use Easy Come branding, colors, typography or visual language. The client must have an independent identity.
- Do not start from a visible template. Derive layout, proportions, palette and section order from this business.
- No fashion-driven purple/blue gradients, glassmorphism, random blobs, floating pills, excessive rounded rectangles, card soup, default bento grids, generic icon feature rows, fake dashboards or repetitive alternating sections.
- Hard ban on the common generic landing formula: eyebrow + centered giant headline + two pill buttons + 3 equal cards + icon grid + testimonial strip + rounded final CTA. If your first attempt drifts there, throw it away and recompose.
- Do not make every section a component-shaped rectangle. Prefer open composition, edges, rules, image fields, type, whitespace and changes of scale.
- Typography is not decoration. Use the TYPOGRAPHY DIRECTOR pair above unless a real supplied brand font overrides it. Inter, Poppins, Montserrat, Roboto, Arial, Helvetica and system-ui are fallbacks only, not the visual identity. Avoid generic Space Grotesk + Playfair pairings.
- Use at most one visual gimmick. Craft comes from proportion, type, crop, spacing and rhythm—not from effects.
- Avoid the universal headline-left/image-right hero unless it is genuinely the strongest concept. The first viewport needs a clear visual idea.
- Use typography as a design material: considered scale, line length, hierarchy, spacing and contrast. Do not overuse uppercase micro-labels.
- Use asymmetry, editorial pacing, full-bleed imagery, negative space, typographic moments or other composition techniques only when they support the concept—not as decoration.
- Create 2–3 memorable signature moments, but keep interaction understandable and fast. At least one should be visible in the first 2–3 viewports and should still look strong as a static screenshot.
- Mobile is a separate composition problem. Design at 390px/360px, do not merely stack desktop sections.
- Motion must have a reason. Keep it subtle, performant and compatible with prefers-reduced-motion.
- Use a restrained radius system. Not every section, image and button needs rounded corners.
- Use icons only where they add information. Never decorate every paragraph with an icon.
- Never invent awards, years in business, reviews, ratings, customer counts, team names, certifications, prices, statistics, menu items, room types, medical claims or testimonials.
- If important information is unknown, make the design work without it. Do not hallucinate copy to fill space.
- Write believable, polished Italian copy. Short, specific and human beats generic marketing language. Ban filler like ‘esperienza unica’, ‘passione e qualità’, ‘soluzioni su misura’, ‘innovazione al tuo servizio’ unless the supplied facts genuinely justify the phrase.
- Section count is not a goal. Use only the sections needed to tell a coherent story and convert. Different sections should have different visual roles; never repeat the same shell three times.

BUILD REQUIREMENTS
- Build a complete web project in Google AI Studio Build mode, using React as appropriate and clean maintainable components.
- Create only the pages that make sense for the business. Usually Home, offer/services, story/about and contact; add menu, gallery, booking, projects or FAQ only when justified.
- Real navigation and real responsive behavior from 360px upward.
- Semantic HTML, keyboard navigation, visible focus, sufficient contrast, sensible aria labels and reduced-motion support.
- SEO-ready title/description, canonical strategy, Open Graph basics and LocalBusiness structured data only from facts actually supplied.
- Performance-conscious images, lazy loading where appropriate, stable layout, no needless dependencies.
- Contact actions must use only the real phone/email/social data above.
- Forms must clearly indicate where submissions go; do not pretend a backend exists if you did not implement one.
- If a product/menu selector exists without a real ecommerce backend, its only valid transactional completion is a real WhatsApp/email handoff containing the selected data. No copy-to-clipboard as the primary completion.
- A reservation UI without a real live booking backend must be a truthful REQUEST form routed to a verified contact; never fake availability or confirmation.
- No lorem ipsum and no dead placeholder buttons.
- Keep content/data reasonably easy to replace before client delivery.

SELF-REVIEW GATE — DO THIS BEFORE YOU STOP
Inspect the finished site at desktop and mobile. Ask yourself:
1. Could this be identified as a generic template-generated landing page in five seconds?
2. Could the same design belong to an unrelated business if only the logo changed?
3. Is the first viewport memorable without being confusing?
4. Does the typography feel intentionally art-directed?
5. Are there too many cards, pills, borders, radii or generic sections?
6. Is the mobile experience genuinely composed?
7. Did you invent a single unsupported business fact?
8. Are the primary CTA and contact path obvious?
9. Does the first 900px of desktop look like a real art-directed brand page rather than a UI kit?
10. Did you repeat the same rounded container/card treatment more than twice?
11. Would a design-aware human call any section generic or template-looking? If yes, rebuild it rather than polish it.
12. Does every primary CTA complete a real action instead of copying text or showing a fake success state?
13. Is every cart/booking/form justified and connected to a verified destination?
14. Does visible customer copy contain any mention of production tools or process? If yes, rewrite it completely.
15. For every repeated visual group, do ALL items have equally valid role-correct imagery? If not, redesign the entire group consistently instead of leaving one item visually incomplete.
16. Does every image depict exactly what its surrounding copy claims it depicts? If uncertain, remove or relocate it.
17. If all photos disappeared, would the remaining information architecture still make sense for this specific business? If not, the design is leaning on decoration instead of understanding.
18. Does the site answer the visitor questions defined in EASY COME ACTIVITY UNDERSTANDING before asking for conversion? If not, restructure it.
19. Is the selected display/body font pair visibly loaded and used, or did the project fall back to a generic system font? If generic, fix it.
20. Does the hero rely on the cliché of gigantic serif text, repeated italic accent words or micro-uppercase labels instead of real art direction? If yes, redesign it.
21. Could you recognize this business from the type, imagery and palette even with the logo hidden? If no, strengthen the identity.
If the answer is wrong on any point, redesign and fix it before considering the project complete.

FINAL EXPECTATION
Deliver the website itself, not a mockup or a prose proposal. It should look like the work of a strong boutique studio, feel authentic to ${name}, and be ready to iterate visually in AI Studio and export as a ZIP/GitHub project.`;

  const markdown=`# Easy Come Web — Creative Build Pack\n\n## Cliente\n**${name}** — ${category}\n${address?`\n${address}`:''}\n\n## Come usarlo\n1. Apri Google AI Studio in **Build**.\n2. Incolla il **MASTER BUILD PROMPT** qui sotto.\n3. Lascia generare il sito e controlla il primo risultato.\n4. Esegui in ordine i tre prompt di Quality Gate: Creative Director, Mobile, Production.\n5. Quando è pronto, usa Download ZIP oppure GitHub dall'ambiente di AI Studio.\n\n---\n\n## MASTER BUILD PROMPT\n\n${prompt}\n\n---\n\n## QUALITY GATE 1 — CREATIVE DIRECTOR\n\n${reviewPrompts.creative}\n\n---\n\n## QUALITY GATE 2 — MOBILE\n\n${reviewPrompts.mobile}\n\n---\n\n## QUALITY GATE 3 — PRODUCTION\n\n${reviewPrompts.production}\n`;
  return {
    prompt,
    markdown,
    aiStudioUrl:'https://aistudio.google.com/apps',
    references:refs,
    images,
    imageManifest,
    reviewPrompts,
    meta:{name,category,goal,audience,differentiator,offer,personality,territory,tone,cta,features,anti,notes,actionMode,conversionRules,brandColors,uploadedAssets,designDNA:dna,intelligence,assetPlan,createdAt:new Date().toISOString(),engine:'easycome-web-v36-typography-director'}
  };
}
