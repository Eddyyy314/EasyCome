import { targetBySlug, updateTarget } from '../_demo-store.js';
import { appOrigin, json, readJson } from '../_responses.js';
import { stripePost } from '../_stripe.js';
const clean=(v,max=220)=>String(v||'').trim().slice(0,max);const validEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export default async function handler(req,res){
  if(req.method!=='POST')return json(res,405,{error:'Metodo non consentito.'});
  try{
    const body=await readJson(req);const slug=clean(body.demoSlug,120);const token=clean(body.token,180);const target=await targetBySlug(slug);if(!target)throw new Error('Proposta non trovata.');const cfg=target.demo_config||{};const p=cfg.webProposal||{};if(!p.token||p.token!==token||p.status==='disabled')throw new Error('Proposta non disponibile.');if(p.expiresAt&&new Date(p.expiresAt).getTime()<Date.now())throw new Error('Questa proposta è scaduta.');if(!p.packagePath)throw new Error('Il pacchetto del sito non è ancora stato caricato su Easy Come.');if(p.status==='paid')throw new Error('Questa proposta risulta già acquistata.');
    const name=clean(body.name,160);const email=clean(body.email,220).toLowerCase();const phone=clean(body.phone,80);if(!name)throw new Error('Inserisci nome e cognome.');if(!validEmail(email))throw new Error('Inserisci un’email valida.');if(body.termsAccepted!==true)throw new Error('Accetta i Termini Easy Come per continuare.');
    const priceCents=Math.round(Number(p.price||0)*100);if(priceCents<1000)throw new Error('Prezzo proposta non valido.');const origin=appOrigin(req);const snap=cfg.placeSnapshot||{};
    const params=new URLSearchParams();const add=(k,v)=>{if(v!==undefined&&v!==null&&v!=='')params.append(k,String(v))};
    add('mode','payment');add('payment_method_types[0]','card');add('customer_email',email);add('billing_address_collection','required');add('line_items[0][quantity]','1');add('line_items[0][price_data][currency]','eur');add('line_items[0][price_data][unit_amount]',priceCents);add('line_items[0][price_data][tax_behavior]',process.env.STRIPE_TAX_BEHAVIOR||'inclusive');add('line_items[0][price_data][product_data][name]',`Easy Come Web — ${snap.name||p.companyName||'Sito web'}`);add('line_items[0][price_data][product_data][description]','Progetto web personalizzato Easy Come Web, come mostrato nella proposta privata.');
    add('metadata[purchase_type]','web_proposal');add('metadata[demo_slug]',slug);add('metadata[proposal_token]',token);add('metadata[company_name]',String(snap.name||p.companyName||'').slice(0,480));add('metadata[buyer_name]',name);add('metadata[buyer_email]',email);add('metadata[buyer_phone]',phone);add('metadata[terms_version]','EC-TOS-2026-08-10-v1');
    add('success_url',`${origin}/web-proposal.html?d=${encodeURIComponent(slug)}&t=${encodeURIComponent(token)}&paid=1&session_id={CHECKOUT_SESSION_ID}`);add('cancel_url',`${origin}/web-proposal.html?d=${encodeURIComponent(slug)}&t=${encodeURIComponent(token)}&cancel=1`);add('locale','it');add('submit_type','pay');
    const session=await stripePost('checkout/sessions',params);const next={...p,lastCheckoutSession:session.id,lastCheckoutAt:new Date().toISOString(),buyer:{name,email,phone}};await updateTarget(target.id,{demo_config:{...cfg,webProposal:next}});return json(res,200,{url:session.url});
  }catch(e){return json(res,400,{error:e.message||'Checkout non riuscito.'})}
}
