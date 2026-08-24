const clean=(v,max=4000)=>String(v??'').trim().slice(0,max);
function safeUrl(v){try{const u=new URL(String(v||'').trim());return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
function listUrls(raw){
  const arr=Array.isArray(raw)?raw:String(raw||'').split(/[\n,]+/);
  return [...new Set(arr.map(safeUrl).filter(Boolean))].slice(0,12);
}
function sectorLens(templateId='',category=''){
  const k=String(templateId||'').toLowerCase();
  const c=String(category||'').toLowerCase();
  if(k==='restaurant'||/ristor|food|bar|cafe|caff|pizzeria|trattoria|osteria/.test(c))return {
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
function designDNA(name='',templateId='',category=''){
  const seed=hashString(`${name}|${templateId}|${category}`);
  const c=String(category||'').toLowerCase();
  const isFood=/ristor|food|bar|cafe|caff|pizzeria|trattoria|osteria/.test(c)||templateId==='restaurant';
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
  return {
    composition:pick(composition,seed,1),image:pick(image,seed,3),navigation:pick(navigation,seed,5),motion:pick(motion,seed,7),signature:pick(signature,seed,11),
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
function buildReviewPrompts(name,dna,assets=[]){
  const approved=assets.map(a=>a.url);
  const assetLock=approved.length?`APPROVED ASSET LOCK: the only business photography/logo URLs allowed in this project are: ${approved.join(' | ')}. Inspect the code and remove every business image/background URL that is not on this list. Never generate, search for, or substitute stock/AI imagery. If a section has no suitable approved image, redesign it without an image.`:`ASSET LOCK: no approved business photography exists. Remove stock/AI imagery and design with typography, color, rules and spacing instead.`;
  const creative=`REDESIGN PASS — act as a demanding creative director from a top independent web studio. Review the ${name} site in the live preview and EDIT THE PROJECT NOW. This is not a polish pass. First delete generic AI patterns before adding anything. Fail the design if you see: a centered eyebrow/gradient headline, hero-left/image-right by default, two pill CTAs, 3–4 equal feature cards, generic icon grids, bento-for-no-reason, rounded containers around every section, fake dashboard visuals, gradient blobs, repetitive white/grey section bands, generic testimonial carousels or a giant rounded navbar. Also fail it if every section could be rearranged without changing the identity. Rebuild weak sections using this Design DNA: ${dna.composition} ${dna.image} ${dna.navigation} ${dna.signature} Use fewer components, stronger hierarchy, real negative space, editorial cropping and typography with personality. Avoid overused AI font choices (Inter, Poppins, Montserrat, Roboto, generic Space Grotesk/Playfair pairings) unless there is a specific reason. Keep factual accuracy. ${assetLock} The finished first 2–3 viewports must look screenshot-worthy and clearly commissioned for ${name}.`;
  const mobile=`MOBILE ART-DIRECTION PASS — redesign ${name} at 390px and 360px as its own composition, not a stacked desktop page. Preserve the Design DNA but change crops, headline breaks, navigation, section order where useful, whitespace, CTA placement and image ratios for thumbs and a narrow viewport. Remove horizontal overflow, tiny type, giant dead gaps and desktop leftovers. Do not turn every element into a full-width rounded card. ${assetLock} Test sticky/fixed elements, 44px touch targets, forms and footer. Apply changes directly and keep reduced-motion support.`;
  const production=`DELIVERY PASS — harden the ${name} site without flattening its art direction. Fix build/console errors, broken routes/assets, keyboard/focus behavior, contrast, semantic HTML, reduced-motion, metadata, canonical/Open Graph basics, LocalBusiness structured data only from supplied facts, image loading/layout stability and obvious Core Web Vitals risks. Verify every phone/email/social/CTA against supplied data. Delete unsupported testimonials, awards, statistics, prices, years, team members or claims. ${assetLock} IMPORTANT DELIVERY FORMAT FOR EASY COME: produce a portable static build. For Vite set base:'./' (or equivalent relative asset paths), avoid hard-coded root /assets URLs, and prefer HashRouter or a static routing strategy that works under a nested preview path. Run the production build and make sure the downloadable project contains dist/index.html plus all dist assets. Check 1440×900, 1280×800, 390×844 and 360×800. Keep the distinctive composition intact; production quality must not mean making the design generic.`;
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
  const anti=clean(override.anti||'Evita qualsiasi soluzione che sembri un sito AI generico o un tema marketplace.',1500);
  const refs=listUrls(override.references);
  const imageManifest=normalizeImageManifest(override.imageManifest);
  const images=listUrls(imageManifest.length?imageManifest.map(x=>x.url):override.images);
  const brandColors=[...new Set((Array.isArray(override.brandColors)?override.brandColors:String(override.brandColors||'').split(/[\s,;]+/)).map(v=>String(v||'').trim()).filter(v=>/^#[0-9a-f]{6}$/i.test(v)))].slice(0,6);
  const uploadedAssets=clean(override.uploadedAssets,1200);
  const lens=sectorLens(templateId,category);
  const dna=designDNA(name,templateId,category);
  const reviewPrompts=buildReviewPrompts(name,dna,imageManifest);
  const referenceBlock=refs.length?refs.map((u,i)=>`${i+1}. ${u}`).join('\n'):'None supplied. Do not imitate a random trend site.';
  const imageBlock=images.length?images.map((u,i)=>`${i+1}. ${u}`).join('\n'):'No approved business imagery supplied. Do NOT invent or fetch replacement stock/AI imagery.';
  const assetManifestBlock=imageManifest.length?imageManifest.map((a,i)=>`${i+1}. [${String(a.role||'approved').toUpperCase()}] ${a.url}${a.name?` — ${a.name}`:''} (${a.source||'approved'})`).join('\n'):'NONE. No business image is approved for use.';
  const colorBlock=brandColors.length?brandColors.join(' · '):'No reliable palette extracted. Derive color choices from the supplied logo/reference photos if available; otherwise keep the palette restrained and easy to retune.';
  const prompt=`You are not a generic website generator. You are the creative director, conversion strategist, UX lead and senior frontend engineer of an excellent independent digital studio.

MISSION
Design and build an exceptional, production-quality website for a real Italian SME. It must feel commissioned, art-directed and specific to this business. The output should be impressive enough to present to a paying client, while remaining truthful, usable and easy to maintain.

IMPORTANT WORKING METHOD
Before writing UI code, silently establish: (1) the conversion goal, (2) the content hierarchy, (3) three genuinely different visual concepts, (4) reject the two that feel most like familiar web templates, (5) commit to one strong concept, (6) a type system, (7) an image strategy, (8) 2–3 signature visual moments, and (9) the mobile composition. Then build. Do not show the rejected concepts or dump a design-rationale page into the website.

REAL BUSINESS DATA — NEVER CONTRADICT OR EMBELLISH
Name: ${name}
Category: ${category}
Address: ${address||'Not provided'}
Phone: ${phone||'Not provided'}
Email: ${email||'Not provided'}
Instagram: ${instagram||'Not provided'}
Facebook: ${facebook||'Not provided'}
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

SECTOR LENS
Business type: ${lens.business}
Conversion lens: ${lens.conversion}
Experience lens: ${lens.experience}
Category clichés to avoid: ${lens.avoid}

DESIGN DNA — THIS IS A COMPOSITION BRIEF, NOT A TEMPLATE
Composition: ${dna.composition}
APPROVED VISUAL ASSET MANIFEST — HARD LOCK
${assetManifestBlock}

NON-NEGOTIABLE IMAGE RULES
- Every business photo, logo image and CSS background-image in the site MUST come from the approved manifest above.
- Never generate, search, scrape or substitute a different person/product/location image.
- Asset roles are binding: a TEAM/PERSON image must never stand in for a PRODUCT, food or location; a PRODUCT image must not be presented as a person/team image; an ALTRA FOTO ORIGINALE is general brand material only unless the role is clarified. Never infer a more specific role than the manifest says.
- If a section needs a photo but there is no approved asset with the correct role, redesign that section without a photo. Empty space, typography or color is always better than a wrong image.
- This rule is stricter than aesthetics. A beautiful but wrong image is a failed build.

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

NON-NEGOTIABLE CREATIVE RULES
- This is a business website, NOT a SaaS dashboard and NOT an AI demo.
- Do not use Easy Come branding, colors, typography or visual language. The client must have an independent identity.
- Do not start from a visible template. Derive layout, proportions, palette and section order from this business.
- No purple/blue AI gradients, glassmorphism, random blobs, floating pills, excessive rounded rectangles, card soup, default bento grids, generic icon feature rows, fake dashboards or repetitive alternating sections.
- Hard ban on the common AI landing formula: eyebrow + centered giant headline + two pill buttons + 3 equal cards + icon grid + testimonial strip + rounded final CTA. If your first attempt drifts there, throw it away and recompose.
- Do not make every section a component-shaped rectangle. Prefer open composition, edges, rules, image fields, type, whitespace and changes of scale.
- Avoid overused generator typography by default: Inter, Poppins, Montserrat, Roboto and fashionable-but-generic Space Grotesk + Playfair pairings. Choose fonts for this identity, not because they are common in AI output.
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
- No lorem ipsum and no dead placeholder buttons.
- Keep content/data reasonably easy to replace before client delivery.

SELF-REVIEW GATE — DO THIS BEFORE YOU STOP
Inspect the finished site at desktop and mobile. Ask yourself:
1. Could this be identified as an AI-generated landing page in five seconds?
2. Could the same design belong to an unrelated business if only the logo changed?
3. Is the first viewport memorable without being confusing?
4. Does the typography feel intentionally art-directed?
5. Are there too many cards, pills, borders, radii or generic sections?
6. Is the mobile experience genuinely composed?
7. Did you invent a single unsupported business fact?
8. Are the primary CTA and contact path obvious?
9. Does the first 900px of desktop look like a real art-directed brand page rather than a UI kit?
10. Did you repeat the same rounded container/card treatment more than twice?
11. Would a design-aware human call any section ‘AI-looking’? If yes, rebuild it rather than polish it.
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
    meta:{name,category,goal,audience,differentiator,offer,personality,territory,tone,cta,features,anti,notes,brandColors,uploadedAssets,designDNA:dna,createdAt:new Date().toISOString(),engine:'google-ai-studio-build-v4-asset-lock'}
  };
}
