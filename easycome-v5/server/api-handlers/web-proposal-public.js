import { targetBySlug, updateTarget } from '../_demo-store.js';
import { json, readJson } from '../_responses.js';

const GOALS=new Set(['contacts','bookings','sales','showcase','visibility','quotes','visits','automation','other']);
const ACTIONS=new Set(['call','whatsapp','form','booking','quote','buy','prices','menu','availability','services','portfolio','maps']);
const clean=(v,max=1600)=>String(v||'').trim().slice(0,max);

function requestData(req){
  const u=new URL(req.url||'/api/web-proposal-public','http://localhost');
  return {slug:String(req.query?.d||u.searchParams.get('d')||'').trim(),token:String(req.query?.t||u.searchParams.get('t')||'').trim()};
}
function validTarget(target,token){
  if(!target)throw new Error('Proposta non trovata.');
  const cfg=target.demo_config&&typeof target.demo_config==='object'?target.demo_config:{};
  const p=cfg.webProposal&&typeof cfg.webProposal==='object'?cfg.webProposal:{};
  if(!p.token||p.token!==token||p.status==='disabled')throw new Error('Proposta non disponibile.');
  if(p.expiresAt&&new Date(p.expiresAt).getTime()<Date.now()&&p.status!=='paid')throw new Error('Questa proposta è scaduta. Contatta Easy Come per riattivarla.');
  return {cfg,p};
}

export default async function handler(req,res){
  try{
    const {slug,token}=requestData(req);const target=await targetBySlug(slug);const {cfg,p}=validTarget(target,token);
    if(req.method==='POST'){
      if(p.status==='paid')return json(res,409,{error:'Il progetto è già stato acquistato. Per nuove modifiche contatta Easy Come.'});
      const body=await readJson(req,60_000);const goal=clean(body.goal,40);if(!GOALS.has(goal))throw new Error('Scegli l’obiettivo principale del sito.');
      const otherGoal=clean(body.otherGoal,300);if(goal==='other'&&!otherGoal)throw new Error('Scrivi qual è il tuo obiettivo principale.');
      const pain=clean(body.pain,1200);if(!pain)throw new Error('Raccontaci qual è oggi la parte più scomoda nella gestione dei clienti.');
      const actions=[...new Set((Array.isArray(body.actions)?body.actions:[]).map(v=>clean(v,40)).filter(v=>ACTIONS.has(v)))].slice(0,12);
      const now=new Date().toISOString();
      const clientBrief={
        version:'V40',submittedAt:now,goal,otherGoal,actions,pain,
        mustHave:clean(body.mustHave,1200),notes:clean(body.notes,1600)
      };
      const nextProposal={...p,flowVersion:p.flowVersion||'needs-first-v40',needsRevision:true,finalizedAt:null,updatedAt:now};
      await updateTarget(target.id,{demo_config:{...cfg,clientBrief,webProposal:nextProposal}});
      return json(res,200,{ok:true,clientBrief,proposal:{status:nextProposal.status,needsRevision:true,finalizedAt:null,checkoutReady:false}});
    }
    if(req.method!=='GET')return json(res,405,{error:'Metodo non consentito.'});
    const snap=cfg.placeSnapshot||{},handoff=cfg.websiteHandoff&&typeof cfg.websiteHandoff==='object'?cfg.websiteHandoff:{},hc=handoff.config&&typeof handoff.config==='object'?handoff.config:{},clientBrief=cfg.clientBrief&&typeof cfg.clientBrief==='object'?cfg.clientBrief:null;
    const isNeedsFlow=p.flowVersion==='needs-first-v40';const checkoutReady=!isNeedsFlow||p.status==='paid'||Boolean(p.finalizedAt&&!p.needsRevision);
    return json(res,200,{ok:true,proposal:{
      companyName:snap.name||p.companyName||'La tua attività',category:snap.category||'',address:snap.address||'',previewUrl:p.hostedPreviewUrl||p.previewUrl||'',previewMode:p.previewMode||'',siteFileCount:Number(p.siteFileCount||0),
      price:Number(p.price||0),implementationFee:Number(p.implementationFee??50),totalPrice:Number(p.totalPrice??(Number(p.price||0)+50)),currency:'EUR',status:p.status||'ready',paidAt:p.paidAt||null,packageReady:Boolean(p.packagePath),createdAt:p.createdAt||null,expiresAt:p.expiresAt||null,
      flowVersion:p.flowVersion||'legacy',needsRevision:Boolean(p.needsRevision),finalizedAt:p.finalizedAt||null,checkoutReady,
      draftDirection:{goal:clean(hc.goal,500),features:clean(hc.features,700),actionMode:clean(hc.actionMode,40)},
      clientBrief:clientBrief?{goal:clientBrief.goal||'',otherGoal:clientBrief.otherGoal||'',actions:Array.isArray(clientBrief.actions)?clientBrief.actions:[],pain:clientBrief.pain||'',mustHave:clientBrief.mustHave||'',notes:clientBrief.notes||'',submittedAt:clientBrief.submittedAt||''}:null
    }});
  }catch(e){return json(res,400,{error:e.message||'Errore proposta.'})}
}
