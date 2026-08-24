import { targetBySlug } from '../_demo-store.js';
import { json } from '../_responses.js';
export default async function handler(req,res){
  if(req.method!=='GET')return json(res,405,{error:'Metodo non consentito.'});
  try{
    const u=new URL(req.url||'/api/web-proposal-public','http://localhost');const slug=String(req.query?.d||u.searchParams.get('d')||'').trim();const token=String(req.query?.t||u.searchParams.get('t')||'').trim();
    const target=await targetBySlug(slug);if(!target)return json(res,404,{error:'Proposta non trovata.'});const cfg=target.demo_config||{};const p=cfg.webProposal||{};if(!p.token||p.token!==token||p.status==='disabled')return json(res,404,{error:'Proposta non disponibile.'});if(p.expiresAt&&new Date(p.expiresAt).getTime()<Date.now()&&p.status!=='paid')return json(res,410,{error:'Questa proposta è scaduta. Contatta Easy Come per riattivarla.'});
    const snap=cfg.placeSnapshot||{};return json(res,200,{ok:true,proposal:{companyName:snap.name||p.companyName||'La tua attività',category:snap.category||'',address:snap.address||'',previewUrl:p.hostedPreviewUrl||p.previewUrl||'',previewMode:p.previewMode||'',siteFileCount:Number(p.siteFileCount||0),price:Number(p.price||0),currency:'EUR',status:p.status||'ready',paidAt:p.paidAt||null,packageReady:Boolean(p.packagePath),createdAt:p.createdAt||null,expiresAt:p.expiresAt||null}});
  }catch(e){return json(res,400,{error:e.message||'Errore proposta.'})}
}
