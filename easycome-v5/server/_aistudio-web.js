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
function joinList(value,fallback='Not provided'){
  const s=clean(value,3500);return s||fallback;
}
function buildReviewPrompts(name){
  const creative=`Act as a ruthless senior creative director reviewing the website you just built for ${name}. Do NOT merely describe problems: edit the project now. Check the first viewport, composition, typography, image treatment, section rhythm, navigation, CTA hierarchy, originality and brand specificity. Remove any visible AI/template tells: card soup, excessive rounded boxes, generic gradients, floating pills, generic icon rows, meaningless bento layouts, stock SaaS patterns, repetitive section shells and safe-but-forgettable composition. If the site could plausibly belong to five unrelated businesses by changing the logo, it has failed: redesign the weak parts. Preserve factual accuracy and do not invent business claims.`;
  const mobile=`Now perform a dedicated mobile design pass for ${name} at 390px and 360px. Do not simply stack the desktop layout. Recompose the hero, type scale, image crops, navigation, whitespace, CTA placement, galleries, forms and footer for touch. Remove overflow, cramped text, tiny controls and dead space. Make the mobile version feel intentionally art-directed. Apply the changes directly.`;
  const production=`Now harden the ${name} website for delivery. Fix all console/build issues, broken routes, missing assets, accessibility problems, focus states, reduced-motion behavior, metadata, semantic structure, Core Web Vitals risks and obvious SEO/local-business issues. Verify every phone/email/CTA uses only supplied real data. Do not add invented testimonials, prices, awards, team members, statistics or legal claims. Keep the visual concept intact while making the code clean and export-ready.`;
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
  const images=listUrls(override.images);
  const lens=sectorLens(templateId,category);
  const reviewPrompts=buildReviewPrompts(name);
  const referenceBlock=refs.length?refs.map((u,i)=>`${i+1}. ${u}`).join('\n'):'None supplied. Do not imitate a random trend site.';
  const imageBlock=images.length?images.map((u,i)=>`${i+1}. ${u}`).join('\n'):'No approved client imagery supplied. Design image slots intentionally and use tasteful replaceable imagery only if the environment can source it legally/reliably.';
  const prompt=`You are not a generic website generator. You are the creative director, conversion strategist, UX lead and senior frontend engineer of an excellent independent digital studio.

MISSION
Design and build an exceptional, production-quality website for a real Italian SME. It must feel commissioned, art-directed and specific to this business. The output should be impressive enough to present to a paying client, while remaining truthful, usable and easy to maintain.

IMPORTANT WORKING METHOD
Before writing UI code, silently establish: (1) the conversion goal, (2) the content hierarchy, (3) one strong visual concept, (4) a type system, (5) an image strategy, (6) 2–3 signature visual moments, and (7) the mobile composition. Then build. Do not dump a design rationale page into the website.

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

VISUAL REFERENCES — INSPIRATION ONLY, NEVER COPY
${referenceBlock}

APPROVED / REFERENCE IMAGES
${imageBlock}

NON-NEGOTIABLE CREATIVE RULES
- This is a business website, NOT a SaaS dashboard and NOT an AI demo.
- Do not use Easy Come branding, colors, typography or visual language. The client must have an independent identity.
- Do not start from a visible template. Derive layout, proportions, palette and section order from this business.
- No purple/blue AI gradients, glassmorphism, random blobs, floating pills, excessive rounded rectangles, card soup, default bento grids, generic icon feature rows, fake dashboards or repetitive alternating sections.
- Avoid the universal headline-left/image-right hero unless it is genuinely the strongest concept. The first viewport needs a clear visual idea.
- Use typography as a design material: considered scale, line length, hierarchy, spacing and contrast. Do not overuse uppercase micro-labels.
- Use asymmetry, editorial pacing, full-bleed imagery, negative space, typographic moments or other composition techniques only when they support the concept—not as decoration.
- Create 2–3 memorable signature moments, but keep interaction understandable and fast.
- Mobile is a separate composition problem. Design at 390px/360px, do not merely stack desktop sections.
- Motion must have a reason. Keep it subtle, performant and compatible with prefers-reduced-motion.
- Use a restrained radius system. Not every section, image and button needs rounded corners.
- Use icons only where they add information. Never decorate every paragraph with an icon.
- Never invent awards, years in business, reviews, ratings, customer counts, team names, certifications, prices, statistics, menu items, room types, medical claims or testimonials.
- If important information is unknown, make the design work without it. Do not hallucinate copy to fill space.
- Write believable, polished Italian copy. Short, specific and human beats generic marketing language.

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
    reviewPrompts,
    meta:{name,category,goal,audience,differentiator,offer,personality,territory,tone,cta,features,anti,notes,createdAt:new Date().toISOString(),engine:'google-ai-studio-build'}
  };
}
