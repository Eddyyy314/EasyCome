import { targetBySlug, updateTarget } from '../server/_demo-store.js';
import { placeDetails } from '../server/_google-places.js';
import { buildDemoModel, buildProject, templateFor } from '../server/_demo-factory-core.js';

function cleanPlace(p){return{name:p.displayName?.text||'La tua attività',address:p.formattedAddress||'',website:p.websiteUri||'',phone:p.nationalPhoneNumber||'',category:p.primaryTypeDisplayName?.text||p.primaryType||'Attività',primaryType:p.primaryType||'',placeId:p.id||''}}
export default async function handler(req,res){
  if(req.method!=='GET')return res.status(405).json({error:'Metodo non consentito.'});
  try{
    const slug=String(req.query?.slug||req.query?.d||'').trim();if(!slug)throw new Error('Demo non valida.');
    const target=await targetBySlug(slug);if(!target) return res.status(404).json({error:'Demo non trovata.'});
    if(target.expires_at&&new Date(target.expires_at).getTime()<Date.now())return res.status(410).json({error:'Questa demo è scaduta. Contatta Easy Come per riattivarla.'});
    const p=await placeDetails(target.place_id); const place=cleanPlace(p); const model=target.demo_config||buildDemoModel(target.template_id,target.place_id); const t=templateFor(target.template_id);
    const count=Number(target.view_count||0)+1;updateTarget(target.id,{view_count:count,last_viewed_at:new Date().toISOString()}).catch(()=>{});
    const project=buildProject(p,target.template_id,'');
    res.setHeader('cache-control','private, no-store, max-age=0');
    return res.status(200).json({slug,place,model,project,expiresAt:target.expires_at,views:count,templateLabel:t.label,googleMapsAttribution:true});
  }catch(error){console.error(error);return res.status(400).json({error:error.message||'Demo non disponibile.'})}
}
