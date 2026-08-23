const clean=(v,max=2000)=>String(v??'').trim().slice(0,max);
function safeUrl(v){try{const u=new URL(String(v||'').trim());return ['http:','https:'].includes(u.protocol)?u.href:''}catch{return ''}}
function listUrls(raw){
  const arr=Array.isArray(raw)?raw:String(raw||'').split(/[\n,]+/);
  return [...new Set(arr.map(safeUrl).filter(Boolean))].slice(0,10);
}
function sectorGuidance(templateId='',category=''){
  const k=String(templateId||'').toLowerCase();
  const c=String(category||'').toLowerCase();
  if(k==='restaurant'||/ristor|food|bar|cafe|pizzeria/.test(c))return 'Food / hospitality. Make the experience sensorial and editorial; photography and atmosphere must lead. Avoid generic menu-card grids.';
  if(k==='booking'||/hotel|camp|resort|bed|tour|travel|vacan/.test(c))return 'Hospitality / travel. Sell the feeling of being there. Use immersive imagery, clear availability/contact CTAs, strong local storytelling and mobile-first decision flows.';
  if(k==='professional'||/consult|avvocat|commercial|studio|account|legal/.test(c))return 'Professional services. Build authority through typography, restraint, editorial composition, cases/results and a very clear contact path. Do not look like a SaaS landing page.';
  if(k==='health'||/medic|clinic|dent|health|physio/.test(c))return 'Health / professional care. Calm, trustworthy, accessible, highly legible. Avoid sterile template aesthetics; use human warmth and excellent information hierarchy.';
  if(k==='retail'||/shop|store|boutique|retail|fashion/.test(c))return 'Retail / brand. Treat the site like a digital flagship: art direction, product storytelling, collection rhythm, strong imagery and deliberate whitespace.';
  if(k==='workshop'||/officin|repair|auto|mechanic/.test(c))return 'Workshop / technical services. Confident, tactile, direct. Show craft, real work, proof and fast contact. Avoid corporate blue cards and generic wrench icons.';
  if(k==='appointments'||/beauty|wellness|salon|spa|hair/.test(c))return 'Beauty / wellness. Refined, tactile and human. Use restrained motion, premium typography and a frictionless appointment journey.';
  return 'Local SME. Infer the best visual language from the real business rather than applying a prebuilt category template.';
}
export function buildLovableBrief(place={},templateId='custom',override={}){
  const name=clean(place.name||'Attività',160);
  const address=clean(place.address,260);
  const category=clean(place.category||templateId,160);
  const phone=clean(place.phone,80);
  const email=clean(place.email,160);
  const instagram=clean(place.instagram,400);
  const facebook=clean(place.facebook,400);
  const platformUrl=clean(place.platformUrl||place.listedUrl,500);
  const goal=clean(override.goal||'Generare contatti reali e far percepire l’attività come molto più curata e credibile.',600);
  const notes=clean(override.notes,3000);
  const tone=clean(override.tone||'Auto: scegli tu la direzione creativa più forte per questa attività',300);
  const cta=clean(override.cta||'Scegli la CTA più adatta al business e rendila evidente senza essere aggressiva.',300);
  const features=clean(override.features||'Form contatti reale, CTA telefono/WhatsApp se disponibili, SEO locale, responsive impeccabile, performance, privacy placeholder da completare.',1200);
  const refs=listUrls(override.references);
  const images=listUrls(override.images);
  const prompt=`You are the senior creative director and senior frontend engineer of a top independent digital studio. Build a genuinely exceptional production-ready website for the following real Italian SME.\n\nBUSINESS\nName: ${name}\nCategory: ${category}\nAddress: ${address||'not provided'}\nPhone: ${phone||'not provided'}\nEmail: ${email||'not provided'}\nInstagram: ${instagram||'not provided'}\nFacebook: ${facebook||'not provided'}\nOther platform presence: ${platformUrl||'none'}\n\nBUSINESS / DESIGN DIRECTION\n${sectorGuidance(templateId,category)}\nCreative tone requested: ${tone}\nPrimary business goal: ${goal}\nMain CTA: ${cta}\nExtra notes from Easy Come: ${notes||'none'}\n\nNON-NEGOTIABLE CREATIVE RULES\n- Do NOT make it look AI-generated. No generic gradient blobs, purple/blue SaaS gradients, glassmorphism, random floating pills, card soup, overused bento grids, fake dashboards, generic stock-icon rows, or repetitive rounded boxes.\n- Do NOT use Easy Come branding, colors or visual language. This website belongs to the client and must have its own identity.\n- Do NOT start from a visible template. Create an art direction specific to this business: typography, scale, rhythm, grid, image treatment, transitions, section order and copy hierarchy should all feel intentionally designed.\n- Strong first viewport. The hero must feel art-directed and memorable, not like a template with headline-left / image-right unless that is genuinely the best concept.\n- Use sophisticated typography and spacing. Make the mobile version feel designed, not merely stacked.\n- Prefer a small number of excellent sections over many mediocre ones.\n- Use real, believable Italian copy. Never invent awards, years of experience, testimonials, prices, staff names, certifications, reviews or facts not supplied. If a fact is unknown, design around it instead of hallucinating it.\n- The site must feel expensive, credible and human.\n\nBUILD REQUIREMENTS\n- Production-quality React app with clean components and maintainable structure.\n- Pages/sections appropriate to the business: Home, services/offer, about/story, contact; add booking/menu/gallery/projects only if appropriate.\n- Excellent responsive behavior from 360px upward.\n- Subtle motion with purpose; respect prefers-reduced-motion.\n- Accessible navigation, semantic HTML, keyboard support, useful focus states and high contrast.\n- SEO-ready title/meta, local business structured data when the supplied facts are sufficient, sitemap/robots strategy.\n- Contact interactions must use the real phone/email supplied above when available.\n- Features: ${features}\n- No placeholder lorem ipsum.\n- Use high-quality image placeholders only where real client photography is not provided, and structure the code so imagery can be replaced easily.\n\nQUALITY BAR\nBefore finishing, inspect the result as a creative director. If it looks like a common AI landing page or a theme marketplace template, redesign it. The final result should be something a serious boutique web studio could confidently present to a paying client.\n`;
  const parts=[`https://lovable.dev/?autosubmit=true#prompt=${encodeURIComponent(prompt)}`];
  const attachments=[];
  for(const u of images.slice(0,10))attachments.push(`images=${encodeURIComponent(u)}`);
  for(const u of refs.slice(0,Math.max(0,10-images.length)))attachments.push(`html=${encodeURIComponent(u)}`);
  const lovableUrl=parts[0]+(attachments.length?'&'+attachments.join('&'):'');
  return {prompt,lovableUrl,references:refs,images,meta:{name,category,goal,tone,createdAt:new Date().toISOString(),engine:'lovable-build-with-url'}};
}
